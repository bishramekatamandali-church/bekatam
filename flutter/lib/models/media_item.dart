class MediaItem {
  final String id;
  final String title;
  final String? description;
  final String url;
  final String mediaType; // image | video
  final String? category;

  MediaItem({
    required this.id,
    required this.title,
    this.description,
    required this.url,
    this.mediaType = 'image',
    this.category,
  });

  factory MediaItem.fromMap(Map<String, dynamic> map) {
    return MediaItem(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String?,
      url: map['url'] as String? ?? '',
      mediaType: map['media_type'] as String? ?? 'image',
      category: map['category'] as String?,
    );
  }
}
