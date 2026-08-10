import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/history_chapter.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

class HistoryChapterDetailScreen extends ConsumerWidget {
  final HistoryChapter chapter;
  const HistoryChapterDetailScreen({super.key, required this.chapter});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: ListView(
        children: [
          if (chapter.imageUrl != null) CachedNetworkImage(imageUrl: chapter.imageUrl!, height: 220, width: double.infinity, fit: BoxFit.cover),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Chapter ${chapter.chapterNumber}: ${chapter.title}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                if (chapter.authorName != null)
                  Padding(padding: const EdgeInsets.only(top: 6), child: Text('By ${chapter.authorName}', style: const TextStyle(color: Colors.grey))),
                const SizedBox(height: 16),
                Text(chapter.content),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SocialInteractionBar(
              itemType: 'historyChapter',
              itemId: chapter.id,
              initialLikes: chapter.likes,
              commentCount: 0,
              currentProfile: profileAsync.valueOrNull,
              onCommentTap: () => showCommentSheet(
                context: context,
                itemType: 'historyChapter',
                itemId: chapter.id,
                currentProfile: profileAsync.valueOrNull,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
