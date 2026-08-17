import 'package:flutter/material.dart';
import '../../services/jumbo_report_service.dart';

class AdminJumboReportFinalScreen extends StatefulWidget {
  const AdminJumboReportFinalScreen({super.key});
  @override State<AdminJumboReportFinalScreen> createState() => _AdminJumboReportFinalScreenState();
}

class _AdminJumboReportFinalScreenState extends State<AdminJumboReportFinalScreen> {
  bool _busy = false;
  String? _message;

  Future<void> _generate() async {
    setState(() { _busy = true; _message = null; });
    try {
      await JumboReportService.generateAndShare();
      if (mounted) setState(() => _message = 'Jumbo report generated and shared.');
    } catch (e) {
      if (mounted) setState(() => _message = 'Could not generate report: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Jumbo Report')),
    body: Center(child: Card(margin: const EdgeInsets.all(24), child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Combined administrative report', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        const Text('Members, expenses, donations, collections, meetings, decisions, and fellowship schedules.'),
        const SizedBox(height: 24),
        FilledButton.icon(onPressed: _busy ? null : _generate,
          icon: _busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.picture_as_pdf),
          label: Text(_busy ? 'Generating…' : 'Generate Jumbo Report')),
        if (_message != null) ...[const SizedBox(height: 16), SelectableText(_message!)],
      ]),
    ))),
  );
}
