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

    private EmployeeDTO getEmployeeSafely(UUID employeeId) {
        if (employeeId == null) return null;
        try {
            return employeeClient.getEmployee(employeeId);
        } catch (Exception e) {
            log.warn("Falha ao buscar funcionario {}: {}", employeeId, e.getMessage());
            return null;
        }
    }

    private EmployeeDTO getEmployeeByUserIdSafely(UUID userId) {
        if (userId == null) return null;
        try {
            return employeeClient.getEmployeeByUserId(userId);
        } catch (Exception e) {
            log.warn("Falha ao buscar funcionario por userId {}: {}", userId, e.getMessage());
            return null;
        }
    }

    public void publishPDICreated(PDI pdi) {
        try {
            EmployeeDTO employee = getEmployeeSafely(pdi.getEmployeeId());
            if (employee == null || employee.getUserId() == null) {
                log.warn("Funcionario {} nao possui userId associado. Notificacao de PDI nao sera enviada.", pdi.getEmployeeId());
                return;
            }

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(pdi.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("PDI_CREATED")
                    .title("Novo PDI Criado")
                    .body("Um novo Plano de Desenvolvimento Individual foi criado para você: " + pdi.getTitle())
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
            EmployeeDTO employee = getEmployeeSafely(assignment.getEmployeeId());
            if (employee == null || employee.getUserId() == null) {
                log.warn("Funcionario {} nao possui userId associado. Notificacao de DISC nao sera enviada.", assignment.getEmployeeId());
                return;
            }

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(assignment.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("DISC_ASSIGNED")
                    .title("Teste DISC Atribuído")
                    .body("Um novo teste DISC foi atribuído a você: " + questionnaireTitle)
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
            EmployeeDTO evaluator = getEmployeeSafely(evaluation.getEvaluatorId());
            if (evaluator == null || evaluator.getUserId() == null) {
                log.warn("Avaliador {} nao possui userId associado. Notificacao de avaliacao nao sera enviada.", evaluation.getEvaluatorId());
                return;
            }

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(evaluator.getUserId())
                    .eventType("EVALUATION_CREATED")
                    .title("Nova Avaliação para Preencher")
                    .body("Você tem uma nova avaliação pendente no ciclo: " + cycleName + " (Colaborador: " + evaluation.getEmployeeName() + " )")
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
            EmployeeDTO evaluator = getEmployeeSafely(evaluation.getEvaluatorId());
            if (evaluator == null || evaluator.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(evaluator.getUserId())
                    .eventType("EVALUATION_REMINDER")
                    .title("Lembrete: Avaliação Pendente")
                    .body("Atenção! Você ainda não preencheu a avaliação de " + evaluation.getEmployeeName() + " para o ciclo " + cycleName + ". O prazo está vencendo/vencido.")
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
            EmployeeDTO employee = getEmployeeSafely(assignment.getEmployeeId());
            if (employee == null || employee.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(assignment.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("DISC_REMINDER")
                    .title("Lembrete: Teste DISC Pendente")
                    .body("Você possui um teste DISC pendente. Por favor, reserve um tempo para realizá-lo.")
                    .category("PERFORMANCE")
                    .priority("HIGH")
                    .actionUrl("/performance/disc?take=true")
                    .sourceType("DISC_ASSIGNMENT")
                    .sourceId(assignment.getId())
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar lembrete de DISC", e);
        }
    }

    public void publishDiscCompleted(com.axonrh.performance.entity.DiscEvaluation evaluation) {
        try {
            // Notificar quem solicitou (gestor/RH)
            if (evaluation.getRequestedBy() == null) return;
            
            EmployeeDTO requester = getEmployeeSafely(evaluation.getRequestedBy());
            if (requester == null || requester.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(requester.getUserId())
                    .eventType("DISC_COMPLETED")
                    .title("Teste DISC Concluído")
                    .body("O colaborador " + evaluation.getEmployeeName() + " concluiu o teste DISC.")
                    .category("PERFORMANCE")
                    .priority("NORMAL")
                    .actionUrl("/performance/disc/result/" + evaluation.getId())
                    .sourceType("DISC_EVALUATION")
                    .sourceId(evaluation.getId())
                    .metadata(Map.of(
                            "evaluationId", evaluation.getId().toString(),
                            "employeeName", evaluation.getEmployeeName()
                    ))
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de DISC concluido", e);
        }
    }

    public void publishPDIViewed(PDI pdi, UUID viewerUserId) {
        try {
            // Determinar quem notificar:
            // Se o colaborador visualizou, notifica o gestor
            // Se o gestor visualizou, notifica o colaborador
            
            UUID targetEmployeeId;
            String message;
            
            EmployeeDTO viewerEmployee = getEmployeeByUserIdSafely(viewerUserId);
            if (viewerEmployee == null) return;

            if (viewerEmployee.getId().equals(pdi.getEmployeeId())) {
                // Colaborador viu -> Notifica gestor
                if (pdi.getManagerId() == null) return;
                targetEmployeeId = pdi.getManagerId();
                message = "O colaborador " + pdi.getEmployeeName() + " visualizou o PDI: " + pdi.getTitle();
            } else if (viewerEmployee.getId().equals(pdi.getManagerId())) {
                // Gestor viu -> Notifica colaborador
                targetEmployeeId = pdi.getEmployeeId();
                message = "O gestor " + pdi.getManagerName() + " visualizou o seu PDI: " + pdi.getTitle();
            } else {
                // Outra pessoa viu? (RH talvez). Nao notifica por enquanto ou escolhe um padrao.
                return;
            }

            EmployeeDTO target = getEmployeeSafely(targetEmployeeId);
            if (target == null || target.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(pdi.getTenantId())
                    .userId(target.getUserId())
                    .eventType("PDI_VIEWED")
                    .title("PDI Visualizado")
                    .body(message)
                    .category("PERFORMANCE")
                    .priority("LOW")
                    .actionUrl("/performance/pdi/" + pdi.getId())
                    .sourceType("PDI")
                    .sourceId(pdi.getId())
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de PDI visualizado", e);
        }
    }

    public void publishPDIActionCompleted(com.axonrh.performance.entity.PDI pdi, com.axonrh.performance.entity.PDIAction action) {
        try {
            if (pdi.getManagerId() == null) return;
            
            EmployeeDTO manager = getEmployeeSafely(pdi.getManagerId());
            if (manager == null || manager.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(pdi.getTenantId())
                    .userId(manager.getUserId())
                    .eventType("PDI_ACTION_COMPLETED")
                    .title("Ação de PDI Concluída")
                    .body("O colaborador " + pdi.getEmployeeName() + " concluiu a ação: " + action.getTitle())
                    .category("PERFORMANCE")
                    .priority("NORMAL")
                    .actionUrl("/performance/pdi/" + pdi.getId())
                    .sourceType("PDI_ACTION")
                    .sourceId(action.getId())
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de acao de PDI concluida", e);
        }
    }

    public void publishEvaluationAcknowledged(com.axonrh.performance.entity.Evaluation evaluation) {
        try {
            EmployeeDTO manager = getEmployeeSafely(evaluation.getEvaluatorId());
            if (manager == null || manager.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(manager.getUserId())
                    .eventType("EVALUATION_ACKNOWLEDGED")
                    .title("Avaliação Visualizada pelo Colaborador")
                    .body("O colaborador " + evaluation.getEmployeeName() + " leu e deu o ciente na sua avaliação.")
                    .category("PERFORMANCE")
                    .priority("NORMAL")
                    .actionUrl("/performance/evaluations/" + evaluation.getId())
                    .sourceType("EVALUATION")
                    .sourceId(evaluation.getId())
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de ciencia de avaliacao", e);
        }
    }

    public void publishEvaluationCompleted(com.axonrh.performance.entity.Evaluation evaluation) {
        try {
            // Notificar o colaborador que a avaliacao dele está pronta
            EmployeeDTO employee = getEmployeeSafely(evaluation.getEmployeeId());
            if (employee == null || employee.getUserId() == null) return;

            NotificationEvent event = NotificationEvent.builder()
                    .tenantId(evaluation.getTenantId())
                    .userId(employee.getUserId())
                    .eventType("EVALUATION_COMPLETED")
                    .title("Sua Avaliação foi Concluída")
                    .body("Sua avaliação de desempenho do ciclo " + (evaluation.getCycle() != null ? evaluation.getCycle().getName() : "") + " foi finalizada e está disponível para visualização.")
                    .category("PERFORMANCE")
                    .priority("NORMAL")
                    .actionUrl("/performance/evaluations/my-evaluations")
                    .sourceType("EVALUATION")
                    .sourceId(evaluation.getId())
                    .build();

            domainEventPublisher.publish(KafkaTopics.PERFORMANCE_DOMAIN_EVENTS, event);
        } catch (Exception e) {
            log.error("Erro ao publicar evento de avaliacao concluida para o colaborador", e);
        }
    }
}

