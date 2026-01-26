import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';

import '../config/theme.dart';
import '../models/time_record.dart';
import '../services/location_service.dart';
import '../services/offline_service.dart';
import '../providers/auth_provider.dart';

class TimePunchScreen extends ConsumerStatefulWidget {
  const TimePunchScreen({super.key});

  @override
  ConsumerState<TimePunchScreen> createState() => _TimePunchScreenState();
}

class _TimePunchScreenState extends ConsumerState<TimePunchScreen> {
  final LocationService _locationService = LocationService();

  DateTime _currentTime = DateTime.now();
  Timer? _timer;
  Position? _currentPosition;
  String? _currentAddress;
  bool _isLoading = false;
  bool _locationLoading = true;
  PunchType _nextPunchType = PunchType.clockIn;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _loadLocation();
    _loadTodayStatus();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _currentTime = DateTime.now();
      });
    });
  }

  Future<void> _loadLocation() async {
    setState(() {
      _locationLoading = true;
    });

    try {
      final position = await _locationService.getCurrentPosition();
      if (position != null) {
        final address = await _locationService.getAddressFromCoordinates(
          position.latitude,
          position.longitude,
        );
        setState(() {
          _currentPosition = position;
          _currentAddress = address;
        });
      }
    } catch (e) {
      print('Error loading location: $e');
    } finally {
      setState(() {
        _locationLoading = false;
      });
    }
  }

  Future<void> _loadTodayStatus() async {
    // TODO: Load today's punches from API or cache
    // For now, use default
  }

  Future<void> _registerPunch() async {
    if (_isLoading) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final punch = TimePunchRequest(
        type: _nextPunchType,
        timestamp: DateTime.now(),
        latitude: _currentPosition?.latitude,
        longitude: _currentPosition?.longitude,
        location: _currentAddress,
      );

      // Check if online
      if (OfflineService.instance.isOnline) {
        // TODO: Call API to register punch
        // await _apiService.registerPunch(punch);
        _showSuccessDialog();
      } else {
        // Save offline
        await OfflineService.instance.savePendingPunch(punch);
        _showOfflineDialog();
      }

      // Update next punch type
      setState(() {
        _nextPunchType = PunchType.values[(_nextPunchType.index + 1) % 4];
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Erro ao registrar ponto. Tente novamente.';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check,
                color: Colors.white,
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Ponto Registrado!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              DateFormat('HH:mm:ss').format(_currentTime),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
            if (_currentAddress != null) ...[
              const SizedBox(height: 8),
              Text(
                _currentAddress!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showOfflineDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off,
                color: AppColors.warning,
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Ponto Salvo Offline',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Seu ponto foi salvo e será sincronizado quando houver conexão.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final timeFormat = DateFormat('HH:mm:ss');
    final dateFormat = DateFormat("EEEE, d 'de' MMMM", 'pt_BR');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Registrar Ponto'),
        actions: [
          IconButton(
            onPressed: _loadLocation,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Date and Time Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.4),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    dateFormat.format(_currentTime),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    timeFormat.format(_currentTime),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 56,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 4,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          OfflineService.instance.isOnline
                              ? Icons.cloud_done
                              : Icons.cloud_off,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          OfflineService.instance.isOnline ? 'Online' : 'Offline',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Location Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.location_on,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Localização',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_locationLoading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  else if (_currentPosition != null)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_currentAddress != null)
                          Text(
                            _currentAddress!,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        const SizedBox(height: 4),
                        Text(
                          'Lat: ${_currentPosition!.latitude.toStringAsFixed(6)}, '
                          'Lng: ${_currentPosition!.longitude.toStringAsFixed(6)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ],
                    )
                  else
                    const Text(
                      'Não foi possível obter a localização',
                      style: TextStyle(
                        color: AppColors.error,
                        fontSize: 14,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Error Message
            if (_errorMessage != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.error.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.error),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),

            // Punch Button
            SizedBox(
              width: 200,
              height: 200,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _registerPunch,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _getPunchButtonColor(),
                  shape: const CircleBorder(),
                  elevation: 8,
                  shadowColor: _getPunchButtonColor().withOpacity(0.5),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _getPunchIcon(),
                            size: 48,
                            color: Colors.white,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _getPunchLabel(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 16),

            // Punch type indicator
            Text(
              _getPunchDescription(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPunchButtonColor() {
    switch (_nextPunchType) {
      case PunchType.clockIn:
        return AppColors.success;
      case PunchType.breakStart:
        return AppColors.warning;
      case PunchType.breakEnd:
        return AppColors.info;
      case PunchType.clockOut:
        return AppColors.error;
    }
  }

  IconData _getPunchIcon() {
    switch (_nextPunchType) {
      case PunchType.clockIn:
        return Icons.login;
      case PunchType.breakStart:
        return Icons.restaurant;
      case PunchType.breakEnd:
        return Icons.play_arrow;
      case PunchType.clockOut:
        return Icons.logout;
    }
  }

  String _getPunchLabel() {
    switch (_nextPunchType) {
      case PunchType.clockIn:
        return 'ENTRADA';
      case PunchType.breakStart:
        return 'INTERVALO';
      case PunchType.breakEnd:
        return 'RETORNO';
      case PunchType.clockOut:
        return 'SAÍDA';
    }
  }

  String _getPunchDescription() {
    switch (_nextPunchType) {
      case PunchType.clockIn:
        return 'Toque para registrar sua entrada';
      case PunchType.breakStart:
        return 'Toque para iniciar o intervalo';
      case PunchType.breakEnd:
        return 'Toque para retornar do intervalo';
      case PunchType.clockOut:
        return 'Toque para registrar sua saída';
    }
  }
}
