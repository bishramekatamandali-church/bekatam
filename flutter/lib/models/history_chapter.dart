class HistoryChapter {
  final String id;
  final int chapterNumber;
  final String title;
  final String content;
  final String status; // draft | published
  final String? imageUrl;
  final String? summary;
  final String? authorName;
  final DateTime? lastPublishedAt;
  final int likes;

  HistoryChapter({
    required this.id,
    required this.chapterNumber,
    required this.title,
    required this.content,
    this.status = 'published',
    this.imageUrl,
    this.summary,
    this.authorName,
    this.lastPublishedAt,
    this.likes = 0,
  });

  factory HistoryChapter.fromMap(Map<String, dynamic> map) {
    return HistoryChapter(
      id: map['id'] as String,
      chapterNumber: (map['chapter_number'] as int?) ?? 0,
      title: map['title'] as String? ?? '',
      content: map['content'] as String? ?? '',
      status: map['status'] as String? ?? 'published',
      imageUrl: map['image_url'] as String?,
      summary: map['summary'] as String?,
      authorName: map['author_name'] as String?,
      lastPublishedAt: map['last_published_at'] != null ? DateTime.tryParse(map['last_published_at'] as String) : null,
      likes: (map['likes'] as int?) ?? 0,
    );
  }
}
