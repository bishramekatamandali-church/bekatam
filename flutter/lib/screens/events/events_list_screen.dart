import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/event_item.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import 'event_detail_screen.dart';
import 'event_calendar_screen.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

final eventsProvider = FutureProvider<List<EventItem>>((ref) async {
  final rows = await SupabaseService.client.from('eventitem').select().order('date', ascending: true);
  return (rows as List).map((r) => EventItem.fromMap(r as Map<String, dynamic>)).toList();
});

class EventsListScreen extends ConsumerWidget {
  const EventsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      floatingActionButton: FloatingActionButton.small(
        heroTag: 'events-calendar-view',
        tooltip: 'Calendar view',
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventCalendarScreen())),
        child: const Icon(Icons.calendar_month),
      ),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load events: $e')),
        data: (events) {
          if (events.isEmpty) return const Center(child: Text('No upcoming events.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(eventsProvider),
            child: ListView.builder(
              itemCount: events.length,
              itemBuilder: (context, i) {
                final e = events[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (e.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: e.imageUrl!, height: 160, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: InkWell(
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: e))),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                            if (e.date != null)
                              Text(
                                '${DateFormat.yMMMd().format(e.date!)}${e.time != null ? " · ${e.time}" : ""}',
                                style: const TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            if (e.location != null) Text(e.location!, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 6),
                            Text(e.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                          ],
                          ),
                        ),
                      ),
                      SocialInteractionBar(
                        itemType: 'event',
                        itemId: e.id,
                        initialLikes: e.likes,
                        commentCount: 0,
                        currentProfile: profileAsync.valueOrNull,
                        onCommentTap: () => showCommentSheet(
                          context: context,
                          itemType: 'event',
                          itemId: e.id,
                          currentProfile: profileAsync.valueOrNull,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
