import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/news_item.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import 'news_detail_screen.dart';

final newsItemsProvider = FutureProvider<List<NewsItem>>((ref) async {
  final rows = await SupabaseService.client.from('newsitem').select().order('date', ascending: false);
  return (rows as List).map((r) => NewsItem.fromMap(r as Map<String, dynamic>)).toList();
});

class NewsListScreen extends ConsumerWidget {
  const NewsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newsAsync = ref.watch(newsItemsProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('News')),
      body: newsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load news: $e')),
        data: (items) {
          if (items.isEmpty) return const Center(child: Text('No news yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(newsItemsProvider),
            child: ListView.builder(
              itemCount: items.length,
              itemBuilder: (context, i) {
                final n = items[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (n.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: n.imageUrl!, height: 160, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: InkWell(
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => NewsDetailScreen(newsItem: n))),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                            if (n.date != null) Text(DateFormat.yMMMd().format(n.date!), style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 6),
                            Text(n.description, maxLines: 3, overflow: TextOverflow.ellipsis),
                          ],
                          ),
                        ),
                      ),
                      SocialInteractionBar(
                        itemType: 'news',
                        itemId: n.id,
                        initialLikes: n.likes,
                        commentCount: 0,
                        currentProfile: profileAsync.value,
                        onCommentTap: () => showCommentSheet(
                          context: context,
                          itemType: 'news',
                          itemId: n.id,
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
