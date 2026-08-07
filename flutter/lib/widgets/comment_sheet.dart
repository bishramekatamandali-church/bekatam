import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../models/comment.dart';
import '../models/profile.dart';
import '../services/supabase_service.dart';
import '../services/social_service.dart';
import '../screens/profile/public_profile_screen.dart';

/// Opens a modal bottom sheet with the real comment thread for one content
/// item, backed by the `comment` table (read) and the `create-comment` Edge
/// Function (write) — see FK_COLUMN in that function for the itemType set
/// this supports.
Future<void> showCommentSheet({
  required BuildContext context,
  required String itemType,
  required String itemId,
  required Profile? currentProfile,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (_) => CommentSheet(itemType: itemType, itemId: itemId, currentProfile: currentProfile),
  );
}

class CommentSheet extends StatefulWidget {
  final String itemType;
  final String itemId;
  final Profile? currentProfile;

  const CommentSheet({super.key, required this.itemType, required this.itemId, required this.currentProfile});

  @override
  State<CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<CommentSheet> {
  final _controller = TextEditingController();
  List<Comment> _comments = [];
  bool _loading = true;
  bool _posting = false;

  String get _fkColumn => commentFkColumn[widget.itemType] ?? 'sermon_id';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client
        .from('comment')
        .select()
        .eq(_fkColumn, widget.itemId)
        .order('timestamp', ascending: true);
    setState(() {
      _comments = (rows as List).map((r) => Comment.fromMap(r as Map<String, dynamic>)).toList();
      _loading = false;
    });
  }

  Future<void> _post() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    if (widget.currentProfile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sign in to comment.')));
      return;
    }
    setState(() => _posting = true);
    try {
      await SocialService.createComment(
        itemType: widget.itemType,
        itemId: widget.itemId,
        text: text,
        userName: widget.currentProfile!.fullName,
        userId: widget.currentProfile!.id,
        userProfileImageUrl: widget.currentProfile!.profileImageUrl,
      );
      _controller.clear();
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not post comment: $e')));
    } finally {
      if (mounted) setState(() => _posting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.all(12),
                child: Text('Comments', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : _comments.isEmpty
                        ? const Center(child: Text('No comments yet. Be the first.'))
                        : ListView.builder(
                            controller: scrollController,
                            itemCount: _comments.length,
                            itemBuilder: (context, i) {
                              final c = _comments[i];
                              return ListTile(
                                leading: CircleAvatar(
                                  backgroundImage: c.userProfileImageUrl != null ? NetworkImage(c.userProfileImageUrl!) : null,
                                  child: c.userProfileImageUrl == null ? Text(c.userName.isNotEmpty ? c.userName[0] : '?') : null,
                                ),
                                title: Text(c.userName),
                                subtitle: Text(c.text),
                                trailing: Text(timeago.format(c.timestamp), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                onTap: (c.isGuest || c.userId == null)
                                    ? null
                                    : () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: c.userId!)),
                                        );
                                      },
                              );
                            },
                          ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          decoration: const InputDecoration(hintText: 'Write a comment...', border: OutlineInputBorder()),
                        ),
                      ),
                      IconButton(
                        icon: _posting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.send),
                        onPressed: _posting ? null : _post,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
