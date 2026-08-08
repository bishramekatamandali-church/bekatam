import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';

class AdminContactMessagesScreen extends StatefulWidget {
  const AdminContactMessagesScreen({super.key});
  @override
  State<AdminContactMessagesScreen> createState() => _AdminContactMessagesScreenState();
}

class _AdminContactMessagesScreenState extends State<AdminContactMessagesScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('contactmessage').select().order('submitted_at', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _markReplied(Map<String, dynamic> m) async {
    final controller = TextEditingController(text: m['reply_note'] ?? '');
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mark as replied'),
        content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Reply note (optional)'), maxLines: 3),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Mark Replied')),
        ],
      ),
    );
    if (confirmed != true) return;
    await SupabaseService.client.from('contactmessage').update({
      'status': 'replied',
      'replied_at': DateTime.now().toIso8601String(),
      'reply_note': controller.text.trim().isEmpty ? null : controller.text.trim(),
    }).eq('id', m['id']);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final pending = _rows.where((r) => r['status'] == 'pending').toList();
    final replied = _rows.where((r) => r['status'] != 'pending').toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Contact Messages')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  Text('Pending (${pending.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                  if (pending.isEmpty) const Padding(padding: EdgeInsets.all(12), child: Text('No pending messages.')),
                  for (final m in pending) _messageCard(m, canReply: true),
                  const SizedBox(height: 16),
                  Text('Replied (${replied.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                  for (final m in replied) _messageCard(m, canReply: false),
                ],
              ),
            ),
    );
  }

  Widget _messageCard(Map<String, dynamic> m, {required bool canReply}) {
    final dateStr = m['submitted_at'] != null ? DateFormat.yMMMd().add_jm().format(DateTime.parse(m['submitted_at'])) : '';
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${m['name']} · ${m['subject'] ?? 'No subject'}', style: const TextStyle(fontWeight: FontWeight.w600)),
            Text('${m['email']} · $dateStr', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 6),
            Text(m['message'] ?? ''),
            if (m['reply_note'] != null) ...[
              const SizedBox(height: 6),
              Text('Reply note: ${m['reply_note']}', style: const TextStyle(fontStyle: FontStyle.italic)),
            ],
            if (canReply) ...[
              const SizedBox(height: 8),
              Align(alignment: Alignment.centerRight, child: FilledButton(onPressed: () => _markReplied(m), child: const Text('Mark Replied'))),
            ],
          ],
        ),
      ),
    );
  }
}
