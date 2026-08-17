import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class AdminJumboReportV2Screen extends StatefulWidget {
  const AdminJumboReportV2Screen({super.key});
  @override State<AdminJumboReportV2Screen> createState() => _AdminJumboReportV2ScreenState();
}
class _AdminJumboReportV2ScreenState extends State<AdminJumboReportV2Screen> {
  bool busy = false; String? message;
  Future<void> generate() async {
    setState(() { busy = true; message = null; });
    try {
      final response = await SupabaseService.client.functions.invoke('generate-jumbo-report');
      if (mounted) setState(() => message = response.data is Map && response.data['url'] != null ? response.data['url'].toString() : 'Combined report generated.');
    } catch (e) { if (mounted) setState(() => message = 'Could not generate report: $e'); }
    finally { if (mounted) setState(() => busy = false); }
  }
  @override Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Jumbo Report')), body: Center(child: Card(margin: const EdgeInsets.all(24), child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [const Text('Combined administrative report', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)), const SizedBox(height: 12), const Text('Finance, members, meetings, expenses, and fellowship summaries.'), const SizedBox(height: 24), FilledButton.icon(onPressed: busy ? null : generate, icon: busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.picture_as_pdf), label: Text(busy ? 'Generating…' : 'Generate Jumbo Report')), if (message != null) ...[const SizedBox(height: 16), SelectableText(message!)] ]))));
}
