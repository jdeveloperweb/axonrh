import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_storage_service.dart';
import '../config/app_config.dart';

// Auth state
class AuthState {
  final User? user;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;
  final AuthStorageService _storage = AuthStorageService();
  final LocalAuthentication _localAuth = LocalAuthentication();

  AuthNotifier(this._apiService) : super(const AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    try {
      final isLoggedIn = await _storage.isLoggedIn();
      if (isLoggedIn) {
        final user = await _storage.getUser();
        state = AuthState(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = const AuthState(isLoading: false);
      }
    } catch (e) {
      state = AuthState(error: e.toString(), isLoading: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiService.post(
        ApiEndpoints.login,
        data: {'email': email, 'password': password},
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;

        // Save tokens
        await _storage.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
          expiresAt: DateTime.parse(data['expiresAt']),
        );

        // Save tenant ID
        await _storage.saveTenantId(data['tenantId']);

        // Get user profile
        final profileResponse = await _apiService.get(ApiEndpoints.profile);
        final user = User.fromJson(profileResponse.data);
        await _storage.saveUser(user);

        state = AuthState(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );

        return true;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Credenciais inválidas',
      );
    }

    return false;
  }

  Future<bool> loginWithBiometrics() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // Check if biometrics is available
      final canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();

      if (!canCheckBiometrics || !isDeviceSupported) {
        state = state.copyWith(
          isLoading: false,
          error: 'Biometria não disponível',
        );
        return false;
      }

      // Authenticate
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'Use sua biometria para acessar o app',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );

      if (authenticated) {
        // Check if we have stored credentials
        final isLoggedIn = await _storage.isLoggedIn();
        if (isLoggedIn) {
          final user = await _storage.getUser();
          state = AuthState(
            user: user,
            isAuthenticated: true,
            isLoading: false,
          );
          return true;
        }
      }

      state = state.copyWith(
        isLoading: false,
        error: 'Autenticação biométrica falhou',
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Erro na autenticação biométrica',
      );
    }

    return false;
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    try {
      await _apiService.post(ApiEndpoints.logout);
    } catch (_) {
      // Ignore logout API errors
    }

    await _storage.clearAll();
    state = const AuthState();
  }

  Future<void> refreshProfile() async {
    try {
      final response = await _apiService.get(ApiEndpoints.profile);
      final user = User.fromJson(response.data);
      await _storage.saveUser(user);
      state = state.copyWith(user: user);
    } catch (e) {
      print('Error refreshing profile: $e');
    }
  }

  Future<bool> isBiometricAvailable() async {
    try {
      final canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      return canCheckBiometrics && isDeviceSupported;
    } catch (_) {
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Providers
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(apiService);
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authStateProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).isAuthenticated;
});
