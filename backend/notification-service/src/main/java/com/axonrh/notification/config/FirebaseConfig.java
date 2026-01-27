package com.axonrh.notification.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.getApplicationDefault())
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase App initialized successfully using Application Default Credentials.");
            } catch (IOException e) {
                log.warn("Failed to initialize Firebase App: {}. Push Notification service might not work correctly.", e.getMessage());
                
                try {
                    FirebaseApp.initializeApp();
                } catch (Exception ex) {
                    log.error("Could not initialize Firebase. Check credentials.");
                }
            }
        }
        
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase App could not be initialized. Push notifications will be disabled.");
            return null;
        }
        
        try {
            return FirebaseMessaging.getInstance();
        } catch (Exception e) {
            log.error("Error getting FirebaseMessaging instance: {}", e.getMessage());
            return null;
        }
    }
}
