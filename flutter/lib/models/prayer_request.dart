class PrayerRequest {
  final String id;
  final String? userId;
  final String? userName;
  final String? userProfileImageUrl;
  final String title;
  final String requestText;
  final String? category;
  final String status; // active | prayed_for | answered | archived
  final DateTime submittedAt;
  final DateTime? lastPrayedAt;

  PrayerRequest({
    required this.id,
    this.userId,
    this.userName,
    this.userProfileImageUrl,
    required this.title,
    required this.requestText,
    this.category,
    this.status = 'active',
    required this.submittedAt,
    this.lastPrayedAt,
  });

  factory PrayerRequest.fromMap(Map<String, dynamic> map) {
    return PrayerRequest(
      id: map['id'] as String,
      userId: map['user_id'] as String?,
      userName: map['user_name'] as String?,
      userProfileImageUrl: map['user_profile_image_url'] as String?,
      title: map['title'] as String? ?? '',
      requestText: map['request_text'] as String? ?? '',
      category: map['category'] as String?,
      status: map['status'] as String? ?? 'active',
      submittedAt: DateTime.tryParse(map['submitted_at'] as String? ?? '') ?? DateTime.now(),
      lastPrayedAt: map['last_prayed_at'] != null ? DateTime.tryParse(map['last_prayed_at'] as String) : null,
    );
  }
}
