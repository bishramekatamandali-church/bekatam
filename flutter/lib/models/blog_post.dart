class BlogPost {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? category;
  final DateTime? date;
  final int likes;

  BlogPost({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.category,
    this.date,
    this.likes = 0,
  });

  factory BlogPost.fromMap(Map<String, dynamic> map) {
    return BlogPost(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      description: map['description'] as String? ?? '',
      imageUrl: map['image_url'] as String?,
      category: map['category'] as String?,
      date: map['date'] != null ? DateTime.tryParse(map['date'] as String) : null,
      likes: (map['likes'] as int?) ?? 0,
    );
  }
}
