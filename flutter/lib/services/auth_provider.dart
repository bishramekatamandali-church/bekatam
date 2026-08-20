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

String _normalizedPhone(String value) => value.replaceAll(RegExp(r'[\s().-]'), '');

class AuthRepository {
  const AuthRepository();

  Future<void> _logAdminIfNeeded(String? userId) async {
    if (userId == null) return;
    final profile = await SupabaseService.client.from('profiles').select('role').eq('id', userId).maybeSingle();
    if (profile != null && profile['role'] == 'admin') {
      await AdminLogService.log(action: 'Admin Logged In', targetId: userId);
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    final res = await SupabaseService.auth.signInWithPassword(email: email.trim(), password: password);
    await _logAdminIfNeeded(res.user?.id);
  }

  /// Preserves the legacy email/username/phone identifier behavior.
  /// Resolution happens server-side so an identifier lookup never exposes the
  /// account email to the Flutter client.
  Future<void> signInWithIdentifier({required String identifier, required String password}) async {
    final value = identifier.trim();
    if (value.contains('@')) {
      await signIn(email: value, password: password);
      return;
    }

    final normalized = _normalizedPhone(value);
    final res = await SupabaseService.client.functions.invoke(
      'sign-in-identifier',
      body: {'identifier': value, 'normalized_phone': normalized, 'password': password},
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final refreshToken = data['refresh_token'] as String?;
    if (refreshToken == null || refreshToken.isEmpty) {
      throw Exception(data['error'] as String? ?? 'Invalid credentials.');
    }
    final auth = await SupabaseService.auth.setSession(refreshToken);
    await _logAdminIfNeeded(auth.user?.id);
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String fullName,
    String? username,
    String? countryCode,
    String? phone,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.isEmpty || !normalizedEmail.contains('@')) {
      throw Exception('Enter a valid email address.');
    }
    if (password.length < 6) throw Exception('Password must be at least 6 characters.');

    final normalizedCountry = (countryCode ?? '').trim();
    final normalizedLocalPhone = _normalizedPhone(phone ?? '');
    final fullPhone = normalizedLocalPhone.isEmpty
        ? null
        : '${normalizedCountry.isEmpty ? '' : normalizedCountry}$normalizedLocalPhone';
    final requestedUsername = username?.trim().toLowerCase();

    // Username generation, collision handling, phone uniqueness, and profile
    // creation are performed by the auth.users trigger. This avoids a client
    // side race and also works when email confirmation means there is no
    // authenticated session immediately after signUp().
    final res = await SupabaseService.auth.signUp(
      email: normalizedEmail,
      password: password,
      data: {
        if (requestedUsername != null && requestedUsername.isNotEmpty) 'username': requestedUsername,
        'full_name': fullName.trim(),
        if (fullPhone != null) 'phone': fullPhone,
        if (normalizedCountry.isNotEmpty) 'country_code': normalizedCountry,
      },
    );

    final userId = res.user?.id;
    if (userId == null) throw Exception('Sign up did not return a user id.');

    // The trigger already created the profile. When a session is immediately
    // available, refresh the provider so the UI sees the new profile. When
    // confirmation is required, no RLS-protected client write is attempted.
    if (res.session != null) {
      ref.invalidate(currentProfileProvider);
    }
  }

  Future<void> updateProfileImage(String imageUrl) async {
    final userId = SupabaseService.currentUser?.id;
    if (userId == null) throw Exception('You must be signed in to update your profile image.');
    await SupabaseService.client.from('profiles').update({'profile_image_url': imageUrl}).eq('id', userId);
  }

  Future<void> signOut() => SupabaseService.auth.signOut();
  Future<void> sendPasswordResetOtp(String email) => SupabaseService.auth.resetPasswordForEmail(email.trim().toLowerCase());
}

final authRepositoryProvider = Provider((ref) => const AuthRepository());
