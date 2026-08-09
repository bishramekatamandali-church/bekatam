import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_provider.dart';
import '../theme/app_colors.dart';
import '../screens/auth/login_screen.dart';
import '../screens/profile/profile_screen.dart';
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

/// Ports Header.tsx's mobile menu (isMobileMenuOpen panel + MobileNavCollapsible)
/// as a real Flutter Drawer instead of an overlay panel — same content and
/// grouping (Connect/Resources collapse), native platform pattern.
class AppNavDrawer extends ConsumerWidget {
  const AppNavDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);
    final profile = profileAsync.valueOrNull;
    final isAuthed = profile != null;

    return Drawer(
      backgroundColor: AppColors.indigo800,
      child: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(color: AppColors.indigo700),
              child: Row(
                children: [
                  Icon(Icons.church, color: Colors.white, size: 32),
                  SizedBox(width: 12),
                  Text('Bishram Ekata Mandali', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
            ),
            _DrawerLink(Icons.search, 'Search', () {
              Navigator.of(context).pop();
              showGlobalSearchSheet(context);
            }),
            _DrawerLink(Icons.home_outlined, 'Home', () => Navigator.of(context)
              ..pop()
              ..popUntil((r) => r.isFirst)),
            _DrawerLink(Icons.edit_note_outlined, 'Blog', () => _go(context, const BlogListScreen())),
            _DrawerLink(Icons.newspaper_outlined, 'News', () => _go(context, const NewsListScreen())),
            _DrawerLink(Icons.campaign_outlined, 'Notices', () => _go(context, const NoticesScreen())),
            _DrawerGroup('Connect', {
              'Ministries': () => _go(context, const MinistriesListScreen()),
              'Events': () => _go(context, const EventsListScreen()),
              'Event Calendar': () => _go(context, const EventCalendarScreen()),
              'Our Branches': () => _go(context, const BranchesListScreen()),
              'Contact Us': () => _go(context, const ContactScreen()),
            }),
            _DrawerGroup('Resources', {
              'Sermons': () => _go(context, const SermonsListScreen()),
              'Media Library': () => _go(context, const MediaGalleryScreen()),
              'Church History': () => _go(context, const ChurchHistoryScreen()),
            }),
            _DrawerLink(Icons.info_outline, 'About', () => _go(context, const AboutScreen())),
            _DrawerLink(Icons.volunteer_activism_outlined, 'Donate', () => _go(context, const DonateScreen())),
            if (profile?.isAdmin ?? false)
              _DrawerLink(Icons.admin_panel_settings_outlined, 'Admin Panel', () => _go(context, const AdminDashboardScreen())),
            const Divider(color: AppColors.indigo600),
            if (isAuthed) ...[
              _DrawerLink(Icons.person_outline, 'Profile', () => _go(context, const ProfileScreen())),
              _DrawerLink(Icons.logout, 'Logout', () {
                Navigator.of(context).pop();
                ref.read(authRepositoryProvider).signOut();
              }),
            ] else
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
                    },
                    child: const Text('Login / Register'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _go(BuildContext context, Widget screen) {
    Navigator.of(context).pop();
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }
}

class _DrawerLink extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _DrawerLink(this.icon, this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.indigo200),
      title: Text(label, style: const TextStyle(color: Colors.white)),
      onTap: onTap,
    );
  }
}

class _DrawerGroup extends StatelessWidget {
  final String label;
  final Map<String, VoidCallback> items;
  const _DrawerGroup(this.label, this.items);

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        iconColor: AppColors.indigo200,
        collapsedIconColor: AppColors.indigo200,
        title: Text(label, style: const TextStyle(color: Colors.white)),
        children: items.entries
            .map((e) => Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: ListTile(
                    title: Text(e.key, style: const TextStyle(color: AppColors.indigo200, fontSize: 14)),
                    onTap: e.value,
                  ),
                ))
            .toList(),
      ),
    );
  }
}
