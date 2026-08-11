import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../services/admin_log_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _prayerStatuses = ['active', 'prayed_for', 'answered', 'archived'];

/// Moderation for user-submitted prayer requests and testimonials.
/// Note: `public_visibility` in the live schema only has one value
/// ('public') — there's no separate 'anonymous' option to toggle, so
/// moderation here works through `is_deleted` (hide/restore) and
/// `moderation_reason`/`admin_notes`, not a visibility switch.
class AdminModerationScreen extends StatefulWidget {
  const AdminModerationScreen({super.key});
  @override
  State<AdminModerationScreen> createState() => _AdminModerationScreenState();
}

class _AdminModerationScreenState extends State<AdminModerationScreen> with SingleTickerProviderStateMixin {
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
        title: const Text('Content Moderation'),
        bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'Prayer Requests'), Tab(text: 'Testimonials')]),
      ),
      body: TabBarView(controller: _tabController, children: const [_PrayerModerationTab(), _TestimonialModerationTab()]),
    );
  }
}

class _PrayerModerationTab extends ConsumerStatefulWidget {
  const _PrayerModerationTab();
  @override
  ConsumerState<_PrayerModerationTab> createState() => _PrayerModerationTabState();
}

class _PrayerModerationTabState extends ConsumerState<_PrayerModerationTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('prayerrequest').select().order('submitted_at', ascending: false).limit(100);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _toggleHide(Map<String, dynamic> r) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    final hiding = r['is_deleted'] != true;
    String? reason;
    if (hiding) {
      final controller = TextEditingController();
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Hide this prayer request?'),
          content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Reason')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Hide')),
          ],
        ),
      );
      if (confirmed != true) return;
      reason = controller.text.trim().isEmpty ? null : controller.text.trim();
    }
    await SupabaseService.client.from('prayerrequest').update({
      'is_deleted': hiding,
      'moderation_reason': hiding ? reason : null,
      'moderated_at': DateTime.now().toIso8601String(),
      'moderated_by_admin_id': profile?.id,
      'moderated_by_admin_name': profile?.fullName,
    }).eq('id', r['id']);
    await AdminLogService.log(
      action: hiding ? 'Hid Prayer Request' : 'Restored Prayer Request',
      targetId: r['id'] as String?,
      details: reason,
    );
    _load();
  }

  Future<void> _setStatus(Map<String, dynamic> r, String status) async {
    await SupabaseService.client.from('prayerrequest').update({'status': status}).eq('id', r['id']);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_rows.isEmpty) return const Center(child: Text('No prayer requests yet.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        itemCount: _rows.length,
        itemBuilder: (context, i) {
          final r = _rows[i];
          final hidden = r['is_deleted'] == true;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: hidden ? Colors.grey[200] : null,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(r['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600))),
                      if (hidden) const Chip(label: Text('Hidden'), visualDensity: VisualDensity.compact),
                    ],
                  ),
                  Text('${r['user_name'] ?? 'Anonymous'} · ${(r['category'] as String? ?? '')}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 6),
                  Text(r['request_text'] ?? '', maxLines: 3, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      DropdownButton<String>(
                        value: r['status'],
                        items: _prayerStatuses.map((s) => DropdownMenuItem(value: s, child: Text(s.replaceAll('_', ' ')))).toList(),
                        onChanged: (v) => v == null ? null : _setStatus(r, v),
                      ),
                      OutlinedButton(
                        onPressed: () => _toggleHide(r),
                        child: Text(hidden ? 'Restore' : 'Hide'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _TestimonialModerationTab extends ConsumerStatefulWidget {
  const _TestimonialModerationTab();
  @override
  ConsumerState<_TestimonialModerationTab> createState() => _TestimonialModerationTabState();
}

class _TestimonialModerationTabState extends ConsumerState<_TestimonialModerationTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('testimonial').select().order('submitted_at', ascending: false).limit(100);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _toggleHide(Map<String, dynamic> r) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    final hiding = r['is_deleted'] != true;
    String? reason;
    if (hiding) {
      final controller = TextEditingController();
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Hide this testimonial?'),
          content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Reason')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Hide')),
          ],
        ),
      );
      if (confirmed != true) return;
      reason = controller.text.trim().isEmpty ? null : controller.text.trim();
    }
    await SupabaseService.client.from('testimonial').update({
      'is_deleted': hiding,
      'moderation_reason': hiding ? reason : null,
      'moderated_at': DateTime.now().toIso8601String(),
      'moderated_by_admin_id': profile?.id,
      'moderated_by_admin_name': profile?.fullName,
    }).eq('id', r['id']);
    await AdminLogService.log(
      action: hiding ? 'Hid Testimonial' : 'Restored Testimonial',
      targetId: r['id'] as String?,
      details: reason,
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_rows.isEmpty) return const Center(child: Text('No testimonials yet.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        itemCount: _rows.length,
        itemBuilder: (context, i) {
          final r = _rows[i];
          final hidden = r['is_deleted'] == true;
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: hidden ? Colors.grey[200] : null,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(r['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600))),
                      if (hidden) const Chip(label: Text('Hidden'), visualDensity: VisualDensity.compact),
                    ],
                  ),
                  Text('${r['user_name'] ?? 'Anonymous'} · ${r['submitted_at'] != null ? DateFormat.yMMMd().format(DateTime.parse(r['submitted_at'])) : ''}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 6),
                  Text(r['content_text'] ?? '', maxLines: 3, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: OutlinedButton(onPressed: () => _toggleHide(r), child: Text(hidden ? 'Restore' : 'Hide')),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
