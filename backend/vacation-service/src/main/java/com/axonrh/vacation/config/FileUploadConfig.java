package com.axonrh.vacation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuração para servir arquivos estáticos (atestados médicos).
 */
@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${vacation.leaves.upload-dir:C:/Users/Jaime.Vicente/axonrh/uploads/medical-certificates}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        // Usar toUri().toString() garante que o path comece com file:/// corretamente em Windows/Linux
        String uploadPathUri = uploadPath.toUri().toString();
        
        registry.addResourceHandler("/api/v1/leaves/certificates/**")
                .addResourceLocations(uploadPathUri);
        
        // Mantem compatibilidade com path genérico
        registry.addResourceHandler("/uploads/medical-certificates/**")
                .addResourceLocations(uploadPathUri);
    }
}
