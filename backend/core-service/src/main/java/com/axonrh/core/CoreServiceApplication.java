package com.axonrh.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableJpaRepositories(basePackages = {"com.axonrh.core.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.core.entity", "com.axonrh.kafka.dlq"})
public class CoreServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoreServiceApplication.class, args);
    }
}
