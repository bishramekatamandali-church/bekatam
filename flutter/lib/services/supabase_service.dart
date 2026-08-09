import 'package:supabase_flutter/supabase_flutter.dart';

/// Wraps Supabase project init + the single client instance used app-wide.
/// Project: bishramekatamandali-church's Project (asnmqrwshsupnlawjjqq, ap-northeast-1).
class SupabaseService {
  SupabaseService._();

  static Future<void> init() async {
    await Supabase.initialize(
      url: const String.fromEnvironment(
        'SUPABASE_URL',
        defaultValue: 'https://asnmqrwshsupnlawjjqq.supabase.co',
      ),
      anonKey: const String.fromEnvironment(
        'SUPABASE_ANON_KEY',
        // Legacy anon (JWT) key for asnmqrwshsupnlawjjqq — public by design,
        // access is enforced by RLS, same pattern as the SUPABASE_URL default
        // above. Was previously missing a defaultValue, so anonKey silently
        // resolved to an empty string on any run without --dart-define,
        // causing every request to fail with PostgrestException 401 "No API
        // key found in request".
        defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbm1xcndzaHN1cG5sYXdqanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NjY1MzIsImV4cCI6MjEwMDU0MjUzMn0.fCTVJdruJyhaNAb6rMFqnk0QKFpWDA0_gtIPTzSZxHk',
      ),
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
  static GoTrueClient get auth => client.auth;
  static User? get currentUser => client.auth.currentUser;
  static bool get isAuthenticated => currentUser != null;
}
