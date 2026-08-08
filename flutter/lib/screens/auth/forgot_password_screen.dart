import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/auth_provider.dart';

/// Ports ResetPasswordPage.tsx. The old app's custom email-OTP reset flow
/// was replaced in Phase 2 by Supabase Auth's built-in
/// resetPasswordForEmail — this screen requests that email; the link it
/// sends opens a Supabase-hosted page to set the new password.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  String? _error;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).sendPasswordResetOtp(_email.text.trim());
      if (mounted) setState(() => _sent = true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _sent
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.mark_email_read_outlined, size: 56, color: Colors.green),
                  const SizedBox(height: 16),
                  Text('If an account exists for ${_email.text.trim()}, a password reset link has been sent.',
                      textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Back to Sign In')),
                ],
              )
            : Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Enter your account email and we will send you a link to reset your password.'),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _email,
                      decoration: const InputDecoration(labelText: 'Email'),
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading ? const CircularProgressIndicator() : const Text('Send Reset Link'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
