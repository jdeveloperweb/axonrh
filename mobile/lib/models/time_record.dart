import 'package:equatable/equatable.dart';

enum PunchType { clockIn, breakStart, breakEnd, clockOut }

enum PunchStatus { pending, approved, rejected, processing }

class TimeRecord extends Equatable {
  final String id;
  final String employeeId;
  final DateTime date;
  final DateTime? clockIn;
  final DateTime? breakStart;
  final DateTime? breakEnd;
  final DateTime? clockOut;
  final Duration? totalWorked;
  final Duration? breakDuration;
  final Duration? overtime;
  final PunchStatus status;
  final String? location;
  final double? latitude;
  final double? longitude;
  final bool isOffline;
  final String? notes;
  final String? approvedBy;
  final DateTime? approvedAt;

  const TimeRecord({
    required this.id,
    required this.employeeId,
    required this.date,
    this.clockIn,
    this.breakStart,
    this.breakEnd,
    this.clockOut,
    this.totalWorked,
    this.breakDuration,
    this.overtime,
    this.status = PunchStatus.pending,
    this.location,
    this.latitude,
    this.longitude,
    this.isOffline = false,
    this.notes,
    this.approvedBy,
    this.approvedAt,
  });

  factory TimeRecord.fromJson(Map<String, dynamic> json) {
    return TimeRecord(
      id: json['id'] as String,
      employeeId: json['employeeId'] as String,
      date: DateTime.parse(json['date'] as String),
      clockIn: json['clockIn'] != null
          ? DateTime.parse(json['clockIn'] as String)
          : null,
      breakStart: json['breakStart'] != null
          ? DateTime.parse(json['breakStart'] as String)
          : null,
      breakEnd: json['breakEnd'] != null
          ? DateTime.parse(json['breakEnd'] as String)
          : null,
      clockOut: json['clockOut'] != null
          ? DateTime.parse(json['clockOut'] as String)
          : null,
      totalWorked: json['totalWorkedMinutes'] != null
          ? Duration(minutes: json['totalWorkedMinutes'] as int)
          : null,
      breakDuration: json['breakDurationMinutes'] != null
          ? Duration(minutes: json['breakDurationMinutes'] as int)
          : null,
      overtime: json['overtimeMinutes'] != null
          ? Duration(minutes: json['overtimeMinutes'] as int)
          : null,
      status: PunchStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => PunchStatus.pending,
      ),
      location: json['location'] as String?,
      latitude: json['latitude'] as double?,
      longitude: json['longitude'] as double?,
      isOffline: json['isOffline'] as bool? ?? false,
      notes: json['notes'] as String?,
      approvedBy: json['approvedBy'] as String?,
      approvedAt: json['approvedAt'] != null
          ? DateTime.parse(json['approvedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'date': date.toIso8601String(),
      'clockIn': clockIn?.toIso8601String(),
      'breakStart': breakStart?.toIso8601String(),
      'breakEnd': breakEnd?.toIso8601String(),
      'clockOut': clockOut?.toIso8601String(),
      'totalWorkedMinutes': totalWorked?.inMinutes,
      'breakDurationMinutes': breakDuration?.inMinutes,
      'overtimeMinutes': overtime?.inMinutes,
      'status': status.name,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'isOffline': isOffline,
      'notes': notes,
      'approvedBy': approvedBy,
      'approvedAt': approvedAt?.toIso8601String(),
    };
  }

  PunchType? get nextPunchType {
    if (clockIn == null) return PunchType.clockIn;
    if (breakStart == null) return PunchType.breakStart;
    if (breakEnd == null) return PunchType.breakEnd;
    if (clockOut == null) return PunchType.clockOut;
    return null;
  }

  bool get isComplete => clockIn != null && clockOut != null;

  bool get isOnBreak => breakStart != null && breakEnd == null;

  bool get isWorking => clockIn != null && clockOut == null && !isOnBreak;

  TimeRecord copyWith({
    String? id,
    String? employeeId,
    DateTime? date,
    DateTime? clockIn,
    DateTime? breakStart,
    DateTime? breakEnd,
    DateTime? clockOut,
    Duration? totalWorked,
    Duration? breakDuration,
    Duration? overtime,
    PunchStatus? status,
    String? location,
    double? latitude,
    double? longitude,
    bool? isOffline,
    String? notes,
    String? approvedBy,
    DateTime? approvedAt,
  }) {
    return TimeRecord(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      date: date ?? this.date,
      clockIn: clockIn ?? this.clockIn,
      breakStart: breakStart ?? this.breakStart,
      breakEnd: breakEnd ?? this.breakEnd,
      clockOut: clockOut ?? this.clockOut,
      totalWorked: totalWorked ?? this.totalWorked,
      breakDuration: breakDuration ?? this.breakDuration,
      overtime: overtime ?? this.overtime,
      status: status ?? this.status,
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isOffline: isOffline ?? this.isOffline,
      notes: notes ?? this.notes,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedAt: approvedAt ?? this.approvedAt,
    );
  }

  @override
  List<Object?> get props => [id, employeeId, date];
}

class TimePunchRequest {
  final PunchType type;
  final DateTime timestamp;
  final double? latitude;
  final double? longitude;
  final String? location;
  final String? deviceId;
  final String? notes;

  const TimePunchRequest({
    required this.type,
    required this.timestamp,
    this.latitude,
    this.longitude,
    this.location,
    this.deviceId,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'timestamp': timestamp.toIso8601String(),
      'latitude': latitude,
      'longitude': longitude,
      'location': location,
      'deviceId': deviceId,
      'notes': notes,
    };
  }
}

class DailySummary {
  final DateTime date;
  final Duration scheduled;
  final Duration worked;
  final Duration balance;
  final int lateMinutes;
  final int earlyDepartureMinutes;
  final bool hasAbsence;
  final String? absenceReason;

  const DailySummary({
    required this.date,
    required this.scheduled,
    required this.worked,
    required this.balance,
    this.lateMinutes = 0,
    this.earlyDepartureMinutes = 0,
    this.hasAbsence = false,
    this.absenceReason,
  });

  factory DailySummary.fromJson(Map<String, dynamic> json) {
    return DailySummary(
      date: DateTime.parse(json['date'] as String),
      scheduled: Duration(minutes: json['scheduledMinutes'] as int),
      worked: Duration(minutes: json['workedMinutes'] as int),
      balance: Duration(minutes: json['balanceMinutes'] as int),
      lateMinutes: json['lateMinutes'] as int? ?? 0,
      earlyDepartureMinutes: json['earlyDepartureMinutes'] as int? ?? 0,
      hasAbsence: json['hasAbsence'] as bool? ?? false,
      absenceReason: json['absenceReason'] as String?,
    );
  }
}
