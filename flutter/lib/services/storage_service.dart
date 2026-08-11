import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;
import 'supabase_service.dart';

/// Wraps uploads to the Supabase Storage buckets provisioned in Phase 4
/// (content-media, donation-qr, profile-images, receipts). Mirrors what
/// `frontend/src/utils/cloudinary.ts` did for the React app — pick a file,
/// upload it, get back a public URL to store in the relevant text column.
class StorageService {
  static final ImagePicker _picker = ImagePicker();

  /// Opens the device image picker, uploads the result to [bucket] under an
  /// optional [pathPrefix] (e.g. a user id or record id folder), and returns
  /// the public URL. Returns null if the user cancelled the picker.
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
    final Uint8List bytes = await picked.readAsBytes();
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
}
