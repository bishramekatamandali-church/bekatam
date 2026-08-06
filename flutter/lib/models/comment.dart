class Comment {
  final String id;
  final String? userId;
  final String userName;
  final String? userProfileImageUrl;
  final bool isGuest;
  final String text;
  final DateTime timestamp;

  Comment({
    required this.id,
    this.userId,
    required this.userName,
    this.userProfileImageUrl,
    this.isGuest = false,
    required this.text,
    required this.timestamp,
  });

  factory Comment.fromMap(Map<String, dynamic> map) {
    return Comment(
      id: map['id'] as String,
      userId: map['user_id'] as String?,
      userName: map['user_name'] as String? ?? 'Guest',
      userProfileImageUrl: map['user_profile_image_url'] as String?,
      isGuest: map['is_guest'] as bool? ?? false,
      text: map['text'] as String? ?? '',
      timestamp: DateTime.tryParse(map['timestamp'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

/// Maps a SocialService itemType to the comment table's FK column, matching
/// FK_COLUMN in the real create-comment Edge Function.
const Map<String, String> commentFkColumn = {
  'sermon': 'sermon_id',
  'event': 'event_id',
  'blogPost': 'blog_post_id',
  'news': 'news_item_id',
  'historyChapter': 'history_chapter_id',
  'prayerRequest': 'prayer_request_id',
  'testimonial': 'testimonial_id',
};
