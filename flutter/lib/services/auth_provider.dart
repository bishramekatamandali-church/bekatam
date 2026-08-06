import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/profile.dart';
import 'supabase_service.dart';

/// Streams Supabase auth state changes so the UI reacts to sign-in/out.
final authStateProvider = StreamProvider<AuthState>((ref) {
  return SupabaseService.auth.onAuthStateChange;
});

/// Loads the current user's row from `profiles` (1:1 with auth.users, per
/// the Phase 2 auth migration plan) whenever auth state changes.
final currentProfileProvider = FutureProvider<Profile?>((ref) async {
  ref.watch(authStateProvider);
  final user = SupabaseService.currentUser;
  if (user == null) return null;
  final row = await SupabaseService.client.from('profiles').select().eq('id', user.id).maybeSingle();
  if (row == null) return null;
  return Profile.fromMap(row);
});

class AuthRepository {
  const AuthRepository();

  Future<void> signIn({required String email, required String password}) async {
    await SupabaseService.auth.signInWithPassword(email: email, password: password);
  }

  /// Registration: creates the auth.users row via Supabase Auth, then the
  /// matching `profiles` row (username/fullName/etc. — the fields the old
  /// custom `user` model held beyond what auth.users itself stores).
  Future<void> signUp({
    required String email,
    required String password,
    required String fullName,
    required String username,
  }) async {
    final res = await SupabaseService.auth.signUp(email: email, password: password);
    final userId = res.user?.id;
    if (userId == null) throw Exception('Sign up did not return a user id.');
    await SupabaseService.client.from('profiles').insert({
      'id': userId,
      'username': username,
      'full_name': fullName,
      'email': email,
    });
  }

  Future<void> signOut() => SupabaseService.auth.signOut();

  Future<void> sendPasswordResetOtp(String email) => SupabaseService.auth.resetPasswordForEmail(email);
}

final authRepositoryProvider = Provider((ref) => const AuthRepository());
