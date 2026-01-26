import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String tenantId;
  final String employeeCode;
  final String fullName;
  final String email;
  final String? cpf;
  final String? phone;
  final String? photoUrl;
  final String? department;
  final String? position;
  final String? manager;
  final DateTime? hireDate;
  final List<String> roles;
  final List<String> permissions;

  const User({
    required this.id,
    required this.tenantId,
    required this.employeeCode,
    required this.fullName,
    required this.email,
    this.cpf,
    this.phone,
    this.photoUrl,
    this.department,
    this.position,
    this.manager,
    this.hireDate,
    this.roles = const [],
    this.permissions = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      employeeCode: json['employeeCode'] as String,
      fullName: json['fullName'] as String,
      email: json['email'] as String,
      cpf: json['cpf'] as String?,
      phone: json['phone'] as String?,
      photoUrl: json['photoUrl'] as String?,
      department: json['department'] as String?,
      position: json['position'] as String?,
      manager: json['manager'] as String?,
      hireDate: json['hireDate'] != null
          ? DateTime.parse(json['hireDate'] as String)
          : null,
      roles: (json['roles'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      permissions: (json['permissions'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tenantId': tenantId,
      'employeeCode': employeeCode,
      'fullName': fullName,
      'email': email,
      'cpf': cpf,
      'phone': phone,
      'photoUrl': photoUrl,
      'department': department,
      'position': position,
      'manager': manager,
      'hireDate': hireDate?.toIso8601String(),
      'roles': roles,
      'permissions': permissions,
    };
  }

  String get firstName => fullName.split(' ').first;

  String get initials {
    final parts = fullName.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return fullName[0].toUpperCase();
  }

  bool hasPermission(String permission) => permissions.contains(permission);

  bool hasRole(String role) => roles.contains(role);

  @override
  List<Object?> get props => [id, tenantId, email];
}

class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;

  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'expiresAt': expiresAt.toIso8601String(),
    };
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  bool get isAboutToExpire =>
      DateTime.now().isAfter(expiresAt.subtract(const Duration(minutes: 5)));
}
