package com.axonrh.employee.config;

import lombok.extern.slf4j.Slf4j;
import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

/**
 * T095 - Configuracao de multi-tenancy com schema-per-tenant.
 * Cada tenant tem seu proprio schema no PostgreSQL.
 */
@Configuration
@Slf4j
public class MultiTenantConfig {

    @Value("${multitenancy.default-schema:shared}")
    private String defaultSchema;

    @Value("${multitenancy.tenant-schema-prefix:tenant_}")
    private String tenantSchemaPrefix;

    @Bean
    public CurrentTenantIdentifierResolver<String> currentTenantIdentifierResolver() {
        return new CurrentTenantIdentifierResolver<>() {
            @Override
            public String resolveCurrentTenantIdentifier() {
                String tenantId = TenantContext.getCurrentTenant();
                return tenantId != null ? tenantSchemaPrefix + tenantId : defaultSchema;
            }

            @Override
            public boolean validateExistingCurrentSessions() {
                return true;
            }
        };
    }

    @Bean
    public MultiTenantConnectionProvider<String> multiTenantConnectionProvider(DataSource dataSource) {
        return new MultiTenantConnectionProvider<>() {
            @Override
            public Connection getAnyConnection() throws SQLException {
                return dataSource.getConnection();
            }

            @Override
            public void releaseAnyConnection(Connection connection) throws SQLException {
                connection.close();
            }

            @Override
            public Connection getConnection(String tenantIdentifier) throws SQLException {
                Connection connection = getAnyConnection();
                try {
                    connection.setSchema(tenantIdentifier);
                    log.trace("Schema alterado para: {}", tenantIdentifier);
                } catch (SQLException e) {
                    log.error("Erro ao definir schema {}: {}", tenantIdentifier, e.getMessage());
                    throw e;
                }
                return connection;
            }

            @Override
            public void releaseConnection(String tenantIdentifier, Connection connection) throws SQLException {
                try {
                    connection.setSchema(defaultSchema);
                } finally {
                    releaseAnyConnection(connection);
                }
            }

            @Override
            public boolean supportsAggressiveRelease() {
                return false;
            }

            @Override
            public boolean isUnwrappableAs(Class<?> unwrapType) {
                return false;
            }

            @Override
            public <T> T unwrap(Class<T> unwrapType) {
                throw new UnsupportedOperationException("Unwrap nao suportado");
            }
        };
    }

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(
            MultiTenantConnectionProvider<String> multiTenantConnectionProvider,
            CurrentTenantIdentifierResolver<String> currentTenantIdentifierResolver) {

        return (Map<String, Object> hibernateProperties) -> {
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, multiTenantConnectionProvider);
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, currentTenantIdentifierResolver);
        };
    }
}
