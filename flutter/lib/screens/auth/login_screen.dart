import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/auth_provider.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).signIn(email: _email.text.trim(), password: _password.text);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign In')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Bishram Ekata Mandali', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 32),
              TextFormField(
                controller: _email,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _password,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (v) => (v == null || v.length < 6) ? 'Password must be at least 6 characters' : null,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                  child: const Text('Forgot password?'),
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: _loading ? const CircularProgressIndicator() : const Text('Sign In'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.of(context).pushNamed('/register'),
                child: const Text("Don't have an account? Register"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
