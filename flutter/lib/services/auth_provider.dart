import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/profile.dart';
import 'supabase_service.dart';
import 'admin_log_service.dart';

final authStateProvider = StreamProvider<AuthState>((ref) => SupabaseService.auth.onAuthStateChange);

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

  Future<void> _logAdminIfNeeded(String? userId) async {
    if (userId == null) return;
    final profile = await SupabaseService.client.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (profile != null && profile['role'] == 'admin') await AdminLogService.log(action: 'Admin Logged In', targetId: userId);
  }

  Future<void> signIn({required String email, required String password}) async {
    final res = await SupabaseService.auth.signInWithPassword(email: email, password: password);
    await _logAdminIfNeeded(res.user?.id);
  }

  /// Supports the old email-or-username login behavior. Email identifiers use
  /// Supabase Auth directly; usernames are resolved only inside the protected
  /// Edge Function, so the user's email is never exposed to the client.
  Future<void> signInWithIdentifier({required String identifier, required String password}) async {
    final value = identifier.trim();
    if (value.contains('@')) {
      await signIn(email: value, password: password);
      return;
    }
    final res = await SupabaseService.client.functions.invoke('sign-in-identifier', body: {'identifier': value, 'password': password});
    final data = Map<String, dynamic>.from(res.data as Map);
    final accessToken = data['access_token'] as String?;
    final refreshToken = data['refresh_token'] as String?;
    if (accessToken == null || refreshToken == null) throw Exception(data['error'] ?? 'Invalid credentials.');
    final auth = await SupabaseService.auth.setSession(refreshToken);
    await _logAdminIfNeeded(auth.user?.id);
  }

  Future<void> signUp({required String email, required String password, required String fullName, required String username, String? phone}) async {
    final res = await SupabaseService.auth.signUp(email: email, password: password, data: {'username': username, 'full_name': fullName, if (phone != null && phone.isNotEmpty) 'phone': phone});
    final userId = res.user?.id;
    if (userId == null) throw Exception('Sign up did not return a user id.');
    await SupabaseService.client.from('profiles').upsert({'id': userId, 'username': username, 'full_name': fullName, 'email': email, 'phone': phone == null || phone.isEmpty ? null : phone});
  }

  Future<void> signOut() => SupabaseService.auth.signOut();
  Future<void> sendPasswordResetOtp(String email) => SupabaseService.auth.resetPasswordForEmail(email);
}

final authRepositoryProvider = Provider((ref) => const AuthRepository());
