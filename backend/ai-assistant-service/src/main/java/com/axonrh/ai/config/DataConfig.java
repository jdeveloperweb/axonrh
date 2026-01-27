package com.axonrh.ai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.mongodb.repository.MongoRepository;

@Configuration
public class DataConfig {

    @Configuration
    @EnableJpaRepositories(
            basePackages = "com.axonrh.ai.repository",
            includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JpaRepository.class)
    )
    static class JpaRepositoriesConfig {}

    @Configuration
    @EnableMongoRepositories(
            basePackages = "com.axonrh.ai.repository",
            includeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = MongoRepository.class)
    )
    static class MongoRepositoriesConfig {}
}
