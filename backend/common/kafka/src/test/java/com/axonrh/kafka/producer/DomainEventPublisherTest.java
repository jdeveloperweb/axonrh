package com.axonrh.kafka.producer;

import com.axonrh.kafka.event.DomainEvent;
import com.axonrh.kafka.event.employee.EmployeeCreatedEvent;
import com.axonrh.kafka.topic.KafkaTopics;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Testes do DomainEventPublisher.
 */
@ExtendWith(MockitoExtension.class)
class DomainEventPublisherTest {

    @Mock
    private KafkaTemplate<String, DomainEvent> kafkaTemplate;

    @Captor
    private ArgumentCaptor<ProducerRecord<String, DomainEvent>> recordCaptor;

    private DomainEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new DomainEventPublisher(kafkaTemplate);
    }

    @Test
    @DisplayName("Deve publicar evento no topic correto")
    void shouldPublishEventToCorrectTopic() {
        // Given
        UUID tenantId = UUID.randomUUID();
        UUID aggregateId = UUID.randomUUID();

        EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                .eventId(UUID.randomUUID())
                .tenantId(tenantId)
                .aggregateId(aggregateId)
                .fullName("Maria Silva")
                .email("maria@empresa.com")
                .cpf("12345678901")
                .hireDate(LocalDate.now())
                .build();

        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        // When
        publisher.publish(event);

        // Then
        verify(kafkaTemplate).send(recordCaptor.capture());
        ProducerRecord<String, DomainEvent> record = recordCaptor.getValue();

        assertThat(record.topic()).isEqualTo(KafkaTopics.EMPLOYEE_DOMAIN_EVENTS);
        assertThat(record.key()).isEqualTo(aggregateId.toString());
        assertThat(record.value()).isEqualTo(event);
    }

    @Test
    @DisplayName("Deve adicionar headers de rastreamento")
    void shouldAddTrackingHeaders() {
        // Given
        UUID tenantId = UUID.randomUUID();
        String correlationId = UUID.randomUUID().toString();

        EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                .eventId(UUID.randomUUID())
                .tenantId(tenantId)
                .aggregateId(UUID.randomUUID())
                .correlationId(correlationId)
                .fullName("Joao Santos")
                .build();

        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        // When
        publisher.publish(event);

        // Then
        verify(kafkaTemplate).send(recordCaptor.capture());
        ProducerRecord<String, com.axonrh.kafka.event.DomainEvent> record = recordCaptor.getValue();

        assertThat(record.headers().lastHeader("correlationId")).isNotNull();
        assertThat(new String(record.headers().lastHeader("correlationId").value()))
                .isEqualTo(correlationId);

        assertThat(record.headers().lastHeader("tenantId")).isNotNull();
        assertThat(new String(record.headers().lastHeader("tenantId").value()))
                .isEqualTo(tenantId.toString());

        assertThat(record.headers().lastHeader("eventType")).isNotNull();
        assertThat(new String(record.headers().lastHeader("eventType").value()))
                .isEqualTo("EMPLOYEE_CREATED");
    }

    @Test
    @DisplayName("Deve usar aggregateId como chave de particao")
    void shouldUseAggregateIdAsPartitionKey() {
        // Given
        UUID aggregateId = UUID.randomUUID();

        EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                .eventId(UUID.randomUUID())
                .aggregateId(aggregateId)
                .fullName("Ana Costa")
                .build();

        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        // When
        publisher.publish(event);

        // Then
        verify(kafkaTemplate).send(recordCaptor.capture());
        assertThat(recordCaptor.getValue().key()).isEqualTo(aggregateId.toString());
    }

    @Test
    @DisplayName("Deve usar tenantId como chave quando aggregateId e nulo")
    void shouldUseTenantIdAsKeyWhenAggregateIdIsNull() {
        // Given
        UUID tenantId = UUID.randomUUID();

        EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                .eventId(UUID.randomUUID())
                .tenantId(tenantId)
                .aggregateId(null)
                .fullName("Carlos Lima")
                .build();

        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        // When
        publisher.publish(event);

        // Then
        verify(kafkaTemplate).send(recordCaptor.capture());
        assertThat(recordCaptor.getValue().key()).isEqualTo(tenantId.toString());
    }

    @Test
    @DisplayName("Deve publicar para DLQ com headers de erro")
    void shouldPublishToDlqWithErrorHeaders() {
        // Given
        UUID eventId = UUID.randomUUID();
        EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                .eventId(eventId)
                .aggregateId(UUID.randomUUID())
                .fullName("Pedro Alves")
                .build();

        String reason = "PROCESSING_ERROR";
        Exception ex = new RuntimeException("Erro no processamento");

        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        // When
        publisher.publishToDlq(event, reason, ex);

        // Then
        verify(kafkaTemplate).send(recordCaptor.capture());
        ProducerRecord<String, DomainEvent> record = recordCaptor.getValue();

        assertThat(record.topic()).isEqualTo(KafkaTopics.DEAD_LETTER_QUEUE);

        assertThat(record.headers().lastHeader("dlq.reason")).isNotNull();
        assertThat(new String(record.headers().lastHeader("dlq.reason").value()))
                .isEqualTo(reason);

        assertThat(record.headers().lastHeader("dlq.exception")).isNotNull();
        assertThat(new String(record.headers().lastHeader("dlq.exception").value()))
                .contains("Erro no processamento");
    }

    @Test
    @DisplayName("Deve publicar em topic especifico quando fornecido")
    void shouldPublishToSpecificTopic() {
        // Given
        String customTopic = "custom.topic";
        EmployeeCreatedEvent event = EmployeeCreatedEvent.create()
                .eventId(UUID.randomUUID())
                .aggregateId(UUID.randomUUID())
                .fullName("Lucia Melo")
                .build();

        when(kafkaTemplate.send(any(ProducerRecord.class)))
                .thenReturn(CompletableFuture.completedFuture(mock(SendResult.class)));

        // When
        publisher.publish(customTopic, event);

        // Then
        verify(kafkaTemplate).send(recordCaptor.capture());
        assertThat(recordCaptor.getValue().topic()).isEqualTo(customTopic);
    }
}
