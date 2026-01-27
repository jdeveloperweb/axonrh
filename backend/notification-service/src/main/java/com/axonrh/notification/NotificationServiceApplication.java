package com.axonrh.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableAsync
@EnableScheduling
@EnableJpaRepositories(basePackages = {"com.axonrh.notification.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.notification.entity", "com.axonrh.kafka.dlq"})
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
