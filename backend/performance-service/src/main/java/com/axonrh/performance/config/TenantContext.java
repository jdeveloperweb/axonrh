package com.axonrh.performance.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Context holder para tenant atual.
 * Utiliza ThreadLocal para armazenar o tenant da requisicao.
 */
public class TenantContext {

    private static final Logger log = LoggerFactory.getLogger(TenantContext.class);

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    /**
     * Define o tenant atual.
     */
    public static void setCurrentTenant(String tenantId) {
        log.trace("Definindo tenant: {}", tenantId);
        CURRENT_TENANT.set(tenantId);
    }

    /**
     * Retorna o tenant atual.
     */
    public static String getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    /**
     * Limpa o tenant atual.
     * Deve ser chamado ao final de cada requisicao.
     */
    public static void clear() {
        log.trace("Limpando tenant context");
        CURRENT_TENANT.remove();
    }
}
