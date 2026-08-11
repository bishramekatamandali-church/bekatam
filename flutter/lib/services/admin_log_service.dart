import 'supabase_service.dart';

/// Mirrors `logAdminAction()` in frontend/src/contexts/AuthContext.tsx.
/// Writes into `adminactionlog` — previously only ever read from the
/// Flutter app (admin_activity_log_screen.dart), never written to, so
/// every action taken from the Flutter app was invisible to the log.
class AdminLogService {
  static Future<void> log({
    required String action,
    String? targetId,
    String? details,
  }) async {
    final user = SupabaseService.currentUser;
    if (user == null) return;
    String adminName = user.email ?? 'Admin';
    try {
      final profile = await SupabaseService.client.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      if (profile != null && profile['full_name'] != null) {
        adminName = profile['full_name'] as String;
      }
    } catch (_) {
      // Fall back to email if the profile lookup fails — logging should
      // never block or crash the action it's recording.
    }
    try {
      await SupabaseService.client.from('adminactionlog').insert({
        'admin_id': user.id,
        'admin_name': adminName,
        'action': action,
        if (targetId != null) 'target_id': targetId,
        if (details != null) 'details': details,
      });
    } catch (_) {
      // Best-effort: a failed log write should never block the underlying
      // admin action from completing.
    }
  }
}
