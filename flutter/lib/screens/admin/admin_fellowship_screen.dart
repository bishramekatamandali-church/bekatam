import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _rosterTypes = [
  'Saturday_Main_Fellowship', 'Saturday_Children_Fellowship', 'Saturday_Youth_Fellowship',
  'Wednesday_Home_Fellowship', 'House_Fellowship', 'Womens_Fellowship', 'Bible_Study',
  'Friday_Evening_Program', 'Special_Meeting', 'Outreach_Program', 'Other_Regular_Program',
  'Custom_Schedule', 'Prayer_Team_Visit', 'Night_Prayer', 'Saturday_Prayer',
];

/// Ports fellowshipRosters.ts + fellowshipSchedules.ts: `fellowshiprosteritem`
/// holds reusable roster templates (`is_template=true`) or one-off items;
/// `generatedscheduleitem` holds actual dated schedule entries derived from
/// them. The real app's generation is manual admin entry, not an automated
/// recurrence engine (confirmed during the Phase 5 audit — the
/// generate-fellowship-schedule function built early in this migration is
/// unused/superseded), so both tabs here are plain CRUD.
class AdminFellowshipScreen extends StatefulWidget {
  const AdminFellowshipScreen({super.key});
  @override
  State<AdminFellowshipScreen> createState() => _AdminFellowshipScreenState();
}

class _AdminFellowshipScreenState extends State<AdminFellowshipScreen> with SingleTickerProviderStateMixin {
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
        title: const Text('Fellowship Rosters & Schedules'),
        bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'Rosters'), Tab(text: 'Schedule')]),
      ),
      body: TabBarView(controller: _tabController, children: const [_RostersTab(), _ScheduleTab()]),
    );
  }
}

// ---------------- Rosters ----------------

class _RostersTab extends ConsumerStatefulWidget {
  const _RostersTab();
  @override
  ConsumerState<_RostersTab> createState() => _RostersTabState();
}

class _RostersTabState extends ConsumerState<_RostersTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('fellowshiprosteritem').select().order('assigned_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('fellowshiprosteritem').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).value;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _RosterFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
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
                  ? const Center(child: Text('No roster items yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text(r['group_name_or_event_title'] ?? ''),
                            subtitle: Text('${(r['roster_type'] as String? ?? '').replaceAll('_', ' ')}${r['is_template'] == true ? ' · Template' : ''}'),
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

class _RosterFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _RosterFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_RosterFormSheet> createState() => _RosterFormSheetState();
}

class _RosterFormSheetState extends State<_RosterFormSheet> {
  late final TextEditingController _groupName, _timeSlot, _location, _contactNumber, _notes;
  String? _rosterType;
  DateTime _assignedDate = DateTime.now();
  bool _isTemplate = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _groupName = TextEditingController(text: e?['group_name_or_event_title'] ?? '');
    _timeSlot = TextEditingController(text: e?['time_slot'] ?? '');
    _location = TextEditingController(text: e?['location'] ?? '');
    _contactNumber = TextEditingController(text: e?['contact_number'] ?? '');
    _notes = TextEditingController(text: e?['additional_notes_or_program_details'] ?? '');
    _rosterType = e?['roster_type'];
    _assignedDate = e?['assigned_date'] != null ? DateTime.tryParse(e!['assigned_date']) ?? DateTime.now() : DateTime.now();
    _isTemplate = e?['is_template'] ?? false;
  }

  Future<void> _save() async {
    if (_groupName.text.trim().isEmpty || _rosterType == null) {
      setState(() => _error = 'Group/event name and roster type are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'group_name_or_event_title': _groupName.text.trim(),
      'roster_type': _rosterType,
      'assigned_date': _assignedDate.toIso8601String(),
      'time_slot': _timeSlot.text.trim().isEmpty ? null : _timeSlot.text.trim(),
      'location': _location.text.trim().isEmpty ? null : _location.text.trim(),
      'contact_number': _contactNumber.text.trim().isEmpty ? null : _contactNumber.text.trim(),
      'additional_notes_or_program_details': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      'is_template': _isTemplate,
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        await SupabaseService.client.from('fellowshiprosteritem').insert(body);
      } else {
        await SupabaseService.client.from('fellowshiprosteritem').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Roster Item' : 'Edit Roster Item', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _groupName, decoration: const InputDecoration(labelText: 'Group / Event Title')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _rosterType,
              decoration: const InputDecoration(labelText: 'Roster Type'),
              items: _rosterTypes.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _rosterType = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_assignedDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _assignedDate);
                if (picked != null) setState(() => _assignedDate = picked);
              },
            ),
            TextField(controller: _timeSlot, decoration: const InputDecoration(labelText: 'Time Slot')),
            const SizedBox(height: 8),
            TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 8),
            TextField(controller: _contactNumber, decoration: const InputDecoration(labelText: 'Contact Number')),
            const SizedBox(height: 8),
            TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes / Program Details'), maxLines: 2),
            const SizedBox(height: 8),
            SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Reusable template'), value: _isTemplate, onChanged: (v) => setState(() => _isTemplate = v)),
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

// ---------------- Generated Schedule ----------------

class _ScheduleTab extends ConsumerStatefulWidget {
  const _ScheduleTab();
  @override
  ConsumerState<_ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends ConsumerState<_ScheduleTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('generatedscheduleitem').select().order('scheduled_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('generatedscheduleitem').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).value;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _ScheduleFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
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
                  ? const Center(child: Text('No scheduled items yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        final dateStr = r['scheduled_date'] != null ? DateFormat.yMMMd().format(DateTime.parse(r['scheduled_date'])) : '';
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text(r['group_name_or_event_title'] ?? ''),
                            subtitle: Text('$dateStr · ${(r['roster_type'] as String? ?? '').replaceAll('_', ' ')}'),
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

class _ScheduleFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _ScheduleFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_ScheduleFormSheet> createState() => _ScheduleFormSheetState();
}

class _ScheduleFormSheetState extends State<_ScheduleFormSheet> {
  late final TextEditingController _groupName, _timeSlot, _location, _contactNumber, _notes;
  String? _rosterType;
  DateTime _scheduledDate = DateTime.now();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _groupName = TextEditingController(text: e?['group_name_or_event_title'] ?? '');
    _timeSlot = TextEditingController(text: e?['time_slot'] ?? '');
    _location = TextEditingController(text: e?['location'] ?? '');
    _contactNumber = TextEditingController(text: e?['contact_number'] ?? '');
    _notes = TextEditingController(text: e?['additional_notes_or_program_details'] ?? '');
    _rosterType = e?['roster_type'];
    _scheduledDate = e?['scheduled_date'] != null ? DateTime.tryParse(e!['scheduled_date']) ?? DateTime.now() : DateTime.now();
  }

  Future<void> _save() async {
    if (_groupName.text.trim().isEmpty || _rosterType == null) {
      setState(() => _error = 'Group/event name and roster type are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'group_name_or_event_title': _groupName.text.trim(),
      'roster_type': _rosterType,
      'scheduled_date': _scheduledDate.toIso8601String(),
      'time_slot': _timeSlot.text.trim().isEmpty ? null : _timeSlot.text.trim(),
      'location': _location.text.trim().isEmpty ? null : _location.text.trim(),
      'contact_number': _contactNumber.text.trim().isEmpty ? null : _contactNumber.text.trim(),
      'additional_notes_or_program_details': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        body['generated_at'] = DateTime.now().toIso8601String();
        await SupabaseService.client.from('generatedscheduleitem').insert(body);
      } else {
        await SupabaseService.client.from('generatedscheduleitem').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Schedule Item' : 'Edit Schedule Item', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _groupName, decoration: const InputDecoration(labelText: 'Group / Event Title')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _rosterType,
              decoration: const InputDecoration(labelText: 'Roster Type'),
              items: _rosterTypes.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _rosterType = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_scheduledDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _scheduledDate);
                if (picked != null) setState(() => _scheduledDate = picked);
              },
            ),
            TextField(controller: _timeSlot, decoration: const InputDecoration(labelText: 'Time Slot')),
            const SizedBox(height: 8),
            TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 8),
            TextField(controller: _contactNumber, decoration: const InputDecoration(labelText: 'Contact Number')),
            const SizedBox(height: 8),
            TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes / Program Details'), maxLines: 2),
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
