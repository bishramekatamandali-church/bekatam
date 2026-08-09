class EventItem {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? category;
  final DateTime? date;
  final String? location;
  final String? time;
  final String? contactPerson;
  final String? contactEmail;
  final String? contactPhone;
  final String? registrationLink;
  final int? capacity;
  final bool isFeeRequired;
  final String? feeAmount;
  final String? videoUrl;
  final String? audioUrl;
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
    this.contactPerson,
    this.contactEmail,
    this.contactPhone,
    this.registrationLink,
    this.capacity,
    this.isFeeRequired = false,
    this.feeAmount,
    this.videoUrl,
    this.audioUrl,
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
      contactPerson: map['contact_person'] as String?,
      contactEmail: map['contact_email'] as String?,
      contactPhone: map['contact_phone'] as String?,
      registrationLink: map['registration_link'] as String?,
      capacity: map['capacity'] as int?,
      isFeeRequired: map['is_fee_required'] as bool? ?? false,
      // fee_amount is a free-form `text` column in the real schema (matches
      // SingleEventPage.tsx rendering it as raw text, e.g. "Rs 500" or
      // "Details in link") — not numeric. Was previously cast as `num?`,
      // which threw on any non-empty/non-null value including the common
      // "" case.
      feeAmount: map['fee_amount'] as String?,
      videoUrl: map['video_url'] as String?,
      audioUrl: map['audio_url'] as String?,
      likes: (map['likes'] as int?) ?? 0,
    );
  }
}
