import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _meetingTypes = [
  'General_Leaders_Meeting', 'Elders_Meeting', 'Deacons_Meeting', 'General_Choir_Meeting',
  'Worship_Team_Practice', 'Programme_Arrange_Meeting', 'Event_Planning_Meeting',
  'Helping_Ministry_Meeting', 'Benevolence_Committee', 'Outreach_Planning_Meeting',
  'Missions_Update_Meeting', 'Sunday_School_Teachers_Meeting', 'Youth_Leaders_Meeting',
  "Men_s_Fellowship_Planning", "Women_s_Fellowship_Planning", 'Prayer_Meeting',
  'Bible_Study_Group', 'Financial_Committee_Meeting', 'Administrative_Meeting', 'Special_General_Meeting',
];
const _meetingStatuses = [
  'Pending_Discussion', 'Agenda_Set', 'In_Progress', 'Completed',
  'Decisions_Approved', 'Follow_up_Required', 'Postponed', 'Cancelled',
];
const _decisionStatuses = [
  'Proposed', 'Approved', 'Implemented', 'Rejected', 'Follow_up_Required', 'Postponed', 'Cancelled',
];

class AdminMeetingsScreen extends StatefulWidget {
  const AdminMeetingsScreen({super.key});
  @override
  State<AdminMeetingsScreen> createState() => _AdminMeetingsScreenState();
}

class _AdminMeetingsScreenState extends State<AdminMeetingsScreen> with SingleTickerProviderStateMixin {
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
        title: const Text('Meetings & Decisions'),
        bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'Meetings'), Tab(text: 'Decisions')]),
      ),
      body: TabBarView(controller: _tabController, children: const [_MeetingsTab(), _DecisionsTab()]),
    );
  }
}

// ---------------- Meetings ----------------

class _MeetingsTab extends ConsumerStatefulWidget {
  const _MeetingsTab();
  @override
  ConsumerState<_MeetingsTab> createState() => _MeetingsTabState();
}

class _MeetingsTabState extends ConsumerState<_MeetingsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('meetinglog').select().order('meeting_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('meetinglog').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _MeetingFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
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
                  ? const Center(child: Text('No meeting logs yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        final dateStr = r['meeting_date'] != null ? DateFormat.yMMMd().format(DateTime.parse(r['meeting_date'])) : '';
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text(r['title'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                            subtitle: Text('${(r['meeting_type'] as String? ?? '').replaceAll('_', ' ')} · $dateStr · ${r['status'] ?? ''}'),
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

class _MeetingFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _MeetingFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_MeetingFormSheet> createState() => _MeetingFormSheetState();
}

class _MeetingFormSheetState extends State<_MeetingFormSheet> {
  late final TextEditingController _title, _attendees, _agenda, _minutes, _actionItems, _imageUrl;
  String? _meetingType;
  String? _status;
  DateTime _meetingDate = DateTime.now();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?['title'] ?? '');
    _attendees = TextEditingController(text: e?['attendees'] ?? '');
    _agenda = TextEditingController(text: e?['agenda'] ?? '');
    _minutes = TextEditingController(text: e?['minutes'] ?? '');
    _actionItems = TextEditingController(text: e?['action_items'] ?? '');
    _imageUrl = TextEditingController(text: e?['image_url'] ?? '');
    _meetingType = e?['meeting_type'];
    _status = e?['status'];
    _meetingDate = e?['meeting_date'] != null ? DateTime.tryParse(e!['meeting_date']) ?? DateTime.now() : DateTime.now();
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _attendees.text.trim().isEmpty || _agenda.text.trim().isEmpty || _minutes.text.trim().isEmpty) {
      setState(() => _error = 'Title, attendees, agenda, and minutes are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'title': _title.text.trim(),
      'meeting_type': _meetingType,
      'attendees': _attendees.text.trim(),
      'agenda': _agenda.text.trim(),
      'minutes': _minutes.text.trim(),
      'action_items': _actionItems.text.trim().isEmpty ? null : _actionItems.text.trim(),
      'status': _status,
      'image_url': _imageUrl.text.trim().isEmpty ? null : _imageUrl.text.trim(),
      'meeting_date': _meetingDate.toIso8601String(),
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        await SupabaseService.client.from('meetinglog').insert(body);
      } else {
        await SupabaseService.client.from('meetinglog').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Meeting' : 'Edit Meeting', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _meetingType,
              decoration: const InputDecoration(labelText: 'Meeting Type'),
              items: _meetingTypes.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _meetingType = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_meetingDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _meetingDate);
                if (picked != null) setState(() => _meetingDate = picked);
              },
            ),
            TextField(controller: _attendees, decoration: const InputDecoration(labelText: 'Attendees'), maxLines: 2),
            const SizedBox(height: 8),
            TextField(controller: _agenda, decoration: const InputDecoration(labelText: 'Agenda'), maxLines: 3),
            const SizedBox(height: 8),
            TextField(controller: _minutes, decoration: const InputDecoration(labelText: 'Minutes'), maxLines: 4),
            const SizedBox(height: 8),
            TextField(controller: _actionItems, decoration: const InputDecoration(labelText: 'Action Items'), maxLines: 2),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _meetingStatuses.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _status = v),
            ),
            const SizedBox(height: 8),
            TextField(controller: _imageUrl, decoration: const InputDecoration(labelText: 'Image URL')),
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

// ---------------- Decisions ----------------

class _DecisionsTab extends ConsumerStatefulWidget {
  const _DecisionsTab();
  @override
  ConsumerState<_DecisionsTab> createState() => _DecisionsTabState();
}

class _DecisionsTabState extends ConsumerState<_DecisionsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('decisionlog').select().order('decision_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('decisionlog').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _DecisionFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
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
                  ? const Center(child: Text('No decisions logged yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        final dateStr = r['decision_date'] != null ? DateFormat.yMMMd().format(DateTime.parse(r['decision_date'])) : '';
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text(r['title'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                            subtitle: Text('$dateStr · ${(r['status'] as String? ?? '').replaceAll('_', ' ')} · by ${r['made_by'] ?? ''}'),
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

class _DecisionFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _DecisionFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_DecisionFormSheet> createState() => _DecisionFormSheetState();
}

class _DecisionFormSheetState extends State<_DecisionFormSheet> {
  late final TextEditingController _title, _description, _madeBy, _followUpActions;
  String? _status;
  DateTime _decisionDate = DateTime.now();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?['title'] ?? '');
    _description = TextEditingController(text: e?['description'] ?? '');
    _madeBy = TextEditingController(text: e?['made_by'] ?? '');
    _followUpActions = TextEditingController(text: e?['follow_up_actions'] ?? '');
    _status = e?['status'];
    _decisionDate = e?['decision_date'] != null ? DateTime.tryParse(e!['decision_date']) ?? DateTime.now() : DateTime.now();
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _description.text.trim().isEmpty || _madeBy.text.trim().isEmpty) {
      setState(() => _error = 'Title, description, and made-by are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'title': _title.text.trim(),
      'description': _description.text.trim(),
      'made_by': _madeBy.text.trim(),
      'status': _status,
      'follow_up_actions': _followUpActions.text.trim().isEmpty ? null : _followUpActions.text.trim(),
      'decision_date': _decisionDate.toIso8601String(),
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        await SupabaseService.client.from('decisionlog').insert(body);
      } else {
        await SupabaseService.client.from('decisionlog').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Decision' : 'Edit Decision', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
            const SizedBox(height: 8),
            TextField(controller: _madeBy, decoration: const InputDecoration(labelText: 'Made By')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _decisionStatuses.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _status = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_decisionDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _decisionDate);
                if (picked != null) setState(() => _decisionDate = picked);
              },
            ),
            TextField(controller: _followUpActions, decoration: const InputDecoration(labelText: 'Follow-up Actions'), maxLines: 2),
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
