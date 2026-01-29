package com.axonrh.employee.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração para servir arquivos estáticos (fotos de colaboradores).
 */
@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${employee.photos.upload-dir:uploads/employee-photos}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/employee-photos/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }
}
