import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../screens/sermons/sermons_list_screen.dart';
import '../screens/events/events_list_screen.dart';
import '../screens/prayer/prayer_requests_screen.dart';

/// Not a 1:1 port — the real React app relies on the hamburger menu alone
/// on mobile (see Header.tsx's `lg:hidden` panel), with no bottom bar.
/// Added on top of that because the user asked explicitly for the app to
/// be "mobile friendly" with a bottom bar: a persistent bottom nav is the
/// native-app convention for quick access to top destinations, so it's
/// additive to the ported layout rather than a straight port of anything
/// in frontend/src.
///
/// Kept intentionally simple: each tap pushes the destination screen
/// (matching how every other nav entry in this app already navigates) —
/// this is a set of shortcuts, not a persistent IndexedStack-tab shell, to
/// avoid restructuring how the other 50+ existing screens are reached.
class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      selectedItemColor: AppColors.purple600,
      unselectedItemColor: AppColors.slate500,
      currentIndex: 0,
      onTap: (index) {
        switch (index) {
          case 0:
            Navigator.of(context).popUntil((r) => r.isFirst);
            break;
          case 1:
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SermonsListScreen()));
            break;
          case 2:
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventsListScreen()));
            break;
          case 3:
            Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrayerRequestsScreen()));
            break;
          case 4:
            Scaffold.of(context).openEndDrawer();
            break;
        }
      },
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.church_outlined), label: 'Sermons'),
        BottomNavigationBarItem(icon: Icon(Icons.event_outlined), label: 'Events'),
        BottomNavigationBarItem(icon: Icon(Icons.favorite_outline), label: 'Prayer'),
        BottomNavigationBarItem(icon: Icon(Icons.menu), label: 'Menu'),
      ],
    );
  }
}
