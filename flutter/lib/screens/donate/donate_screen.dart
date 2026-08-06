import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/donate_page_content.dart';
import '../../services/supabase_service.dart';

// donatepagecontent is a singleton row (id defaults to 'singleton') edited
// by admins elsewhere — this screen just reads and displays it.
final donatePageProvider = FutureProvider<DonatePageContent?>((ref) async {
  final row = await SupabaseService.client.from('donatepagecontent').select().maybeSingle();
  if (row == null) return null;
  return DonatePageContent.fromMap(row);
});

class DonateScreen extends ConsumerWidget {
  const DonateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contentAsync = ref.watch(donatePageProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Donate')),
      body: contentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load donation info: $e')),
        data: (content) {
          if (content == null) return const Center(child: Text('Donation information is not set up yet.'));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (content.headerImageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(imageUrl: content.headerImageUrl!, height: 160, fit: BoxFit.cover),
                ),
              const SizedBox(height: 12),
              Text(content.headerTitle, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(content.headerSubtitle, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 24),
              _SectionCard(
                title: content.localDonationsTitle,
                children: [
                  _InfoRow('Bank', content.bankName),
                  _InfoRow('Account Name', content.accountName),
                  _InfoRow('Account Number', content.accountNumber),
                  _InfoRow('Branch', content.branch),
                  _InfoRow('eSewa ID', content.esewaId),
                  if (content.localDonationsNote.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(content.localDonationsNote, style: const TextStyle(fontStyle: FontStyle.italic)),
                  ],
                  if (content.bankQrImageUrl != null || content.esewaQrImageUrl != null) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (content.bankQrImageUrl != null)
                          Expanded(child: _QrTile(label: 'Bank QR', url: content.bankQrImageUrl!)),
                        if (content.esewaQrImageUrl != null)
                          Expanded(child: _QrTile(label: 'eSewa QR', url: content.esewaQrImageUrl!)),
                      ],
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              _SectionCard(
                title: content.internationalDonationsTitle,
                children: [
                  Text(content.internationalDonationsContent),
                  const SizedBox(height: 8),
                  _InfoRow('Contact', content.internationalDonationsContactEmail),
                  if (content.internationalQrImageUrl != null) ...[
                    const SizedBox(height: 12),
                    _QrTile(label: 'International QR', url: content.internationalQrImageUrl!),
                  ],
                ],
              ),
              if (content.receiptVerses != null) ...[
                const SizedBox(height: 24),
                Text(content.receiptVerses!, textAlign: TextAlign.center, style: const TextStyle(fontStyle: FontStyle.italic)),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(width: 110, child: Text(label, style: const TextStyle(color: Colors.grey))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }
}

class _QrTile extends StatelessWidget {
  final String label;
  final String url;
  const _QrTile({required this.label, required this.url});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: CachedNetworkImage(imageUrl: url, width: 140, height: 140, fit: BoxFit.contain),
        ),
      ],
    );
  }
}
