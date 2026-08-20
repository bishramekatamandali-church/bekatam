import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/auth_provider.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';
import '../../services/storage_service.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _fullNameController = TextEditingController();
  final _bioController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _saving = false;
  bool _initialized = false;
  bool _uploadingAvatar = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _bioController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<List<Map<String, dynamic>>> _recentActivity(String userId) async {
    final rows = await SupabaseService.client.from('frontendactivitylog').select('timestamp,description,type,item_type').eq('user_id', userId).order('timestamp', ascending: false).limit(10);
    return List<Map<String, dynamic>>.from(rows as List);
  }

  Future<void> _changeAvatar(String profileId) async {
    setState(() => _uploadingAvatar = true);
    try {
      final url = await StorageService.pickAndUploadImage(bucket: 'profile-images', pathPrefix: profileId);
      if (url != null) {
        await SupabaseService.client.from('profiles').update({'profile_image_url': url}).eq('id', profileId);
        ref.invalidate(currentProfileProvider);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not update photo: $e')));
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _saveProfile(String profileId, String currentEmail) async {
    final name = _fullNameController.text.trim();
    final bio = _bioController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    if (name.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Full name is required.'))); return; }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid email address.'))); return; }
    setState(() => _saving = true);
    try {
      if (email != currentEmail) await SupabaseService.auth.updateUser(UserAttributes(email: email));
      await SupabaseService.client.from('profiles').update({'full_name': name, 'bio': bio, 'phone': phone.isEmpty ? null : phone, 'email': email}).eq('id', profileId);
      ref.invalidate(currentProfileProvider);
      if (context.mounted) {
        final message = email == currentEmail ? 'Profile updated.' : 'Profile updated. Check your email to confirm the new address if confirmation is required.';
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not update profile: $e')));
    } finally { if (mounted) setState(() => _saving = false); }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(currentProfileProvider);
    return Scaffold(
      appBar: const AppHeader(), endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load profile: $e')),
        data: (profile) {
          if (profile == null) return const Center(child: Text('Sign in to view your profile.'));
          if (!_initialized) {
            _fullNameController.text = profile.fullName;
            _bioController.text = profile.bio ?? '';
            _emailController.text = profile.email;
