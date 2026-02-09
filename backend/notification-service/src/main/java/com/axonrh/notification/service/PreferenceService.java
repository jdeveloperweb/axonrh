package com.axonrh.notification.service;

import com.axonrh.notification.entity.NotificationCategory;
import com.axonrh.notification.entity.NotificationPreferences;
import com.axonrh.notification.repository.NotificationCategoryRepository;
import com.axonrh.notification.repository.NotificationPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final NotificationPreferencesRepository preferencesRepository;
    private final NotificationCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public NotificationPreferences getPreferences(UUID tenantId, UUID userId) {
        return preferencesRepository.findByTenantIdAndUserId(tenantId, userId)
                .orElseGet(() -> createDefaultPreferences(tenantId, userId));
    }

    @Transactional
    public NotificationPreferences updatePreferences(UUID tenantId, UUID userId, NotificationPreferences newPrefs) {
        NotificationPreferences prefs = getPreferences(tenantId, userId);
        
        prefs.setEmailEnabled(newPrefs.isEmailEnabled());
        prefs.setEmailDigestFrequency(newPrefs.getEmailDigestFrequency());
        prefs.setEmailDigestTime(newPrefs.getEmailDigestTime());
        
        prefs.setPushEnabled(newPrefs.isPushEnabled());
        prefs.setPushSoundEnabled(newPrefs.isPushSoundEnabled());
        prefs.setPushVibrationEnabled(newPrefs.isPushVibrationEnabled());
        
        prefs.setInAppEnabled(newPrefs.isInAppEnabled());
        prefs.setInAppSoundEnabled(newPrefs.isInAppSoundEnabled());
        
        prefs.setQuietHoursEnabled(newPrefs.isQuietHoursEnabled());
        prefs.setQuietHoursStart(newPrefs.getQuietHoursStart());
        prefs.setQuietHoursEnd(newPrefs.getQuietHoursEnd());

        if (newPrefs.getCategoryPreferences() != null) {
            prefs.setCategoryPreferences(newPrefs.getCategoryPreferences());
        }

        return preferencesRepository.save(prefs);
    }

    @Transactional
    public void updateCategoryPreference(UUID tenantId, UUID userId, String categoryCode, NotificationPreferences.CategoryPreference categoryPref) {
        NotificationPreferences prefs = getPreferences(tenantId, userId);
        if (prefs.getCategoryPreferences() == null) {
            prefs.setCategoryPreferences(new HashMap<>());
        }
        prefs.getCategoryPreferences().put(categoryCode, categoryPref);
        preferencesRepository.save(prefs);
    }

    @Transactional(readOnly = true)
    public List<NotificationCategory> getActiveCategories(UUID tenantId) {
        return categoryRepository.findAllActiveByTenant(tenantId);
    }

    private NotificationPreferences createDefaultPreferences(UUID tenantId, UUID userId) {
        NotificationPreferences prefs = NotificationPreferences.builder()
                .tenantId(tenantId)
                .userId(userId)
                .categoryPreferences(new HashMap<>())
                .build();
        return preferencesRepository.save(prefs);
    }
}
