import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/media_item.dart';
import '../../services/supabase_service.dart';

final mediaItemsProvider = FutureProvider<List<MediaItem>>((ref) async {
  final rows = await SupabaseService.client.from('directmediaitem').select().order('upload_date', ascending: false);
  return (rows as List).map((r) => MediaItem.fromMap(r as Map<String, dynamic>)).toList();
});

class MediaGalleryScreen extends ConsumerWidget {
  const MediaGalleryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mediaAsync = ref.watch(mediaItemsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Media')),
      body: mediaAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load media: $e')),
        data: (items) {
          if (items.isEmpty) return const Center(child: Text('No media uploaded yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(mediaItemsProvider),
            child: GridView.builder(
              padding: const EdgeInsets.all(8),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1,
              ),
              itemCount: items.length,
              itemBuilder: (context, i) {
                final m = items[i];
                return GestureDetector(
                  onTap: () => showDialog(
                    context: context,
                    builder: (_) => Dialog(
                      child: m.mediaType == 'video'
                          ? Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text('${m.title}\n\nVideo playback not yet wired — open externally: ${m.url}'),
                            )
                          : InteractiveViewer(child: CachedNetworkImage(imageUrl: m.url)),
                    ),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: CachedNetworkImage(imageUrl: m.url, fit: BoxFit.cover),
                      ),
                      if (m.mediaType == 'video')
                        const Center(child: Icon(Icons.play_circle_fill, color: Colors.white, size: 36)),
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
