import 'package:flutter/material.dart';

/// Tailwind color tokens copied 1:1 from the React app (frontend/src), so the
/// two clients render the same palette. Values are Tailwind's default
/// palette (the frontend never overrides tailwind.config.js theme.colors),
/// pulled from the actual class usage counted across frontend/src:
/// text-slate-500/700/400/600 etc. are the dominant text colors;
/// bg-indigo-800 is the header; text/border-purple-600 is the primary brand
/// accent used on buttons and links; teal-500 is the secondary/active-state
/// accent; red/green/amber are status colors (errors, success, warnings).
class AppColors {
  AppColors._();

  // Brand
  static const indigo800 = Color(0xFF3730A3); // header / chrome
  static const indigo700 = Color(0xFF4338CA); // header hover states
  static const indigo600 = Color(0xFF4F46E5);
  static const indigo200 = Color(0xFFC7D2FE);

  static const purple600 = Color(0xFF9333EA); // primary CTA buttons, primary links
  static const purple700 = Color(0xFF7E22CE);
  static const purple500 = Color(0xFFA855F7);
  static const purple400 = Color(0xFFC084FC);
  static const purple200 = Color(0xFFE9D5FF);
  static const purple100 = Color(0xFFF3E8FF);
  static const purple50 = Color(0xFFFAF5FF);

  static const teal500 = Color(0xFF14B8A6); // secondary accent, active nav state
  static const teal600 = Color(0xFF0D9488);
  static const teal200 = Color(0xFF99F6E4);
  static const teal100 = Color(0xFFCCFBF1);
  static const teal800 = Color(0xFF115E59);

  // Neutrals (slate) — the dominant text/border/surface family site-wide
  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);

  // Status colors
  static const red500 = Color(0xFFEF4444);
  static const red600 = Color(0xFFDC2626);
  static const red700 = Color(0xFFB91C1C);
  static const red100 = Color(0xFFFEE2E2);

  static const green100 = Color(0xFFDCFCE7);
  static const green700 = Color(0xFF15803D);

  static const amber600 = Color(0xFFD97706);
  static const yellow100 = Color(0xFFFEF9C3);

  static const blue600 = Color(0xFF2563EB);
}
