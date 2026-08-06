class EventItem {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? category;
  final DateTime? date;
  final String? location;
  final String? time;
  final int likes;

  EventItem({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.category,
    this.date,
    this.location,
    this.time,
    this.likes = 0,
  });

  factory EventItem.fromMap(Map<String, dynamic> map) {
    return EventItem(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      imageUrl: map['image_url'] as String?,
      category: map['category'] as String?,
      date: map['date'] != null ? DateTime.tryParse(map['date'] as String) : null,
      location: map['location'] as String?,
      time: map['time'] as String?,
      likes: (map['likes'] as int?) ?? 0,
    );
  }
}
