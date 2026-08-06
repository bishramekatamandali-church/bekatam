class Sermon {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? category;
  final DateTime? date;
  final String? speaker;
  final String? scripture;
  final String? videoUrl;
  final String? audioUrl;
  final String? fullContent;
  final String? location;
  final int likes;

  Sermon({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.category,
    this.date,
    this.speaker,
    this.scripture,
    this.videoUrl,
    this.audioUrl,
    this.fullContent,
    this.location,
    this.likes = 0,
  });

  factory Sermon.fromMap(Map<String, dynamic> map) {
    return Sermon(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      imageUrl: map['image_url'] as String?,
      category: map['category'] as String?,
      date: map['date'] != null ? DateTime.tryParse(map['date'] as String) : null,
      speaker: map['speaker'] as String?,
      scripture: map['scripture'] as String?,
      videoUrl: map['video_url'] as String?,
      audioUrl: map['audio_url'] as String?,
      fullContent: map['full_content'] as String?,
      location: map['location'] as String?,
      likes: (map['likes'] as int?) ?? 0,
    );
  }
}
