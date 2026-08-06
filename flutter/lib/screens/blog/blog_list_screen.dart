import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/blog_post.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';

final blogPostsProvider = FutureProvider<List<BlogPost>>((ref) async {
  final rows = await SupabaseService.client.from('blogpost').select().order('date', ascending: false);
  return (rows as List).map((r) => BlogPost.fromMap(r as Map<String, dynamic>)).toList();
});

class BlogListScreen extends ConsumerWidget {
  const BlogListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(blogPostsProvider);
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Blog')),
      body: postsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load blog posts: $e')),
        data: (posts) {
          if (posts.isEmpty) return const Center(child: Text('No blog posts yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(blogPostsProvider),
            child: ListView.builder(
              itemCount: posts.length,
              itemBuilder: (context, i) {
                final p = posts[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (p.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: p.imageUrl!, height: 160, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                            if (p.date != null) Text(DateFormat.yMMMd().format(p.date!), style: const TextStyle(color: Colors.grey, fontSize: 12)),
                            const SizedBox(height: 6),
                            Text(p.description, maxLines: 3, overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      SocialInteractionBar(
                        itemType: 'blogPost',
                        itemId: p.id,
                        initialLikes: p.likes,
                        commentCount: 0,
                        currentProfile: profileAsync.value,
                        onCommentTap: () => showCommentSheet(
                          context: context,
                          itemType: 'blogPost',
                          itemId: p.id,
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
