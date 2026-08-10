import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/ministry.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import '../auth/login_screen.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

/// Ports SingleMinistryPage.tsx: full ministry guidelines + a join-request
/// flow that tracks the member's latest request status (pending / approved
/// / rejected) against `ministryjoinrequest`, same as the React page.
final _latestJoinRequestProvider =
    FutureProvider.family<Map<String, dynamic>?, ({String ministryId, String userId})>((ref, args) async {
  final rows = await SupabaseService.client
      .from('ministryjoinrequest')
      .select()
      .eq('ministry_id', args.ministryId)
      .eq('user_id', args.userId)
      .order('request_date', ascending: false)
      .limit(1);
  final list = rows as List;
  return list.isEmpty ? null : list.first as Map<String, dynamic>;
});

class MinistryDetailScreen extends ConsumerWidget {
  final Ministry ministry;
  const MinistryDetailScreen({super.key, required this.ministry});

  Color _statusColor(String status) {
    switch (status) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  String _statusMessage(Map<String, dynamic> request) {
    final status = request['status'] as String? ?? 'pending';
    final name = ministry.title;
    if (status == 'approved') return 'Great news! Your request to join "$name" has been approved.';
    if (status == 'rejected') return 'Thank you for your interest. Your request to join "$name" was not approved.';
    return 'Your request to join "$name" has been submitted and is under review.';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(currentProfileProvider);
    final profile = profileAsync.valueOrNull;
    final existingRequestAsync = profile == null
        ? null
        : ref.watch(_latestJoinRequestProvider((ministryId: ministry.id, userId: profile.id)));

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (ministry.imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: CachedNetworkImage(imageUrl: ministry.imageUrl!, height: 200, fit: BoxFit.cover, width: double.infinity),
            ),
          const SizedBox(height: 16),
          Text(ministry.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          if (ministry.category != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(ministry.category!.replaceAll('_', ' '), style: const TextStyle(color: Color(0xFF14B8A6), fontWeight: FontWeight.w600)),
            ),
          const SizedBox(height: 8),
          if (ministry.leader != null) Text('Leader: ${ministry.leader}', style: const TextStyle(color: Colors.grey)),
          if (ministry.meetingTime != null) Text('Meeting Time: ${ministry.meetingTime}', style: const TextStyle(color: Colors.grey)),
          const Divider(height: 32),
          const Text('Ministry Guidelines & Expectations', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(ministry.description.isEmpty ? "Details about this ministry's guidelines and expectations will be updated soon." : ministry.description),
          const SizedBox(height: 24),
          if (existingRequestAsync != null)
            existingRequestAsync.when(
              loading: () => const SizedBox(),
              error: (_, __) => const SizedBox(),
              data: (request) {
                if (request == null) {
                  return FilledButton.icon(
                    onPressed: () => _openJoinForm(context, ref, profile!),
                    icon: const Icon(Icons.group_add),
                    label: const Text('Get Involved / Join'),
                  );
                }
                final status = request['status'] as String? ?? 'pending';
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(8)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text('Your latest request status', style: TextStyle(fontWeight: FontWeight.w600)),
                              const Spacer(),
                              Chip(
                                label: Text(status, style: const TextStyle(fontSize: 12)),
                                backgroundColor: _statusColor(status).withOpacity(0.15),
                                labelStyle: TextStyle(color: _statusColor(status)),
                                visualDensity: VisualDensity.compact,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(_statusMessage(request), style: const TextStyle(color: Colors.grey)),
                          if ((request['admin_notes'] as String?)?.isNotEmpty ?? false) ...[
                            const SizedBox(height: 8),
                            Text('Admin note: ${request['admin_notes']}', style: const TextStyle(fontStyle: FontStyle.italic)),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (status == 'rejected')
                      OutlinedButton(
                        onPressed: () => _openJoinForm(context, ref, profile!),
                        child: const Text('Submit a New Request'),
                      ),
                  ],
                );
              },
            )
          else
            FilledButton.icon(
              onPressed: () {
                if (profile == null) {
                  Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
                  return;
                }
                _openJoinForm(context, ref, profile);
              },
              icon: const Icon(Icons.group_add),
              label: const Text('Get Involved / Join'),
            ),
        ],
      ),
    );
  }

  void _openJoinForm(BuildContext context, WidgetRef ref, dynamic profile) {
    final messageController = TextEditingController();
    bool agreed = false;
    String? error;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text('Join ${ministry.title}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: messageController,
                  decoration: const InputDecoration(labelText: 'Message (optional)'),
                  maxLines: 3,
                ),
                const SizedBox(height: 8),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  value: agreed,
                  onChanged: (v) => setState(() => agreed = v ?? false),
                  title: const Text('I have read and agree to the Ministry Guidelines & Expectations.'),
                ),
                if (error != null) Text(error!, style: const TextStyle(color: Colors.red)),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                if (!agreed) {
                  setState(() => error = 'You must agree to the guidelines to submit your request.');
                  return;
                }
                await SupabaseService.client.from('ministryjoinrequest').insert({
                  'user_id': profile.id,
                  'user_name': profile.fullName,
                  'user_email': profile.email,
                  'ministry_id': ministry.id,
                  'ministry_name': ministry.title,
                  'ministry_guidelines': ministry.description,
                  'message': messageController.text.trim(),
                });
                ref.invalidate(_latestJoinRequestProvider((ministryId: ministry.id, userId: profile.id)));
                if (ctx.mounted) Navigator.of(ctx).pop();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Your request to join has been submitted.')),
                  );
                }
              },
              child: const Text('Submit Request'),
            ),
          ],
        ),
      ),
    );
  }
}
