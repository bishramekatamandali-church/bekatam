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

String _usernameBase({required String email, required String fullName}) {
  final emailBase = email.split('@').first.toLowerCase();
  final source = emailBase.isNotEmpty ? emailBase : fullName;
  final sanitized = source.replaceAll(RegExp(r'[^a-z0-9]'), '');
  return sanitized.isNotEmpty ? sanitized : 'user';
}

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
      body: {
        'identifier': value,
        'normalized_phone': normalized,
        'password': password,
      },
    );
    final data = Map<String, dynamic>.from(res.data as Map);
    final refreshToken = data['refresh_token'] as String?;
    if (refreshToken == null || refreshToken.isEmpty) {
      throw AuthException(data['error'] as String? ?? 'Invalid credentials.');
    }
    final auth = await SupabaseService.auth.setSession(refreshToken);
    await _logAdminIfNeeded(auth.user?.id);
  }

  Future<String> generateUniqueUsername({required String email, required String fullName}) async {
    final base = _usernameBase(email: email, fullName: fullName);
    var candidate = base;
    var suffix = 1;

    while (true) {
      final row = await SupabaseService.client
          .from('profiles')
          .select('id')
          .ilike('username', candidate)
          .maybeSingle();
      if (row == null) return candidate;
      candidate = '$base${suffix++}';
    }
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
      throw const AuthException('Enter a valid email address.');
    }
    if (password.length < 6) {
      throw const AuthException('Password must be at least 6 characters.');
    }

    final normalizedCountry = (countryCode ?? '').trim();
    final normalizedLocalPhone = _normalizedPhone(phone ?? '');
    final fullPhone = normalizedLocalPhone.isEmpty
        ? null
        : '${normalizedCountry.isEmpty ? '' : normalizedCountry}$normalizedLocalPhone';

    final resolvedUsername = (username == null || username.trim().isEmpty)
        ? await generateUniqueUsername(email: normalizedEmail, fullName: fullName)
        : username.trim().toLowerCase();

    final res = await SupabaseService.auth.signUp(
      email: normalizedEmail,
      password: password,
      data: {
        'username': resolvedUsername,
        'full_name': fullName.trim(),
        if (fullPhone != null) 'phone': fullPhone,
        if (normalizedCountry.isNotEmpty) 'country_code': normalizedCountry,
      },
    );

    final userId = res.user?.id;
    if (userId == null) throw const AuthException('Sign up did not return a user id.');

    await SupabaseService.client.from('profiles').upsert({
      'id': userId,
      'username': resolvedUsername,
      'full_name': fullName.trim(),
      'email': normalizedEmail,
      'phone': fullPhone,
      'country_code': normalizedCountry.isEmpty ? null : normalizedCountry,
    });
  }

  Future<void> updateProfileImage(String imageUrl) async {
    final userId = SupabaseService.currentUser?.id;
    if (userId == null) throw const AuthException('You must be signed in to update your profile image.');
    await SupabaseService.client.from('profiles').update({'profile_image_url': imageUrl}).eq('id', userId);
  }

  Future<void> signOut() => SupabaseService.auth.signOut();

  Future<void> sendPasswordResetOtp(String email) => SupabaseService.auth.resetPasswordForEmail(email.trim().toLowerCase());
}

final authRepositoryProvider = Provider((ref) => const AuthRepository());