import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/profile.dart';
import '../../models/prayer_request.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../../widgets/social_interaction_bar.dart';

/// Ports PublicProfilePage.tsx: shows another user's basic profile info
/// plus their public/anonymous prayer requests.
///
/// NOTE on a quirk carried over from the real source for parity: the
/// original filters prayer requests by `postedByAdminId === targetUser.id`
/// (not `userId`), which looks like it should be `userId` but isn't — this
/// only ever matches requests an admin posted on this user's behalf. Since
/// the goal is "no feature changes", that exact filter is replicated below
/// rather than "fixed".
class PublicProfileScreen extends ConsumerStatefulWidget {
  final String userId;
  const PublicProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<PublicProfileScreen> createState() => _PublicProfileScreenState();
}

class _PublicProfileScreenState extends ConsumerState<PublicProfileScreen> {
  Profile? _target;
  List<PrayerRequest> _prayers = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final profileRow =
          await SupabaseService.client.from('profiles').select().eq('id', widget.userId).maybeSingle();
      if (profileRow == null) {
        setState(() {
          _target = null;
          _loading = false;
        });
        return;
      }
      final target = Profile.fromMap(profileRow);
      final prayerRows = await SupabaseService.client
          .from('prayerrequest')
          .select()
          .eq('posted_by_admin_id', widget.userId)
          .eq('is_deleted', false)
          .inFilter('visibility', ['public', 'anonymous']);
      setState(() {
        _target = target;
        _prayers = (prayerRows as List).map((r) => PrayerRequest.fromMap(r as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // If this happens to be the signed-in user's own id, the original
    // redirects to /profile instead of showing the public view.
    final myProfile = ref.watch(currentProfileProvider).valueOrNull;
    if (myProfile != null && myProfile.id == widget.userId) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.of(context).pop();
      });
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Failed to load profile: $_error'))
              : _target == null
                  ? const Center(child: Text('User not found.'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                children: [
                                  CircleAvatar(
                                    radius: 44,
                                    backgroundImage: _target!.profileImageUrl != null
                                        ? CachedNetworkImageProvider(_target!.profileImageUrl!)
                                        : null,
                                    child: _target!.profileImageUrl == null
                                        ? const Icon(Icons.person, size: 44)
                                        : null,
                                  ),
                                  const SizedBox(height: 12),
                                  Text(_target!.fullName,
                                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
                                  Text('@${_target!.username}', style: TextStyle(color: Colors.grey[600])),
                                  if (_target!.bio != null && _target!.bio!.isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    Text(_target!.bio!, textAlign: TextAlign.center),
                                  ],
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _InfoTile(label: 'Email', value: _target!.email),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: _InfoTile(label: 'Contact Number', value: _target!.phone ?? 'Not provided'),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text("${_target!.fullName.split(' ').first}'s Public Prayer Requests",
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          if (_prayers.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(child: Text('No public prayer requests available.')),
                            )
                          else
                            ..._prayers.map(
                              (r) => Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(r.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 6),
                                      Text(r.requestText),
                                      const SizedBox(height: 8),
                                      PrayerActionBar(
                                        prayerRequestId: r.id,
                                        currentProfile: myProfile,
                                        prayerCount: 0,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  const _InfoTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: TextStyle(fontSize: 10, color: Colors.grey[600], letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
