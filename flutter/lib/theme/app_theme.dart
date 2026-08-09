import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Mirrors the React app's design system, sourced directly from
/// frontend/src/components/ui/Button.tsx, Card.tsx, and
/// components/layout/Header.tsx — not re-guessed. Key mappings:
///
/// - Header: bg-indigo-800, text-white, shadow-lg  -> AppBarTheme
/// - Primary button (Button.tsx `variant="primary"`): bg-purple-600,
///   hover:bg-purple-700, rounded-xl, font-semibold -> FilledButtonTheme
/// - Outline/secondary button: border-purple-600 text-purple-600 /
///   bg-slate-600 -> OutlinedButtonTheme / dark surface button
/// - Card.tsx: bg-white, shadow-md, rounded-xl, border-slate-200 dividers
///   on header/footer -> CardTheme
/// - Active nav / accent state: bg-teal-500 -> ColorScheme.secondary
class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.purple600,
      brightness: Brightness.light,
      primary: AppColors.purple600,
      onPrimary: Colors.white,
      secondary: AppColors.teal500,
      onSecondary: Colors.white,
      surface: Colors.white,
      onSurface: AppColors.slate800,
      error: AppColors.red600,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.slate50,
      fontFamily: null, // system-ui equivalent: let each platform use its native system font, same as the site's `font-family: system-ui, -apple-system, ...`

      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.indigo800,
        foregroundColor: Colors.white,
        elevation: 4,
        shadowColor: Colors.black26,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: IconThemeData(color: Colors.white),
      ),

      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 2, // approximates Tailwind shadow-md
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12), // rounded-xl
          side: const BorderSide(color: AppColors.slate200, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.purple600,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.purple600.withOpacity(0.5),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.purple600,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.purple600,
          side: const BorderSide(color: AppColors.purple600),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.purple600,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.slate300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.slate300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.purple600, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.red500),
        ),
        labelStyle: const TextStyle(color: AppColors.slate600),
        hintStyle: const TextStyle(color: AppColors.slate400),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: AppColors.slate100,
        labelStyle: const TextStyle(color: AppColors.slate700, fontSize: 12),
        selectedColor: AppColors.teal100,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999), // Tailwind rounded-full badges/chips
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),

      dividerTheme: const DividerThemeData(color: AppColors.slate200, thickness: 1),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.slate800,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),

      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.teal500,
        foregroundColor: Colors.white,
      ),

      tabBarTheme: const TabBarThemeData(
        labelColor: AppColors.teal500,
        unselectedLabelColor: AppColors.slate500,
        indicatorColor: AppColors.teal500,
      ),

      textTheme: const TextTheme(
        headlineLarge: TextStyle(color: AppColors.slate900, fontWeight: FontWeight.w700),
        headlineMedium: TextStyle(color: AppColors.slate900, fontWeight: FontWeight.w700),
        headlineSmall: TextStyle(color: AppColors.slate800, fontWeight: FontWeight.w600),
        titleLarge: TextStyle(color: AppColors.slate800, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(color: AppColors.slate800, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(color: AppColors.slate700),
        bodyMedium: TextStyle(color: AppColors.slate600),
        bodySmall: TextStyle(color: AppColors.slate500),
        labelLarge: TextStyle(color: AppColors.slate700, fontWeight: FontWeight.w600),
      ),
    );
  }
}
