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
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
  static GoTrueClient get auth => client.auth;
  static User? get currentUser => client.auth.currentUser;
  static bool get isAuthenticated => currentUser != null;
}
