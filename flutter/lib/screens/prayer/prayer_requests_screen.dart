import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../models/prayer_request.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../profile/public_profile_screen.dart';

// visibility is 'public' only (see the public_visibility enum on
// prayerrequest) — the source app's other visibility option was
// 'anonymous', handled by user_name being null/omitted rather than a
// separate enum value, so no extra filtering is needed here.
final prayerRequestsProvider = FutureProvider<List<PrayerRequest>>((ref) async {
  final rows = await SupabaseService.client
      .from('prayerrequest')
      .select()
      .eq('is_deleted', false)
      .order('submitted_at', ascending: false);
  return (rows as List).map((r) => PrayerRequest.fromMap(r as Map<String, dynamic>)).toList();
});

class PrayerRequestsScreen extends ConsumerWidget {
  const PrayerRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(prayerRequestsProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Prayer Requests')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showSubmitSheet(context, ref, profileAsync.value),
        icon: const Icon(Icons.add),
        label: const Text('Share a request'),
      ),
      body: requestsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load prayer requests: $e')),
        data: (requests) {
          if (requests.isEmpty) return const Center(child: Text('No prayer requests yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(prayerRequestsProvider),
            child: ListView.builder(
              itemCount: requests.length,
              itemBuilder: (context, i) {
                final r = requests[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(child: Text(r.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                            if (r.status == 'answered')
                              const Chip(label: Text('Answered'), backgroundColor: Colors.green, labelStyle: TextStyle(color: Colors.white)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        GestureDetector(
                          onTap: r.userId == null
                              ? null
                              : () => Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: r.userId!)),
                                  ),
                          child: Text(
                            '${r.userName ?? "Anonymous"} · ${timeago.format(r.submittedAt)}',
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                              decoration: r.userId == null ? null : TextDecoration.underline,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(r.requestText),
                        const SizedBox(height: 8),
                        PrayerActionBar(
                          prayerRequestId: r.id,
                          currentProfile: profileAsync.value,
                          prayerCount: 0, // real count comes from the nested prayer(*) array; see toggle-prayer's response for a live count after praying.
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showSubmitSheet(BuildContext context, WidgetRef ref, dynamic profile) {
    final controller = TextEditingController();
    final titleController = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Share a Prayer Request', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 8),
            TextField(controller: controller, decoration: const InputDecoration(labelText: 'Your request'), maxLines: 4),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () async {
                if (profile == null) {
                  ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Sign in to submit a prayer request.')));
                  return;
                }
                await SupabaseService.client.from('prayerrequest').insert({
                  'user_id': profile.id,
                  'user_name': profile.fullName,
                  'title': titleController.text.trim(),
                  'request_text': controller.text.trim(),
                  'visibility': 'public',
                });
                if (ctx.mounted) Navigator.of(ctx).pop();
                ref.invalidate(prayerRequestsProvider);
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}
