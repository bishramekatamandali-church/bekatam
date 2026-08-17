import 'package:flutter/material.dart';
import 'admin_reports_screen.dart';
import 'admin_users_screen.dart';
import 'admin_content_crud_screen.dart';
import 'admin_events_screen.dart';
import 'admin_church_members_screen.dart';
import 'admin_finance_screen.dart';
import 'admin_meetings_screen.dart';
import 'admin_expenses_screen.dart';
import 'admin_ministries_screen.dart';
import 'admin_moderation_screen.dart';
import 'admin_fellowship_screen.dart';
import 'admin_contact_messages_screen.dart';
import 'admin_advertisements_screen.dart';
import 'admin_site_content_screen.dart';
import 'admin_activity_log_screen.dart';
import 'admin_donate_content_screen.dart';
import 'admin_history_screen.dart';
import 'admin_seo_tools_screen.dart';
import 'admin_jumbo_report_final_screen.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';
import '../../services/supabase_service.dart';
import '../../services/admin_log_service.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: const AppHeader(), endDrawer: const AppNavDrawer(),
    bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
    body: ListView(padding: const EdgeInsets.all(16), children: [
      const _OverviewCard(), const SizedBox(height: 16),
      _AdminTile(icon: Icons.picture_as_pdf, title: 'Reports', subtitle: 'Financial, calendar, donor list, and single-record PDF reports', onTap: () => _push(context, const AdminReportsScreen())),
      _AdminTile(icon: Icons.picture_as_pdf_outlined, title: 'Jumbo Report', subtitle: 'Combined administrative PDF report', onTap: () => _push(context, const AdminJumboReportFinalScreen())),
      _AdminTile(icon: Icons.manage_accounts, title: 'Manage Users', subtitle: 'Block/delete requests with multi-admin approval', onTap: () => _push(context, const AdminUsersScreen())),
      _AdminTile(icon: Icons.church, title: 'Sermons', subtitle: 'Add, edit, and remove sermons', onTap: () => _push(context, const AdminContentCrudScreen(config: AdminContentConfig(table: 'sermon', displayName: 'Sermons', categories: ['Sermon_Series', 'Guest_Speaker', 'Topical_Sermon', 'Special_Event_Sermon', 'Bible_Study'], hasSermonFields: true)))),
      _AdminTile(icon: Icons.event, title: 'Events', subtitle: 'Add, edit, and remove events', onTap: () => _push(context, const AdminEventsScreen())),
      _AdminTile(icon: Icons.article, title: 'Blog Posts', subtitle: 'Add, edit, and remove devotionals and blog posts', onTap: () => _push(context, const AdminContentCrudScreen(config: AdminContentConfig(table: 'blogpost', displayName: 'Blog Posts', categories: ['Church_Life', 'Biblical_Study', 'Devotionals', 'Community_News', 'Testimonies'])))),
      _AdminTile(icon: Icons.campaign, title: 'News', subtitle: 'Add, edit, and remove announcements', onTap: () => _push(context, const AdminContentCrudScreen(config: AdminContentConfig(table: 'newsitem', displayName: 'News', categories: ['Church_Announcements', 'Community_Updates', 'Special_Reports', 'Mission_News', 'Youth_Activities', 'Pastoral_Messages'])))),
      _AdminTile(icon: Icons.history_edu, title: 'Church History', subtitle: 'Manage history chapters and milestones', onTap: () => _push(context, const AdminHistoryScreen())),
      _AdminTile(icon: Icons.search, title: 'SEO Tools', subtitle: 'Search Console, Analytics, Trends, and SEO research tools', onTap: () => _push(context, const AdminSeoToolsScreen())),
      _AdminTile(icon: Icons.groups_2, title: 'Church Members', subtitle: 'Membership records', onTap: () => _push(context, const AdminChurchMembersScreen())),
      _AdminTile(icon: Icons.account_balance_wallet, title: 'Finance', subtitle: 'Donations, collections, and financial summary', onTap: () => _push(context, const AdminFinanceScreen())),
      _AdminTile(icon: Icons.receipt_long, title: 'Expenses', subtitle: 'Track church expenses and approvals', onTap: () => _push(context, const AdminExpensesScreen())),
      _AdminTile(icon: Icons.forum, title: 'Meetings & Decisions', subtitle: 'Meeting logs, agendas, minutes, and decisions', onTap: () => _push(context, const AdminMeetingsScreen())),
      _AdminTile(icon: Icons.diversity_3, title: 'Ministries', subtitle: 'Manage ministries and review join requests', onTap: () => _push(context, const AdminMinistriesScreen())),
      _AdminTile(icon: Icons.shield_moon, title: 'Content Moderation', subtitle: 'Review and hide prayer requests and testimonials', onTap: () => _push(context, const AdminModerationScreen())),
      _AdminTile(icon: Icons.event_repeat, title: 'Fellowship Rosters & Schedules', subtitle: 'Recurring fellowship rosters and scheduled dates', onTap: () => _push(context, const AdminFellowshipScreen())),
      _AdminTile(icon: Icons.mail_outline, title: 'Contact Messages', subtitle: 'Inbox from the public contact form', onTap: () => _push(context, const AdminContactMessagesScreen())),
      _AdminTile(icon: Icons.ads_click, title: 'Advertisements', subtitle: 'Banner ads, with AI-generated name and alt text', onTap: () => _push(context, const AdminAdvertisementsScreen())),
      _AdminTile(icon: Icons.web, title: 'Site Content', subtitle: 'About sections, branch churches, key persons, media library', onTap: () => _push(context, const AdminSiteContentScreen())),
      _AdminTile(icon: Icons.volunteer_activism, title: 'Donate Page Content', subtitle: 'eSewa/bank details, QR codes, and donation instructions', onTap: () => _push(context, const AdminDonateContentScreen())),
      _AdminTile(icon: Icons.receipt_long_outlined, title: 'Activity Log', subtitle: 'Audit trail of admin actions', onTap: () => _push(context, const AdminActivityLogScreen())),
    ]),
  );
  static void _push(BuildContext context, Widget screen) => Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
}

class _OverviewCard extends StatefulWidget { const _OverviewCard(); @override State<_OverviewCard> createState() => _OverviewCardState(); }
class _OverviewCardState extends State<_OverviewCard> {
  int? _userCount; bool _sending = false;
  @override void initState() { super.initState(); _loadCount(); }
  Future<void> _loadCount() async { try { final res = await SupabaseService.client.from('profiles').select('id'); if (mounted) setState(() => _userCount = (res as List).length); } catch (_) {} }
  Future<void> _broadcast() async {
    final controller = TextEditingController();
    final message = await showDialog<String>(context: context, builder: (ctx) => AlertDialog(title: const Text('Broadcast Feature Update'), content: TextField(controller: controller, maxLines: 3, decoration: const InputDecoration(labelText: 'Message')), actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(ctx, controller.text.trim()), child: const Text('Send'))]));
    if (message == null || message.isEmpty) return; setState(() => _sending = true);
    try { final users = await SupabaseService.client.from('profiles').select('id'); final rows = (users as List).map((u) => {'target_user_id': u['id'], 'message': '✨ New Feature Update: $message', 'link': '/', 'type': 'feature_update', 'read': false}).toList(); if (rows.isNotEmpty) await SupabaseService.client.from('notification').insert(rows); await AdminLogService.log(action: 'Broadcasted Feature Update', details: 'Message: $message'); if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Feature update sent to ${rows.length} users.'))); } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Broadcast failed: $e'))); } finally { if (mounted) setState(() => _sending = false); }
  }
  @override Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [const Icon(Icons.people_outline), const SizedBox(width: 8), Text(_userCount == null ? 'Registered users: —' : 'Registered users: $_userCount', style: const TextStyle(fontWeight: FontWeight.w600))]), const SizedBox(height: 12), OutlinedButton.icon(onPressed: _sending ? null : _broadcast, icon: _sending ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.campaign_outlined), label: const Text('Broadcast Feature Update'))])));
}
class _AdminTile extends StatelessWidget { final IconData icon; final String title; final String subtitle; final VoidCallback onTap; const _AdminTile({required this.icon, required this.title, required this.subtitle, required this.onTap}); @override Widget build(BuildContext context) { final primary = Theme.of(context).colorScheme.primary; return Card(margin: const EdgeInsets.only(bottom: 10), child: ListTile(contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6), leading: CircleAvatar(radius: 22, backgroundColor: primary.withOpacity(0.1), child: Icon(icon, color: primary)), title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(subtitle, style: TextStyle(color: Colors.grey[600], fontSize: 13)), trailing: const Icon(Icons.chevron_right), onTap: onTap)); } }
