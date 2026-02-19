package com.axonrh.vacation.controller;

import com.axonrh.vacation.entity.CidCode;
import com.axonrh.vacation.service.CidService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/leaves/cid")
@RequiredArgsConstructor
public class CidController {

    private final CidService cidService;

    @PostMapping("/import")
    public ResponseEntity<Map<String, String>> importCids() {
        // Caminho dentro do container Docker (mapeado via volume no docker-compose)
        String path = "/workspace/CID10CSV";
        cidService.importFromCsv(path);
        return ResponseEntity.ok(Map.of("message", "Importação iniciada com sucesso."));
    }

    @GetMapping("/search")
    public ResponseEntity<List<CidCode>> search(@RequestParam("q") String query) {
        if (query == null || query.length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(cidService.search(query));
    }
}
