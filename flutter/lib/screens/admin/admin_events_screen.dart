import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _eventCategories = [
  'Community_Outreach', 'Conference', 'Workshop', 'Holiday_Service',
  'Youth_Event', 'Worship_Night', 'Fellowship', 'Special_Meeting',
];
const _eventTypes = ['REGULAR', 'SPECIAL'];
const _scheduleTypes = [
  'ONE_TIME', 'SATURDAY_SERVICE', 'WEDNESDAY_SERVICE', 'MONTHLY_15TH',
  'FIRST_WEEKEND_LORDS_SUPPER', 'SECOND_WEEKEND_BIBLE_STUDY',
  'FOURTH_WEEKEND_LEADERS_MEETING', 'LAST_SUNDAY_PRAYER_TEAM_VISIT', 'OTHER',
];

/// Ports ManageEventsPage.tsx's core fields. Note: `locations`,
/// `conducted_by`, and `speakers` are jsonb array columns in the real
/// schema (multi-location / multi-speaker events) — this first pass edits
/// the single `location` text field only; the jsonb array editors are a
/// follow-up if multi-location/multi-speaker events are actually used.
class AdminEventsScreen extends ConsumerStatefulWidget {
  const AdminEventsScreen({super.key});

  @override
  ConsumerState<AdminEventsScreen> createState() => _AdminEventsScreenState();
}

class _AdminEventsScreenState extends ConsumerState<AdminEventsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('eventitem').select().order('date', ascending: false);
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
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirmed != true) return;
    await SupabaseService.client.from('eventitem').delete().eq('id', item['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).value;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _EventFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Events')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.add),
        label: const Text('Add'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? const Center(child: Text('No events yet. Add one to get started.'))
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
                          subtitle: Text('${item['category'] ?? ''} · $dateStr · ${item['location'] ?? ''}'),
                          onTap: () => _openForm(existing: item),
                          trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(item)),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}

class _EventFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _EventFormSheet({this.existing, this.adminId, this.adminName});

  @override
  State<_EventFormSheet> createState() => _EventFormSheetState();
}

class _EventFormSheetState extends State<_EventFormSheet> {
  late final TextEditingController _title, _description, _imageUrl, _linkPath, _location, _time,
      _expectations, _guests, _contactPerson, _contactEmail, _contactPhone, _registrationLink, _capacity, _feeAmount;
  String? _category;
  String _eventType = 'REGULAR';
  String? _scheduleType;
  DateTime? _date;
  bool _isFeeRequired = false;
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
    _location = TextEditingController(text: e?['location'] ?? '');
    _time = TextEditingController(text: e?['time'] ?? '');
    _expectations = TextEditingController(text: e?['expectations'] ?? '');
    _guests = TextEditingController(text: e?['guests'] ?? '');
    _contactPerson = TextEditingController(text: e?['contact_person'] ?? '');
    _contactEmail = TextEditingController(text: e?['contact_email'] ?? '');
    _contactPhone = TextEditingController(text: e?['contact_phone'] ?? '');
    _registrationLink = TextEditingController(text: e?['registration_link'] ?? '');
    _capacity = TextEditingController(text: e?['capacity']?.toString() ?? '');
    _feeAmount = TextEditingController(text: e?['fee_amount'] ?? '');
    _category = e?['category'];
    _eventType = e?['event_type'] ?? 'REGULAR';
    _scheduleType = e?['schedule_type'];
    _date = e?['date'] != null ? DateTime.tryParse(e!['date']) : null;
    _isFeeRequired = e?['is_fee_required'] ?? false;
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
      'event_type': _eventType,
      'schedule_type': _scheduleType,
      'date': _date?.toIso8601String(),
      'location': _location.text.trim().isEmpty ? null : _location.text.trim(),
      'time': _time.text.trim().isEmpty ? null : _time.text.trim(),
      'expectations': _expectations.text.trim().isEmpty ? null : _expectations.text.trim(),
      'guests': _guests.text.trim().isEmpty ? null : _guests.text.trim(),
      'contact_person': _contactPerson.text.trim().isEmpty ? null : _contactPerson.text.trim(),
      'contact_email': _contactEmail.text.trim().isEmpty ? null : _contactEmail.text.trim(),
      'contact_phone': _contactPhone.text.trim().isEmpty ? null : _contactPhone.text.trim(),
      'registration_link': _registrationLink.text.trim().isEmpty ? null : _registrationLink.text.trim(),
      'capacity': int.tryParse(_capacity.text.trim()),
      'is_fee_required': _isFeeRequired,
      'fee_amount': _isFeeRequired && _feeAmount.text.trim().isNotEmpty ? _feeAmount.text.trim() : null,
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        body['likes'] = 0;
        await SupabaseService.client.from('eventitem').insert(body);
      } else {
        await SupabaseService.client.from('eventitem').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Event' : 'Edit Event', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _eventCategories.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _category = v),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _eventType,
              decoration: const InputDecoration(labelText: 'Event Type'),
              items: _eventTypes.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _eventType = v ?? 'REGULAR'),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _scheduleType,
              decoration: const InputDecoration(labelText: 'Schedule Type'),
              items: _scheduleTypes.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _scheduleType = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(_date == null ? 'Pick a date' : DateFormat.yMMMd().format(_date!)),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _date ?? DateTime.now());
                if (picked != null) setState(() => _date = picked);
              },
            ),
            TextField(controller: _time, decoration: const InputDecoration(labelText: 'Time (e.g. 10:00 AM)')),
            const SizedBox(height: 8),
            TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 8),
            TextField(controller: _imageUrl, decoration: const InputDecoration(labelText: 'Image URL')),
            const SizedBox(height: 8),
            TextField(controller: _linkPath, decoration: const InputDecoration(labelText: 'Link path')),
            const SizedBox(height: 8),
            TextField(controller: _expectations, decoration: const InputDecoration(labelText: 'Expectations'), maxLines: 2),
            const SizedBox(height: 8),
            TextField(controller: _guests, decoration: const InputDecoration(labelText: 'Guests')),
            const SizedBox(height: 8),
            TextField(controller: _contactPerson, decoration: const InputDecoration(labelText: 'Contact Person')),
            const SizedBox(height: 8),
            TextField(controller: _contactEmail, decoration: const InputDecoration(labelText: 'Contact Email')),
            const SizedBox(height: 8),
            TextField(controller: _contactPhone, decoration: const InputDecoration(labelText: 'Contact Phone')),
            const SizedBox(height: 8),
            TextField(controller: _registrationLink, decoration: const InputDecoration(labelText: 'Registration Link')),
            const SizedBox(height: 8),
            TextField(controller: _capacity, decoration: const InputDecoration(labelText: 'Capacity'), keyboardType: TextInputType.number),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Fee required?'),
              value: _isFeeRequired,
              onChanged: (v) => setState(() => _isFeeRequired = v),
            ),
            if (_isFeeRequired) TextField(controller: _feeAmount, decoration: const InputDecoration(labelText: 'Fee amount')),
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
