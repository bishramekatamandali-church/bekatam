import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'supabase_service.dart';

class JumboReportService {
  JumboReportService._();

  static Future<File> generateAndSave() async {
    final res = await SupabaseService.client.functions.invoke('generate-jumbo-report');
    final bytes = res.data is String ? utf8.encode(res.data as String) : (res.data as List<int>);
    final dir = await getTemporaryDirectory();
    final file = File('${dir.path}/jumbo-administrative-${DateTime.now().millisecondsSinceEpoch}.pdf');
    await file.writeAsBytes(bytes);
    return file;
  }

  static Future<void> generateAndShare() async {
    final file = await generateAndSave();
    await Share.shareXFiles([XFile(file.path)]);
  }
}
