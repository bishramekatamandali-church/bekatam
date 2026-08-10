import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

// Ported from the real NoticesPage.tsx, which reads generatedscheduleitem
// (fellowship roster schedule notices) rather than a dedicated "notice"
// table — there isn't one in the schema.
final noticesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final rows = await SupabaseService.client
      .from('generatedscheduleitem')
      .select()
      .order('scheduled_date', ascending: true);
  return (rows as List).cast<Map<String, dynamic>>();
});

class NoticesScreen extends ConsumerWidget {
  const NoticesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final noticesAsync = ref.watch(noticesProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: noticesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load notices: $e')),
        data: (notices) {
          if (notices.isEmpty) return const Center(child: Text('No notices right now.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(noticesProvider),
            child: ListView.builder(
              itemCount: notices.length,
              itemBuilder: (context, i) {
                final n = notices[i];
                final date = n['scheduled_date'] != null ? DateTime.tryParse(n['scheduled_date'] as String) : null;
                return ListTile(
                  leading: const Icon(Icons.notifications_active_outlined),
                  title: Text(n['group_name_or_event_title'] as String? ?? 'Notice'),
                  subtitle: Text([
                    if (date != null) DateFormat.yMMMd().format(date),
                    if (n['time_slot'] != null) n['time_slot'] as String,
                    if (n['location'] != null) n['location'] as String,
                  ].join(' · ')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
