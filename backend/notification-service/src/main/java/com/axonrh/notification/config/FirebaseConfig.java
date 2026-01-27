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
                log.info("Firebase App inicializado com sucesso usando Application Default Credentials.");
            } catch (IOException e) {
                log.warn("Falha ao inicializar Firebase App: {}. O serviço de Push Notification pode não funcionar corretamente.", e.getMessage());
                // Em desenvolvimento, podemos querer apenas inicializar com credenciais mock ou deixar falhar se for obrigatorio
                // Para evitar que a aplicação quebre no startup, podemos retornar o bean mesmo se falhar a inicialização do App
                // No entanto, FirebaseMessaging.getInstance() precisa de um app.
                
                try {
                    // Tenta inicializar sem credenciais explicitas para ver se funciona (alguns ambientes ja tem configurado)
                    FirebaseApp.initializeApp();
                } catch (Exception ex) {
                    log.error("Não foi possível inicializar o Firebase. Verifique as credenciais.");
                }
            }
        }
        
        try {
            return FirebaseMessaging.getInstance();
        } catch (Exception e) {
            log.error("Erro ao obter instância do FirebaseMessaging: {}", e.getMessage());
            return null; // Retornar null pode causar NullPointerException no PushNotificationService se não for tratado
        }
    }
}
