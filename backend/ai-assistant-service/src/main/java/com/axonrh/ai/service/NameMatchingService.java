package com.axonrh.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.similarity.LevenshteinDistance;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for intelligent name matching with fuzzy search capabilities.
 * Handles variations in names like "Jaime Vicente da Silva Junior" vs "Jaime Vicente Jr".
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NameMatchingService {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    private static final LevenshteinDistance LEVENSHTEIN = LevenshteinDistance.getDefaultInstance();
    private static final double EXACT_MATCH_THRESHOLD = 1.0;
    private static final double HIGH_SIMILARITY_THRESHOLD = 0.85;
    private static final double MINIMUM_SIMILARITY_THRESHOLD = 0.5;

    // Common name abbreviations and variations in Portuguese
    private static final Map<String, List<String>> NAME_VARIATIONS = Map.ofEntries(
        Map.entry("jr", List.of("junior", "júnior")),
        Map.entry("junior", List.of("jr", "júnior")),
        Map.entry("júnior", List.of("jr", "junior")),
        Map.entry("sr", List.of("senior", "sênior")),
        Map.entry("senior", List.of("sr", "sênior")),
        Map.entry("sênior", List.of("sr", "senior")),
        Map.entry("filho", List.of("jr", "junior", "f")),
        Map.entry("neto", List.of("nt")),
        Map.entry("sobrinho", List.of("sob")),
        Map.entry("maria", List.of("m")),
        Map.entry("jose", List.of("j", "josé")),
        Map.entry("josé", List.of("j", "jose")),
        Map.entry("joao", List.of("joão")),
        Map.entry("joão", List.of("joao")),
        Map.entry("francisco", List.of("chico")),
        Map.entry("antônio", List.of("antonio", "tonio")),
        Map.entry("antonio", List.of("antônio", "tonio"))
    );

    // Common connecting words to ignore in matching
    private static final Set<String> CONNECTING_WORDS = Set.of(
        "de", "da", "do", "das", "dos", "e", "el", "la", "del"
    );

    /**
     * Result of a name matching operation.
     */
    public record MatchResult(
        UUID employeeId,
        String fullName,
        String socialName,
        String department,
        String position,
        double similarity,
        boolean isExactMatch
    ) {
        public String getDisplayName() {
            return socialName != null && !socialName.isBlank() ? socialName : fullName;
        }
    }

    /**
     * Search result containing match status and candidates.
     */
    public record SearchResult(
        boolean found,
        boolean exactMatch,
        boolean needsDisambiguation,
        List<MatchResult> candidates,
        String message
    ) {}

    /**
     * Searches for employees by name with intelligent fuzzy matching.
     *
     * @param searchName The name to search for
     * @param tenantId The tenant ID for filtering
     * @param activeOnly Whether to search only active employees
     * @return SearchResult with match status and candidates
     */
    public SearchResult searchByName(String searchName, UUID tenantId, boolean activeOnly) {
        log.info("Searching for employee with name: '{}' (tenantId: {}, activeOnly: {})",
                searchName, tenantId, activeOnly);

        if (searchName == null || searchName.isBlank()) {
            return new SearchResult(false, false, false, List.of(),
                "Nome de busca não fornecido.");
        }

        // Normalize the search name
        String normalizedSearch = normalizeName(searchName);
        List<String> searchTokens = tokenizeName(normalizedSearch);
        log.debug("Normalized search: '{}', tokens: {}", normalizedSearch, searchTokens);

        // Get all potential candidates from database
        List<Map<String, Object>> allEmployees = fetchEmployees(tenantId, activeOnly);
        log.debug("Found {} employees to match against", allEmployees.size());

        // Calculate similarity scores for all employees
        List<MatchResult> scoredMatches = allEmployees.stream()
            .map(emp -> scoreEmployee(emp, normalizedSearch, searchTokens))
            .filter(match -> match.similarity() >= MINIMUM_SIMILARITY_THRESHOLD)
            .sorted(Comparator.comparingDouble(MatchResult::similarity).reversed())
            .collect(Collectors.toList());

        log.debug("Found {} matches above minimum threshold", scoredMatches.size());

        if (scoredMatches.isEmpty()) {
            // Try a more relaxed search with partial token matching
            scoredMatches = allEmployees.stream()
                .map(emp -> scoreEmployeePartial(emp, searchTokens))
                .filter(match -> match.similarity() >= 0.3)
                .sorted(Comparator.comparingDouble(MatchResult::similarity).reversed())
                .limit(5)
                .collect(Collectors.toList());

            if (scoredMatches.isEmpty()) {
                return new SearchResult(false, false, false, List.of(),
                    String.format("Nenhum funcionário encontrado com nome similar a '%s'.", searchName));
            }

            return new SearchResult(true, false, true, scoredMatches,
                "Não encontrei correspondência exata. Você quis dizer um destes funcionários?");
        }

        MatchResult bestMatch = scoredMatches.get(0);

        // Check for exact match
        if (bestMatch.isExactMatch() || bestMatch.similarity() >= EXACT_MATCH_THRESHOLD) {
            log.info("Found exact match: {}", bestMatch.fullName());
            return new SearchResult(true, true, false, List.of(bestMatch),
                String.format("Encontrado: %s", bestMatch.getDisplayName()));
        }

        // Check for high similarity single match
        if (bestMatch.similarity() >= HIGH_SIMILARITY_THRESHOLD) {
            // If second best is much lower, treat as single match
            if (scoredMatches.size() == 1 ||
                scoredMatches.get(1).similarity() < bestMatch.similarity() - 0.15) {
                log.info("Found high similarity match: {} ({})", bestMatch.fullName(), bestMatch.similarity());
                return new SearchResult(true, false, false, List.of(bestMatch),
                    String.format("Encontrado: %s", bestMatch.getDisplayName()));
            }
        }

        // Multiple candidates need disambiguation
        List<MatchResult> topCandidates = scoredMatches.stream()
            .limit(5)
            .collect(Collectors.toList());

        log.info("Multiple candidates found, needs disambiguation: {}",
            topCandidates.stream().map(MatchResult::fullName).toList());

        return new SearchResult(true, false, true, topCandidates,
            "Encontrei mais de um funcionário com nome similar. Qual destes você está procurando?");
    }

    /**
     * Searches for an employee by ID after disambiguation.
     */
    public SearchResult getEmployeeById(UUID employeeId, UUID tenantId) {
        String sql = """
            SELECT e.id, e.full_name, e.social_name,
                   d.name as department_name, p.title as position_title
            FROM shared.employees e
            LEFT JOIN shared.departments d ON e.department_id = d.id AND d.tenant_id = :tenant_id
            LEFT JOIN shared.positions p ON e.position_id = p.id AND p.tenant_id = :tenant_id
            WHERE e.id = :employee_id AND e.tenant_id = :tenant_id
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("tenant_id", tenantId)
            .addValue("employee_id", employeeId);

        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, params);

        if (results.isEmpty()) {
            return new SearchResult(false, false, false, List.of(),
                "Funcionário não encontrado.");
        }

        Map<String, Object> emp = results.get(0);
        MatchResult match = new MatchResult(
            (UUID) emp.get("id"),
            (String) emp.get("full_name"),
            (String) emp.get("social_name"),
            (String) emp.get("department_name"),
            (String) emp.get("position_title"),
            1.0,
            true
        );

        return new SearchResult(true, true, false, List.of(match),
            String.format("Encontrado: %s", match.getDisplayName()));
    }

    /**
     * Normalizes a name by removing accents and converting to lowercase.
     */
    public String normalizeName(String name) {
        if (name == null) return "";

        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        normalized = normalized.toLowerCase().trim();

        // Remove extra spaces
        normalized = normalized.replaceAll("\\s+", " ");

        return normalized;
    }

    /**
     * Tokenizes a name into individual words, filtering out connecting words.
     */
    public List<String> tokenizeName(String normalizedName) {
        if (normalizedName == null || normalizedName.isBlank()) {
            return List.of();
        }

        return Arrays.stream(normalizedName.split("\\s+"))
            .filter(token -> !CONNECTING_WORDS.contains(token))
            .filter(token -> token.length() > 1 || Character.isUpperCase(token.charAt(0)))
            .collect(Collectors.toList());
    }

    /**
     * Expands a name with common variations.
     */
    private Set<String> expandNameVariations(String name) {
        Set<String> variations = new HashSet<>();
        variations.add(name);

        for (String token : tokenizeName(name)) {
            if (NAME_VARIATIONS.containsKey(token)) {
                variations.addAll(NAME_VARIATIONS.get(token));
            }
        }

        return variations;
    }

    /**
     * Fetches all employees from the database.
     */
    private List<Map<String, Object>> fetchEmployees(UUID tenantId, boolean activeOnly) {
        String sql = """
            SELECT e.id, e.full_name, e.social_name,
                   d.name as department_name, p.title as position_title
            FROM shared.employees e
            LEFT JOIN shared.departments d ON e.department_id = d.id AND d.tenant_id = :tenant_id
            LEFT JOIN shared.positions p ON e.position_id = p.id AND p.tenant_id = :tenant_id
            WHERE e.tenant_id = :tenant_id
            """ + (activeOnly ? " AND e.is_active = true" : "");

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("tenant_id", tenantId);

        return jdbcTemplate.queryForList(sql, params);
    }

    /**
     * Scores an employee based on name similarity.
     */
    private MatchResult scoreEmployee(Map<String, Object> emp, String normalizedSearch,
                                       List<String> searchTokens) {
        UUID id = (UUID) emp.get("id");
        String fullName = (String) emp.get("full_name");
        String socialName = (String) emp.get("social_name");
        String department = (String) emp.get("department_name");
        String position = (String) emp.get("position_title");

        String normalizedFull = normalizeName(fullName);
        String normalizedSocial = socialName != null ? normalizeName(socialName) : "";

        // Check for exact match first
        if (normalizedFull.equals(normalizedSearch) ||
            normalizedSocial.equals(normalizedSearch)) {
            return new MatchResult(id, fullName, socialName, department, position, 1.0, true);
        }

        // Calculate similarity scores
        double fullNameSimilarity = calculateSimilarity(normalizedSearch, normalizedFull);
        double socialNameSimilarity = socialName != null ?
            calculateSimilarity(normalizedSearch, normalizedSocial) : 0;

        // Token-based similarity
        List<String> fullTokens = tokenizeName(normalizedFull);
        List<String> socialTokens = socialName != null ? tokenizeName(normalizedSocial) : List.of();

        double tokenSimilarityFull = calculateTokenSimilarity(searchTokens, fullTokens);
        double tokenSimilaritySocial = calculateTokenSimilarity(searchTokens, socialTokens);

        // Combined score (weighted average)
        double bestStringSimilarity = Math.max(fullNameSimilarity, socialNameSimilarity);
        double bestTokenSimilarity = Math.max(tokenSimilarityFull, tokenSimilaritySocial);

        // Weight token similarity higher as it handles variations better
        double combinedScore = (bestStringSimilarity * 0.3) + (bestTokenSimilarity * 0.7);

        return new MatchResult(id, fullName, socialName, department, position, combinedScore, false);
    }

    /**
     * Scores an employee using partial token matching (more relaxed).
     */
    private MatchResult scoreEmployeePartial(Map<String, Object> emp, List<String> searchTokens) {
        UUID id = (UUID) emp.get("id");
        String fullName = (String) emp.get("full_name");
        String socialName = (String) emp.get("social_name");
        String department = (String) emp.get("department_name");
        String position = (String) emp.get("position_title");

        List<String> fullTokens = tokenizeName(normalizeName(fullName));
        List<String> socialTokens = socialName != null ?
            tokenizeName(normalizeName(socialName)) : List.of();

        double similarity = Math.max(
            calculatePartialTokenMatch(searchTokens, fullTokens),
            calculatePartialTokenMatch(searchTokens, socialTokens)
        );

        return new MatchResult(id, fullName, socialName, department, position, similarity, false);
    }

    /**
     * Calculates Levenshtein similarity between two strings.
     */
    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0;
        if (s1.isEmpty() || s2.isEmpty()) return 0;
        if (s1.equals(s2)) return 1.0;

        int distance = LEVENSHTEIN.apply(s1, s2);
        int maxLength = Math.max(s1.length(), s2.length());

        return 1.0 - ((double) distance / maxLength);
    }

    /**
     * Calculates token-based similarity with support for variations.
     */
    private double calculateTokenSimilarity(List<String> searchTokens, List<String> targetTokens) {
        if (searchTokens.isEmpty() || targetTokens.isEmpty()) return 0;

        int matchedTokens = 0;
        Set<String> expandedSearch = new HashSet<>();

        // Expand search tokens with variations
        for (String token : searchTokens) {
            expandedSearch.add(token);
            expandedSearch.addAll(expandNameVariations(token));
        }

        Set<String> expandedTarget = new HashSet<>();
        for (String token : targetTokens) {
            expandedTarget.add(token);
            expandedTarget.addAll(expandNameVariations(token));
        }

        // Count matches (including partial matches)
        for (String searchToken : searchTokens) {
            double bestMatch = 0;
            for (String targetToken : targetTokens) {
                // Direct match
                if (searchToken.equals(targetToken)) {
                    bestMatch = 1.0;
                    break;
                }
                // Variation match
                if (expandedTarget.contains(searchToken) || expandedSearch.contains(targetToken)) {
                    bestMatch = Math.max(bestMatch, 0.95);
                    continue;
                }
                // Prefix match (e.g., "Vic" matches "Vicente")
                if (targetToken.startsWith(searchToken) || searchToken.startsWith(targetToken)) {
                    double prefixScore = (double) Math.min(searchToken.length(), targetToken.length()) /
                                        Math.max(searchToken.length(), targetToken.length());
                    bestMatch = Math.max(bestMatch, prefixScore * 0.9);
                    continue;
                }
                // Fuzzy match
                double similarity = calculateSimilarity(searchToken, targetToken);
                if (similarity > 0.75) {
                    bestMatch = Math.max(bestMatch, similarity * 0.85);
                }
            }
            matchedTokens += bestMatch;
        }

        // Normalize by the number of search tokens
        return matchedTokens / searchTokens.size();
    }

    /**
     * Calculates partial token match (at least one significant token must match).
     */
    private double calculatePartialTokenMatch(List<String> searchTokens, List<String> targetTokens) {
        if (searchTokens.isEmpty() || targetTokens.isEmpty()) return 0;

        double totalScore = 0;
        int significantMatches = 0;

        for (String searchToken : searchTokens) {
            for (String targetToken : targetTokens) {
                // Skip very short tokens
                if (searchToken.length() < 2 || targetToken.length() < 2) continue;

                // Check for contains
                if (targetToken.contains(searchToken) || searchToken.contains(targetToken)) {
                    double score = (double) Math.min(searchToken.length(), targetToken.length()) /
                                  Math.max(searchToken.length(), targetToken.length());
                    totalScore += score;
                    significantMatches++;
                    break;
                }

                // Check similarity
                double similarity = calculateSimilarity(searchToken, targetToken);
                if (similarity > 0.6) {
                    totalScore += similarity;
                    significantMatches++;
                    break;
                }
            }
        }

        if (significantMatches == 0) return 0;

        // Boost if multiple tokens match
        double baseScore = totalScore / searchTokens.size();
        double matchRatio = (double) significantMatches / searchTokens.size();

        return baseScore * (0.7 + 0.3 * matchRatio);
    }

    /**
     * Formats candidates for display to the user.
     */
    public String formatCandidatesForDisplay(List<MatchResult> candidates) {
        if (candidates.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < candidates.size(); i++) {
            MatchResult c = candidates.get(i);
            sb.append(String.format("%d. %s", i + 1, c.getDisplayName()));
            if (c.position() != null || c.department() != null) {
                sb.append(" (");
                if (c.position() != null) {
                    sb.append(c.position());
                }
                if (c.position() != null && c.department() != null) {
                    sb.append(" - ");
                }
                if (c.department() != null) {
                    sb.append(c.department());
                }
                sb.append(")");
            }
            sb.append("\n");
        }
        return sb.toString().trim();
    }
}
