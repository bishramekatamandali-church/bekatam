import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/sermon.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import 'sermon_detail_screen.dart';

final sermonsProvider = FutureProvider<List<Sermon>>((ref) async {
  final rows = await SupabaseService.client.from('sermon').select().order('date', ascending: false);
  return (rows as List).map((r) => Sermon.fromMap(r as Map<String, dynamic>)).toList();
});

class SermonsListScreen extends ConsumerWidget {
  const SermonsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sermonsAsync = ref.watch(sermonsProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Sermons')),
      body: sermonsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load sermons: $e')),
        data: (sermons) {
          if (sermons.isEmpty) return const Center(child: Text('No sermons yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(sermonsProvider),
            child: ListView.builder(
              itemCount: sermons.length,
              itemBuilder: (context, i) {
                final s = sermons[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (s.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: s.imageUrl!, height: 160, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: InkWell(
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => SermonDetailScreen(sermon: s))),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(s.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                            if (s.speaker != null) Text(s.speaker!, style: const TextStyle(color: Colors.grey)),
                            if (s.date != null) Text(DateFormat.yMMMd().format(s.date!), style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 6),
                            Text(s.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                          ],
                          ),
                        ),
                      ),
                      SocialInteractionBar(
                        itemType: 'sermon',
                        itemId: s.id,
                        initialLikes: s.likes,
                        commentCount: 0, // real comment count needs a join; wired up when detail screen loads comment(*).
                        currentProfile: profileAsync.valueOrNull,
                        onCommentTap: () => showCommentSheet(
                          context: context,
                          itemType: 'sermon',
                          itemId: s.id,
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
