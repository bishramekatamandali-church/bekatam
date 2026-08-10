import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/sermon.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

class SermonDetailScreen extends ConsumerWidget {
  final Sermon sermon;
  const SermonDetailScreen({super.key, required this.sermon});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: ListView(
        children: [
          if (sermon.imageUrl != null) CachedNetworkImage(imageUrl: sermon.imageUrl!, height: 220, width: double.infinity, fit: BoxFit.cover),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(sermon.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 12,
                  children: [
                    if (sermon.speaker != null) Text(sermon.speaker!, style: const TextStyle(color: Colors.grey)),
                    if (sermon.date != null) Text(DateFormat.yMMMd().format(sermon.date!), style: const TextStyle(color: Colors.grey)),
                  ],
                ),
                if (sermon.scripture != null) ...[
                  const SizedBox(height: 8),
                  Chip(label: Text(sermon.scripture!)),
                ],
                const SizedBox(height: 16),
                if (sermon.videoUrl != null)
                  OutlinedButton.icon(
                    onPressed: () => launchUrl(Uri.parse(sermon.videoUrl!), mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.play_circle_outline),
                    label: const Text('Watch Video'),
                  ),
                if (sermon.audioUrl != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: OutlinedButton.icon(
                      onPressed: () => launchUrl(Uri.parse(sermon.audioUrl!), mode: LaunchMode.externalApplication),
                      icon: const Icon(Icons.headphones),
                      label: const Text('Listen'),
                    ),
                  ),
                const SizedBox(height: 16),
                Text(sermon.fullContent?.isNotEmpty == true ? sermon.fullContent! : sermon.description),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SocialInteractionBar(
              itemType: 'sermon',
              itemId: sermon.id,
              initialLikes: sermon.likes,
              commentCount: 0,
              currentProfile: profileAsync.valueOrNull,
              onCommentTap: () => showCommentSheet(
                context: context,
                itemType: 'sermon',
                itemId: sermon.id,
                currentProfile: profileAsync.valueOrNull,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
