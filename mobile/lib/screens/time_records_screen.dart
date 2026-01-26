import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../config/theme.dart';
import '../models/time_record.dart';

class TimeRecordsScreen extends ConsumerStatefulWidget {
  const TimeRecordsScreen({super.key});

  @override
  ConsumerState<TimeRecordsScreen> createState() => _TimeRecordsScreenState();
}

class _TimeRecordsScreenState extends ConsumerState<TimeRecordsScreen> {
  DateTime _selectedMonth = DateTime.now();
  List<TimeRecord> _records = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRecords();
  }

  Future<void> _loadRecords() async {
    setState(() => _isLoading = true);

    // TODO: Load from API
    await Future.delayed(const Duration(seconds: 1));

    // Mock data
    setState(() {
      _records = _generateMockRecords();
      _isLoading = false;
    });
  }

  List<TimeRecord> _generateMockRecords() {
    final records = <TimeRecord>[];
    final now = DateTime.now();

    for (int i = 0; i < 20; i++) {
      final date = now.subtract(Duration(days: i));
      if (date.weekday == DateTime.saturday || date.weekday == DateTime.sunday) {
        continue;
      }

      records.add(TimeRecord(
        id: 'record_$i',
        employeeId: 'emp_1',
        date: date,
        clockIn: DateTime(date.year, date.month, date.day, 8, 0),
        breakStart: DateTime(date.year, date.month, date.day, 12, 0),
        breakEnd: DateTime(date.year, date.month, date.day, 13, 0),
        clockOut: i == 0 ? null : DateTime(date.year, date.month, date.day, 17, 0),
        totalWorked: i == 0 ? null : const Duration(hours: 8),
        status: PunchStatus.approved,
      ));
    }

    return records;
  }

  void _changeMonth(int delta) {
    setState(() {
      _selectedMonth = DateTime(
        _selectedMonth.year,
        _selectedMonth.month + delta,
      );
    });
    _loadRecords();
  }

  @override
  Widget build(BuildContext context) {
    final monthFormat = DateFormat('MMMM yyyy', 'pt_BR');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Meus Registros'),
      ),
      body: Column(
        children: [
          // Month Selector
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => _changeMonth(-1),
                  icon: const Icon(Icons.chevron_left),
                ),
                Text(
                  monthFormat.format(_selectedMonth),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  onPressed: () => _changeMonth(1),
                  icon: const Icon(Icons.chevron_right),
                ),
              ],
            ),
          ),

          // Summary Card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _SummaryItem(
                  label: 'Trabalhadas',
                  value: '160h',
                  color: AppColors.primary,
                ),
                _SummaryItem(
                  label: 'Esperadas',
                  value: '176h',
                  color: AppColors.textSecondary,
                ),
                _SummaryItem(
                  label: 'Saldo',
                  value: '-16h',
                  color: AppColors.error,
                ),
              ],
            ),
          ),

          // Records List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _loadRecords,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _records.length,
                      itemBuilder: (context, index) {
                        return _RecordCard(record: _records[index]);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _RecordCard extends StatelessWidget {
  final TimeRecord record;

  const _RecordCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEE, dd/MM', 'pt_BR');
    final timeFormat = DateFormat('HH:mm');

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  dateFormat.format(record.date),
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                _StatusBadge(status: record.status),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _TimeSlot(
                  label: 'Entrada',
                  time: record.clockIn != null
                      ? timeFormat.format(record.clockIn!)
                      : '--:--',
                ),
                _TimeSlot(
                  label: 'Intervalo',
                  time: record.breakStart != null && record.breakEnd != null
                      ? '${timeFormat.format(record.breakStart!)} - ${timeFormat.format(record.breakEnd!)}'
                      : '--:--',
                ),
                _TimeSlot(
                  label: 'Saída',
                  time: record.clockOut != null
                      ? timeFormat.format(record.clockOut!)
                      : '--:--',
                ),
                _TimeSlot(
                  label: 'Total',
                  time: record.totalWorked != null
                      ? '${record.totalWorked!.inHours}h${(record.totalWorked!.inMinutes % 60).toString().padLeft(2, '0')}min'
                      : '--:--',
                  highlight: true,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TimeSlot extends StatelessWidget {
  final String label;
  final String time;
  final bool highlight;

  const _TimeSlot({
    required this.label,
    required this.time,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textTertiary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          time,
          style: TextStyle(
            fontSize: 13,
            fontWeight: highlight ? FontWeight.bold : FontWeight.w500,
            color: highlight ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final PunchStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (status) {
      case PunchStatus.approved:
        color = AppColors.success;
        label = 'Aprovado';
        break;
      case PunchStatus.pending:
        color = AppColors.warning;
        label = 'Pendente';
        break;
      case PunchStatus.rejected:
        color = AppColors.error;
        label = 'Rejeitado';
        break;
      case PunchStatus.processing:
        color = AppColors.info;
        label = 'Processando';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
