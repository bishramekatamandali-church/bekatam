import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';
import '../../widgets/image_upload_field.dart';

const _adTypes = ['image_banner', 'video_banner'];

class AdminAdvertisementsScreen extends ConsumerStatefulWidget {
  const AdminAdvertisementsScreen({super.key});
  @override
  ConsumerState<AdminAdvertisementsScreen> createState() => _AdminAdvertisementsScreenState();
}

class _AdminAdvertisementsScreenState extends ConsumerState<AdminAdvertisementsScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;
  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('advertisement').select().order('display_order');
    setState(() { _rows = List<Map<String, dynamic>>.from(rows as List); _loading = false; });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('advertisement').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    await showModalBottomSheet(context: context, isScrollControlled: true, builder: (ctx) => _AdFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(), endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Add')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _rows.isEmpty ? const Center(child: Text('No advertisements yet.')) : RefreshIndicator(
        onRefresh: _load,
        child: ListView.builder(itemCount: _rows.length, itemBuilder: (context, i) {
          final r = _rows[i];
          return Card(margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), child: ListTile(
            leading: Icon(r['ad_type'] == 'video_banner' ? Icons.videocam : Icons.image),
            title: Text(r['name'] ?? ''),
            subtitle: Text('${r['is_active'] == true ? 'Active' : 'Inactive'} · order ${r['display_order'] ?? 0}'),
            onTap: () => _openForm(existing: r),
            trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
          ));
        }),
      ),
    );
  }
}

class _AdFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _AdFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_AdFormSheet> createState() => _AdFormSheetState();
}

class _AdFormSheetState extends State<_AdFormSheet> {
  late final TextEditingController _name, _imageUrl, _videoUrl, _linkUrl, _altText, _displayOrder, _adSizeKey, _placementsJson;
  DateTime? _startDate;
  DateTime? _endDate;
  String _adType = 'image_banner';
  bool _isActive = true;
  bool _saving = false;
  bool _generatingCopy = false;
  String? _error;

  String _jsonText(dynamic value) => value == null ? '[]' : const JsonEncoder.withIndent('  ').convert(value);

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?['name'] ?? '');
    _imageUrl = TextEditingController(text: e?['image_url'] ?? '');
    _videoUrl = TextEditingController(text: e?['video_url'] ?? '');
    _linkUrl = TextEditingController(text: e?['link_url'] ?? '');
    _altText = TextEditingController(text: e?['alt_text'] ?? '');
    _displayOrder = TextEditingController(text: e?['display_order']?.toString() ?? '0');
    _adSizeKey = TextEditingController(text: e?['ad_size_key'] ?? '');
    _placementsJson = TextEditingController(text: _jsonText(e?['placements']));
    _adType = e?['ad_type'] ?? 'image_banner';
    _isActive = e?['is_active'] ?? true;
    _startDate = e?['start_date'] != null ? DateTime.tryParse(e!['start_date']) : null;
    _endDate = e?['end_date'] != null ? DateTime.tryParse(e!['end_date']) : null;
  }

  @override
  void dispose() {
    for (final c in [_name, _imageUrl, _videoUrl, _linkUrl, _altText, _displayOrder, _adSizeKey, _placementsJson]) { c.dispose(); }
    super.dispose();
  }

  Future<void> _pickDate({required bool start}) async {
    final initial = (start ? _startDate : _endDate) ?? DateTime.now();
    final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: initial);
    if (picked != null) setState(() { if (start) { _startDate = picked; } else { _endDate = picked; } });
  }

  Future<void> _generateWithAI() async {
    if (_linkUrl.text.trim().isEmpty) { setState(() => _error = 'Enter a link URL first so the AI can analyze the page.'); return; }
    setState(() { _generatingCopy = true; _error = null; });
    try {
      final res = await SupabaseService.client.functions.invoke('generate-ad-copy', body: {'linkUrl': _linkUrl.text.trim()});
      final data = res.data as Map;
      setState(() { _name.text = data['name'] ?? _name.text; _altText.text = data['altText'] ?? _altText.text; _generatingCopy = false; });
    } catch (e) {
      setState(() { _error = 'AI generation failed: $e (make sure GEMINI_API_KEY is configured on the project)'; _generatingCopy = false; });
    }
  }

  dynamic _parsePlacements() {
    final decoded = jsonDecode(_placementsJson.text);
    if (decoded is! List && decoded is! Map) throw const FormatException('Placements must be a JSON array or object.');
    return decoded;
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) { setState(() => _error = 'Name is required.'); return; }
    setState(() { _saving = true; _error = null; });
    try {
      final body = <String, dynamic>{
        'name': _name.text.trim(), 'ad_type': _adType,
        'image_url': _imageUrl.text.trim().isEmpty ? null : _imageUrl.text.trim(),
        'video_url': _videoUrl.text.trim().isEmpty ? null : _videoUrl.text.trim(),
        'link_url': _linkUrl.text.trim().isEmpty ? null : _linkUrl.text.trim(),
        'alt_text': _altText.text.trim().isEmpty ? null : _altText.text.trim(),
        'placements': _parsePlacements(),
        'start_date': _startDate?.toIso8601String(), 'end_date': _endDate?.toIso8601String(),
        'display_order': int.tryParse(_displayOrder.text.trim()) ?? 0,
        'ad_size_key': _adSizeKey.text.trim().isEmpty ? null : _adSizeKey.text.trim(), 'is_active': _isActive,
      };
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId; body['posted_by_admin_name'] = widget.adminName;
        await SupabaseService.client.from('advertisement').insert(body);
      } else {
        await SupabaseService.client.from('advertisement').update(body).eq('id', widget.existing!['id']);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() { _error = 'Could not save: $e'; _saving = false; });
    }
  }

  Widget _dateTile(String label, DateTime? value, VoidCallback onTap, VoidCallback onClear) => ListTile(
    contentPadding: EdgeInsets.zero,
    title: Text(value == null ? label : '$label: ${value.toLocal().toString().split(' ').first}'),
    trailing: Row(mainAxisSize: MainAxisSize.min, children: [if (value != null) IconButton(onPressed: onClear, icon: const Icon(Icons.clear)), const Icon(Icons.edit_calendar)]),
    onTap: onTap,
  );

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(widget.existing == null ? 'Add Advertisement' : 'Edit Advertisement', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(value: _adType, decoration: const InputDecoration(labelText: 'Ad Type'), items: _adTypes.map((t) => DropdownMenuItem(value: t, child: Text(t.replaceAll('_', ' ')))).toList(), onChanged: (v) => setState(() => _adType = v ?? 'image_banner')),
        const SizedBox(height: 8),
        TextField(controller: _linkUrl, decoration: const InputDecoration(labelText: 'Link URL (destination when tapped)')),
        const SizedBox(height: 8),
        Align(alignment: Alignment.centerLeft, child: OutlinedButton.icon(onPressed: _generatingCopy ? null : _generateWithAI, icon: _generatingCopy ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.auto_awesome, size: 18), label: const Text('Generate name + alt text with AI')),
        const SizedBox(height: 8),
        TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name')),
        const SizedBox(height: 8), TextField(controller: _altText, decoration: const InputDecoration(labelText: 'Alt Text')),
        const SizedBox(height: 8),
        ...(_adType == 'image_banner' ? <Widget>[ImageUploadField(controller: _imageUrl, bucket: 'content-media', label: 'Image')] : const <Widget>[]),
        ...(_adType == 'video_banner' ? <Widget>[TextField(controller: _videoUrl, decoration: const InputDecoration(labelText: 'Video URL'))] : const <Widget>[]),
        const SizedBox(height: 8), TextField(controller: _adSizeKey, decoration: const InputDecoration(labelText: 'Ad Size Key (e.g. 300x250)')),
        _dateTile('Start date', _startDate, () => _pickDate(start: true), () => setState(() => _startDate = null)),
        _dateTile('End date', _endDate, () => _pickDate(start: false), () => setState(() => _endDate = null)),
        TextField(controller: _placementsJson, decoration: const InputDecoration(labelText: 'Placements JSON', helperText: 'Array/object; preserves existing placement configuration'), maxLines: 5),
        const SizedBox(height: 8), TextField(controller: _displayOrder, decoration: const InputDecoration(labelText: 'Display Order'), keyboardType: TextInputType.number),
        SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Active'), value: _isActive, onChanged: (v) => setState(() => _isActive = v)),
        if (_error != null) ...[const SizedBox(height: 8), Text(_error!, style: const TextStyle(color: Colors.red))],
        const SizedBox(height: 16), FilledButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save')),
      ])),
    );
  }
}
