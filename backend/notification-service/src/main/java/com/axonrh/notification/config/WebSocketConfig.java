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
        // Enable a simple memory-based message broker to send messages to the client
        // /topic for broadcast messages and /queue for user-specific messages
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages sent from client to server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for messages directed to specific users
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint that the client will use to connect to the WebSocket server
        registry.addEndpoint("/ws-notifications")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
