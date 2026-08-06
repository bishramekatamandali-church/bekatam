import 'package:flutter/material.dart';
import '../models/profile.dart';
import '../services/social_service.dart';

/// Like + comment-count row for content types that support likes
/// (sermon, event, blogPost, news, historyChapter, testimonial).
/// For prayer requests, use [PrayerActionBar] instead — praying is a
/// separate one-way action (see toggle-prayer), not a like.
class SocialInteractionBar extends StatefulWidget {
  final String itemType;
  final String itemId;
  final int initialLikes;
  final int commentCount;
  final Profile? currentProfile;
  final VoidCallback? onCommentTap;

  const SocialInteractionBar({
    super.key,
    required this.itemType,
    required this.itemId,
    required this.initialLikes,
    required this.commentCount,
    required this.currentProfile,
    this.onCommentTap,
  });

  @override
  State<SocialInteractionBar> createState() => _SocialInteractionBarState();
}

class _SocialInteractionBarState extends State<SocialInteractionBar> {
  late int _likes = widget.initialLikes;
  bool _liked = false; // local-only optimistic flag; the source app doesn't
  // track "did I like this" per-viewer in a queryable way for guests, so this
  // mirrors that: a signed-in user's own like state could be derived from a
  // contentlike lookup if needed later.
  bool _busy = false;

  Future<void> _handleLike() async {
    if (widget.currentProfile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in to like this.')),
      );
      return;
    }
    if (_busy) return;
    setState(() => _busy = true);
    final nextLiked = !_liked;
    try {
      final likes = await SocialService.toggleLike(
        itemType: widget.itemType,
        itemId: widget.itemId,
        like: nextLiked,
        userId: widget.currentProfile!.id,
      );
      setState(() {
        _likes = likes;
        _liked = nextLiked;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not update like: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          icon: Icon(_liked ? Icons.favorite : Icons.favorite_border, color: _liked ? Colors.red : null),
          onPressed: _busy ? null : _handleLike,
        ),
        Text('$_likes'),
        const SizedBox(width: 16),
        IconButton(icon: const Icon(Icons.mode_comment_outlined), onPressed: widget.onCommentTap),
        Text('${widget.commentCount}'),
      ],
    );
  }
}

/// "Pray for this" button for prayer requests — one-way, no un-pray, per
/// toggle-prayer's actual behavior. Returns the updated request so callers
/// can refresh last_prayed_at / prayer count in their own state.
class PrayerActionBar extends StatefulWidget {
  final String prayerRequestId;
  final Profile? currentProfile;
  final int prayerCount;
  final ValueChanged<Map<String, dynamic>>? onPrayed;

  const PrayerActionBar({
    super.key,
    required this.prayerRequestId,
    required this.currentProfile,
    required this.prayerCount,
    this.onPrayed,
  });

  @override
  State<PrayerActionBar> createState() => _PrayerActionBarState();
}

class _PrayerActionBarState extends State<PrayerActionBar> {
  bool _busy = false;
  bool _prayed = false;

  Future<void> _handlePray() async {
    if (_busy || _prayed) return;
    setState(() => _busy = true);
    try {
      final updated = await SocialService.togglePrayer(
        prayerRequestId: widget.prayerRequestId,
        userId: widget.currentProfile?.id,
        userName: widget.currentProfile?.fullName,
      );
      setState(() => _prayed = true);
      widget.onPrayed?.call(updated);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not record prayer: $e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: _busy || _prayed ? null : _handlePray,
      icon: Icon(_prayed ? Icons.volunteer_activism : Icons.volunteer_activism_outlined),
      label: Text(_prayed ? "You're praying for this" : 'Pray for this (${widget.prayerCount})'),
    );
  }
}
