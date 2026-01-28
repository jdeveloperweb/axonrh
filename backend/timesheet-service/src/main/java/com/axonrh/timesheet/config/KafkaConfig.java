package com.axonrh.timesheet.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuracao do Kafka para o Timesheet Service.
 */
@Configuration
public class KafkaConfig {

    public static final String TIMESHEET_EVENTS_TOPIC = "timesheet.domain.events";
    public static final String TIMESHEET_NOTIFICATIONS_TOPIC = "timesheet.notifications";
    public static final String TIMESHEET_DLQ_TOPIC = "timesheet.dlq";

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${spring.kafka.producer.acks:all}")
    private String acks;

    @Value("${spring.kafka.producer.retries:3}")
    private Integer retries;

    @Bean
    public ObjectMapper timesheetKafkaObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    @Bean
    public ProducerFactory<String, Object> timesheetProducerFactory(ObjectMapper timesheetKafkaObjectMapper) {
        Map<String, Object> props = new HashMap<>();

        // Conexao
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);

        // Serializadores
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        // Confiabilidade
        props.put(ProducerConfig.ACKS_CONFIG, acks);
        props.put(ProducerConfig.RETRIES_CONFIG, retries);
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);

        // Performance
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        props.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");

        // Buffer
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432); // 32MB

        DefaultKafkaProducerFactory<String, Object> factory =
                new DefaultKafkaProducerFactory<>(props);

        // Configura ObjectMapper customizado
        JsonSerializer<Object> valueSerializer = new JsonSerializer<>(timesheetKafkaObjectMapper);
        valueSerializer.setAddTypeInfo(false);
        factory.setValueSerializer(valueSerializer);

        return factory;
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate(
            ProducerFactory<String, Object> timesheetProducerFactory) {
        KafkaTemplate<String, Object> template = new KafkaTemplate<>(timesheetProducerFactory);
        template.setObservationEnabled(true);
        return template;
    }

    @Bean
    public NewTopic timesheetEventsTopic() {
        return TopicBuilder.name(TIMESHEET_EVENTS_TOPIC)
                .partitions(12)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic timesheetNotificationsTopic() {
        return TopicBuilder.name(TIMESHEET_NOTIFICATIONS_TOPIC)
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic timesheetDlqTopic() {
        return TopicBuilder.name(TIMESHEET_DLQ_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
