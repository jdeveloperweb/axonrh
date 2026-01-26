import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:axonrh_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('AxonRH Mobile E2E Tests', () {
    testWidgets('Splash screen displays and navigates', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify splash screen elements
      expect(find.text('AxonRH'), findsOneWidget);

      // Wait for navigation to login
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should navigate to login screen
      expect(find.text('Entrar'), findsOneWidget);
    });

    testWidgets('Login flow works correctly', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find email and password fields
      final emailField = find.byType(TextField).first;
      final passwordField = find.byType(TextField).last;

      // Enter credentials
      await tester.enterText(emailField, 'teste@empresa.com');
      await tester.enterText(passwordField, 'senha123');
      await tester.pumpAndSettle();

      // Tap login button
      final loginButton = find.text('Entrar');
      await tester.tap(loginButton);
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Should navigate to home screen
      expect(find.text('Olá'), findsWidgets);
    });

    testWidgets('Bottom navigation works', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Login first
      final emailField = find.byType(TextField).first;
      final passwordField = find.byType(TextField).last;
      await tester.enterText(emailField, 'teste@empresa.com');
      await tester.enterText(passwordField, 'senha123');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to Ponto
      await tester.tap(find.text('Ponto'));
      await tester.pumpAndSettle();
      expect(find.text('Registrar Ponto'), findsOneWidget);

      // Navigate to Registros
      await tester.tap(find.text('Registros'));
      await tester.pumpAndSettle();
      expect(find.text('Registros de Ponto'), findsOneWidget);

      // Navigate to Profile
      await tester.tap(find.text('Perfil'));
      await tester.pumpAndSettle();
      expect(find.text('Meus Dados'), findsWidgets);

      // Navigate back to Home
      await tester.tap(find.text('Início'));
      await tester.pumpAndSettle();
      expect(find.text('Olá'), findsWidgets);
    });

    testWidgets('Time punch screen displays correctly', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Login
      final emailField = find.byType(TextField).first;
      final passwordField = find.byType(TextField).last;
      await tester.enterText(emailField, 'teste@empresa.com');
      await tester.enterText(passwordField, 'senha123');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to Ponto
      await tester.tap(find.text('Ponto'));
      await tester.pumpAndSettle();

      // Verify time punch screen elements
      expect(find.text('Registrar Ponto'), findsOneWidget);
      expect(find.byIcon(Icons.access_time), findsWidgets);
    });

    testWidgets('Settings screen displays correctly', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Login
      final emailField = find.byType(TextField).first;
      final passwordField = find.byType(TextField).last;
      await tester.enterText(emailField, 'teste@empresa.com');
      await tester.enterText(passwordField, 'senha123');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to Profile
      await tester.tap(find.text('Perfil'));
      await tester.pumpAndSettle();

      // Find and tap settings icon
      await tester.tap(find.byIcon(Icons.settings));
      await tester.pumpAndSettle();

      // Verify settings screen elements
      expect(find.text('Configurações'), findsOneWidget);
      expect(find.text('Segurança'), findsOneWidget);
      expect(find.text('Notificações'), findsOneWidget);
      expect(find.text('Aparência'), findsOneWidget);
    });

    testWidgets('AI Assistant screen works', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Login
      final emailField = find.byType(TextField).first;
      final passwordField = find.byType(TextField).last;
      await tester.enterText(emailField, 'teste@empresa.com');
      await tester.enterText(passwordField, 'senha123');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Navigate to Assistant (from home quick actions)
      final assistantButton = find.text('Assistente').first;
      await tester.tap(assistantButton);
      await tester.pumpAndSettle();

      // Verify AI assistant screen
      expect(find.text('Assistente de RH'), findsOneWidget);

      // Send a message
      final messageField = find.byType(TextField);
      await tester.enterText(messageField, 'Qual meu saldo de férias?');
      await tester.tap(find.byIcon(Icons.send));
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should show user message
      expect(find.text('Qual meu saldo de férias?'), findsOneWidget);
    });
  });
}
