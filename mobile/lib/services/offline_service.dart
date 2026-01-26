import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/time_record.dart';

class OfflineService {
  static final OfflineService _instance = OfflineService._internal();
  static OfflineService get instance => _instance;
  OfflineService._internal();

  late Box<String> _pendingPunchesBox;
  late Box<String> _cachedRecordsBox;
  late Box<String> _syncQueueBox;

  final Connectivity _connectivity = Connectivity();
  bool _isOnline = true;

  bool get isOnline => _isOnline;

  Future<void> initialize() async {
    _pendingPunchesBox = await Hive.openBox<String>('pending_punches');
    _cachedRecordsBox = await Hive.openBox<String>('cached_records');
    _syncQueueBox = await Hive.openBox<String>('sync_queue');

    // Monitor connectivity
    _connectivity.onConnectivityChanged.listen((result) {
      _isOnline = result != ConnectivityResult.none;
      if (_isOnline) {
        syncPendingData();
      }
    });

    // Check initial connectivity
    final result = await _connectivity.checkConnectivity();
    _isOnline = result != ConnectivityResult.none;
  }

  // Save punch for offline sync
  Future<String> savePendingPunch(TimePunchRequest punch) async {
    final id = const Uuid().v4();
    final data = {
      'id': id,
      'punch': punch.toJson(),
      'createdAt': DateTime.now().toIso8601String(),
      'synced': false,
    };
    await _pendingPunchesBox.put(id, jsonEncode(data));
    return id;
  }

  // Get all pending punches
  Future<List<Map<String, dynamic>>> getPendingPunches() async {
    final punches = <Map<String, dynamic>>[];
    for (final key in _pendingPunchesBox.keys) {
      final data = _pendingPunchesBox.get(key);
      if (data != null) {
        final punch = jsonDecode(data) as Map<String, dynamic>;
        if (punch['synced'] != true) {
          punches.add(punch);
        }
      }
    }
    return punches;
  }

  // Mark punch as synced
  Future<void> markPunchSynced(String id) async {
    final data = _pendingPunchesBox.get(id);
    if (data != null) {
      final punch = jsonDecode(data) as Map<String, dynamic>;
      punch['synced'] = true;
      punch['syncedAt'] = DateTime.now().toIso8601String();
      await _pendingPunchesBox.put(id, jsonEncode(punch));
    }
  }

  // Remove synced punches
  Future<void> cleanSyncedPunches() async {
    final keysToRemove = <String>[];
    for (final key in _pendingPunchesBox.keys) {
      final data = _pendingPunchesBox.get(key);
      if (data != null) {
        final punch = jsonDecode(data) as Map<String, dynamic>;
        if (punch['synced'] == true) {
          keysToRemove.add(key as String);
        }
      }
    }
    for (final key in keysToRemove) {
      await _pendingPunchesBox.delete(key);
    }
  }

  // Cache time records
  Future<void> cacheTimeRecords(List<TimeRecord> records, String dateKey) async {
    final data = records.map((r) => r.toJson()).toList();
    await _cachedRecordsBox.put(dateKey, jsonEncode(data));
  }

  // Get cached time records
  Future<List<TimeRecord>?> getCachedTimeRecords(String dateKey) async {
    final data = _cachedRecordsBox.get(dateKey);
    if (data == null) return null;

    final list = jsonDecode(data) as List<dynamic>;
    return list.map((e) => TimeRecord.fromJson(e as Map<String, dynamic>)).toList();
  }

  // Add to sync queue
  Future<void> addToSyncQueue(String type, Map<String, dynamic> data) async {
    final id = const Uuid().v4();
    final item = {
      'id': id,
      'type': type,
      'data': data,
      'createdAt': DateTime.now().toIso8601String(),
      'attempts': 0,
    };
    await _syncQueueBox.put(id, jsonEncode(item));
  }

  // Get sync queue
  Future<List<Map<String, dynamic>>> getSyncQueue() async {
    final items = <Map<String, dynamic>>[];
    for (final key in _syncQueueBox.keys) {
      final data = _syncQueueBox.get(key);
      if (data != null) {
        items.add(jsonDecode(data) as Map<String, dynamic>);
      }
    }
    return items;
  }

  // Remove from sync queue
  Future<void> removeFromSyncQueue(String id) async {
    await _syncQueueBox.delete(id);
  }

  // Sync all pending data
  Future<SyncResult> syncPendingData() async {
    if (!_isOnline) {
      return SyncResult(
        success: false,
        message: 'Sem conexão com a internet',
      );
    }

    int synced = 0;
    int failed = 0;

    // Sync pending punches
    final pendingPunches = await getPendingPunches();
    for (final punch in pendingPunches) {
      try {
        // TODO: Call API to sync punch
        // await _apiService.syncPunch(punch);
        await markPunchSynced(punch['id'] as String);
        synced++;
      } catch (e) {
        failed++;
        print('Failed to sync punch: $e');
      }
    }

    // Sync queue items
    final queueItems = await getSyncQueue();
    for (final item in queueItems) {
      try {
        // TODO: Process queue item based on type
        await removeFromSyncQueue(item['id'] as String);
        synced++;
      } catch (e) {
        failed++;
        print('Failed to sync queue item: $e');
      }
    }

    // Clean up synced punches
    await cleanSyncedPunches();

    return SyncResult(
      success: failed == 0,
      syncedCount: synced,
      failedCount: failed,
      message: failed == 0
          ? 'Sincronização concluída'
          : 'Alguns itens não foram sincronizados',
    );
  }

  // Get pending count
  Future<int> getPendingCount() async {
    final punches = await getPendingPunches();
    final queue = await getSyncQueue();
    return punches.length + queue.length;
  }

  // Clear all offline data
  Future<void> clearAll() async {
    await _pendingPunchesBox.clear();
    await _cachedRecordsBox.clear();
    await _syncQueueBox.clear();
  }
}

class SyncResult {
  final bool success;
  final int syncedCount;
  final int failedCount;
  final String message;

  const SyncResult({
    required this.success,
    this.syncedCount = 0,
    this.failedCount = 0,
    this.message = '',
  });
}
