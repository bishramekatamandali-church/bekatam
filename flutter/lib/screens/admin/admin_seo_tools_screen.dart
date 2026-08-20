import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Curated external SEO resources that were available from the legacy admin
/// SEO tools page. Links are copied so the utility remains platform-neutral.
class AdminSeoToolsScreen extends StatelessWidget {
  const AdminSeoToolsScreen({super.key});

  static const _tools = <Map<String, String>>[
    {'name': 'Google Search Console', 'url': 'https://search.google.com/search-console', 'description': 'Indexing, search performance, and site health.'},
    {'name': 'Google Analytics', 'url': 'https://analytics.google.com/', 'description': 'Traffic, engagement, and audience analytics.'},
    {'name': 'Google Trends', 'url': 'https://trends.google.com/', 'description': 'Explore search interest and content trends.'},
    {'name': 'Google Keyword Planner', 'url': 'https://ads.google.com/home/tools/keyword-planner/', 'description': 'Keyword discovery and search-volume research.'},
    {'name': 'Ahrefs Webmaster Tools', 'url': 'https://ahrefs.com/webmaster-tools', 'description': 'Technical SEO and backlink diagnostics.'},
    {'name': 'Semrush', 'url': 'https://www.semrush.com/', 'description': 'Keyword, competitor, and SEO research.'},
  ];

  Future<void> _open(String url) async {
    await Clipboard.setData(ClipboardData(text: url));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('SEO Tools')),
        body: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _tools.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (_, i) {
            final tool = _tools[i];
            return Card(
              child: ListTile(
                leading: const Icon(Icons.search),
                title: Text(tool['name']!),
                subtitle: Text('${tool['description']}\n${tool['url']}'),
                isThreeLine: true,
                trailing: IconButton(
                  tooltip: 'Copy URL',
                  icon: const Icon(Icons.copy),
                  onPressed: () async {
                    await _open(tool['url']!);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('URL copied to clipboard')));
                    }
                  },
                ),
              ),
            );
          },
        ),
      );
}
