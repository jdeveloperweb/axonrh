package com.axonrh.vacation.controller;

import com.axonrh.vacation.client.EmployeeServiceClient;
import com.axonrh.vacation.config.TenantContext;
import com.axonrh.vacation.dto.EmployeeDTO;
import com.axonrh.vacation.entity.LeaveRequest;
import com.axonrh.vacation.entity.enums.LeaveType;
import com.axonrh.vacation.entity.enums.VacationRequestStatus;
import com.axonrh.vacation.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/mock/leaves")
@RequiredArgsConstructor
@Slf4j
public class MockLeaveController {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final Random random = new Random();

    private final String[] CIDS = {"M54.5", "J06", "B34", "K29.7", "R51", "A09", "M54.1", "J00", "B30"};
    private final String[] CID_DESCS = {
        "Dorsalgia lombar", 
        "Infecções agudas das vias aéreas superiores", 
        "Virose não especificada", 
        "Gastrite não especificada",
        "Cefaleia", 
        "Diarreia e gastroenterite de origem infecciosa", 
        "Radiculopatia",
        "Resfriado comum (Nasofaringite aguda)",
        "Conjuntivite"
    };

    private final String[] DOCTORS = {"Dr. Arnaldo Silva", "Dra. Juliana Mendes", "Dr. Ricardo Santos", "Dra. Fernanda Oliveira", "Dr. Paulo Guedes"};

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedLeaves(@RequestParam(defaultValue = "10") int count) {
        UUID tenantId = getTenantId();
        log.info("Iniciando carga de {} licenças mockadas para tenant {}", count, tenantId);

        List<EmployeeDTO> employees = employeeServiceClient.getActiveEmployees();
        if (employees.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nenhum colaborador ativo encontrado para este tenant."));
        }

        int createdCount = 0;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            try {
                EmployeeDTO emp = employees.get(random.nextInt(employees.size()));
                LeaveType type = LeaveType.values()[random.nextInt(LeaveType.values().length)];
                
                // If VACATION, let's keep it simple or pick another type if we want to focus on licenses
                if (type == LeaveType.VACATION && random.nextBoolean()) {
                    type = LeaveType.MEDICAL;
                }

                int duration = 1 + random.nextInt(15);
                LocalDate start = LocalDate.now().minusDays(random.nextInt(180));
                LocalDate end = start.plusDays(duration - 1);

                LeaveRequest lr = LeaveRequest.builder()
                        .tenantId(tenantId)
                        .employeeId(emp.getId())
                        .employeeName(emp.getFullName())
                        .type(type)
                        .startDate(start)
                        .endDate(end)
                        .daysCount(duration)
                        .status(VacationRequestStatus.values()[random.nextInt(VacationRequestStatus.values().length)])
                        .build();

                if (type == LeaveType.MEDICAL) {
                    int cidIdx = random.nextInt(CIDS.length);
                    lr.setCid(CIDS[cidIdx]);
                    lr.setCidDescription(CID_DESCS[cidIdx]);
                    lr.setDoctorName(DOCTORS[random.nextInt(DOCTORS.length)]);
                    lr.setCrm("CRM/UF " + (10000 + random.nextInt(90000)));
                    lr.setReason("Paciente apresenta quadro clínico compatível com o CID informado.");
                } else {
                    lr.setReason("Solicitação de licença do tipo " + type);
                }

                leaveRequestRepository.save(lr);
                createdCount++;
            } catch (Exception e) {
                log.error("Erro ao criar licença mock: {}", e.getMessage());
                errors.add(e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Carga de licenças finalizada");
        result.put("requested", count);
        result.put("created", createdCount);
        result.put("errors", errors);

        return ResponseEntity.ok(result);
    }

    private UUID getTenantId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("Tenant nao definido no contexto. Chame a API autenticado.");
        }
        return UUID.fromString(tenant);
    }
}
