import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

/// Ports AboutPage.tsx: the public-facing rendering of `aboutsection`
/// (ordered by display_order) plus the `keyperson` leadership list. The
/// admin CRUD for both tables already exists in the Site Content and
/// leadership admin screens — this is the reader-facing page that was
/// missing.
final _aboutSectionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final rows = await SupabaseService.client.from('aboutsection').select().order('display_order', ascending: true);
  return List<Map<String, dynamic>>.from(rows as List);
});

final _keyPeopleProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final rows = await SupabaseService.client.from('keyperson').select().order('created_at', ascending: true);
  return List<Map<String, dynamic>>.from(rows as List);
});

class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sectionsAsync = ref.watch(_aboutSectionsProvider);
    final peopleAsync = ref.watch(_keyPeopleProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_aboutSectionsProvider);
          ref.invalidate(_keyPeopleProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            sectionsAsync.when(
              loading: () => const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Failed to load: $e'),
              data: (sections) {
                if (sections.isEmpty) return const Text('About content will be updated soon.');
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: sections.map((s) {
                    final isCore = s['is_core_section'] == true;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (s['image_url'] != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(imageUrl: s['image_url'] as String, height: 180, width: double.infinity, fit: BoxFit.cover),
                            ),
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              s['title'] as String? ?? '',
                              style: TextStyle(fontSize: isCore ? 22 : 19, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(s['content'] as String? ?? ''),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),
            const Divider(height: 32),
            const Text('Our Leaders', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            peopleAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Failed to load leaders: $e'),
              data: (people) {
                if (people.isEmpty) return const Text('Leadership profiles will be updated soon.');
                return Column(
                  children: people.map((p) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        leading: CircleAvatar(
                          radius: 26,
                          backgroundImage: p['image_url'] != null ? CachedNetworkImageProvider(p['image_url'] as String) : null,
                          child: p['image_url'] == null ? const Icon(Icons.person) : null,
                        ),
                        title: Text(p['name'] as String? ?? ''),
                        subtitle: Text('${p['role'] ?? ''}${(p['bio'] as String?)?.isNotEmpty == true ? '\n${p['bio']}' : ''}'),
                        isThreeLine: (p['bio'] as String?)?.isNotEmpty == true,
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
