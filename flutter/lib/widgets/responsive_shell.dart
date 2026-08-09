import 'package:flutter/material.dart';
import '../theme/app_breakpoints.dart';
import '../theme/app_colors.dart';

/// Wraps every screen in the app (via MaterialApp.builder in main.dart) so
/// the whole app is responsive without touching each of the 57 individual
/// screen files.
///
/// Problem this solves: every screen was built mobile-first (single-column
/// ListView, fixed padding). That's correct on a phone, but on a wide
/// desktop/browser window it stretches edge-to-edge and looks broken.
///
/// Fix mirrors how the real React site behaves at Tailwind's own
/// breakpoints (see app_breakpoints.dart, copied from Tailwind's default
/// `theme.screens`): below `sm` (640) renders unchanged — phones. From `sm`
/// up to `lg` (1024) — tablets — content is capped a bit narrower than full
/// width. At `lg` and above — laptops, desktops, wide browser windows —
/// content is capped at a comfortable reading width and centered with a
/// neutral surround, which is what the React site's own content column does
/// on a wide monitor (most page grids in frontend/src/pages are
/// `grid-cols-1`, i.e. the real site doesn't spread into extra columns on
/// desktop either — it just keeps a fixed-width centered column).
class ResponsiveShell extends StatelessWidget {
  final Widget child;
  const ResponsiveShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;

        if (AppBreakpoints.isMobile(width)) {
          // Phones — unchanged, full width.
          return child;
        }

        final double maxContentWidth = AppBreakpoints.isTablet(width)
            ? 760 // sm-lg: tablets — a bit wider than before so Home's left sidebar (768+) has room to appear
            : (width >= AppBreakpoints.xl ? 1280 : 1040); // lg-xl vs xl+: wide enough for content + one or two sidebars

        return ColoredBox(
          color: AppColors.slate200,
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxContentWidth),
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
