import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

enum FaceRecognitionStatus {
  notInitialized,
  initializing,
  ready,
  processing,
  success,
  failed,
  noFaceDetected,
  multipleFacesDetected,
}

class FaceRecognitionResult {
  final bool success;
  final String? message;
  final double? confidence;
  final String? imagePath;

  FaceRecognitionResult({
    required this.success,
    this.message,
    this.confidence,
    this.imagePath,
  });
}

class FaceRecognitionService {
  static FaceRecognitionService? _instance;
  static FaceRecognitionService get instance {
    _instance ??= FaceRecognitionService._();
    return _instance!;
  }

  FaceRecognitionService._();

  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  FaceRecognitionStatus _status = FaceRecognitionStatus.notInitialized;

  FaceRecognitionStatus get status => _status;
  CameraController? get cameraController => _cameraController;
  bool get isInitialized => _status == FaceRecognitionStatus.ready;

  final _statusController = StreamController<FaceRecognitionStatus>.broadcast();
  Stream<FaceRecognitionStatus> get statusStream => _statusController.stream;

  Future<void> initialize() async {
    if (_status == FaceRecognitionStatus.initializing) return;

    _status = FaceRecognitionStatus.initializing;
    _statusController.add(_status);

    try {
      _cameras = await availableCameras();

      if (_cameras == null || _cameras!.isEmpty) {
        _status = FaceRecognitionStatus.failed;
        _statusController.add(_status);
        return;
      }

      // Find front camera
      final frontCamera = _cameras!.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.front,
        orElse: () => _cameras!.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();

      _status = FaceRecognitionStatus.ready;
      _statusController.add(_status);
    } catch (e) {
      debugPrint('FaceRecognitionService initialization error: $e');
      _status = FaceRecognitionStatus.failed;
      _statusController.add(_status);
    }
  }

  Future<FaceRecognitionResult> captureAndVerify() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return FaceRecognitionResult(
        success: false,
        message: 'Câmera não inicializada',
      );
    }

    _status = FaceRecognitionStatus.processing;
    _statusController.add(_status);

    try {
      // Capture image
      final XFile image = await _cameraController!.takePicture();

      // Save to app directory
      final directory = await getApplicationDocumentsDirectory();
      final String timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final String filePath = '${directory.path}/face_$timestamp.jpg';

      await File(image.path).copy(filePath);

      // In a real implementation, this would:
      // 1. Detect faces in the image
      // 2. Extract face embeddings
      // 3. Compare with stored embeddings on the server
      // 4. Return verification result

      // Simulating face detection and verification
      await Future.delayed(const Duration(seconds: 1));

      // Simulate successful verification with high confidence
      final result = FaceRecognitionResult(
        success: true,
        message: 'Face verificada com sucesso',
        confidence: 0.95,
        imagePath: filePath,
      );

      _status = FaceRecognitionStatus.success;
      _statusController.add(_status);

      return result;
    } catch (e) {
      debugPrint('Face capture error: $e');
      _status = FaceRecognitionStatus.failed;
      _statusController.add(_status);

      return FaceRecognitionResult(
        success: false,
        message: 'Erro ao capturar imagem: $e',
      );
    }
  }

  Future<FaceRecognitionResult> registerFace() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return FaceRecognitionResult(
        success: false,
        message: 'Câmera não inicializada',
      );
    }

    _status = FaceRecognitionStatus.processing;
    _statusController.add(_status);

    try {
      // Capture multiple images for registration
      final List<String> imagePaths = [];

      for (int i = 0; i < 3; i++) {
        final XFile image = await _cameraController!.takePicture();
        final directory = await getApplicationDocumentsDirectory();
        final String timestamp = DateTime.now().millisecondsSinceEpoch.toString();
        final String filePath = '${directory.path}/face_register_${i}_$timestamp.jpg';

        await File(image.path).copy(filePath);
        imagePaths.add(filePath);

        // Small delay between captures
        await Future.delayed(const Duration(milliseconds: 500));
      }

      // In a real implementation, this would:
      // 1. Process all captured images
      // 2. Detect and extract face features
      // 3. Create face embeddings
      // 4. Send to server for storage

      // Simulating registration process
      await Future.delayed(const Duration(seconds: 2));

      _status = FaceRecognitionStatus.success;
      _statusController.add(_status);

      return FaceRecognitionResult(
        success: true,
        message: 'Face registrada com sucesso',
        imagePath: imagePaths.first,
      );
    } catch (e) {
      debugPrint('Face registration error: $e');
      _status = FaceRecognitionStatus.failed;
      _statusController.add(_status);

      return FaceRecognitionResult(
        success: false,
        message: 'Erro ao registrar face: $e',
      );
    }
  }

  void resetStatus() {
    if (_status != FaceRecognitionStatus.notInitialized &&
        _status != FaceRecognitionStatus.initializing) {
      _status = FaceRecognitionStatus.ready;
      _statusController.add(_status);
    }
  }

  Future<void> dispose() async {
    await _cameraController?.dispose();
    _cameraController = null;
    _status = FaceRecognitionStatus.notInitialized;
    await _statusController.close();
  }
}
