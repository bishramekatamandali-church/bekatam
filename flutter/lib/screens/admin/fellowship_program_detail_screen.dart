import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';

/// Ports FellowshipProgramDetailPage.tsx: a read-only detail view for a
/// `fellowshiprosteritem` (isRoster=true) or `generatedscheduleitem` row,
/// including its linked `responsibility` rows. Reached from the admin
/// Fellowship Rosters & Schedules screen.
class FellowshipProgramDetailScreen extends StatefulWidget {
  final Map<String, dynamic> item;
  final bool isRoster;
  const FellowshipProgramDetailScreen({super.key, required this.item, required this.isRoster});

  @override
  State<FellowshipProgramDetailScreen> createState() => _FellowshipProgramDetailScreenState();
}

class _FellowshipProgramDetailScreenState extends State<FellowshipProgramDetailScreen> {
  List<Map<String, dynamic>> _responsibilities = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadResponsibilities();
  }

  Future<void> _loadResponsibilities() async {
    final column = widget.isRoster ? 'roster_item_id' : 'generated_schedule_id';
    final rows = await SupabaseService.client.from('responsibility').select().eq(column, widget.item['id']);
    setState(() {
      _responsibilities = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Widget _row(String label, String? value, {IconData? icon}) {
    if (value == null || value.trim().isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (icon != null) Padding(padding: const EdgeInsets.only(right: 8, top: 2), child: Icon(icon, size: 18, color: Colors.grey)),
          SizedBox(width: 110, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final dateField = widget.isRoster ? item['assigned_date'] : item['scheduled_date'];
    final dateStr = dateField != null ? DateFormat.yMMMd().add_jm().format(DateTime.parse(dateField)) : null;

    return Scaffold(
      appBar: AppBar(title: Text(item['group_name_or_event_title'] as String? ?? 'Program Details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(item['group_name_or_event_title'] as String? ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          Text((item['roster_type'] as String? ?? '').replaceAll('_', ' '), style: const TextStyle(color: Colors.purple, fontWeight: FontWeight.w600)),
          Text('ID: ${item['id']}', style: const TextStyle(color: Colors.grey, fontSize: 11)),
          const Divider(height: 28),
          _row('Scheduled', dateStr, icon: Icons.calendar_today),
          _row('Time Slot', item['time_slot'] as String?, icon: Icons.access_time),
          _row('Location', item['location'] as String?, icon: Icons.location_on_outlined),
          _row('Contact', item['contact_number'] as String?, icon: Icons.phone_outlined),
          const Divider(height: 28),
          Row(
            children: [
              const Icon(Icons.groups_outlined, size: 18, color: Colors.grey),
              const SizedBox(width: 8),
              const Text('Responsibilities', style: TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          if (_loading)
            const Padding(padding: EdgeInsets.all(12), child: Center(child: CircularProgressIndicator()))
          else if (_responsibilities.isEmpty)
            const Padding(padding: EdgeInsets.only(left: 26), child: Text('No specific responsibilities listed.', style: TextStyle(color: Colors.grey)))
          else
            Padding(
              padding: const EdgeInsets.only(left: 26),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _responsibilities
                    .map((r) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Text.rich(TextSpan(children: [
                            TextSpan(text: '${r['role']}: ', style: const TextStyle(fontWeight: FontWeight.w600)),
                            TextSpan(text: '${r['assigned_to']}'),
                          ])),
                        ))
                    .toList(),
              ),
            ),
          if (widget.isRoster) ...[
            const Divider(height: 28),
            _row('Reusable Template', item['is_template'] == true ? 'Yes' : 'No', icon: Icons.label_outline),
          ],
          if (!widget.isRoster) ...[
            const Divider(height: 28),
            _row('Status', item['is_published_as_event'] == true ? 'Published as Event' : 'Draft', icon: Icons.info_outline),
            _row('Admin Notes', item['admin_notes'] as String?, icon: Icons.edit_outlined),
          ],
          if ((item['additional_notes_or_program_details'] as String?)?.trim().isNotEmpty ?? false) ...[
            const Divider(height: 28),
            const Row(children: [Icon(Icons.description_outlined, size: 18, color: Colors.grey), SizedBox(width: 8), Text('Additional Details', style: TextStyle(fontWeight: FontWeight.w600))]),
            const SizedBox(height: 6),
            Padding(padding: const EdgeInsets.only(left: 26), child: Text(item['additional_notes_or_program_details'] as String)),
          ],
          const Divider(height: 28),
          _row('Posted By', item['posted_by_admin_name'] as String?, icon: Icons.person_outline),
        ],
      ),
    );
  }
}
