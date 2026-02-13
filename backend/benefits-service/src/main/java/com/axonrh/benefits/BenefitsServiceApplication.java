package com.axonrh.benefits;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableCaching
@EnableJpaAuditing
@EnableKafka
@EnableAsync
@EnableFeignClients
@EnableJpaRepositories(basePackages = {"com.axonrh.benefits.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.benefits.entity", "com.axonrh.kafka.dlq"})
public class BenefitsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BenefitsServiceApplication.class, args);
    }
}
