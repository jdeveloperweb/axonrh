package com.axonrh.payroll;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableCaching
@EnableJpaAuditing
@EnableKafka
@EnableAsync
@EnableFeignClients
@EnableJpaRepositories(basePackages = {"com.axonrh.payroll.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.payroll.entity", "com.axonrh.kafka.dlq"})
public class PayrollServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PayrollServiceApplication.class, args);
    }
}
