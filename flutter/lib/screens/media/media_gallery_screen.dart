import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import '../../models/media_item.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

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
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
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
                      insetPadding: const EdgeInsets.all(12),
                      child: m.mediaType == 'video'
                          ? _VideoPlayerDialog(item: m)
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

/// Inline video playback for `directmediaitem` rows where media_type is
/// 'video' — the original React app uses a plain HTML5 <video> tag; this
/// mirrors that with the video_player package (network URL, no download).
class _VideoPlayerDialog extends StatefulWidget {
  final MediaItem item;
  const _VideoPlayerDialog({required this.item});

  @override
  State<_VideoPlayerDialog> createState() => _VideoPlayerDialogState();
}

class _VideoPlayerDialogState extends State<_VideoPlayerDialog> {
  late final VideoPlayerController _controller;
  bool _ready = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.item.url));
    _controller.initialize().then((_) {
      if (!mounted) return;
      setState(() => _ready = true);
      _controller.play();
    }).catchError((e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    });
    _controller.addListener(() => mounted ? setState(() {}) : null);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: Text(widget.item.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Could not play this video: $_error'),
          )
        else if (!_ready)
          const Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())
        else
          AspectRatio(
            aspectRatio: _controller.value.aspectRatio == 0 ? 16 / 9 : _controller.value.aspectRatio,
            child: Stack(
              alignment: Alignment.center,
              children: [
                VideoPlayer(_controller),
                VideoProgressIndicator(_controller, allowScrubbing: true),
                IconButton(
                  iconSize: 48,
                  color: Colors.white70,
                  icon: Icon(_controller.value.isPlaying ? Icons.pause_circle : Icons.play_circle),
                  onPressed: () => setState(() {
                    _controller.value.isPlaying ? _controller.pause() : _controller.play();
                  }),
                ),
              ],
            ),
          ),
        const SizedBox(height: 8),
      ],
    );
  }
}
