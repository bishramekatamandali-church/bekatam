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
///
/// report_type is one of: meeting, decision, collection-record,
/// history-chapter, church-member, fellowship-schedule, donation-receipt,
/// financial, calendar. Each takes different body fields — see
/// supabase/functions/generate-pdf/index.ts in the repo for the exact
/// per-type body shape (id, or start_date/end_date, or bs_year).
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

  /// Generates the PDF then opens the OS share sheet so the admin can save
  /// it, print it, or send it — there's no in-app PDF viewer wired up yet.
  static Future<void> generateAndShare({
    required String reportType,
    required Map<String, dynamic> body,
  }) async {
    final file = await generateAndSave(reportType: reportType, body: body);
    // share_plus 10.x API (pinned in pubspec.yaml). If share_plus is later
    // upgraded to 11.x+, switch this to SharePlus.instance.share(ShareParams(...)).
    await Share.shareXFiles([XFile(file.path)]);
  }

  /// donor-list-report is a separate Edge Function (not part of generate-pdf)
  /// that returns JSON or XML rather than a PDF — see donor-list-report/index.ts.
  static Future<Map<String, dynamic>> fetchDonorListReport({String format = 'json'}) async {
    final res = await SupabaseService.client.functions.invoke('donor-list-report', body: {'format': format});
    final data = res.data is String ? jsonDecode(res.data as String) : res.data;
    return Map<String, dynamic>.from(data as Map);
  }
}
