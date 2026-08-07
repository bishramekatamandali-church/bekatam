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

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bishram Ekata Mandali'),
        actions: [
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
        padding: const EdgeInsets.all(16),
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
          const SizedBox(height: 24),
          Text('Still being ported: Community feed, notifications UI, PDF downloads, and the full Admin dashboard.',
              style: TextStyle(color: Colors.grey[600]), textAlign: TextAlign.center),
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
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, size: 32),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
