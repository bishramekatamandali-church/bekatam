import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Ports users.ts's multi-admin consensus workflow via the user-action-consensus
/// Edge Function: blocking/deleting a user needs approval from every OTHER
/// active admin before it actually applies.
class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  List<Map<String, dynamic>> _profiles = [];
  List<Map<String, dynamic>> _pendingRequests = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final profiles = await SupabaseService.client.from('profiles').select().order('full_name');
    final pending = await SupabaseService.client
        .from('useractionrequest')
        .select()
        .eq('status', 'pending')
        .order('created_at', ascending: false);
    setState(() {
      _profiles = List<Map<String, dynamic>>.from(profiles as List);
      _pendingRequests = List<Map<String, dynamic>>.from(pending as List);
      _loading = false;
    });
  }

  Future<void> _callConsensus(Map<String, dynamic> body) async {
    try {
      await SupabaseService.client.functions.invoke('user-action-consensus', body: body);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted.')));
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _requestAction(Map<String, dynamic> user, String actionType) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${actionType == 'block' ? 'Block' : 'Delete'} ${user['full_name']}'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(labelText: 'Reason (required)'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Submit Request')),
        ],
      ),
    );
    if (confirmed != true || reasonController.text.trim().isEmpty) return;
    await _callConsensus({
      'op': 'request',
      'user_id': user['id'],
      'action_type': actionType,
      'reason': reasonController.text.trim(),
    });
  }

  Future<void> _approve(Map<String, dynamic> request) async {
    await _callConsensus({'op': 'approve', 'request_id': request['id']});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Users'),
        bottom: TabBar(controller: _tabController, tabs: const [Tab(text: 'All Users'), Tab(text: 'Pending Requests')]),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [_buildUsersList(), _buildPendingList()],
            ),
    );
  }

  Widget _buildUsersList() {
    final myProfile = ref.watch(currentProfileProvider).value;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        itemCount: _profiles.length,
        itemBuilder: (context, i) {
          final u = _profiles[i];
          final isSelf = myProfile != null && u['id'] == myProfile.id;
          return ListTile(
            title: Text(u['full_name'] ?? u['username'] ?? 'Unnamed'),
            subtitle: Text('${u['email'] ?? ''} · ${u['role']} · ${u['account_status']}'),
            trailing: isSelf
                ? const Text('You', style: TextStyle(color: Colors.grey))
                : PopupMenuButton<String>(
                    onSelected: (action) => _requestAction(u, action),
                    itemBuilder: (context) => [
                      if (u['account_status'] != 'blocked')
                        const PopupMenuItem(value: 'block', child: Text('Request Block')),
                      if (u['account_status'] != 'deleted')
                        const PopupMenuItem(value: 'delete', child: Text('Request Delete')),
                    ],
                  ),
          );
        },
      ),
    );
  }

  Widget _buildPendingList() {
    if (_pendingRequests.isEmpty) return const Center(child: Text('No pending requests.'));
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        itemCount: _pendingRequests.length,
        itemBuilder: (context, i) {
          final r = _pendingRequests[i];
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${r['action_type']} request', style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('Requested by ${r['requested_by_admin_name'] ?? 'admin'}'),
                  const SizedBox(height: 4),
                  Text('Reason: ${r['reason'] ?? ''}'),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton(onPressed: () => _approve(r), child: const Text('Approve')),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
