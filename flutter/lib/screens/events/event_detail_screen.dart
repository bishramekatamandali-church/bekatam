import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/event_item.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';
import '../../widgets/comment_sheet.dart';

class EventDetailScreen extends ConsumerWidget {
  final EventItem event;
  const EventDetailScreen({super.key, required this.event});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text(event.title, overflow: TextOverflow.ellipsis)),
      body: ListView(
        children: [
          if (event.imageUrl != null) CachedNetworkImage(imageUrl: event.imageUrl!, height: 220, width: double.infinity, fit: BoxFit.cover),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                if (event.date != null)
                  Row(children: [
                    const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text('${DateFormat.yMMMd().format(event.date!)}${event.time != null ? " · ${event.time}" : ""}'),
                  ]),
                if (event.location != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(children: [
                      const Icon(Icons.location_on, size: 16, color: Colors.grey),
                      const SizedBox(width: 6),
                      Expanded(child: Text(event.location!)),
                    ]),
                  ),
                if (event.isFeeRequired && event.feeAmount != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text('Fee: NPR ${event.feeAmount!.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                if (event.capacity != null)
                  Padding(padding: const EdgeInsets.only(top: 4), child: Text('Capacity: ${event.capacity}')),
                const SizedBox(height: 16),
                Text(event.description),
                if (event.contactPerson != null || event.contactEmail != null || event.contactPhone != null) ...[
                  const SizedBox(height: 16),
                  const Text('Contact', style: TextStyle(fontWeight: FontWeight.w600)),
                  if (event.contactPerson != null) Text(event.contactPerson!),
                  if (event.contactPhone != null)
                    TextButton.icon(
                      onPressed: () => launchUrl(Uri.parse('tel:${event.contactPhone}')),
                      icon: const Icon(Icons.phone, size: 16),
                      label: Text(event.contactPhone!),
                    ),
                  if (event.contactEmail != null)
                    TextButton.icon(
                      onPressed: () => launchUrl(Uri.parse('mailto:${event.contactEmail}')),
                      icon: const Icon(Icons.email, size: 16),
                      label: Text(event.contactEmail!),
                    ),
                ],
                if (event.registrationLink != null) ...[
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => launchUrl(Uri.parse(event.registrationLink!), mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.how_to_reg),
                    label: const Text('Register'),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SocialInteractionBar(
              itemType: 'event',
              itemId: event.id,
              initialLikes: event.likes,
              commentCount: 0,
              currentProfile: profileAsync.value,
              onCommentTap: () => showCommentSheet(
                context: context,
                itemType: 'event',
                itemId: event.id,
                currentProfile: profileAsync.value,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
