import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/branch_church.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

final branchesProvider = FutureProvider<List<BranchChurch>>((ref) async {
  final rows = await SupabaseService.client.from('branchchurch').select().order('name', ascending: true);
  return (rows as List).map((r) => BranchChurch.fromMap(r as Map<String, dynamic>)).toList();
});

class BranchesListScreen extends ConsumerWidget {
  const BranchesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final branchesAsync = ref.watch(branchesProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: branchesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load branches: $e')),
        data: (branches) {
          if (branches.isEmpty) return const Center(child: Text('No branch churches listed yet.'));
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(branchesProvider),
            child: ListView.builder(
              itemCount: branches.length,
              itemBuilder: (context, i) {
                final b = branches[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (b.imageUrl != null)
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                          child: CachedNetworkImage(imageUrl: b.imageUrl!, height: 140, fit: BoxFit.cover),
                        ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(b.name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                            if (b.pastorName != null) Text('Pastor: ${b.pastorName}', style: const TextStyle(color: Colors.grey)),
                            if (b.address != null) Text(b.address!, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                            if (b.serviceTimes != null) Text(b.serviceTimes!, style: const TextStyle(fontSize: 13)),
                            if (b.description != null) ...[
                              const SizedBox(height: 6),
                              Text(b.description!),
                            ],
                            if (b.phone != null || b.email != null) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (b.phone != null)
                                    TextButton.icon(
                                      onPressed: () => launchUrl(Uri.parse('tel:${b.phone}')),
                                      icon: const Icon(Icons.phone, size: 16),
                                      label: Text(b.phone!),
                                    ),
                                  if (b.email != null)
                                    TextButton.icon(
                                      onPressed: () => launchUrl(Uri.parse('mailto:${b.email}')),
                                      icon: const Icon(Icons.email, size: 16),
                                      label: Text(b.email!),
                                    ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
