import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/auth_provider.dart';
import '../../services/supabase_service.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _fullNameController = TextEditingController();
  final _bioController = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(currentProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile')),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load profile: $e')),
        data: (profile) {
          if (profile == null) {
            return const Center(child: Text('Sign in to view your profile.'));
          }
          if (!_initialized) {
            _fullNameController.text = profile.fullName;
            _bioController.text = profile.bio ?? '';
            _initialized = true;
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              CircleAvatar(
                radius: 40,
                backgroundImage: profile.profileImageUrl != null ? NetworkImage(profile.profileImageUrl!) : null,
                child: profile.profileImageUrl == null ? Text(profile.fullName.isNotEmpty ? profile.fullName[0] : '?', style: const TextStyle(fontSize: 28)) : null,
              ),
              const SizedBox(height: 8),
              Center(child: Text('@${profile.username}', style: const TextStyle(color: Colors.grey))),
              if (profile.isAdmin) const Center(child: Padding(padding: EdgeInsets.only(top: 4), child: Chip(label: Text('Admin')))),
              const SizedBox(height: 24),
              TextField(controller: _fullNameController, decoration: const InputDecoration(labelText: 'Full Name')),
              const SizedBox(height: 12),
              TextField(controller: _bioController, decoration: const InputDecoration(labelText: 'Bio'), maxLines: 3),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _saving
                    ? null
                    : () async {
                        setState(() => _saving = true);
                        try {
                          await SupabaseService.client.from('profiles').update({
                            'full_name': _fullNameController.text.trim(),
                            'bio': _bioController.text.trim(),
                          }).eq('id', profile.id);
                          ref.invalidate(currentProfileProvider);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated.')));
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not update profile: $e')));
                          }
                        } finally {
                          if (mounted) setState(() => _saving = false);
                        }
                      },
                child: _saving ? const CircularProgressIndicator() : const Text('Save Changes'),
              ),
            ],
          );
        },
      ),
    );
  }
}
