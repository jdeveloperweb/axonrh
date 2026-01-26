import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/theme.dart';
import '../providers/auth_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _biometricEnabled = true;
  bool _pushNotifications = true;
  bool _emailNotifications = true;
  bool _darkMode = false;
  bool _offlineMode = false;
  String _selectedLanguage = 'pt_BR';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Configurações'),
      ),
      body: ListView(
        children: [
          // Security Section
          _SectionHeader(title: 'Segurança'),
          _SwitchTile(
            icon: Icons.fingerprint,
            title: 'Login Biométrico',
            subtitle: 'Use impressão digital ou Face ID para acessar',
            value: _biometricEnabled,
            onChanged: (value) => setState(() => _biometricEnabled = value),
          ),
          _ActionTile(
            icon: Icons.lock_outline,
            title: 'Alterar Senha',
            subtitle: 'Atualize sua senha de acesso',
            onTap: _showChangePasswordDialog,
          ),
          _ActionTile(
            icon: Icons.devices,
            title: 'Dispositivos Conectados',
            subtitle: 'Gerencie seus dispositivos de acesso',
            onTap: () => _showComingSoonSnackBar(),
          ),

          // Notifications Section
          _SectionHeader(title: 'Notificações'),
          _SwitchTile(
            icon: Icons.notifications_outlined,
            title: 'Notificações Push',
            subtitle: 'Receba alertas em tempo real',
            value: _pushNotifications,
            onChanged: (value) => setState(() => _pushNotifications = value),
          ),
          _SwitchTile(
            icon: Icons.email_outlined,
            title: 'Notificações por E-mail',
            subtitle: 'Receba resumos e alertas importantes',
            value: _emailNotifications,
            onChanged: (value) => setState(() => _emailNotifications = value),
          ),
          _ActionTile(
            icon: Icons.tune,
            title: 'Preferências de Notificação',
            subtitle: 'Escolha quais alertas deseja receber',
            onTap: () => _showNotificationPreferences(),
          ),

          // Appearance Section
          _SectionHeader(title: 'Aparência'),
          _SwitchTile(
            icon: Icons.dark_mode_outlined,
            title: 'Modo Escuro',
            subtitle: 'Ative o tema escuro do app',
            value: _darkMode,
            onChanged: (value) => setState(() => _darkMode = value),
          ),
          _SelectTile(
            icon: Icons.language,
            title: 'Idioma',
            subtitle: _getLanguageName(_selectedLanguage),
            onTap: _showLanguageSelector,
          ),

          // Data Section
          _SectionHeader(title: 'Dados'),
          _SwitchTile(
            icon: Icons.offline_bolt_outlined,
            title: 'Modo Offline',
            subtitle: 'Salve dados para acesso sem internet',
            value: _offlineMode,
            onChanged: (value) => setState(() => _offlineMode = value),
          ),
          _ActionTile(
            icon: Icons.delete_sweep_outlined,
            title: 'Limpar Cache',
            subtitle: 'Libere espaço no dispositivo',
            onTap: _showClearCacheDialog,
          ),
          _ActionTile(
            icon: Icons.sync,
            title: 'Sincronizar Dados',
            subtitle: 'Última sincronização: Hoje, 14:30',
            onTap: _syncData,
          ),

          // About Section
          _SectionHeader(title: 'Sobre'),
          _InfoTile(
            icon: Icons.info_outline,
            title: 'Versão do App',
            subtitle: '1.0.0 (Build 100)',
          ),
          _ActionTile(
            icon: Icons.description_outlined,
            title: 'Termos de Uso',
            subtitle: 'Leia os termos e condições',
            onTap: () => _showComingSoonSnackBar(),
          ),
          _ActionTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Política de Privacidade',
            subtitle: 'Saiba como seus dados são usados',
            onTap: () => _showComingSoonSnackBar(),
          ),
          _ActionTile(
            icon: Icons.help_outline,
            title: 'Central de Ajuda',
            subtitle: 'Tire suas dúvidas',
            onTap: () => _showComingSoonSnackBar(),
          ),

          // Logout Section
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: _showLogoutDialog,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              icon: const Icon(Icons.logout),
              label: const Text('Sair da Conta'),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _getLanguageName(String code) {
    switch (code) {
      case 'pt_BR':
        return 'Português (Brasil)';
      case 'en_US':
        return 'English (US)';
      case 'es_ES':
        return 'Español';
      default:
        return code;
    }
  }

  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Alterar Senha'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Senha Atual',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Nova Senha',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirmar Nova Senha',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Senha alterada com sucesso!')),
              );
            },
            child: const Text('Alterar'),
          ),
        ],
      ),
    );
  }

  void _showNotificationPreferences() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Preferências de Notificação',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              _NotificationPreferenceItem(
                title: 'Ponto Eletrônico',
                subtitle: 'Lembretes de registro de ponto',
                value: true,
              ),
              _NotificationPreferenceItem(
                title: 'Férias',
                subtitle: 'Aprovações e lembretes de férias',
                value: true,
              ),
              _NotificationPreferenceItem(
                title: 'Contracheque',
                subtitle: 'Quando novos contracheques estiverem disponíveis',
                value: true,
              ),
              _NotificationPreferenceItem(
                title: 'Treinamentos',
                subtitle: 'Lembretes de treinamentos pendentes',
                value: false,
              ),
              _NotificationPreferenceItem(
                title: 'Comunicados',
                subtitle: 'Comunicados gerais da empresa',
                value: true,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageSelector() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Selecionar Idioma',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _LanguageOption(
              code: 'pt_BR',
              name: 'Português (Brasil)',
              flag: '🇧🇷',
              selected: _selectedLanguage == 'pt_BR',
              onTap: () {
                setState(() => _selectedLanguage = 'pt_BR');
                Navigator.pop(context);
              },
            ),
            _LanguageOption(
              code: 'en_US',
              name: 'English (US)',
              flag: '🇺🇸',
              selected: _selectedLanguage == 'en_US',
              onTap: () {
                setState(() => _selectedLanguage = 'en_US');
                Navigator.pop(context);
              },
            ),
            _LanguageOption(
              code: 'es_ES',
              name: 'Español',
              flag: '🇪🇸',
              selected: _selectedLanguage == 'es_ES',
              onTap: () {
                setState(() => _selectedLanguage = 'es_ES');
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Limpar Cache'),
        content: const Text(
          'Isso irá remover todos os dados temporários armazenados no dispositivo. '
          'Deseja continuar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cache limpo com sucesso!')),
              );
            },
            child: const Text('Limpar'),
          ),
        ],
      ),
    );
  }

  void _syncData() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sincronizando dados...')),
    );

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Dados sincronizados com sucesso!')),
        );
      }
    });
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sair da Conta'),
        content: const Text('Tem certeza que deseja sair?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
              context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Sair'),
          ),
        ],
      ),
    );
  }

  void _showComingSoonSnackBar() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Em breve!')),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textTertiary,
          letterSpacing: 1,
        ),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        trailing: Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.primary,
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        trailing: Icon(Icons.chevron_right, color: AppColors.textTertiary),
        onTap: onTap,
      ),
    );
  }
}

class _SelectTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SelectTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: AppColors.primary, fontSize: 12),
        ),
        trailing: Icon(Icons.chevron_right, color: AppColors.textTertiary),
        onTap: onTap,
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
      ),
    );
  }
}

class _NotificationPreferenceItem extends StatefulWidget {
  final String title;
  final String subtitle;
  final bool value;

  const _NotificationPreferenceItem({
    required this.title,
    required this.subtitle,
    required this.value,
  });

  @override
  State<_NotificationPreferenceItem> createState() =>
      _NotificationPreferenceItemState();
}

class _NotificationPreferenceItemState
    extends State<_NotificationPreferenceItem> {
  late bool _value;

  @override
  void initState() {
    super.initState();
    _value = widget.value;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 2),
                Text(
                  widget.subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: _value,
            onChanged: (value) => setState(() => _value = value),
            activeColor: AppColors.primary,
          ),
        ],
      ),
    );
  }
}

class _LanguageOption extends StatelessWidget {
  final String code;
  final String name;
  final String flag;
  final bool selected;
  final VoidCallback onTap;

  const _LanguageOption({
    required this.code,
    required this.name,
    required this.flag,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Text(flag, style: const TextStyle(fontSize: 24)),
      title: Text(name),
      trailing: selected
          ? Icon(Icons.check_circle, color: AppColors.primary)
          : null,
      onTap: onTap,
    );
  }
}
