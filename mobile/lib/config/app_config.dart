class AppConfig {
  static const String appName = 'AxonRH';
  static const String appVersion = '1.0.0';

  // API Configuration
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.axonrh.com.br/api/v1',
  );

  // Feature Flags
  static const bool enableBiometrics = true;
  static const bool enableOfflineMode = true;
  static const bool enableGeofencing = true;
  static const bool enableFacialRecognition = false;

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Cache Configuration
  static const Duration cacheExpiration = Duration(hours: 24);
  static const int maxCacheSize = 100; // MB

  // Location Configuration
  static const double defaultGeofenceRadius = 100.0; // meters
  static const int locationUpdateInterval = 5000; // milliseconds

  // Sync Configuration
  static const Duration syncInterval = Duration(minutes: 15);
  static const int maxRetryAttempts = 3;
}

class ApiEndpoints {
  static const String login = '/auth/login';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';

  static const String profile = '/employees/me';
  static const String updateProfile = '/employees/me';

  static const String timePunch = '/timesheet/punch';
  static const String timeRecords = '/timesheet/records';
  static const String dailySummary = '/timesheet/summary';

  static const String vacationBalance = '/vacation/balance';
  static const String vacationRequests = '/vacation/requests';

  static const String payslips = '/payroll/payslips';
  static const String payslipPdf = '/payroll/payslips/{id}/pdf';

  static const String notifications = '/notifications';
  static const String markNotificationRead = '/notifications/{id}/read';

  static const String documents = '/documents';

  static const String geofences = '/timesheet/geofences';
}
