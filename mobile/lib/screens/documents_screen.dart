import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../config/theme.dart';

enum DocumentCategory {
  contract,
  payslip,
  vacation,
  certificate,
  policy,
  other,
}

class DocumentItem {
  final String id;
  final String name;
  final DocumentCategory category;
  final DateTime uploadedAt;
  final String fileType;
  final int sizeBytes;
  final String? description;

  DocumentItem({
    required this.id,
    required this.name,
    required this.category,
    required this.uploadedAt,
    required this.fileType,
    required this.sizeBytes,
    this.description,
  });

  String get formattedSize {
    if (sizeBytes < 1024) {
      return '$sizeBytes B';
    } else if (sizeBytes < 1024 * 1024) {
      return '${(sizeBytes / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(sizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
  }
}

class DocumentsScreen extends ConsumerStatefulWidget {
  const DocumentsScreen({super.key});

  @override
  ConsumerState<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends ConsumerState<DocumentsScreen> {
  DocumentCategory? _selectedCategory;
  String _searchQuery = '';

  final List<DocumentItem> _documents = [
    DocumentItem(
      id: '1',
      name: 'Contrato de Trabalho',
      category: DocumentCategory.contract,
      uploadedAt: DateTime(2024, 3, 15),
      fileType: 'PDF',
      sizeBytes: 245760,
      description: 'Contrato de trabalho por tempo indeterminado',
    ),
    DocumentItem(
      id: '2',
      name: 'Contracheque Janeiro 2026',
      category: DocumentCategory.payslip,
      uploadedAt: DateTime(2026, 1, 25),
      fileType: 'PDF',
      sizeBytes: 128000,
    ),
    DocumentItem(
      id: '3',
      name: 'Contracheque Dezembro 2025',
      category: DocumentCategory.payslip,
      uploadedAt: DateTime(2025, 12, 25),
      fileType: 'PDF',
      sizeBytes: 125440,
    ),
    DocumentItem(
      id: '4',
      name: 'Comprovante de Férias',
      category: DocumentCategory.vacation,
      uploadedAt: DateTime(2025, 7, 10),
      fileType: 'PDF',
      sizeBytes: 89600,
    ),
    DocumentItem(
      id: '5',
      name: 'Declaração de Vínculo Empregatício',
      category: DocumentCategory.certificate,
      uploadedAt: DateTime(2025, 11, 20),
      fileType: 'PDF',
      sizeBytes: 56320,
    ),
    DocumentItem(
      id: '6',
      name: 'Política de Home Office',
      category: DocumentCategory.policy,
      uploadedAt: DateTime(2024, 6, 1),
      fileType: 'PDF',
      sizeBytes: 512000,
      description: 'Diretrizes para trabalho remoto',
    ),
    DocumentItem(
      id: '7',
      name: 'Código de Conduta',
      category: DocumentCategory.policy,
      uploadedAt: DateTime(2024, 1, 15),
      fileType: 'PDF',
      sizeBytes: 768000,
    ),
    DocumentItem(
      id: '8',
      name: 'Termo de Confidencialidade',
      category: DocumentCategory.contract,
      uploadedAt: DateTime(2024, 3, 15),
      fileType: 'PDF',
      sizeBytes: 102400,
    ),
  ];

  List<DocumentItem> get filteredDocuments {
    return _documents.where((doc) {
      final matchesCategory = _selectedCategory == null || doc.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          doc.name.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Meus Documentos'),
      ),
      body: Column(
        children: [
          // Search and Filter
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  decoration: InputDecoration(
                    hintText: 'Buscar documentos...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: AppColors.background,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Category Chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _CategoryChip(
                        label: 'Todos',
                        selected: _selectedCategory == null,
                        onTap: () => setState(() => _selectedCategory = null),
                      ),
                      const SizedBox(width: 8),
                      ...DocumentCategory.values.map((category) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: _CategoryChip(
                              label: _getCategoryName(category),
                              selected: _selectedCategory == category,
                              onTap: () => setState(() => _selectedCategory = category),
                            ),
                          )),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Documents List
          Expanded(
            child: filteredDocuments.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredDocuments.length,
                    itemBuilder: (context, index) {
                      final document = filteredDocuments[index];
                      return _DocumentCard(
                        document: document,
                        onTap: () => _showDocumentOptions(document),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.folder_open,
            size: 80,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            'Nenhum documento encontrado',
            style: TextStyle(
              fontSize: 18,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tente ajustar os filtros',
            style: TextStyle(
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  String _getCategoryName(DocumentCategory category) {
    switch (category) {
      case DocumentCategory.contract:
        return 'Contratos';
      case DocumentCategory.payslip:
        return 'Contracheques';
      case DocumentCategory.vacation:
        return 'Férias';
      case DocumentCategory.certificate:
        return 'Certidões';
      case DocumentCategory.policy:
        return 'Políticas';
      case DocumentCategory.other:
        return 'Outros';
    }
  }

  void _showDocumentOptions(DocumentItem document) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _DocumentOptionsSheet(document: document),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.textTertiary,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppColors.textSecondary,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final DocumentItem document;
  final VoidCallback onTap;

  const _DocumentCard({
    required this.document,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              _buildFileIcon(),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      document.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _CategoryBadge(category: document.category),
                        const SizedBox(width: 8),
                        Text(
                          '•',
                          style: TextStyle(color: AppColors.textTertiary),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          document.formattedSize,
                          style: TextStyle(
                            color: AppColors.textTertiary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('dd/MM/yyyy').format(document.uploadedAt),
                      style: TextStyle(
                        color: AppColors.textTertiary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.more_vert,
                color: AppColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFileIcon() {
    Color color;
    IconData icon;

    switch (document.fileType.toUpperCase()) {
      case 'PDF':
        color = Colors.red;
        icon = Icons.picture_as_pdf;
        break;
      case 'DOC':
      case 'DOCX':
        color = Colors.blue;
        icon = Icons.description;
        break;
      case 'XLS':
      case 'XLSX':
        color = Colors.green;
        icon = Icons.table_chart;
        break;
      default:
        color = AppColors.textSecondary;
        icon = Icons.insert_drive_file;
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        icon,
        color: color,
        size: 24,
      ),
    );
  }
}

class _CategoryBadge extends StatelessWidget {
  final DocumentCategory category;

  const _CategoryBadge({required this.category});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _getCategoryColor(category).withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getCategoryName(category),
        style: TextStyle(
          color: _getCategoryColor(category),
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getCategoryColor(DocumentCategory category) {
    switch (category) {
      case DocumentCategory.contract:
        return Colors.purple;
      case DocumentCategory.payslip:
        return Colors.green;
      case DocumentCategory.vacation:
        return Colors.orange;
      case DocumentCategory.certificate:
        return Colors.blue;
      case DocumentCategory.policy:
        return Colors.teal;
      case DocumentCategory.other:
        return Colors.grey;
    }
  }

  String _getCategoryName(DocumentCategory category) {
    switch (category) {
      case DocumentCategory.contract:
        return 'Contrato';
      case DocumentCategory.payslip:
        return 'Contracheque';
      case DocumentCategory.vacation:
        return 'Férias';
      case DocumentCategory.certificate:
        return 'Certidão';
      case DocumentCategory.policy:
        return 'Política';
      case DocumentCategory.other:
        return 'Outro';
    }
  }
}

class _DocumentOptionsSheet extends StatelessWidget {
  final DocumentItem document;

  const _DocumentOptionsSheet({required this.document});

  @override
  Widget build(BuildContext context) {
    return Padding(
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.picture_as_pdf,
                    color: Colors.red,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        document.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${document.fileType} • ${document.formattedSize}',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(),
          _OptionTile(
            icon: Icons.visibility,
            label: 'Visualizar',
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Abrindo documento...')),
              );
            },
          ),
          _OptionTile(
            icon: Icons.download,
            label: 'Baixar',
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Baixando documento...')),
              );
            },
          ),
          _OptionTile(
            icon: Icons.share,
            label: 'Compartilhar',
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Compartilhando documento...')),
              );
            },
          ),
          if (document.description != null) ...[
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline,
                    color: AppColors.textTertiary,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      document.description!,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _OptionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(label),
      onTap: onTap,
    );
  }
}
