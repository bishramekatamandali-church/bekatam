class BranchChurch {
  final String id;
  final String name;
  final String? address;
  final String? pastorName;
  final String? phone;
  final String? email;
  final String? serviceTimes;
  final String? imageUrl;
  final String? description;

  BranchChurch({
    required this.id,
    required this.name,
    this.address,
    this.pastorName,
    this.phone,
    this.email,
    this.serviceTimes,
    this.imageUrl,
    this.description,
  });

  factory BranchChurch.fromMap(Map<String, dynamic> map) {
    return BranchChurch(
      id: map['id'] as String,
      name: map['name'] as String? ?? '',
      address: map['address'] as String?,
      pastorName: map['pastor_name'] as String?,
      phone: map['phone'] as String?,
      email: map['email'] as String?,
      serviceTimes: map['service_times'] as String?,
      imageUrl: map['image_url'] as String?,
      description: map['description'] as String?,
    );
  }
}
