package com.axonrh.vacation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableCaching
@EnableScheduling
@EnableFeignClients
@EnableJpaRepositories(basePackages = {"com.axonrh.vacation.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.vacation.entity", "com.axonrh.kafka.dlq"})
public class VacationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(VacationServiceApplication.class, args);
    }
}
