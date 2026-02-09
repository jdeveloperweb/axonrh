package com.axonrh.performance.publisher;

import com.axonrh.kafka.event.notification.NotificationEvent;
import com.axonrh.kafka.producer.DomainEventPublisher;
import com.axonrh.kafka.topic.KafkaTopics;
import com.axonrh.performance.client.EmployeeServiceClient;
import com.axonrh.performance.dto.EmployeeDTO;
import com.axonrh.performance.entity.DiscAssignment;
import com.axonrh.performance.entity.PDI;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PerformanceEventPublisher {

    private final DomainEventPublisher domainEventPublisher;
    private final EmployeeServiceClient employeeClient;

    public void publishPDICreated(PDI pdi) {
        try {
            EmployeeDTO employee = employeeClient.getEmployee(pdi.getEmployeeId());
            if (employee.getUserId() == null) {
                log.warn("Funcionario {} nao possui userId associado. Notificacao de PDI nao sera enviada.", pdi.getEmployeeId());
                return;
            }

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(pdi.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("PDI_CREATED")
                    .title("Novo PDI Criado")
                    .message("Um novo Plano de Desenvolvimento Individual foi criado para você: " + pdi.getTitle())
                    .category("PERFORMANCE")
                    .priority("NORMAL")
                    .actionUrl("/performance/pdi/" + pdi.getId())
                    .sourceType("PDI")
                    .sourceId(pdi.getId())
                    .metadata(Map.of(
                            "pdiId", pdi.getId().toString(),
                            "title", pdi.getTitle()
                    ))
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de PDI criado", e);
        }
    }

    public void publishDiscAssigned(DiscAssignment assignment, String questionnaireTitle) {
        try {
            EmployeeDTO employee = employeeClient.getEmployee(assignment.getEmployeeId());
            if (employee.getUserId() == null) {
                log.warn("Funcionario {} nao possui userId associado. Notificacao de DISC nao sera enviada.", assignment.getEmployeeId());
                return;
            }

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(assignment.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("DISC_ASSIGNED")
                    .title("Teste DISC Atribuído")
                    .message("Um novo teste DISC foi atribuído a você: " + questionnaireTitle)
                    .category("PERFORMANCE")
                    .priority("HIGH")
                    .actionUrl("/performance/disc/take/" + assignment.getId())
                    .sourceType("DISC")
                    .sourceId(assignment.getId())
                    .metadata(Map.of(
                            "assignmentId", assignment.getId().toString(),
                            "title", questionnaireTitle
                    ))
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de teste DISC atribuido", e);
        }
    }

    public void publishEvaluationCreated(com.axonrh.performance.entity.Evaluation evaluation, String cycleName) {
        try {
            // A avaliacao pode ser para o proprio (autoavaliacao) ou para outro (gestor/par)
            // O avaliador (evaluatorId) e quem deve receber a notificacao para preencher
            EmployeeDTO evaluator = employeeClient.getEmployee(evaluation.getEvaluatorId());
            if (evaluator.getUserId() == null) {
                log.warn("Avaliador {} nao possui userId associado. Notificacao de avaliacao nao sera enviada.", evaluation.getEvaluatorId());
                return;
            }

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(evaluator.getUserId())
                    .eventType("EVALUATION_CREATED")
                    .title("Nova Avaliação para Preencher")
                    .message("Você tem uma nova avaliação pendente no ciclo: " + cycleName + " (Colaborador: " + evaluation.getEmployeeName() + " )")
                    .category("PERFORMANCE")
                    .priority("HIGH")
                    .actionUrl("/performance/evaluations/" + evaluation.getId())
                    .sourceType("EVALUATION")
                    .sourceId(evaluation.getId())
                    .metadata(Map.of(
                            "evaluationId", evaluation.getId().toString(),
                            "cycleName", cycleName,
                            "employeeName", evaluation.getEmployeeName()
                    ))
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de avaliacao criada", e);
        }
    }

    public void publishEvaluationReminder(com.axonrh.performance.entity.Evaluation evaluation, String cycleName) {
        try {
            EmployeeDTO evaluator = employeeClient.getEmployee(evaluation.getEvaluatorId());
            if (evaluator.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(evaluator.getUserId())
                    .eventType("EVALUATION_REMINDER")
                    .title("Lembrete: Avaliação Pendente")
                    .message("Atenção! Você ainda não preencheu a avaliação de " + evaluation.getEmployeeName() + " para o ciclo " + cycleName + ". O prazo está vencendo/vencido.")
                    .category("PERFORMANCE")
                    .priority("URGENT")
                    .actionUrl("/performance/evaluations/" + evaluation.getId())
                    .sourceType("EVALUATION")
                    .sourceId(evaluation.getId())
                    .metadata(Map.of(
                            "evaluationId", evaluation.getId().toString(),
                            "cycleName", cycleName
                    ))
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar lembrete de avaliacao", e);
        }
    }

    public void publishDiscReminder(com.axonrh.performance.entity.DiscAssignment assignment) {
        try {
            EmployeeDTO employee = employeeClient.getEmployee(assignment.getEmployeeId());
            if (employee.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(assignment.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("DISC_REMINDER")
                    .title("Lembrete: Teste DISC Pendente")
                    .message("Você possui um teste DISC pendente. Por favor, reserve um tempo para realizá-lo.")
                    .category("PERFORMANCE")
                    .priority("HIGH")
                    .actionUrl("/performance/disc")
                    .sourceType("DISC_ASSIGNMENT")
                    .sourceId(assignment.getId())
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar lembrete de DISC", e);
        }
    }
}
