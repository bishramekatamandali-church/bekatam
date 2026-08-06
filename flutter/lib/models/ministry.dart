class Ministry {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? category;
  final String? leader;
  final String? meetingTime;

  Ministry({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.category,
    this.leader,
    this.meetingTime,
  });

  factory Ministry.fromMap(Map<String, dynamic> map) {
    return Ministry(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      imageUrl: map['image_url'] as String?,
      category: map['category'] as String?,
      leader: map['leader'] as String?,
      meetingTime: map['meeting_time'] as String?,
    );
  }
}
