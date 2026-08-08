import 'package:flutter/material.dart';

/// Wraps every screen in the app (via MaterialApp.builder in main.dart) so
/// the whole app is responsive without touching each of the 57 individual
/// screen files.
///
/// Problem this solves: every screen was built mobile-first (single-column
/// ListView, fixed padding). That's correct on a phone, but on a wide
/// desktop/browser window it stretches edge-to-edge and looks broken —
/// cards and text spanning 1900px is what was reported.
///
/// Fix: below [_wideBreakpoint], render at full width exactly as before
/// (phones, small tablets — no visual change). At or above it (desktop,
/// browser windows, large tablets), constrain content to
/// [_maxContentWidth] and center it, with a neutral background filling the
/// rest — the standard pattern responsive web apps use, and it's the
/// pattern the real React site itself effectively follows (its content
/// column doesn't stretch full-bleed on a wide monitor either).
class ResponsiveShell extends StatelessWidget {
  final Widget child;
  const ResponsiveShell({super.key, required this.child});

  static const double _wideBreakpoint = 700;
  static const double _maxContentWidth = 900;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= _wideBreakpoint;
        if (!isWide) return child;

        return ColoredBox(
          color: Colors.grey.shade200,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: _maxContentWidth),
              child: Material(
                color: Theme.of(context).scaffoldBackgroundColor,
                elevation: 1,
                child: child,
              ),
            ),
          ),
        );
      },
    );
  }
}
