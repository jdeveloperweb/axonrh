package com.axonrh.config.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuracao de cache Redis para configuracoes de tenant.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String THEME_CACHE = "theme-config";
    public static final String CSS_CACHE = "css-variables";
    public static final String LOGO_CACHE = "logo-urls";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Cache de tema: 1 hora
        cacheConfigurations.put(THEME_CACHE, defaultConfig.entryTtl(Duration.ofHours(1)));

        // Cache de CSS: 24 horas (muda com menos frequencia)
        cacheConfigurations.put(CSS_CACHE, defaultConfig.entryTtl(Duration.ofHours(24)));

        // Cache de URLs de logo: 6 horas
        cacheConfigurations.put(LOGO_CACHE, defaultConfig.entryTtl(Duration.ofHours(6)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
