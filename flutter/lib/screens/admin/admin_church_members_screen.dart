import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

class AdminChurchMembersScreen extends StatefulWidget {
  const AdminChurchMembersScreen({super.key});

  @override
  State<AdminChurchMembersScreen> createState() => _AdminChurchMembersScreenState();
}

class _AdminChurchMembersScreenState extends State<AdminChurchMembersScreen> {
  List<Map<String, dynamic>> _members = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('churchmember').select().order('full_name');
    setState(() {
      _members = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> m) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Remove "${m['full_name']}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(style: FilledButton.styleFrom(backgroundColor: Colors.red), onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove')),
        ],
      ),
    );
    if (confirmed != true) return;
    await SupabaseService.client.from('churchmember').delete().eq('id', m['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _MemberFormSheet(existing: existing),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.person_add),
        label: const Text('Add'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _members.isEmpty
              ? const Center(child: Text('No members yet.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _members.length,
                    itemBuilder: (context, i) {
                      final m = _members[i];
                      return ListTile(
                        leading: CircleAvatar(child: Text((m['full_name'] as String? ?? '?').isNotEmpty ? (m['full_name'] as String)[0] : '?')),
                        title: Text(m['full_name'] ?? ''),
                        subtitle: Text('${m['contact_phone'] ?? m['contact_email'] ?? ''} · ${m['member_status'] ?? ''}'),
                        trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(m)),
                        onTap: () => _openForm(existing: m),
                      );
                    },
                  ),
                ),
    );
  }
}

class _MemberFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  const _MemberFormSheet({this.existing});

  @override
  State<_MemberFormSheet> createState() => _MemberFormSheetState();
}

class _MemberFormSheetState extends State<_MemberFormSheet> {
  late final TextEditingController _fullName, _phone, _email, _address, _familyMembers, _notes, _memberStatus;
  DateTime? _memberSince;
  bool _isActive = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _fullName = TextEditingController(text: e?['full_name'] ?? '');
    _phone = TextEditingController(text: e?['contact_phone'] ?? '');
    _email = TextEditingController(text: e?['contact_email'] ?? '');
    _address = TextEditingController(text: e?['address'] ?? '');
    _familyMembers = TextEditingController(text: e?['family_members'] ?? '');
    _notes = TextEditingController(text: e?['notes'] ?? '');
    _memberStatus = TextEditingController(text: e?['member_status'] ?? 'Active');
    _memberSince = e?['member_since'] != null ? DateTime.tryParse(e!['member_since']) : DateTime.now();
    _isActive = e?['is_active_member'] ?? true;
  }

  Future<void> _save() async {
    if (_fullName.text.trim().isEmpty) {
      setState(() => _error = 'Full name is required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'full_name': _fullName.text.trim(),
      'contact_phone': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
      'contact_email': _email.text.trim().isEmpty ? null : _email.text.trim(),
      'address': _address.text.trim().isEmpty ? null : _address.text.trim(),
      'family_members': _familyMembers.text.trim().isEmpty ? null : _familyMembers.text.trim(),
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      'member_status': _memberStatus.text.trim().isEmpty ? 'Active' : _memberStatus.text.trim(),
      'member_since': (_memberSince ?? DateTime.now()).toIso8601String(),
      'is_active_member': _isActive,
      if (!_isActive) 'deactivated_date': DateTime.now().toIso8601String(),
    };
    try {
      if (widget.existing == null) {
        await SupabaseService.client.from('churchmember').insert(body);
      } else {
        await SupabaseService.client.from('churchmember').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Member' : 'Edit Member', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _fullName, decoration: const InputDecoration(labelText: 'Full Name')),
            const SizedBox(height: 8),
            TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 8),
            TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: 8),
            TextField(controller: _address, decoration: const InputDecoration(labelText: 'Address'), maxLines: 2),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Member since: ${_memberSince != null ? DateFormat.yMMMd().format(_memberSince!) : 'Pick a date'}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(1950), lastDate: DateTime(2100), initialDate: _memberSince ?? DateTime.now());
                if (picked != null) setState(() => _memberSince = picked);
              },
            ),
            TextField(controller: _familyMembers, decoration: const InputDecoration(labelText: 'Family Members')),
            const SizedBox(height: 8),
            TextField(controller: _memberStatus, decoration: const InputDecoration(labelText: 'Member Status')),
            const SizedBox(height: 8),
            TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 3),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Active member'),
              value: _isActive,
              onChanged: (v) => setState(() => _isActive = v),
            ),
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
