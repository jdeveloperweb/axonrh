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
        
        // Limpa antes de importar para evitar duplicidade ou inconsistência se rodar de novo
        cidCodeRepository.deleteAll();

        try {
            // 1. Capítulos
            importCapitulos(directoryPath + "/CID-10-CAPITULOS.CSV");
            // 2. Grupos
            importGrupos(directoryPath + "/CID-10-GRUPOS.CSV");
            // 3. Categorias
            importCategorias(directoryPath + "/CID-10-CATEGORIAS.CSV");
            // 4. Subcategorias
            importSubcategorias(directoryPath + "/CID-10-SUBCATEGORIAS.CSV");
            
            log.info("Importação de CIDs concluída com sucesso.");
        } catch (Exception e) {
            log.error("Erro na importação de CIDs: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao importar CIDs: " + e.getMessage());
        }
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
