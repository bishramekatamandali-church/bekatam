import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/auth_provider.dart';
import '../../services/supabase_service.dart';
import '../auth/login_screen.dart';
import '../sermons/sermons_list_screen.dart';
import '../prayer/prayer_requests_screen.dart';
import '../events/events_list_screen.dart';
import '../blog/blog_list_screen.dart';
import '../news/news_list_screen.dart';
import '../ministries/ministries_list_screen.dart';
import '../donate/donate_screen.dart';
import '../history/church_history_screen.dart';
import '../branches/branches_list_screen.dart';
import '../media/media_gallery_screen.dart';
import '../notices/notices_screen.dart';
import '../profile/profile_screen.dart';
import '../notifications/notifications_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../about/about_screen.dart';
import '../contact/contact_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bishram Ekata Mandali'),
        actions: [
          profileAsync.maybeWhen(
            data: (profile) => profile == null
                ? const SizedBox()
                : Builder(builder: (context) {
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
            orElse: () => const SizedBox(),
          ),
          profileAsync.when(
            data: (profile) => profile == null
                ? TextButton(
                    onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
                    child: const Text('Sign In', style: TextStyle(color: Colors.white)),
                  )
                : IconButton(
                    icon: const Icon(Icons.logout),
                    onPressed: () => ref.read(authRepositoryProvider).signOut(),
                  ),
            loading: () => const SizedBox(),
            error: (_, __) => const SizedBox(),
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            width: double.infinity,
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              // Matches HomePage.tsx's real hero: bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700
              gradient: const LinearGradient(
                colors: [Color(0xFF0891B2), Color(0xFF0D9488), Color(0xFF1D4ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)),
                  child: const Text('MAKE AN IMPACT TODAY', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                ),
                const SizedBox(height: 12),
                const Text('Give Hope, Change Lives', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Every gift fuels meals, discipleship, and community care for families in need.',
                    style: TextStyle(color: Colors.white70)),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DonateScreen())),
                  child: const Text('Donate Now'),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                _NavCard(
                  icon: Icons.church,
                  title: 'Sermons',
                subtitle: 'Watch and read recent messages',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SermonsListScreen())),
              ),
              _NavCard(
                icon: Icons.favorite,
                title: 'Prayer Requests',
                subtitle: 'Share and pray for one another',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrayerRequestsScreen())),
              ),
              _NavCard(
                icon: Icons.event,
                title: 'Events',
                subtitle: 'Upcoming gatherings and programs',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventsListScreen())),
              ),
              _NavCard(
                icon: Icons.article,
                title: 'Blog',
                subtitle: 'Devotionals and church life',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BlogListScreen())),
              ),
              _NavCard(
                icon: Icons.campaign,
                title: 'News',
                subtitle: 'Announcements and updates',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NewsListScreen())),
              ),
              _NavCard(
                icon: Icons.groups,
                title: 'Ministries',
                subtitle: 'Find a ministry and request to join',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MinistriesListScreen())),
              ),
              _NavCard(
                icon: Icons.volunteer_activism,
                title: 'Donate',
                subtitle: 'Support the church locally or internationally',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DonateScreen())),
              ),
              _NavCard(
                icon: Icons.menu_book,
                title: 'Our History',
                subtitle: 'The story of the church, chapter by chapter',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChurchHistoryScreen())),
              ),
              _NavCard(
                icon: Icons.info_outline,
                title: 'About Us',
                subtitle: 'Our story, mission, and leadership',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AboutScreen())),
              ),
              _NavCard(
                icon: Icons.contact_mail_outlined,
                title: 'Contact Us',
                subtitle: 'Send us a message',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ContactScreen())),
              ),
              _NavCard(
                icon: Icons.map,
                title: 'Branch Churches',
                subtitle: 'Find a branch near you',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BranchesListScreen())),
              ),
              _NavCard(
                icon: Icons.photo_library,
                title: 'Media',
                subtitle: 'Photos and videos from church life',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MediaGalleryScreen())),
              ),
              _NavCard(
                icon: Icons.notifications,
                title: 'Notices',
                subtitle: 'Fellowship schedule and announcements',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NoticesScreen())),
              ),
              _NavCard(
                icon: Icons.person,
                title: 'My Profile',
                subtitle: 'View and edit your profile',
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
              ),
              if (profileAsync.value?.isAdmin ?? false)
                _NavCard(
                  icon: Icons.admin_panel_settings,
                  title: 'Admin Dashboard',
                  subtitle: 'Reports, user management, and content moderation',
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminDashboardScreen())),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('Still being ported: Community feed (redirects to Home in the original app — no separate screen needed).',
                style: TextStyle(color: Colors.grey[600]), textAlign: TextAlign.center),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _NavCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _NavCard({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: CircleAvatar(
          radius: 22,
          backgroundColor: primary.withOpacity(0.1),
          child: Icon(icon, color: primary),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
