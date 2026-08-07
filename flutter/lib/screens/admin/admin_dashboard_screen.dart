import 'package:flutter/material.dart';
import 'admin_reports_screen.dart';
import 'admin_users_screen.dart';

/// Ports admin/AdminDashboardPage.tsx's section navigation. First pass:
/// Reports (all 9 PDF report types + donor list) and Manage Users (the
/// multi-admin consensus workflow) are fully wired to the real Edge
/// Functions. The remaining ~25 admin CRUD pages (sermons, events, blog,
/// news, ministries, donations, financial, meetings, decisions, church
/// members, expenses, testimonials, prayer requests moderation, contact
/// messages, advertisements, about sections, branch churches, key persons,
/// direct media, fellowship schedules, ministry join requests, activity
/// log) are plain-CRUD-under-RLS per the earlier 33-resource audit and are
/// the next pass — each follows the same list+edit pattern as the member-
/// facing screens already built, just gated to admin-only writes.
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
          const SizedBox(height: 24),
          Text('Coming next', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey[700])),
          const SizedBox(height: 8),
          for (final label in const [
            'Sermons, Events, Blog & News (content CRUD)',
            'Ministries & Join Requests',
            'Donations, Collections & Financial Summary',
            'Expenses',
            'Meetings & Decisions',
            'Church Members',
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
