import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show AuthChangeEvent;
import 'services/supabase_service.dart';
import 'theme/app_theme.dart';
import 'widgets/responsive_shell.dart';
import 'screens/home/home_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/reset_password_confirm_screen.dart';

/// Exposed so the passwordRecovery listener below can push a screen without
/// needing a BuildContext from inside main().
final navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.init();

  // Catches the deep link Supabase's resetPasswordForEmail() email sends
  // the user back into the app with, and lands them on the "set a new
  // password" screen. Previously nothing listened for this event, so the
  // "click emailed link" half of the reset-password flow had no landing
  // screen in the app — mirrors frontend/src/pages/ResetPasswordPage.tsx.
  SupabaseService.auth.onAuthStateChange.listen((state) {
    if (state.event == AuthChangeEvent.passwordRecovery) {
      navigatorKey.currentState?.push(
        MaterialPageRoute(builder: (_) => const ResetPasswordConfirmScreen()),
      );
    }
  });

  runApp(const ProviderScope(child: BekatamApp()));
}

class BekatamApp extends StatelessWidget {
  const BekatamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Bishram Ekata Mandali',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const HomeScreen(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/reset-password': (_) => const ResetPasswordConfirmScreen(),
      },
      builder: (context, child) => ResponsiveShell(child: child ?? const SizedBox()),
    );
  }
}
