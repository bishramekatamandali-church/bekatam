import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/ministry.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';

final ministriesProvider = FutureProvider<List<Ministry>>((ref) async {
  final rows = await SupabaseService.client.from('ministry').select().order('title', ascending: true);
  return (rows as List).map((r) => Ministry.fromMap(r as Map<String, dynamic>)).toList();
});

class MinistriesListScreen extends ConsumerWidget {
  const MinistriesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ministriesAsync = ref.watch(ministriesProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Ministries')),
      body: ministriesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load ministries: $e')),
        data: (ministries) {
          if (ministries.isEmpty) return const Center(child: Text('No ministries listed yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(ministriesProvider),
            child: ListView.builder(
              itemCount: ministries.length,
              itemBuilder: (context, i) {
                final m = ministries[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (m.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: m.imageUrl!, height: 140, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(m.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                            if (m.leader != null) Text('Leader: ${m.leader}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            if (m.meetingTime != null) Text(m.meetingTime!, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 6),
                            Text(m.description, maxLines: 3, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: FilledButton.tonal(
                                onPressed: () => _requestToJoin(context, ref, m, profileAsync.value),
                                child: const Text('Request to Join'),
                              ),
                            ),
                          ],
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

  void _requestToJoin(BuildContext context, WidgetRef ref, Ministry ministry, dynamic profile) {
    if (profile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to request to join a ministry.')));
      return;
    }
    final messageController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Join ${ministry.title}'),
        content: TextField(
          controller: messageController,
          decoration: const InputDecoration(labelText: 'Message (optional)'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              // Matches ministryjoinrequest's real column set — status defaults
              // to 'pending' per the enum default, admin processes it later.
              await SupabaseService.client.from('ministryjoinrequest').insert({
                'user_id': profile.id,
                'user_name': profile.fullName,
                'user_email': profile.email,
                'ministry_id': ministry.id,
                'ministry_name': ministry.title,
                'ministry_guidelines': ministry.description,
                'message': messageController.text.trim(),
              });
              if (ctx.mounted) Navigator.of(ctx).pop();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Your request to join has been submitted.')),
                );
              }
            },
            child: const Text('Submit Request'),
          ),
        ],
      ),
    );
  }
}
