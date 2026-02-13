package com.axonrh.integration.dynamic.service;

import freemarker.template.Configuration;
import freemarker.cache.StringTemplateLoader;
import freemarker.template.Template;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.util.Map;

@Service
public class TemplateService {

    private final Configuration freemarkerConfig;
    private final StringTemplateLoader templateLoader;

    public TemplateService() {
        this.freemarkerConfig = new Configuration(Configuration.VERSION_2_3_32);
        this.templateLoader = new StringTemplateLoader();
        this.freemarkerConfig.setTemplateLoader(templateLoader);
        this.freemarkerConfig.setDefaultEncoding("UTF-8");
        this.freemarkerConfig.setNumberFormat("computer"); // Evita formatação de números com vírgulas
    }

    public String render(String templateName, String templateContent, Map<String, Object> data) {
        if (templateContent == null || templateContent.isBlank()) {
            return null;
        }

        try {
            // Atualiza ou adiciona o template no loader (simples cache por nome)
            // Em produção com muitos templates dinâmicos, seria ideal usar um cache mais robusto
            // ou recriar apenas quando mudar, mas o StringTemplateLoader lida bem com isso.
            // Para garantir que sempre usa a versão mais recente da string, podemos usar o conteúdo como chave ou apenas sobrescrever.
            // Aqui vamos sobrescrever sempre para garantir que edições na config tenham efeito imediato.
            templateLoader.putTemplate(templateName, templateContent);
            
            Template template = freemarkerConfig.getTemplate(templateName);
            StringWriter writer = new StringWriter();
            template.process(data, writer);
            return writer.toString();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar template " + templateName + ": " + e.getMessage(), e);
        }
    }
}
