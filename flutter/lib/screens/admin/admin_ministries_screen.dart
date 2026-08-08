import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _ministryCategories = [
  'Youth_Young_Adults', 'Children_Family', "Men_s_Ministry", "Women_s_Ministry",
  'Worship_Team', 'Outreach_Missions', 'Pastoral_Care',
];

class AdminMinistriesScreen extends StatefulWidget {
  const AdminMinistriesScreen({super.key});
  @override
  State<AdminMinistriesScreen> createState() => _AdminMinistriesScreenState();
}

class _AdminMinistriesScreenState extends State<AdminMinistriesScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ministries'),
        bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'Ministries'), Tab(text: 'Join Requests')]),
      ),
      body: TabBarView(controller: _tabController, children: const [_MinistriesTab(), _JoinRequestsTab()]),
    );
  }
}

// ---------------- Ministries ----------------

class _MinistriesTab extends ConsumerStatefulWidget {
  const _MinistriesTab();
  @override
  ConsumerState<_MinistriesTab> createState() => _MinistriesTabState();
}

class _MinistriesTabState extends ConsumerState<_MinistriesTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('ministry').select().order('title');
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('ministry').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).value;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _MinistryFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Add')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _rows.isEmpty
                  ? const Center(child: Text('No ministries yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text(r['title'] ?? ''),
                            subtitle: Text('${(r['category'] as String? ?? '').replaceAll('_', ' ')} · Leader: ${r['leader'] ?? '—'}'),
                            onTap: () => _openForm(existing: r),
                            trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class _MinistryFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _MinistryFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_MinistryFormSheet> createState() => _MinistryFormSheetState();
}

class _MinistryFormSheetState extends State<_MinistryFormSheet> {
  late final TextEditingController _title, _description, _imageUrl, _linkPath, _leader, _meetingTime;
  String? _category;
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
    _leader = TextEditingController(text: e?['leader'] ?? '');
    _meetingTime = TextEditingController(text: e?['meeting_time'] ?? '');
    _category = e?['category'];
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
      'leader': _leader.text.trim().isEmpty ? null : _leader.text.trim(),
      'meeting_time': _meetingTime.text.trim().isEmpty ? null : _meetingTime.text.trim(),
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        await SupabaseService.client.from('ministry').insert(body);
      } else {
        await SupabaseService.client.from('ministry').update(body).eq('id', widget.existing!['id']);
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
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.existing == null ? 'Add Ministry' : 'Edit Ministry', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _ministryCategories.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _category = v),
            ),
            const SizedBox(height: 8),
            TextField(controller: _leader, decoration: const InputDecoration(labelText: 'Leader')),
            const SizedBox(height: 8),
            TextField(controller: _meetingTime, decoration: const InputDecoration(labelText: 'Meeting Time')),
            const SizedBox(height: 8),
            TextField(controller: _imageUrl, decoration: const InputDecoration(labelText: 'Image URL')),
            const SizedBox(height: 8),
            TextField(controller: _linkPath, decoration: const InputDecoration(labelText: 'Link path')),
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

// ---------------- Join Requests ----------------

class _JoinRequestsTab extends ConsumerStatefulWidget {
  const _JoinRequestsTab();
  @override
  ConsumerState<_JoinRequestsTab> createState() => _JoinRequestsTabState();
}

class _JoinRequestsTabState extends ConsumerState<_JoinRequestsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('ministryjoinrequest').select().order('request_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _decide(Map<String, dynamic> req, bool approve) async {
    final profile = ref.read(currentProfileProvider).value;
    final notesController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(approve ? 'Approve request?' : 'Reject request?'),
        content: TextField(controller: notesController, decoration: const InputDecoration(labelText: 'Admin notes (optional)'), maxLines: 2),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(approve ? 'Approve' : 'Reject')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await SupabaseService.client.from('ministryjoinrequest').update({
        'status': approve ? 'approved' : 'rejected',
        'processed_date': DateTime.now().toIso8601String(),
        'admin_notes': notesController.text.trim().isEmpty ? null : notesController.text.trim(),
        'processed_by_admin_id': profile?.id,
        'processed_by_admin_name': profile?.fullName,
      }).eq('id', req['id']);

      if (approve) {
        // Mirror the real app: approving a join request also adds them to the roster.
        await SupabaseService.client.functions.invoke('ministry-member-transaction', body: {
          'op': 'create',
          'userId': req['user_id'],
          'userName': req['user_name'],
          'userEmail': req['user_email'],
          'ministryId': req['ministry_id'],
          'ministryName': req['ministry_name'],
          'membershipType': 'member',
        });
      }
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(approve ? 'Request approved.' : 'Request rejected.')));
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = _rows.where((r) => r['status'] == 'pending').toList();
    final processed = _rows.where((r) => r['status'] != 'pending').toList();
    return _loading
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                Text('Pending (${pending.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                if (pending.isEmpty) const Padding(padding: EdgeInsets.all(12), child: Text('No pending requests.')),
                for (final r in pending)
                  Card(
                    margin: const EdgeInsets.symmetric(vertical: 6),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${r['user_name']} → ${r['ministry_name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text(r['user_email'] ?? ''),
                          if ((r['message'] ?? '').toString().isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text('"${r['message']}"', style: const TextStyle(fontStyle: FontStyle.italic)),
                          ],
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              TextButton(onPressed: () => _decide(r, false), child: const Text('Reject')),
                              const SizedBox(width: 8),
                              FilledButton(onPressed: () => _decide(r, true), child: const Text('Approve')),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                Text('History (${processed.length})', style: const TextStyle(fontWeight: FontWeight.bold)),
                for (final r in processed)
                  ListTile(
                    dense: true,
                    title: Text('${r['user_name']} → ${r['ministry_name']}'),
                    subtitle: Text('${r['status']} · ${r['processed_date'] != null ? DateFormat.yMMMd().format(DateTime.parse(r['processed_date'])) : ''}'),
                  ),
              ],
            ),
          );
  }
}
