import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

/// Runs the combined administrative report through the Supabase PDF function.
/// The Edge Function can evolve independently of the Flutter client; this
/// screen keeps the client-side contract small and explicit.
class AdminJumboReportScreen extends StatefulWidget {
  const AdminJumboReportScreen({super.key});
  @override State<AdminJumboReportScreen> createState() => _AdminJumboReportScreenState();
}

class _AdminJumboReportScreenState extends State<AdminJumboReportScreen> {
  bool _busy = false;
  String? _message;

  Future<void> _generate() async {
    setState(() { _busy = true; _message = null; });
    try {
      final response = await SupabaseService.client.functions.invoke('generate-pdf', body: {
        'type': 'jumbo',
      });
      if (!mounted) return;
      final data = response.data;
      final url = data is Map ? data['url']?.toString() : null;
      setState(() {
        _message = url == null ? 'Report generated successfully.' : 'Report generated: $url';
      });
    } catch (e) {
      if (mounted) setState(() => _message = 'Could not generate report: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Jumbo Report')),
    body: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 600), child: Card(margin: const EdgeInsets.all(24), child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Combined administrative report', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      const SizedBox(height: 12),
      const Text('Generate the combined report covering the administrative records exposed by the Supabase PDF service.'),
      const SizedBox(height: 24),
      FilledButton.icon(onPressed: _busy ? null : _generate, icon: _busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.picture_as_pdf), label: Text(_busy ? 'Generating…' : 'Generate Jumbo Report')),
      if (_message != null) ...[const SizedBox(height: 16), SelectableText(_message!)],
    ]))))),
  );
}
