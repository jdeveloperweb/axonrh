import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../config/theme.dart';
import '../services/face_recognition_service.dart';
import '../services/location_service.dart';

class FacePunchScreen extends ConsumerStatefulWidget {
  const FacePunchScreen({super.key});

  @override
  ConsumerState<FacePunchScreen> createState() => _FacePunchScreenState();
}

class _FacePunchScreenState extends ConsumerState<FacePunchScreen>
    with WidgetsBindingObserver {
  final FaceRecognitionService _faceService = FaceRecognitionService.instance;
  final LocationService _locationService = LocationService.instance;

  FaceRecognitionStatus _status = FaceRecognitionStatus.notInitialized;
  String? _statusMessage;
  bool _isProcessing = false;
  String? _currentAddress;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initialize();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_faceService.cameraController == null ||
        !_faceService.cameraController!.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      _faceService.cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initialize();
    }
  }

  Future<void> _initialize() async {
    setState(() {
      _statusMessage = 'Inicializando câmera...';
    });

    await _faceService.initialize();

    _faceService.statusStream.listen((status) {
      if (mounted) {
        setState(() => _status = status);
      }
    });

    // Get current location
    final position = await _locationService.getCurrentPosition();
    if (position != null && mounted) {
      final address = await _locationService.getAddressFromPosition(position);
      setState(() {
        _currentAddress = address;
        _statusMessage = null;
      });
    }

    setState(() {
      _status = _faceService.status;
      if (_status == FaceRecognitionStatus.ready) {
        _statusMessage = 'Posicione seu rosto no centro da tela';
      }
    });
  }

  Future<void> _registerPunch() async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
      _statusMessage = 'Verificando identidade...';
    });

    final result = await _faceService.captureAndVerify();

    if (result.success) {
      if (mounted) {
        setState(() {
          _statusMessage = 'Ponto registrado com sucesso!';
        });

        // Show success dialog
        await _showSuccessDialog(result);
      }
    } else {
      if (mounted) {
        setState(() {
          _statusMessage = result.message ?? 'Falha na verificação';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message ?? 'Falha na verificação'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }

    if (mounted) {
      setState(() {
        _isProcessing = false;
      });
      _faceService.resetStatus();
    }
  }

  Future<void> _showSuccessDialog(FaceRecognitionResult result) async {
    final now = DateTime.now();

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.check_circle,
                color: AppColors.success,
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
              DateFormat('HH:mm:ss').format(now),
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              DateFormat('dd/MM/yyyy').format(now),
              style: TextStyle(
                color: AppColors.textSecondary,
              ),
            ),
            if (_currentAddress != null) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.location_on,
                    size: 16,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      _currentAddress!,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textTertiary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ],
            if (result.confidence != null) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.verified_user,
                    size: 16,
                    color: AppColors.success,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Confiança: ${(result.confidence! * 100).toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.go('/home');
              },
              child: const Text('OK'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.go('/punch'),
        ),
        title: const Text(
          'Reconhecimento Facial',
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          if (_faceService.cameraController != null &&
              _faceService.cameraController!.value.isInitialized)
            Center(
              child: CameraPreview(_faceService.cameraController!),
            )
          else
            const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),

          // Face Guide Overlay
          CustomPaint(
            painter: FaceGuidePainter(
              isProcessing: _isProcessing,
              status: _status,
            ),
          ),

          // Bottom Controls
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Status Message
                    if (_statusMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Text(
                          _statusMessage!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),

                    // Capture Button
                    GestureDetector(
                      onTap: _status == FaceRecognitionStatus.ready
                          ? _registerPunch
                          : null,
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: 4,
                          ),
                        ),
                        child: Center(
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isProcessing
                                  ? AppColors.textTertiary
                                  : AppColors.primary,
                            ),
                            child: _isProcessing
                                ? const Center(
                                    child: SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    ),
                                  )
                                : const Icon(
                                    Icons.face,
                                    color: Colors.white,
                                    size: 32,
                                  ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Instructions
                    Text(
                      'Toque para registrar o ponto',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class FaceGuidePainter extends CustomPainter {
  final bool isProcessing;
  final FaceRecognitionStatus status;

  FaceGuidePainter({
    required this.isProcessing,
    required this.status,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = _getGuideColor()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    final center = Offset(size.width / 2, size.height / 2 - 50);
    final radius = size.width * 0.35;

    // Draw face guide oval
    final rect = Rect.fromCenter(
      center: center,
      width: radius * 1.6,
      height: radius * 2,
    );

    canvas.drawOval(rect, paint);

    // Draw corner guides
    final cornerPaint = Paint()
      ..color = _getGuideColor()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    final cornerLength = 30.0;

    // Top left
    canvas.drawLine(
      Offset(rect.left, rect.top + cornerLength),
      Offset(rect.left, rect.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(rect.left, rect.top),
      Offset(rect.left + cornerLength, rect.top),
      cornerPaint,
    );

    // Top right
    canvas.drawLine(
      Offset(rect.right - cornerLength, rect.top),
      Offset(rect.right, rect.top),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(rect.right, rect.top),
      Offset(rect.right, rect.top + cornerLength),
      cornerPaint,
    );

    // Bottom left
    canvas.drawLine(
      Offset(rect.left, rect.bottom - cornerLength),
      Offset(rect.left, rect.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(rect.left, rect.bottom),
      Offset(rect.left + cornerLength, rect.bottom),
      cornerPaint,
    );

    // Bottom right
    canvas.drawLine(
      Offset(rect.right - cornerLength, rect.bottom),
      Offset(rect.right, rect.bottom),
      cornerPaint,
    );
    canvas.drawLine(
      Offset(rect.right, rect.bottom),
      Offset(rect.right, rect.bottom - cornerLength),
      cornerPaint,
    );
  }

  Color _getGuideColor() {
    if (isProcessing) {
      return AppColors.warning;
    }
    switch (status) {
      case FaceRecognitionStatus.success:
        return AppColors.success;
      case FaceRecognitionStatus.failed:
      case FaceRecognitionStatus.noFaceDetected:
      case FaceRecognitionStatus.multipleFacesDetected:
        return AppColors.error;
      default:
        return Colors.white;
    }
  }

  @override
  bool shouldRepaint(covariant FaceGuidePainter oldDelegate) {
    return isProcessing != oldDelegate.isProcessing ||
        status != oldDelegate.status;
  }
}
