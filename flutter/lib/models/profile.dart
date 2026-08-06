class Profile {
  final String id;
  final String username;
  final String fullName;
  final String email;
  final String role; // user | admin
  final String accountStatus; // active | blocked | deleted
  final String? profileImageUrl;
  final String? bio;

  Profile({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    this.role = 'user',
    this.accountStatus = 'active',
    this.profileImageUrl,
    this.bio,
  });

  bool get isAdmin => role == 'admin';

  factory Profile.fromMap(Map<String, dynamic> map) {
    return Profile(
      id: map['id'] as String,
      username: map['username'] as String? ?? '',
      fullName: map['full_name'] as String? ?? '',
      email: map['email'] as String? ?? '',
      role: map['role'] as String? ?? 'user',
      accountStatus: map['account_status'] as String? ?? 'active',
      profileImageUrl: map['profile_image_url'] as String?,
      bio: map['bio'] as String?,
    );
  }
}
