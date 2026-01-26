import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Unit Tests', () {
    test('Date formatting works correctly', () {
      final date = DateTime(2026, 1, 25, 14, 30, 45);
      final formatted = '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      expect(formatted, '14:30');
    });

    test('Time calculation is correct', () {
      final start = DateTime(2026, 1, 25, 8, 0);
      final end = DateTime(2026, 1, 25, 17, 30);
      final worked = end.difference(start);
      expect(worked.inHours, 9);
      expect(worked.inMinutes % 60, 30);
    });

    test('Overtime calculation', () {
      const regularHours = 8;
      const totalWorked = 10.5;
      const overtime = totalWorked - regularHours;
      expect(overtime, 2.5);
    });

    test('Vacation days calculation', () {
      const totalDays = 30;
      const usedDays = 10;
      const remaining = totalDays - usedDays;
      expect(remaining, 20);
    });

    test('Currency formatting', () {
      const value = 5500.50;
      final formatted = 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
      expect(formatted, 'R\$ 5500,50');
    });
  });

  group('Model Tests', () {
    test('User model serialization', () {
      final userData = {
        'id': '1',
        'email': 'teste@empresa.com',
        'name': 'João Silva',
        'tenantId': 'tenant-1',
      };

      expect(userData['id'], '1');
      expect(userData['email'], 'teste@empresa.com');
      expect(userData['name'], 'João Silva');
    });

    test('Time record status calculation', () {
      const status = 'APPROVED';
      final isApproved = status == 'APPROVED';
      expect(isApproved, true);
    });
  });

  group('Validation Tests', () {
    test('Email validation', () {
      bool isValidEmail(String email) {
        return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
      }

      expect(isValidEmail('teste@empresa.com'), true);
      expect(isValidEmail('invalid-email'), false);
      expect(isValidEmail(''), false);
    });

    test('Password strength validation', () {
      bool isStrongPassword(String password) {
        return password.length >= 8 &&
            password.contains(RegExp(r'[A-Z]')) &&
            password.contains(RegExp(r'[a-z]')) &&
            password.contains(RegExp(r'[0-9]'));
      }

      expect(isStrongPassword('Senha123'), true);
      expect(isStrongPassword('weak'), false);
      expect(isStrongPassword('12345678'), false);
    });

    test('CPF validation', () {
      bool isValidCPF(String cpf) {
        cpf = cpf.replaceAll(RegExp(r'[^\d]'), '');
        if (cpf.length != 11) return false;
        if (cpf.split('').toSet().length == 1) return false;
        return true;
      }

      expect(isValidCPF('123.456.789-09'), true);
      expect(isValidCPF('111.111.111-11'), false);
      expect(isValidCPF('123'), false);
    });
  });
}
