import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_colors.dart';
import '../screens/about/about_screen.dart';
import '../screens/events/events_list_screen.dart';
import '../screens/sermons/sermons_list_screen.dart';
import '../screens/contact/contact_screen.dart';

/// Ports components/layout/Footer.tsx verbatim: same Quick Links, same
/// address/email/phone/hours copy, same two social links (Facebook,
/// YouTube), same copyright + credit line. (AdSlot "footer_banner" from the
/// real footer is intentionally omitted — ad slots weren't part of this
/// pass.)
class AppFooter extends StatelessWidget {
  const AppFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final year = DateTime.now().year;
    return Container(
      width: double.infinity,
      color: AppColors.indigo800,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 32,
            runSpacing: 24,
            children: [
              _FooterColumn(
                title: 'Quick Links',
                children: [
                  _FooterLink('Home', () => Navigator.of(context).popUntil((r) => r.isFirst)),
                  _FooterLink('About Us', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AboutScreen()))),
                  _FooterLink('Events', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EventsListScreen()))),
                  _FooterLink('Sermons', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SermonsListScreen()))),
                  _FooterLink('Contact', () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ContactScreen()))),
                ],
              ),
              _FooterColumn(
                title: 'Connect With Us',
                children: const [
                  _FooterText('Sinamangal, Kathmandu'),
                  _FooterText('Email: bishramekatamandali@gmail.com'),
                  _FooterText('Phone: +977-9841568637'),
                  _FooterText('Phone: +977-9818191942'),
                  _FooterText('Sabbath Fellowship (Saturday): 10:00 AM - 2:00 PM'),
                ],
              ),
              _FooterColumn(
                title: 'Follow Us',
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.facebook, color: AppColors.indigo200),
                        onPressed: () => launchUrl(Uri.parse('https://www.facebook.com/share/1FxsWwpPfM'), mode: LaunchMode.externalApplication),
                      ),
                      IconButton(
                        icon: const Icon(Icons.smart_display_outlined, color: AppColors.indigo200),
                        onPressed: () => launchUrl(Uri.parse('https://youtube.com/@bishramtv7102'), mode: LaunchMode.externalApplication),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Divider(color: AppColors.indigo700),
          const SizedBox(height: 12),
          Center(
            child: Column(
              children: [
                Text('© $year Bishram Ekata Mandali. All rights reserved.', style: const TextStyle(color: AppColors.indigo200, fontSize: 11)),
                const SizedBox(height: 2),
                const Text('Website by : Markush Singh', style: TextStyle(color: AppColors.indigo200, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterColumn extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _FooterColumn({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 10),
          ...children,
        ],
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _FooterLink(this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        onTap: onTap,
        child: Text(label, style: const TextStyle(color: AppColors.indigo200, fontSize: 13)),
      ),
    );
  }
}

class _FooterText extends StatelessWidget {
  final String text;
  const _FooterText(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(color: AppColors.indigo200, fontSize: 13)),
    );
  }
}
