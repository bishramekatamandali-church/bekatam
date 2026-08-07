import 'package:flutter/material.dart';
import 'admin_reports_screen.dart';
import 'admin_users_screen.dart';
import 'admin_content_crud_screen.dart';
import 'admin_events_screen.dart';
import 'admin_church_members_screen.dart';
import 'admin_finance_screen.dart';
import 'admin_meetings_screen.dart';
import 'admin_expenses_screen.dart';

/// Ports admin/AdminDashboardPage.tsx's section navigation. Wired so far:
/// Reports (all 9 PDF report types + donor list), Manage Users (multi-admin
/// consensus workflow), and Sermons/Events/Blog Posts/News (content CRUD —
/// Sermons/Blog/News share one generic screen since they're near-identical
/// in schema; Events gets its own screen for its extra fields). The
/// remaining ~21 admin CRUD pages are plain-CRUD-under-RLS per the earlier
/// 33-resource audit and are the next pass, listed below as "Coming next".
class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Dashboard')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _AdminTile(
            icon: Icons.picture_as_pdf,
            title: 'Reports',
            subtitle: 'Financial, calendar, donor list, and single-record PDF reports',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminReportsScreen())),
          ),
          _AdminTile(
            icon: Icons.manage_accounts,
            title: 'Manage Users',
            subtitle: 'Block/delete requests with multi-admin approval',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminUsersScreen())),
          ),
          _AdminTile(
            icon: Icons.church,
            title: 'Sermons',
            subtitle: 'Add, edit, and remove sermons',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const AdminContentCrudScreen(
                    config: AdminContentConfig(
                        table: 'sermon',
                        displayName: 'Sermons',
                        categories: ['Sermon_Series', 'Guest_Speaker', 'Topical_Sermon', 'Special_Event_Sermon', 'Bible_Study'],
                        hasSermonFields: true)))),
          ),
          _AdminTile(
            icon: Icons.event,
            title: 'Events',
            subtitle: 'Add, edit, and remove events',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminEventsScreen())),
          ),
          _AdminTile(
            icon: Icons.article,
            title: 'Blog Posts',
            subtitle: 'Add, edit, and remove devotionals and blog posts',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const AdminContentCrudScreen(
                    config: AdminContentConfig(
                        table: 'blogpost',
                        displayName: 'Blog Posts',
                        categories: ['Church_Life', 'Biblical_Study', 'Devotionals', 'Community_News', 'Testimonies'])))),
          ),
          _AdminTile(
            icon: Icons.campaign,
            title: 'News',
            subtitle: 'Add, edit, and remove announcements',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const AdminContentCrudScreen(
                    config: AdminContentConfig(
                        table: 'newsitem',
                        displayName: 'News',
                        categories: ['Church_Announcements', 'Community_Updates', 'Special_Reports', 'Mission_News', 'Youth_Activities', 'Pastoral_Messages'])))),
          ),
          _AdminTile(
            icon: Icons.groups_2,
            title: 'Church Members',
            subtitle: 'Membership records',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminChurchMembersScreen())),
          ),
          _AdminTile(
            icon: Icons.account_balance_wallet,
            title: 'Finance',
            subtitle: 'Donations, collections, and financial summary',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminFinanceScreen())),
          ),
          _AdminTile(
            icon: Icons.receipt_long,
            title: 'Expenses',
            subtitle: 'Track church expenses and approvals',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminExpensesScreen())),
          ),
          _AdminTile(
            icon: Icons.forum,
            title: 'Meetings & Decisions',
            subtitle: 'Meeting logs, agendas, minutes, and decisions',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminMeetingsScreen())),
          ),
          const SizedBox(height: 24),
          Text('Coming next', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey[700])),
          const SizedBox(height: 8),
          for (final label in const [
            'Ministries & Join Requests',
            'Fellowship Rosters & Schedules',
            'Prayer Request & Testimonial Moderation',
            'Contact Messages',
            'Advertisements (incl. AI-generated ad copy)',
            'About Sections, Branch Churches, Key Persons, Direct Media',
            'Activity Log',
          ])
            Card(
              color: Colors.grey[100],
              child: ListTile(
                dense: true,
                leading: const Icon(Icons.construction, color: Colors.grey),
                title: Text(label, style: TextStyle(color: Colors.grey[700])),
                trailing: const Text('Not yet built', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ),
            ),
        ],
      ),
    );
  }
}

class _AdminTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _AdminTile({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, size: 32),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
