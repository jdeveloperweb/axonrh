package com.axonrh.performance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.axonrh", exclude = {RedisRepositoriesAutoConfiguration.class})
@EnableCaching
@EnableScheduling
@EnableFeignClients
@EnableJpaRepositories(basePackages = {"com.axonrh.performance.repository", "com.axonrh.kafka.dlq"})
@EntityScan(basePackages = {"com.axonrh.performance.entity", "com.axonrh.kafka.dlq"})
public class PerformanceServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PerformanceServiceApplication.class, args);
    }
}
