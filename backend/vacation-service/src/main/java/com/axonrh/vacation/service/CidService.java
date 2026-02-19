package com.axonrh.vacation.service;

import com.axonrh.vacation.entity.CidCode;
import com.axonrh.vacation.repository.CidCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CidService {

    private final CidCodeRepository cidCodeRepository;

    @Transactional
    public void importFromCsv(String directoryPath) {
        log.info("Iniciando importação de CIDs do diretório: {}", directoryPath);
        
        java.io.File dir = new java.io.File(directoryPath);
        if (!dir.exists()) {
            log.error("Diretório não encontrado: {}", directoryPath);
            throw new RuntimeException("Diretório de CIDs não encontrado no path: " + directoryPath);
        }

        String[] files = dir.list();
        if (files != null) {
            log.info("Arquivos encontrados no diretório: {}", String.join(", ", files));
        } else {
            log.warn("Nenhum arquivo listado no diretório: {}", directoryPath);
        }

        // Limpa antes de importar
        cidCodeRepository.deleteAll();

        try {
            // Tenta encontrar os arquivos ignorando case se necessário
            String capitulos = findFile(dir, "CID-10-CAPITULOS.CSV");
            String grupos = findFile(dir, "CID-10-GRUPOS.CSV");
            String categorias = findFile(dir, "CID-10-CATEGORIAS.CSV");
            String subcategorias = findFile(dir, "CID-10-SUBCATEGORIAS.CSV");

            importCapitulos(capitulos);
            importGrupos(grupos);
            importCategorias(categorias);
            importSubcategorias(subcategorias);
            
            log.info("Importação de CIDs concluída com sucesso.");
        } catch (Exception e) {
            log.error("Erro na importação de CIDs: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao importar CIDs: " + e.getMessage());
        }
    }

    private String findFile(java.io.File dir, String target) {
        java.io.File exact = new java.io.File(dir, target);
        if (exact.exists()) return exact.getAbsolutePath();

        // Tenta achar ignorando case
        String[] files = dir.list();
        if (files != null) {
            for (String f : files) {
                if (f.equalsIgnoreCase(target)) {
                    return new java.io.File(dir, f).getAbsolutePath();
                }
            }
        }
        throw new RuntimeException("Arquivo não encontrado: " + target + " em " + dir.getAbsolutePath());
    }

    private void importCapitulos(String path) throws Exception {
        log.info("Importando Capítulos de {}", path);
        try (BufferedReader br = new BufferedReader(new FileReader(path, StandardCharsets.ISO_8859_1))) {
            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(";");
                if (parts.length >= 4) {
                    CidCode cid = CidCode.builder()
                            .code("CH" + parts[0])
                            .chapterNum(Integer.parseInt(parts[0]))
                            .description(parts[3])
                            .type("CHAPTER")
                            .build();
                    cidCodeRepository.save(cid);
                }
            }
        }
    }

    private void importGrupos(String path) throws Exception {
        log.info("Importando Grupos de {}", path);
        try (BufferedReader br = new BufferedReader(new FileReader(path, StandardCharsets.ISO_8859_1))) {
            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(";");
                if (parts.length >= 4) {
                    CidCode cid = CidCode.builder()
                            .code("GRP_" + parts[0] + "_" + parts[1])
                            .description(parts[3])
                            .type("GROUP")
                            .build();
                    cidCodeRepository.save(cid);
                }
            }
        }
    }

    private void importCategorias(String path) throws Exception {
        log.info("Importando Categorias de {}", path);
        List<CidCode> batch = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(path, StandardCharsets.ISO_8859_1))) {
            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(";");
                if (parts.length >= 3) {
                    CidCode cid = CidCode.builder()
                            .code(parts[0])
                            .description(parts[2])
                            .type("CATEGORY")
                            .build();
                    batch.add(cid);
                    if (batch.size() >= 500) {
                        cidCodeRepository.saveAll(batch);
                        batch.clear();
                    }
                }
            }
            cidCodeRepository.saveAll(batch);
        }
    }

    private void importSubcategorias(String path) throws Exception {
        log.info("Importando Subcategorias de {}", path);
        List<CidCode> batch = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(path, StandardCharsets.ISO_8859_1))) {
            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] parts = line.split(";");
                if (parts.length >= 5) {
                    // SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO
                    CidCode cid = CidCode.builder()
                            .code(parts[0])
                            .description(parts[4])
                            .type("SUBCATEGORY")
                            .build();
                    batch.add(cid);
                    if (batch.size() >= 1000) {
                        cidCodeRepository.saveAll(batch);
                        batch.clear();
                    }
                }
            }
            cidCodeRepository.saveAll(batch);
        }
    }

    public List<CidCode> search(String query) {
        return cidCodeRepository.search(query);
    }
}
