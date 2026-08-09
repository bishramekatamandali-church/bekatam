import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/event_item.dart';
import '../services/auth_provider.dart';
import '../screens/events/events_list_screen.dart';
import '../screens/prayer/prayer_requests_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/blog/blog_list_screen.dart';
import '../screens/donate/donate_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../theme/app_colors.dart';

/// Ports components/layout/RightSidebar.tsx: a desktop-only right rail
/// (`hidden lg:block` in React — wider breakpoint than the left sidebar).
/// Signed-out state shows a "Welcome — sign in to see personalized updates"
/// card, exactly matching the real copy. Signed-in state adds Quick
/// Actions, Upcoming Events, and Latest Public Prayers cards.
class HomeRightSidebar extends ConsumerWidget {
  const HomeRightSidebar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);
    final isSignedIn = profileAsync.value != null;

    return Container(
      width: 320,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        border: Border(left: BorderSide(color: AppColors.slate200)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionTitle('Welcome'),
            const SizedBox(height: 8),
            if (!isSignedIn)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: const Text(
                    'Sign in to see personalized updates and your profile activity.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.slate500, fontSize: 13),
                  ),
                ),
              )
            else ...[
              _QuickActionsCard(context),
              const SizedBox(height: 16),
              const _UpcomingEventsCard(),
              const SizedBox(height: 16),
              const _LatestPrayersCard(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _QuickActionsCard(BuildContext context) {
    return Card(
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Quick Actions', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.slate700)),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(8),
            child: GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 1.6,
              children: [
                _QuickActionTile(Icons.campaign_outlined, 'Home Feed', () => Navigator.of(context).popUntil((r) => r.isFirst)),
                _QuickActionTile(Icons.person_outline, 'My Profile', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen()))),
                _QuickActionTile(Icons.edit_note_outlined, 'Blog', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BlogListScreen()))),
                _QuickActionTile(Icons.volunteer_activism_outlined, 'Donate', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DonateScreen()))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickActionTile(this.icon, this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(foregroundColor: AppColors.purple600),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11)),
        ],
      ),
    );
  }
}

class _UpcomingEventsCard extends ConsumerWidget {
  const _UpcomingEventsCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsProvider);
    final now = DateTime.now();
    final upcoming = (eventsAsync.value ?? [])
        .where((e) => e.date != null && e.date!.isAfter(now))
        .toList()
      ..sort((a, b) => a.date!.compareTo(b.date!));
    final top = upcoming.take(3).toList();

    return Card(
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.slate500),
                SizedBox(width: 8),
                Text('Upcoming Events', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.slate700)),
              ],
            ),
          ),
          const Divider(height: 1),
          if (top.isEmpty)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('No upcoming events.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.slate500, fontSize: 12)),
            )
          else
            ...top.map((e) => _EventRow(e)),
          const Divider(height: 1),
          TextButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventsListScreen())),
            child: const Text('View All Events', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

class _EventRow extends StatelessWidget {
  final EventItem event;
  const _EventRow(this.event);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      title: Text(event.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      subtitle: event.date == null ? null : Text('${event.date!.day}/${event.date!.month}/${event.date!.year}', style: const TextStyle(fontSize: 11)),
      trailing: TextButton(
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: event))),
        child: const Text('View', style: TextStyle(fontSize: 11)),
      ),
    );
  }
}

class _LatestPrayersCard extends ConsumerWidget {
  const _LatestPrayersCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prayersAsync = ref.watch(prayerRequestsProvider);
    final recent = (prayersAsync.value ?? [])
        .where((p) => p.visibility == 'public' || p.visibility == 'anonymous')
        .toList()
      ..sort((a, b) => b.submittedAt.compareTo(a.submittedAt));
    final top = recent.take(3).toList();

    return Card(
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.campaign_outlined, size: 16, color: AppColors.slate500),
                SizedBox(width: 8),
                Text('Latest Public Prayers', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.slate700)),
              ],
            ),
          ),
          const Divider(height: 1),
          if (top.isEmpty)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('No recent public prayers.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.slate500, fontSize: 12)),
            )
          else
            ...top.map((p) => Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      Text(p.requestText, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
                    ],
                  ),
                )),
          const Divider(height: 1),
          TextButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrayerRequestsScreen())),
            child: const Text('Visit Home', style: TextStyle(fontSize: 12)),
          ),
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
