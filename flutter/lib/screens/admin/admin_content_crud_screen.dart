import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Describes one content table's admin CRUD shape. Sermon, BlogPost, and
/// NewsItem all share the same core columns (title, description, image_url,
/// link_path, category, date, video_url, audio_url, likes) — this single
/// screen drives all three via config rather than three near-duplicate files.
/// Sermon adds a few extra text fields (speaker, scripture, full_content).
class AdminContentConfig {
  final String table;
  final String displayName;
  final List<String> categories;
  final bool hasSermonFields;
  const AdminContentConfig({
    required this.table,
    required this.displayName,
    required this.categories,
    this.hasSermonFields = false,
  });
}

class AdminContentCrudScreen extends ConsumerStatefulWidget {
  final AdminContentConfig config;
  const AdminContentCrudScreen({super.key, required this.config});

  @override
  ConsumerState<AdminContentCrudScreen> createState() => _AdminContentCrudScreenState();
}

class _AdminContentCrudScreenState extends ConsumerState<AdminContentCrudScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client
        .from(widget.config.table)
        .select()
        .order('date', ascending: false);
    setState(() {
      _items = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Delete "${item['title']}"?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await SupabaseService.client.from(widget.config.table).delete().eq('id', item['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).value;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _ContentFormSheet(
        config: widget.config,
        existing: existing,
        adminId: profile?.id,
        adminName: profile?.fullName,
      ),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Manage ${widget.config.displayName}')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? Center(child: Text('No ${widget.config.displayName.toLowerCase()} yet. Add one to get started.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _items.length,
                    itemBuilder: (context, i) {
                      final item = _items[i];
                      final dateStr = item['date'] != null
                          ? DateFormat.yMMMd().format(DateTime.tryParse(item['date']) ?? DateTime.now())
                          : '';
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: ListTile(
                          title: Text(item['title'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Text('${item['category'] ?? ''} · $dateStr'),
                          onTap: () => _openForm(existing: item),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline, color: Colors.red),
                            onPressed: () => _delete(item),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _ContentFormSheet extends StatefulWidget {
  final AdminContentConfig config;
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _ContentFormSheet({required this.config, this.existing, this.adminId, this.adminName});

  @override
  State<_ContentFormSheet> createState() => _ContentFormSheetState();
}

class _ContentFormSheetState extends State<_ContentFormSheet> {
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _imageUrl;
  late final TextEditingController _linkPath;
  late final TextEditingController _videoUrl;
  late final TextEditingController _audioUrl;
  late final TextEditingController _speaker;
  late final TextEditingController _scripture;
  late final TextEditingController _fullContent;
  String? _category;
  DateTime? _date;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?['title'] ?? '');
    _description = TextEditingController(text: e?['description'] ?? '');
    _imageUrl = TextEditingController(text: e?['image_url'] ?? '');
    _linkPath = TextEditingController(text: e?['link_path'] ?? '/');
    _videoUrl = TextEditingController(text: e?['video_url'] ?? '');
    _audioUrl = TextEditingController(text: e?['audio_url'] ?? '');
    _speaker = TextEditingController(text: e?['speaker'] ?? '');
    _scripture = TextEditingController(text: e?['scripture'] ?? '');
    _fullContent = TextEditingController(text: e?['full_content'] ?? '');
    _category = e?['category'];
    _date = e?['date'] != null ? DateTime.tryParse(e!['date']) : null;
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _description.text.trim().isEmpty) {
      setState(() => _error = 'Title and description are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'title': _title.text.trim(),
      'description': _description.text.trim(),
      'image_url': _imageUrl.text.trim().isEmpty ? null : _imageUrl.text.trim(),
      'link_path': _linkPath.text.trim().isEmpty ? '/' : _linkPath.text.trim(),
      'category': _category,
      'date': _date?.toIso8601String(),
      'video_url': _videoUrl.text.trim().isEmpty ? null : _videoUrl.text.trim(),
      'audio_url': _audioUrl.text.trim().isEmpty ? null : _audioUrl.text.trim(),
      if (widget.config.hasSermonFields) 'speaker': _speaker.text.trim().isEmpty ? null : _speaker.text.trim(),
      if (widget.config.hasSermonFields) 'scripture': _scripture.text.trim().isEmpty ? null : _scripture.text.trim(),
      if (widget.config.hasSermonFields)
        'full_content': _fullContent.text.trim().isEmpty ? null : _fullContent.text.trim(),
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        body['likes'] = 0;
        await SupabaseService.client.from(widget.config.table).insert(body);
      } else {
        await SupabaseService.client.from(widget.config.table).update(body).eq('id', widget.existing!['id']);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() {
        _error = 'Could not save: $e';
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              widget.existing == null ? 'Add ${widget.config.displayName.substring(0, widget.config.displayName.length - 1)}' : 'Edit',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: widget.config.categories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' '))))
                  .toList(),
              onChanged: (v) => setState(() => _category = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_date == null ? 'Pick a date' : DateFormat.yMMMd().format(_date!)),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(
                    context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _date ?? DateTime.now());
                if (picked != null) setState(() => _date = picked);
              },
            ),
            TextField(controller: _imageUrl, decoration: const InputDecoration(labelText: 'Image URL')),
            const SizedBox(height: 8),
            TextField(controller: _linkPath, decoration: const InputDecoration(labelText: 'Link path')),
            const SizedBox(height: 8),
            TextField(controller: _videoUrl, decoration: const InputDecoration(labelText: 'Video URL')),
            const SizedBox(height: 8),
            TextField(controller: _audioUrl, decoration: const InputDecoration(labelText: 'Audio URL')),
            if (widget.config.hasSermonFields) ...[
              const SizedBox(height: 8),
              TextField(controller: _speaker, decoration: const InputDecoration(labelText: 'Speaker')),
              const SizedBox(height: 8),
              TextField(controller: _scripture, decoration: const InputDecoration(labelText: 'Scripture')),
              const SizedBox(height: 8),
              TextField(controller: _fullContent, decoration: const InputDecoration(labelText: 'Full content'), maxLines: 6),
            ],
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
