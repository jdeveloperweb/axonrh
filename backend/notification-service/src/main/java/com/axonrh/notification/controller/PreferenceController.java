package com.axonrh.notification.controller;

import com.axonrh.notification.entity.NotificationCategory;
import com.axonrh.notification.entity.NotificationPreferences;
import com.axonrh.notification.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferences> getPreferences(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId) {
        return ResponseEntity.ok(preferenceService.getPreferences(tenantId, userId));
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferences> updatePreferences(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @RequestBody NotificationPreferences preferences) {
        return ResponseEntity.ok(preferenceService.updatePreferences(tenantId, userId, preferences));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<NotificationCategory>> getCategories(
            @RequestHeader("X-Tenant-ID") UUID tenantId) {
        return ResponseEntity.ok(preferenceService.getActiveCategories(tenantId));
    }

    @PutMapping("/preferences/categories/{categoryCode}")
    public ResponseEntity<Void> updateCategoryPreference(
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-ID") UUID userId,
            @PathVariable String categoryCode,
            @RequestBody NotificationPreferences.CategoryPreference categoryPref) {
        preferenceService.updateCategoryPreference(tenantId, userId, categoryCode, categoryPref);
        return ResponseEntity.ok().build();
    }
}
