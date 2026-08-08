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

/// Ports admin/AdminDashboardPage.tsx's section navigation. All sections
/// from the real 33-resource audit are now wired: Reports, Manage Users,
/// Sermons/Blog Posts/News, Events, Church Members, Finance
/// (Donations/Collections/Summary), Meetings & Decisions, Expenses,
/// Ministries & Join Requests, Content Moderation, Fellowship Rosters &
/// Schedules, Contact Messages, Advertisements, Site Content (About/
/// Branches/Key Persons/Media), and the Activity Log. Known simplifications
/// are documented in each screen's file comment (Events' jsonb array
/// fields, moderation working through hide/restore instead of a
/// visibility toggle since the live enum only has one value, etc.).
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
          _AdminTile(
            icon: Icons.diversity_3,
            title: 'Ministries',
            subtitle: 'Manage ministries and review join requests',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminMinistriesScreen())),
          ),
          _AdminTile(
            icon: Icons.shield_moon,
            title: 'Content Moderation',
            subtitle: 'Review and hide prayer requests and testimonials',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminModerationScreen())),
          ),
          _AdminTile(
            icon: Icons.event_repeat,
            title: 'Fellowship Rosters & Schedules',
            subtitle: 'Recurring fellowship rosters and scheduled dates',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminFellowshipScreen())),
          ),
          _AdminTile(
            icon: Icons.mail_outline,
            title: 'Contact Messages',
            subtitle: 'Inbox from the public contact form',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminContactMessagesScreen())),
          ),
          _AdminTile(
            icon: Icons.ads_click,
            title: 'Advertisements',
            subtitle: 'Banner ads, with AI-generated name and alt text',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminAdvertisementsScreen())),
          ),
          _AdminTile(
            icon: Icons.web,
            title: 'Site Content',
            subtitle: 'About sections, branch churches, key persons, media library',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminSiteContentScreen())),
          ),
          _AdminTile(
            icon: Icons.receipt_long_outlined,
            title: 'Activity Log',
            subtitle: 'Audit trail of admin actions',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminActivityLogScreen())),
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
