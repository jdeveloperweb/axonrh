import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/user.dart';

class AuthStorageService {
  static final AuthStorageService _instance = AuthStorageService._internal();
  factory AuthStorageService() => _instance;
  AuthStorageService._internal();

  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const String _tokenKey = 'auth_tokens';
  static const String _userKey = 'current_user';
  static const String _tenantKey = 'tenant_id';
  static const String _biometricKey = 'biometric_enabled';

  // Token Management
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required DateTime expiresAt,
  }) async {
    final tokens = AuthTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: expiresAt,
    );
    await _storage.write(key: _tokenKey, value: jsonEncode(tokens.toJson()));
  }

  Future<AuthTokens?> getTokens() async {
    final data = await _storage.read(key: _tokenKey);
    if (data == null) return null;
    return AuthTokens.fromJson(jsonDecode(data));
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _tokenKey);
  }

  // User Management
  Future<void> saveUser(User user) async {
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
  }

  Future<User?> getUser() async {
    final data = await _storage.read(key: _userKey);
    if (data == null) return null;
    return User.fromJson(jsonDecode(data));
  }

  Future<void> clearUser() async {
    await _storage.delete(key: _userKey);
  }

  // Tenant Management
  Future<void> saveTenantId(String tenantId) async {
    await _storage.write(key: _tenantKey, value: tenantId);
  }

  Future<String?> getTenantId() async {
    return await _storage.read(key: _tenantKey);
  }

  Future<void> clearTenantId() async {
    await _storage.delete(key: _tenantKey);
  }

  // Biometric Settings
  Future<void> setBiometricEnabled(bool enabled) async {
    await _storage.write(key: _biometricKey, value: enabled.toString());
  }

  Future<bool> isBiometricEnabled() async {
    final value = await _storage.read(key: _biometricKey);
    return value == 'true';
  }

  // Clear All
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final tokens = await getTokens();
    return tokens != null && !tokens.isExpired;
  }
}
