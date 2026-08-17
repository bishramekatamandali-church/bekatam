import 'dart:io';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'supabase_service.dart';

/// Wraps the generate-pdf Edge Function, which is admin-only server-side
/// (checks profiles.role via the same pattern as the other admin functions)
/// — matching the real app's PDF report controllers, which were only ever
/// reachable from the admin dashboard. Calling this as a non-admin user
/// returns a 403 from the function itself; there's no separate client-side
/// gate needed since Supabase enforces it.
class PdfService {
  PdfService._();

  static Future<File> generateAndSave({
    required String reportType,
    required Map<String, dynamic> body,
  }) async {
    final res = await SupabaseService.client.functions.invoke(
      'generate-pdf',
      body: {'report_type': reportType, ...body},
    );
    final bytes = res.data is String ? utf8.encode(res.data as String) : (res.data as List<int>);
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/$reportType-${DateTime.now().millisecondsSinceEpoch}.pdf');
    await file.writeAsBytes(bytes);
    return file;
  }

  static Future<void> generateAndShare({
    required String reportType,
    required Map<String, dynamic> body,
  }) async {
    final file = await generateAndSave(reportType: reportType, body: body);
    await Share.shareXFiles([XFile(file.path)]);
  }

  /// Generates the combined administrative PDF replacement for the old
  /// React/Node Jumbo Report. The Edge Function performs the admin check and
  /// gathers the supported administrative datasets server-side.
  static Future<File> generateJumboAndSave() async {
    final res = await SupabaseService.client.functions.invoke('generate-jumbo-report');
    final bytes = res.data is String ? utf8.encode(res.data as String) : (res.data as List<int>);
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/jumbo-administrative-report-${DateTime.now().millisecondsSinceEpoch}.pdf');
    await file.writeAsBytes(bytes);
    return file;
  }

  static Future<void> generateJumboAndShare() async {
    final file = await generateJumboAndSave();
    await Share.shareXFiles([XFile(file.path)]);
  }

  /// donor-list-report is a separate Edge Function (not part of generate-pdf)
  /// that returns JSON or XML rather than a PDF.
  static Future<Map<String, dynamic>> fetchDonorListReport({String format = 'json'}) async {
    final res = await SupabaseService.client.functions.invoke('donor-list-report', body: {'format': format});
    final data = res.data is String ? jsonDecode(res.data as String) : res.data;
    return Map<String, dynamic>.from(data as Map);
  }
}
