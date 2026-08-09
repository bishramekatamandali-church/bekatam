import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/sermon.dart';
import '../models/event_item.dart';
import '../models/news_item.dart';
import '../models/blog_post.dart';
import '../screens/sermons/sermons_list_screen.dart';
import '../screens/events/events_list_screen.dart';
import '../screens/news/news_list_screen.dart';
import '../screens/blog/blog_list_screen.dart';
import '../screens/events/event_calendar_screen.dart';
import '../screens/donate/donate_screen.dart';
import '../screens/about/about_screen.dart';
import '../screens/history/church_history_screen.dart';
import '../screens/branches/branches_list_screen.dart';
import '../screens/media/media_gallery_screen.dart';
import '../theme/app_colors.dart';

class _CyclingItem {
  final String title;
  final String typeLabel;
  final DateTime? date;
  const _CyclingItem(this.title, this.typeLabel, this.date);
}

/// Ports components/layout/Sidebar.tsx: a desktop-only left rail shown on
/// every non-admin screen (`hidden md:block` in React — here it's only
/// mounted by ResponsiveShell at/above the md breakpoint). Combines the two
/// most recent items each of events/sermons/news/blog into one cycling
/// "Latest Updates" card, plus the donate quote CTA and quick links, exactly
/// matching the real section order and copy.
class HomeLeftSidebar extends ConsumerStatefulWidget {
  const HomeLeftSidebar({super.key});

  @override
  ConsumerState<HomeLeftSidebar> createState() => _HomeLeftSidebarState();
}

class _HomeLeftSidebarState extends ConsumerState<HomeLeftSidebar> {
  int _index = 0;
  Timer? _timer;

  void _restartTimer(int itemCount) {
    _timer?.cancel();
    if (itemCount > 1) {
      _timer = Timer.periodic(const Duration(milliseconds: 2500), (_) {
        if (mounted) setState(() => _index = (_index + 1) % itemCount);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sermonsAsync = ref.watch(sermonsProvider);
    final eventsAsync = ref.watch(eventsProvider);
    final newsAsync = ref.watch(newsItemsProvider);
    final blogAsync = ref.watch(blogPostsProvider);

    final loading = sermonsAsync.isLoading || eventsAsync.isLoading || newsAsync.isLoading || blogAsync.isLoading;

    final items = <_CyclingItem>[];
    List<EventItem> events = eventsAsync.value ?? [];
    List<Sermon> sermons = sermonsAsync.value ?? [];
    List<NewsItem> news = newsAsync.value ?? [];
    List<BlogPost> blog = blogAsync.value ?? [];

    events = [...events]..sort((a, b) => (b.date ?? DateTime(0)).compareTo(a.date ?? DateTime(0)));
    sermons = [...sermons]..sort((a, b) => (b.date ?? DateTime(0)).compareTo(a.date ?? DateTime(0)));
    news = [...news]..sort((a, b) => (b.date ?? DateTime(0)).compareTo(a.date ?? DateTime(0)));
    blog = [...blog]..sort((a, b) => (b.date ?? DateTime(0)).compareTo(a.date ?? DateTime(0)));

    for (final e in events.take(2)) {
      items.add(_CyclingItem(e.title, 'Events', e.date));
    }
    for (final s in sermons.take(2)) {
      items.add(_CyclingItem(s.title, 'Sermons', s.date));
    }
    for (final n in news.take(2)) {
      items.add(_CyclingItem(n.title, 'News', n.date));
    }
    for (final b in blog.take(2)) {
      items.add(_CyclingItem(b.title, 'Blog', b.date));
    }

    WidgetsBinding.instance.addPostFrameCallback((_) => _restartTimer(items.length));
    final current = items.isEmpty ? null : items[_index % items.length];

    return Container(
      width: 280,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: AppColors.slate200)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionTitle('Latest Updates'),
            const SizedBox(height: 8),
            SizedBox(
              height: 120,
              child: loading && items.isEmpty
                  ? const Center(child: Text('Loading...', style: TextStyle(color: AppColors.slate500, fontSize: 13)))
                  : current == null
                      ? const Center(child: Text('No recent updates.', style: TextStyle(color: AppColors.slate500, fontSize: 12)))
                      : _LatestUpdateCard(item: current),
            ),
            const SizedBox(height: 20),
            // "Support Our Mission" quote CTA — ports the teal quote card in Sidebar.tsx
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.teal100,
                border: Border.all(color: AppColors.teal200),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  const Icon(Icons.card_giftcard, color: AppColors.teal600, size: 22),
                  const SizedBox(height: 8),
                  const Text(
                    '"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Cor 9:7',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.teal800, fontSize: 11, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DonateScreen())),
                      child: const Text('Support Our Mission', style: TextStyle(fontSize: 12)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventCalendarScreen())),
                icon: const Icon(Icons.calendar_month, size: 16),
                label: const Text('View Event Calendar', style: TextStyle(fontSize: 12)),
              ),
            ),
            const SizedBox(height: 20),
            _SectionTitle('Quick Links'),
            const SizedBox(height: 8),
            _QuickLink('About Us', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AboutScreen()))),
            _QuickLink('Church History', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChurchHistoryScreen()))),
            _QuickLink('Branches', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BranchesListScreen()))),
            _QuickLink('Media Library', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MediaGalleryScreen()))),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            Text('© ${DateTime.now().year} Bishram Ekata Mandali. All rights reserved.',
                textAlign: TextAlign.center, style: const TextStyle(color: AppColors.slate500, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _LatestUpdateCard extends StatelessWidget {
  final _CyclingItem item;
  const _LatestUpdateCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(item.typeLabel.toUpperCase(),
              style: const TextStyle(color: AppColors.purple600, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
          const SizedBox(height: 6),
          Text(item.title, maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(bottom: 6),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.slate300))),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.slate800, fontSize: 14)),
    );
  }
}

class _QuickLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _QuickLink(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Text(label, style: const TextStyle(color: AppColors.slate700, fontSize: 13)),
      ),
    );
  }
}
