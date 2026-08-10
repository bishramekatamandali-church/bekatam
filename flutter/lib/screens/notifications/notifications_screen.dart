import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

class AppNotification {
  final String id;
  final String message;
  final String? link;
  final DateTime timestamp;
  final bool read;
  final String type;

  AppNotification({
    required this.id,
    required this.message,
    this.link,
    required this.timestamp,
    this.read = false,
    this.type = 'general',
  });

  factory AppNotification.fromMap(Map<String, dynamic> map) {
    return AppNotification(
      id: map['id'] as String,
      message: map['message'] as String? ?? '',
      link: map['link'] as String?,
      timestamp: DateTime.tryParse(map['timestamp'] as String? ?? '') ?? DateTime.now(),
      read: map['read'] as bool? ?? false,
      type: map['type'] as String? ?? 'general',
    );
  }
}

final notificationsProvider = FutureProvider<List<AppNotification>>((ref) async {
  final profile = await ref.watch(currentProfileProvider.future);
  if (profile == null) return [];
  final rows = await SupabaseService.client
      .from('notification')
      .select()
      .eq('target_user_id', profile.id)
      .order('timestamp', ascending: false);
  return (rows as List).map((r) => AppNotification.fromMap(r as Map<String, dynamic>)).toList();
});

final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider).valueOrNull ?? [];
  return notifications.where((n) => !n.read).length;
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load notifications: $e')),
        data: (notifications) {
          if (notifications.isEmpty) return const Center(child: Text('No notifications yet.'));
          final hasUnread = notifications.any((n) => !n.read);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(notificationsProvider),
            child: ListView.separated(
              itemCount: notifications.length + 1,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Notifications', style: Theme.of(context).textTheme.titleLarge),
                        TextButton(
                          onPressed: hasUnread
                              ? () async {
                                  final unreadIds = notifications.where((n) => !n.read).map((n) => n.id).toList();
                                  await SupabaseService.client.from('notification').update({'read': true}).inFilter('id', unreadIds);
                                  ref.invalidate(notificationsProvider);
                                }
                              : null,
                          child: const Text('Mark all read'),
                        ),
                      ],
                    ),
                  );
                }
                final n = notifications[i - 1];
                return ListTile(
                  tileColor: n.read ? null : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.3),
                  leading: Icon(n.read ? Icons.notifications_none : Icons.notifications_active, color: n.read ? Colors.grey : Theme.of(context).colorScheme.primary),
                  title: Text(n.message),
                  subtitle: Text(timeago.format(n.timestamp)),
                  onTap: () async {
                    if (!n.read) {
                      await SupabaseService.client.from('notification').update({'read': true}).eq('id', n.id);
                      ref.invalidate(notificationsProvider);
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
