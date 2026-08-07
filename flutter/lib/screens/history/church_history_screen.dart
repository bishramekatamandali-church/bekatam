import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/history_chapter.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import 'history_chapter_detail_screen.dart';

// Only published chapters are shown to regular members — draft is an
// admin-only editing state (status enum: draft | published).
final historyChaptersProvider = FutureProvider<List<HistoryChapter>>((ref) async {
  final rows = await SupabaseService.client
      .from('historychapter')
      .select()
      .eq('status', 'published')
      .order('chapter_number', ascending: true);
  return (rows as List).map((r) => HistoryChapter.fromMap(r as Map<String, dynamic>)).toList();
});

class ChurchHistoryScreen extends ConsumerWidget {
  const ChurchHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chaptersAsync = ref.watch(historyChaptersProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Our History')),
      body: chaptersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load history: $e')),
        data: (chapters) {
          if (chapters.isEmpty) return const Center(child: Text('No chapters published yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(historyChaptersProvider),
            child: ListView.builder(
              itemCount: chapters.length,
              itemBuilder: (context, i) {
                final c = chapters[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (c.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: c.imageUrl!, height: 150, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: InkWell(
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => HistoryChapterDetailScreen(chapter: c))),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Chapter ${c.chapterNumber}: ${c.title}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            if (c.authorName != null) Text('By ${c.authorName}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 6),
                            Text(c.summary ?? c.content, maxLines: 3, overflow: TextOverflow.ellipsis),
                          ],
                          ),
                        ),
                      ),
                      SocialInteractionBar(
                        itemType: 'historyChapter',
                        itemId: c.id,
                        initialLikes: c.likes,
                        commentCount: 0,
                        currentProfile: profileAsync.value,
                        onCommentTap: () => showCommentSheet(
                          context: context,
                          itemType: 'historyChapter',
                          itemId: c.id,
                          currentProfile: profileAsync.value,
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
