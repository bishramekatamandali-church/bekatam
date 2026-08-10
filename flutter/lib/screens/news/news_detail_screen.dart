import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../models/news_item.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

class NewsDetailScreen extends ConsumerWidget {
  final NewsItem newsItem;
  const NewsDetailScreen({super.key, required this.newsItem});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: ListView(
        children: [
          if (newsItem.imageUrl != null) CachedNetworkImage(imageUrl: newsItem.imageUrl!, height: 220, width: double.infinity, fit: BoxFit.cover),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(newsItem.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                if (newsItem.date != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(DateFormat.yMMMd().format(newsItem.date!), style: const TextStyle(color: Colors.grey)),
                  ),
                const SizedBox(height: 16),
                Text(newsItem.description),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SocialInteractionBar(
              itemType: 'news',
              itemId: newsItem.id,
              initialLikes: newsItem.likes,
              commentCount: 0,
              currentProfile: profileAsync.valueOrNull,
              onCommentTap: () => showCommentSheet(
                context: context,
                itemType: 'news',
                itemId: newsItem.id,
                currentProfile: profileAsync.valueOrNull,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
