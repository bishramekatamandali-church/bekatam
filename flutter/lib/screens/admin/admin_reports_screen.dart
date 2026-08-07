import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/pdf_service.dart';

/// This is where the PDF download buttons live — matching the real app,
/// where all 9 report controllers (pdfController.ts / calendarPdfController.ts)
/// were only ever reachable from the admin dashboard, never from member-facing
/// screens. generate-pdf itself enforces admin-only server-side.
class AdminReportsScreen extends StatelessWidget {
  const AdminReportsScreen({super.key});

  // type -> (source table, id column, row label, order column)
  static final _recordReports = <_RecordReportConfig>[
    _RecordReportConfig('meeting', 'Meeting Log', 'meetinglog', (r) => r['title'] ?? 'Meeting', 'meeting_date'),
    _RecordReportConfig('decision', 'Decision Record', 'decisionlog', (r) => r['title'] ?? 'Decision', 'decision_date'),
    _RecordReportConfig('collection-record', 'Collection Record', 'collectionrecord', (r) => r['purpose'] ?? 'Collection', 'collection_date'),
    _RecordReportConfig('history-chapter', 'Church History Chapter', 'historychapter', (r) => r['title'] ?? 'Chapter', 'chapter_number'),
    _RecordReportConfig('church-member', 'Member Profile', 'churchmember', (r) => r['full_name'] ?? 'Member', 'full_name'),
    _RecordReportConfig('fellowship-schedule', 'Fellowship Schedule', 'generatedscheduleitem', (r) => r['group_name_or_event_title'] ?? 'Schedule', 'scheduled_date'),
    _RecordReportConfig('donation-receipt', 'Donation Receipt', 'donationrecord', (r) => r['donor_name'] ?? 'Donation', 'donation_date'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Summary Reports', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              leading: const Icon(Icons.pie_chart),
              title: const Text('Financial Summary'),
              subtitle: const Text('Income, expenses, net balance over a date range'),
              trailing: const Icon(Icons.download),
              onTap: () => _openFinancialDialog(context),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.calendar_month),
              title: const Text('BS Calendar'),
              subtitle: const Text('12-page Bikram Sambat calendar with fellowship notices'),
              trailing: const Icon(Icons.download),
              onTap: () => _openCalendarDialog(context),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.volunteer_activism),
              title: const Text('Donor List Report'),
              subtitle: const Text('Merged donor totals (JSON or XML)'),
              trailing: const Icon(Icons.list_alt),
              onTap: () => _openDonorListDialog(context),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Single-Record Reports', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 8),
          for (final cfg in _recordReports)
            Card(
              child: ListTile(
                leading: const Icon(Icons.description_outlined),
                title: Text(cfg.displayName),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _openRecordPicker(context, cfg),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openFinancialDialog(BuildContext context) async {
    DateTime? start;
    DateTime? end;
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Financial Summary'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(start == null ? 'Start date' : DateFormat.yMMMd().format(start!)),
                trailing: const Icon(Icons.edit_calendar),
                onTap: () async {
                  final picked = await showDatePicker(
                      context: ctx, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: DateTime.now());
                  if (picked != null) setState(() => start = picked);
                },
              ),
              ListTile(
                title: Text(end == null ? 'End date' : DateFormat.yMMMd().format(end!)),
                trailing: const Icon(Icons.edit_calendar),
                onTap: () async {
                  final picked = await showDatePicker(
                      context: ctx, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: DateTime.now());
                  if (picked != null) setState(() => end = picked);
                },
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await _generateAndShare(context, 'financial', {
                  if (start != null) 'start_date': start!.toIso8601String(),
                  if (end != null) 'end_date': end!.toIso8601String(),
                });
              },
              child: const Text('Generate'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openCalendarDialog(BuildContext context) async {
    final controller = TextEditingController(text: '${DateTime.now().year + 57}'); // rough AD->BS offset
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('BS Calendar'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Bikram Sambat year'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final year = int.tryParse(controller.text.trim());
              Navigator.pop(ctx);
              if (year == null) return;
              await _generateAndShare(context, 'calendar', {'bs_year': year});
            },
            child: const Text('Generate'),
          ),
        ],
      ),
    );
  }

  Future<void> _openDonorListDialog(BuildContext context) async {
    String format = 'json';
    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Donor List Report'),
          content: DropdownButton<String>(
            value: format,
            items: const [
              DropdownMenuItem(value: 'json', child: Text('JSON')),
              DropdownMenuItem(value: 'xml', child: Text('XML')),
            ],
            onChanged: (v) => setState(() => format = v ?? 'json'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  final data = await PdfService.fetchDonorListReport(format: format);
                  if (context.mounted) {
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Donor List Report'),
                        content: SizedBox(
                          width: double.maxFinite,
                          child: SingleChildScrollView(child: Text(data.toString())),
                        ),
                        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                  }
                }
              },
              child: const Text('Fetch'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openRecordPicker(BuildContext context, _RecordReportConfig cfg) async {
    final rows = await SupabaseService.client
        .from(cfg.table)
        .select()
        .order(cfg.orderColumn, ascending: false)
        .limit(30);
    if (!context.mounted) return;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        expand: false,
        builder: (ctx, scrollController) => ListView(
          controller: scrollController,
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text('Select a ${cfg.displayName.toLowerCase()}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            for (final r in (rows as List))
              ListTile(
                title: Text('${cfg.labelOf(r as Map<String, dynamic>)}'),
                trailing: const Icon(Icons.download),
                onTap: () async {
                  Navigator.pop(ctx);
                  await _generateAndShare(context, cfg.type, {'id': r['id']});
                },
              ),
            if ((rows).isEmpty) const Padding(padding: EdgeInsets.all(24), child: Text('No records found.')),
          ],
        ),
      ),
    );
  }

  Future<void> _generateAndShare(BuildContext context, String reportType, Map<String, dynamic> body) async {
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(const SnackBar(content: Text('Generating PDF...')));
    try {
      await PdfService.generateAndShare(reportType: reportType, body: body);
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Failed to generate PDF: $e')));
    }
  }
}

class _RecordReportConfig {
  final String type;
  final String displayName;
  final String table;
  final dynamic Function(Map<String, dynamic>) labelOf;
  final String orderColumn;
  _RecordReportConfig(this.type, this.displayName, this.table, this.labelOf, this.orderColumn);
}
