package com.axonrh.notification.service;

import com.axonrh.notification.entity.PushToken;
import com.axonrh.notification.entity.PushToken.DeviceType;
import com.axonrh.notification.repository.PushLogRepository;
import com.axonrh.notification.repository.PushTokenRepository;
import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Value("${push.enabled:true}")
    private boolean pushEnabled;

    private final PushTokenRepository tokenRepository;
    private final PushLogRepository logRepository;
    private final FirebaseMessaging firebaseMessaging;

    public PushNotificationService(PushTokenRepository tokenRepository,
                                   PushLogRepository logRepository,
                                   FirebaseMessaging firebaseMessaging) {
        this.tokenRepository = tokenRepository;
        this.logRepository = logRepository;
        this.firebaseMessaging = firebaseMessaging;
    }

    /**
     * Registra token de push para um usuario.
     */
    public PushToken registerToken(UUID tenantId, UUID userId, UUID employeeId,
                                   String token, DeviceType deviceType,
                                   String deviceName, String deviceModel,
                                   String osVersion, String appVersion) {
        // Check if token already exists
        Optional<PushToken> existing = tokenRepository.findByTenantIdAndToken(tenantId, token);
        if (existing.isPresent()) {
            PushToken existingToken = existing.get();
            existingToken.setUserId(userId);
            existingToken.setEmployeeId(employeeId);
            existingToken.setDeviceName(deviceName);
            existingToken.setDeviceModel(deviceModel);
            existingToken.setOsVersion(osVersion);
            existingToken.setAppVersion(appVersion);
            existingToken.setActive(true);
            existingToken.markUsed();
            return tokenRepository.save(existingToken);
        }

        PushToken pushToken = new PushToken();
        pushToken.setTenantId(tenantId);
        pushToken.setUserId(userId);
        pushToken.setEmployeeId(employeeId);
        pushToken.setToken(token);
        pushToken.setDeviceType(deviceType);
        pushToken.setDeviceName(deviceName);
        pushToken.setDeviceModel(deviceModel);
        pushToken.setOsVersion(osVersion);
        pushToken.setAppVersion(appVersion);

        return tokenRepository.save(pushToken);
    }

    /**
     * Desativa token de push.
     */
    public void deactivateToken(UUID tenantId, String token) {
        tokenRepository.findByTenantIdAndToken(tenantId, token)
                .ifPresent(pushToken -> {
                    pushToken.setActive(false);
                    tokenRepository.save(pushToken);
                });
    }

    /**
     * Envia notificacao push para um usuario.
     */
    @Async
    public void sendToUser(UUID tenantId, UUID userId, String title, String body,
                           Map<String, String> data, String imageUrl) {
        List<PushToken> tokens = tokenRepository.findActiveByUser(tenantId, userId);
        if (tokens.isEmpty()) {
            log.info("No active push tokens for user: {}", userId);
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(PushToken::getToken)
                .collect(Collectors.toList());

        sendToTokens(tokenStrings, title, body, data, imageUrl);
    }

    /**
     * Envia notificacao push para multiplos usuarios.
     */
    @Async
    public void sendToUsers(UUID tenantId, List<UUID> userIds, String title, String body,
                            Map<String, String> data, String imageUrl) {
        List<PushToken> tokens = tokenRepository.findActiveByUsers(tenantId, userIds);
        if (tokens.isEmpty()) {
            log.info("No active push tokens for users");
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(PushToken::getToken)
                .collect(Collectors.toList());

        sendToTokens(tokenStrings, title, body, data, imageUrl);
    }

    /**
     * Envia notificacao push para um topico.
     */
    @Async
    public void sendToTopic(String topic, String title, String body,
                            Map<String, String> data, String imageUrl) {
        if (!pushEnabled) {
            log.info("Push disabled - would send to topic: {}", topic);
            return;
        }

        try {
            Message.Builder messageBuilder = Message.builder()
                    .setTopic(topic)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .setImage(imageUrl)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            // Add Android specific config
            messageBuilder.setAndroidConfig(AndroidConfig.builder()
                    .setPriority(AndroidConfig.Priority.HIGH)
                    .setNotification(AndroidNotification.builder()
                            .setClickAction("OPEN_NOTIFICATION")
                            .build())
                    .build());

            // Add iOS specific config
            messageBuilder.setApnsConfig(ApnsConfig.builder()
                    .setAps(Aps.builder()
                            .setAlert(ApsAlert.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .build())
                            .setSound("default")
                            .build())
                    .build());

            String response = firebaseMessaging.send(messageBuilder.build());
            log.info("Push sent to topic {} - Response: {}", topic, response);

        } catch (Exception e) {
            log.error("Failed to send push to topic {}: {}", topic, e.getMessage());
        }
    }

    /**
     * Inscreve tokens em um topico.
     */
    public void subscribeToTopic(UUID tenantId, UUID userId, String topic) {
        List<PushToken> tokens = tokenRepository.findActiveByUser(tenantId, userId);
        if (tokens.isEmpty()) return;

        List<String> tokenStrings = tokens.stream()
                .map(PushToken::getToken)
                .collect(Collectors.toList());

        try {
            firebaseMessaging.subscribeToTopic(tokenStrings, topic);
            log.info("Subscribed {} tokens to topic: {}", tokenStrings.size(), topic);
        } catch (Exception e) {
            log.error("Failed to subscribe to topic {}: {}", topic, e.getMessage());
        }
    }

    /**
     * Remove inscricao de tokens em um topico.
     */
    public void unsubscribeFromTopic(UUID tenantId, UUID userId, String topic) {
        List<PushToken> tokens = tokenRepository.findActiveByUser(tenantId, userId);
        if (tokens.isEmpty()) return;

        List<String> tokenStrings = tokens.stream()
                .map(PushToken::getToken)
                .collect(Collectors.toList());

        try {
            firebaseMessaging.unsubscribeFromTopic(tokenStrings, topic);
            log.info("Unsubscribed {} tokens from topic: {}", tokenStrings.size(), topic);
        } catch (Exception e) {
            log.error("Failed to unsubscribe from topic {}: {}", topic, e.getMessage());
        }
    }

    private void sendToTokens(List<String> tokens, String title, String body,
                              Map<String, String> data, String imageUrl) {
        if (!pushEnabled) {
            log.info("Push disabled - would send to {} tokens", tokens.size());
            return;
        }

        if (tokens.size() == 1) {
            sendSingleMessage(tokens.get(0), title, body, data, imageUrl);
        } else {
            sendMulticastMessage(tokens, title, body, data, imageUrl);
        }
    }

    private void sendSingleMessage(String token, String title, String body,
                                   Map<String, String> data, String imageUrl) {
        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .setImage(imageUrl)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            String response = firebaseMessaging.send(messageBuilder.build());
            log.info("Push sent successfully - Response: {}", response);

        } catch (FirebaseMessagingException e) {
            log.error("Failed to send push: {}", e.getMessage());
            handleFailedToken(token, e);
        }
    }

    private void sendMulticastMessage(List<String> tokens, String title, String body,
                                      Map<String, String> data, String imageUrl) {
        try {
            MulticastMessage.Builder messageBuilder = MulticastMessage.builder()
                    .addAllTokens(tokens)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .setImage(imageUrl)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            BatchResponse response = firebaseMessaging.sendEachForMulticast(messageBuilder.build());
            log.info("Push multicast sent - Success: {}, Failure: {}",
                    response.getSuccessCount(), response.getFailureCount());

            // Handle failed tokens
            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        handleFailedToken(tokens.get(i), responses.get(i).getException());
                    }
                }
            }

        } catch (Exception e) {
            log.error("Failed to send multicast push: {}", e.getMessage());
        }
    }

    private void handleFailedToken(String token, Exception e) {
        if (e instanceof FirebaseMessagingException fme) {
            MessagingErrorCode errorCode = fme.getMessagingErrorCode();
            if (errorCode == MessagingErrorCode.UNREGISTERED ||
                errorCode == MessagingErrorCode.INVALID_ARGUMENT) {
                // Token is invalid, deactivate it
                tokenRepository.findByToken(token)
                        .ifPresent(pushToken -> {
                            pushToken.setActive(false);
                            tokenRepository.save(pushToken);
                            log.info("Deactivated invalid push token: {}", token);
                        });
            }
        }
    }
}
