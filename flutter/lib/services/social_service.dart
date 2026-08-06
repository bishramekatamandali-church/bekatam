import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

/// Calls the deployed content-interactions / toggle-prayer / create-comment
/// Edge Functions. All three are `verify_jwt: false` (fully public, matching
/// the original Express routes which allow guest likes/prayers/comments via
/// guestEmail/guestPhone) — auth, when present, is passed as userId/userName
/// from the caller's own profile rather than relying on the JWT.
class SocialService {
  SocialService._();

  static final _functions = SupabaseService.client.functions;

  /// itemType must be one of: sermon, event, blogPost, news, historyChapter,
  /// prayerRequest, testimonial (see TABLE_MAP in content-interactions).
  static Future<int> toggleLike({
    required String itemType,
    required String itemId,
    required bool like,
    String? userId,
    String? guestName,
    String? guestEmail,
    String? guestPhone,
  }) async {
    final res = await _functions.invoke(
      'content-interactions/toggle-like/$itemType/$itemId',
      method: HttpMethod.post,
      body: {
        'action': like ? 'like' : 'unlike',
        if (userId != null) 'userId': userId,
        if (guestName != null) 'guestName': guestName,
        if (guestEmail != null) 'guestEmail': guestEmail,
        if (guestPhone != null) 'guestPhone': guestPhone,
      },
    );
    final data = res.data is String ? jsonDecode(res.data as String) : res.data;
    return (data as Map)['likes'] as int? ?? 0;
  }

  static Future<void> share({required String itemType, required String itemId, required String userId, required String userName}) async {
    await _functions.invoke(
      'content-interactions/share/$itemType/$itemId',
      method: HttpMethod.post,
      body: {'userId': userId, 'userName': userName},
    );
  }

  /// One-way "pray for this" — no un-pray. Returns the updated prayer
  /// request row (with nested comment(*) and prayer(*), same as the
  /// original prayerRequests.ts response shape).
  static Future<Map<String, dynamic>> togglePrayer({
    required String prayerRequestId,
    String? userId,
    String? userName,
    String? guestEmail,
    String? guestPhone,
  }) async {
    final res = await _functions.invoke(
      'toggle-prayer/$prayerRequestId',
      method: HttpMethod.post,
      body: {
        if (userId != null) 'userId': userId,
        if (userName != null) 'userName': userName,
        if (guestEmail != null) 'guestEmail': guestEmail,
        if (guestPhone != null) 'guestPhone': guestPhone,
      },
    );
    final data = res.data is String ? jsonDecode(res.data as String) : res.data;
    return Map<String, dynamic>.from(data as Map);
  }

  /// itemType must be one of: sermon, event, blogPost, news/newsItem,
  /// historyChapter, prayerRequest, testimonial (see FK_COLUMN map).
  static Future<Map<String, dynamic>> createComment({
    required String itemType,
    required String itemId,
    required String text,
    required String userName,
    String? userId,
    String? userProfileImageUrl,
    bool isGuest = false,
    String? guestEmail,
    String? guestPhone,
  }) async {
    final res = await _functions.invoke(
      'create-comment',
      method: HttpMethod.post,
      body: {
        'itemType': itemType,
        'itemId': itemId,
        'text': text,
        'userName': userName,
        if (userId != null) 'userId': userId,
        if (userProfileImageUrl != null) 'userProfileImageUrl': userProfileImageUrl,
        'isGuest': isGuest,
        if (guestEmail != null) 'guestEmail': guestEmail,
        if (guestPhone != null) 'guestPhone': guestPhone,
      },
    );
    final data = res.data is String ? jsonDecode(res.data as String) : res.data;
    return Map<String, dynamic>.from(data as Map);
  }
}
