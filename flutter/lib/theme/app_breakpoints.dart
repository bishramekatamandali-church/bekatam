/// Tailwind's default breakpoint scale (frontend/tailwind.config.js doesn't
/// override `theme.screens`, so these are Tailwind's stock values) — used so
/// the Flutter layout switches at the same widths the React app's
/// sm:/md:/lg:/xl: classes do.
class AppBreakpoints {
  AppBreakpoints._();

  static const double sm = 640;
  static const double md = 768;
  static const double lg = 1024;
  static const double xl = 1280;
  static const double xxl = 1536;

  static bool isMobile(double width) => width < sm;
  static bool isTablet(double width) => width >= sm && width < lg;
  static bool isDesktop(double width) => width >= lg;
}
