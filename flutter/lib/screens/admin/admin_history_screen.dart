import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

/// Admin CRUD for the historychapter and historymilestone tables.
/// Kept as one screen because both resources form the public Church History.
class AdminHistoryScreen extends StatefulWidget {
  const AdminHistoryScreen({super.key});

  @override
  State<AdminHistoryScreen> createState() => _AdminHistoryScreenState();
}

class _AdminHistoryScreenState extends State<AdminHistoryScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  bool _loading = true;
  List<Map<String, dynamic>> _chapters = [];
  List<Map<String, dynamic>> _milestones = [];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final client = SupabaseService.client;
      final chapters = await client.from('historychapter').select().order('chapter_number');
      final milestones = await client.from('historymilestone').select().order('date');
      if (mounted) {
        setState(() {
          _chapters = List<Map<String, dynamic>>.from(chapters);
          _milestones = List<Map<String, dynamic>>.from(milestones);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        _error(e);
      }
    }
  }

  void _error(Object e) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not load history: $e')));

  Future<void> _editChapter([Map<String, dynamic>? row]) async {
    final title = TextEditingController(text: row?['title']?.toString() ?? '');
    final number = TextEditingController(text: row?['chapter_number']?.toString() ?? '');
    final author = TextEditingController(text: row?['author']?.toString() ?? '');
    final content = TextEditingController(text: row?['content']?.toString() ?? '');
    bool published = row?['published'] == true;
    final ok = await showDialog<bool>(context: context, builder: (ctx) => StatefulBuilder(builder: (ctx, setLocal) => AlertDialog(
      title: Text(row == null ? 'Add history chapter' : 'Edit history chapter'),
      content: SizedBox(width: 560, child: SingleChildScrollView(child: Column(children: [
        TextField(controller: number, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Chapter number')),
        TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
        TextField(controller: author, decoration: const InputDecoration(labelText: 'Author')),
        TextField(controller: content, minLines: 8, maxLines: 16, decoration: const InputDecoration(labelText: 'Content')),
        SwitchListTile(title: const Text('Published'), value: published, onChanged: (v) => setLocal(() => published = v)),
      ]))),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save'))],
    )));
    if (ok != true) return;
    try {
      final data = <String, dynamic>{
        'chapter_number': int.tryParse(number.text.trim()) ?? 0,
        'title': title.text.trim(),
        'author': author.text.trim().isEmpty ? null : author.text.trim(),
        'content': content.text.trim(),
        'published': published,
      };
      if (row == null) {
        await SupabaseService.client.from('historychapter').insert(data);
      } else {
        await SupabaseService.client.from('historychapter').update(data).eq('id', row['id']);
      }
      await _load();
    } catch (e) { _error(e); }
  }

  Future<void> _editMilestone([Map<String, dynamic>? row]) async {
    final title = TextEditingController(text: row?['title']?.toString() ?? '');
    final date = TextEditingController(text: row?['date']?.toString() ?? '');
    final description = TextEditingController(text: row?['description']?.toString() ?? '');
    final imageUrl = TextEditingController(text: row?['image_url']?.toString() ?? '');
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: Text(row == null ? 'Add milestone' : 'Edit milestone'),
      content: SizedBox(width: 560, child: SingleChildScrollView(child: Column(children: [
        TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
        TextField(controller: date, decoration: const InputDecoration(labelText: 'Date (YYYY-MM-DD)')),
        TextField(controller: description, minLines: 4, maxLines: 10, decoration: const InputDecoration(labelText: 'Description')),
        TextField(controller: imageUrl, decoration: const InputDecoration(labelText: 'Image URL')),
      ]))),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save'))],
    ));
    if (ok != true) return;
    try {
      final data = <String, dynamic>{'title': title.text.trim(), 'date': date.text.trim().isEmpty ? null : date.text.trim(), 'description': description.text.trim(), 'image_url': imageUrl.text.trim().isEmpty ? null : imageUrl.text.trim()};
      if (row == null) {
        await SupabaseService.client.from('historymilestone').insert(data);
      } else {
        await SupabaseService.client.from('historymilestone').update(data).eq('id', row['id']);
      }
      await _load();
    } catch (e) { _error(e); }
  }

  Future<void> _delete(String table, dynamic id) async {
    final yes = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Delete item?'), content: const Text('This cannot be undone.'),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete'))],
    ));
    if (yes != true) return;
    try { await SupabaseService.client.from(table).delete().eq('id', id); await _load(); } catch (e) { _error(e); }
  }

  Widget _chaptersTab() => Column(children: [
    Align(alignment: Alignment.centerRight, child: FilledButton.icon(onPressed: () => _editChapter(), icon: const Icon(Icons.add), label: const Text('Add chapter'))),
    const SizedBox(height: 8),
    Expanded(child: _chapters.isEmpty ? const Center(child: Text('No history chapters.')) : ListView.builder(itemCount: _chapters.length, itemBuilder: (_, i) {
      final r = _chapters[i];
      return Card(child: ListTile(title: Text('${r['chapter_number'] ?? ''}. ${r['title'] ?? ''}'), subtitle: Text(r['published'] == true ? 'Published' : 'Draft'), trailing: Wrap(children: [IconButton(icon: const Icon(Icons.edit), onPressed: () => _editChapter(r)), IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete('historychapter', r['id']))])));
    }))]);

  Widget _milestonesTab() => Column(children: [
    Align(alignment: Alignment.centerRight, child: FilledButton.icon(onPressed: () => _editMilestone(), icon: const Icon(Icons.add), label: const Text('Add milestone'))),
    const SizedBox(height: 8),
    Expanded(child: _milestones.isEmpty ? const Center(child: Text('No history milestones.')) : ListView.builder(itemCount: _milestones.length, itemBuilder: (_, i) {
      final r = _milestones[i];
      return Card(child: ListTile(title: Text(r['title']?.toString() ?? ''), subtitle: Text(r['date']?.toString() ?? ''), trailing: Wrap(children: [IconButton(icon: const Icon(Icons.edit), onPressed: () => _editMilestone(r)), IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => _delete('historymilestone', r['id']))])));
    }))]);

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Church History'), bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'Chapters'), Tab(text: 'Milestones')])),
    body: _loading ? const Center(child: CircularProgressIndicator()) : Padding(padding: const EdgeInsets.all(16), child: TabBarView(controller: _tabs, children: [_chaptersTab(), _milestonesTab()])),
    floatingActionButton: FloatingActionButton(onPressed: _load, child: const Icon(Icons.refresh)),
  );
}
