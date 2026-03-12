package com.axonrh.timesheet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(scanBasePackages = "com.axonrh")
@EnableCaching
@EnableScheduling
@EnableFeignClients
@EnableJpaRepositories(basePackages = {"com.axonrh.timesheet.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.timesheet.entity", "com.axonrh.kafka.dlq"})
public class TimesheetServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimesheetServiceApplication.class, args);
    }
}
