package com.axonrh.timesheet.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    public static final String TIMESHEET_EVENTS_TOPIC = "timesheet.domain.events";
    public static final String TIMESHEET_NOTIFICATIONS_TOPIC = "timesheet.notifications";
    public static final String TIMESHEET_DLQ_TOPIC = "timesheet.dlq";

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

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
