package com.axonrh.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita um broker simples baseado em memoria para enviar mensagens ao cliente
        // /topic para mensagens broadcast e /queue para mensagens especificas de usuario
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefixo para mensagens enviadas do cliente para o servidor
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefixo para mensagens direcionadas a usuarios especificos
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint que o cliente usara para se conectar ao servidor WebSocket
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
