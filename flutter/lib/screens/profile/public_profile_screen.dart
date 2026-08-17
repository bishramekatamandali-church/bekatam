import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/prayer_request.dart';
import '../../models/profile.dart';
import '../../services/auth_provider.dart';
import '../../services/supabase_service.dart';
import '../../theme/app_breakpoints.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/social_interaction_bar.dart';

/// Public profile view. The source table contains private account fields such
/// as email, phone, role, and notification preferences, so this screen reads
/// only from the restricted public_profile view.
class PublicProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const PublicProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<PublicProfileScreen> createState() =>
      _PublicProfileScreenState();
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
      final profileRow = await SupabaseService.client
          .from('public_profile')
          .select()
          .eq('id', widget.userId)
          .maybeSingle();
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
        _prayers = (prayerRows as List)
            .map((r) => PrayerRequest.fromMap(r as Map<String, dynamic>))
            .toList();
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
    final myProfile = ref.watch(currentProfileProvider).valueOrNull;
    if (myProfile != null && myProfile.id == widget.userId) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.of(context).pop();
      });
    }

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar:
          MediaQuery.sizeOf(context).width < AppBreakpoints.lg
              ? const AppBottomNavBar()
              : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('Failed to load profile: $_error'))
              : _target == null
                  ? const Center(
                      child: Text('User not found or profile is private.'),
                    )
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
                                    backgroundImage:
                                        _target!.profileImageUrl != null
                                            ? CachedNetworkImageProvider(
                                                _target!.profileImageUrl!,
                                              )
                                            : null,
                                    child: _target!.profileImageUrl == null
                                        ? const Icon(Icons.person, size: 44)
                                        : null,
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _target!.fullName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    '@${_target!.username}',
                                    style: TextStyle(color: Colors.grey[600]),
                                  ),
                                  if (_target!.bio != null &&
                                      _target!.bio!.isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    Text(
                                      _target!.bio!,
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            "${_target!.fullName.split(' ').first}'s Public Prayer Requests",
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          if (_prayers.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(
                                child: Text(
                                  'No public prayer requests available.',
                                ),
                              ),
                            )
                          else
                            ..._prayers.map(
                              (r) => Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        r.title,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
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
