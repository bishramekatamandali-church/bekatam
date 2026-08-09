import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_provider.dart';
import '../theme/app_breakpoints.dart';
import '../theme/app_colors.dart';
import '../screens/auth/login_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/blog/blog_list_screen.dart';
import '../screens/news/news_list_screen.dart';
import '../screens/notices/notices_screen.dart';
import '../screens/ministries/ministries_list_screen.dart';
import '../screens/events/events_list_screen.dart';
import '../screens/events/event_calendar_screen.dart';
import '../screens/branches/branches_list_screen.dart';
import '../screens/contact/contact_screen.dart';
import '../screens/sermons/sermons_list_screen.dart';
import '../screens/media/media_gallery_screen.dart';
import '../screens/history/church_history_screen.dart';
import '../screens/about/about_screen.dart';
import '../screens/donate/donate_screen.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import 'global_search_sheet.dart';
import 'app_nav_drawer.dart';

/// Ports components/layout/Header.tsx: bg-indigo-800 bar, h-20 (72 here),
/// desktop nav row with Connect/Resources dropdowns from lg (1024) up,
/// hamburger + AppNavDrawer below that — matching React's exact `lg:hidden`
/// / `hidden lg:flex` split. Trailing side mirrors the real auth-state
/// branching: notification bell + avatar + logout when signed in,
/// "Login / Register" button when signed out.
class AppHeader extends ConsumerWidget implements PreferredSizeWidget {
  const AppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(72);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);
    final profile = profileAsync.valueOrNull;
    final isAuthed = profile != null;
    final isWide = MediaQuery.sizeOf(context).width >= AppBreakpoints.lg;

    return AppBar(
      backgroundColor: AppColors.indigo800,
      foregroundColor: Colors.white,
      elevation: 4,
      toolbarHeight: 72,
      titleSpacing: 12,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(Icons.church, color: Colors.white),
          SizedBox(width: 8),
          Text('BEM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
        ],
      ),
      actions: [
        if (isWide) ..._desktopNavItems(context, profile?.isAdmin ?? false),
        IconButton(
          icon: const Icon(Icons.search),
          tooltip: 'Search site',
          onPressed: () => showGlobalSearchSheet(context),
        ),
        if (isAuthed) ...[
          Builder(builder: (context) {
            final unread = ref.watch(unreadNotificationCountProvider);
            return IconButton(
              icon: Badge(
                isLabelVisible: unread > 0,
                label: Text('$unread'),
                child: const Icon(Icons.notifications_outlined),
              ),
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NotificationsScreen())),
            );
          }),
          IconButton(
            icon: CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.indigo600,
              backgroundImage: profile.profileImageUrl != null ? NetworkImage(profile.profileImageUrl!) : null,
              child: profile.profileImageUrl == null
                  ? Text(profile.fullName.isNotEmpty ? profile.fullName[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontSize: 12))
                  : null,
            ),
            tooltip: 'Profile',
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
          ),
          if (isWide)
            IconButton(icon: const Icon(Icons.logout), tooltip: 'Logout', onPressed: () => ref.read(authRepositoryProvider).signOut()),
        ] else if (isWide)
          Padding(
            padding: const EdgeInsets.only(left: 4, right: 8),
            child: FilledButton(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
              child: const Text('Login / Register'),
            ),
          ),
        if (!isWide)
          Builder(
            builder: (context) => IconButton(
              icon: const Icon(Icons.menu),
              tooltip: 'Menu',
              onPressed: () => Scaffold.of(context).openEndDrawer(),
            ),
          ),
      ],
    );
  }

  List<Widget> _desktopNavItems(BuildContext context, bool isAdmin) {
    return [
      _NavLink('Home', () => Navigator.of(context).popUntil((r) => r.isFirst)),
      _NavLink('Blog', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BlogListScreen()))),
      _NavLink('News', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NewsListScreen()))),
      _NavLink('Notices', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NoticesScreen()))),
      _NavDropdown('Connect', {
        'Ministries': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MinistriesListScreen())),
        'Events': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventsListScreen())),
        'Event Calendar': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventCalendarScreen())),
        'Our Branches': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BranchesListScreen())),
        'Contact Us': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ContactScreen())),
      }),
      _NavDropdown('Resources', {
        'Sermons': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SermonsListScreen())),
        'Media Library': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MediaGalleryScreen())),
        'Church History': () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChurchHistoryScreen())),
      }),
      _NavLink('About', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AboutScreen()))),
      _NavLink('Donate', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DonateScreen()))),
      if (isAdmin)
        _NavLink('Admin Panel', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminDashboardScreen()))),
    ];
  }
}

class _NavLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _NavLink(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(foregroundColor: Colors.white),
      child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
    );
  }
}

class _NavDropdown extends StatelessWidget {
  final String label;
  final Map<String, VoidCallback> items;
  const _NavDropdown(this.label, this.items);

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: label,
      onSelected: (key) => items[key]?.call(),
      itemBuilder: (context) => items.keys
          .map((key) => PopupMenuItem<String>(value: key, child: Text(key)))
          .toList(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
            const Icon(Icons.arrow_drop_down, color: Colors.white, size: 18),
          ],
        ),
      ),
    );
  }
}
