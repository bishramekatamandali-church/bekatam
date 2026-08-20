import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;
import 'supabase_service.dart';

/// Wraps uploads to the Supabase Storage buckets provisioned for the Flutter
/// application. Sensitive files should use private buckets and signed URLs;
/// profile images use the profile-images bucket according to the existing
/// application storage policy.
class StorageService {
  static final ImagePicker _picker = ImagePicker();

  static Future<String?> pickAndUploadImage({
    required String bucket,
    String? pathPrefix,
    int imageQuality = 85,
  }) async {
    final XFile? picked = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: imageQuality,
    );
    if (picked == null) return null;
    return uploadImage(bucket: bucket, picked: picked, pathPrefix: pathPrefix);
  }

  static Future<String> uploadImage({
    required String bucket,
    required XFile picked,
    String? pathPrefix,
  }) async {
    final bytes = await picked.readAsBytes();
    final ext = picked.name.contains('.') ? picked.name.split('.').last : 'jpg';
    final fileName = '${DateTime.now().millisecondsSinceEpoch}.$ext';
    final path = pathPrefix != null && pathPrefix.isNotEmpty ? '$pathPrefix/$fileName' : fileName;

    await SupabaseService.client.storage.from(bucket).uploadBinary(
      path,
      bytes,
      fileOptions: FileOptions(contentType: picked.mimeType ?? 'image/jpeg', upsert: true),
    );

    return SupabaseService.client.storage.from(bucket).getPublicUrl(path);
  }

  static Future<String> uploadProfileImage(XFile picked, String userId) async {
    return uploadImage(bucket: 'profile-images', picked: picked, pathPrefix: userId);
  }
}
