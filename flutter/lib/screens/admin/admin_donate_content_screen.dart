import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import '../../services/admin_log_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../widgets/image_upload_field.dart';
import '../../theme/app_breakpoints.dart';

/// Ports frontend/src/pages/admin/ManageDonatePage.tsx — the one admin
/// screen the Flutter app previously had no equivalent for at all.
/// donate_screen.dart (the public page) already reads this singleton row;
/// this is the first and only place anything writes to it from Flutter.
class AdminDonateContentScreen extends StatefulWidget {
  const AdminDonateContentScreen({super.key});

  @override
  State<AdminDonateContentScreen> createState() => _AdminDonateContentScreenState();
}

class _AdminDonateContentScreenState extends State<AdminDonateContentScreen> {
  bool _loading = true;
  bool _saving = false;
  String? _error;

  final _headerTitle = TextEditingController();
  final _headerSubtitle = TextEditingController();
  final _headerImageUrl = TextEditingController();
  final _localDonationsTitle = TextEditingController();
  final _bankName = TextEditingController();
  final _accountName = TextEditingController();
  final _accountNumber = TextEditingController();
  final _branch = TextEditingController();
  final _esewaId = TextEditingController();
  final _esewaQrImageUrl = TextEditingController();
  final _bankQrImageUrl = TextEditingController();
  final _localDonationsNote = TextEditingController();
  final _internationalDonationsTitle = TextEditingController();
  final _internationalDonationsContent = TextEditingController();
  final _internationalDonationsContactEmail = TextEditingController();
  final _internationalQrImageUrl = TextEditingController();
  final _receiptVerses = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final row = await SupabaseService.client.from('donatepagecontent').select().maybeSingle();
      if (row != null) {
        _headerTitle.text = row['header_title'] ?? '';
        _headerSubtitle.text = row['header_subtitle'] ?? '';
        _headerImageUrl.text = row['header_image_url'] ?? '';
        _localDonationsTitle.text = row['local_donations_title'] ?? '';
        _bankName.text = row['bank_name'] ?? '';
        _accountName.text = row['account_name'] ?? '';
        _accountNumber.text = row['account_number'] ?? '';
        _branch.text = row['branch'] ?? '';
        _esewaId.text = row['esewa_id'] ?? '';
        _esewaQrImageUrl.text = row['esewa_qr_image_url'] ?? '';
        _bankQrImageUrl.text = row['bank_qr_image_url'] ?? '';
        _localDonationsNote.text = row['local_donations_note'] ?? '';
        _internationalDonationsTitle.text = row['international_donations_title'] ?? '';
        _internationalDonationsContent.text = row['international_donations_content'] ?? '';
        _internationalDonationsContactEmail.text = row['international_donations_contact_email'] ?? '';
        _internationalQrImageUrl.text = row['international_qr_image_url'] ?? '';
        _receiptVerses.text = row['receipt_verses'] ?? '';
      }
    } catch (e) {
      _error = 'Failed to load: $e';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = {
      'id': 'singleton',
      'header_title': _headerTitle.text.trim(),
      'header_subtitle': _headerSubtitle.text.trim(),
      'header_image_url': _headerImageUrl.text.trim().isEmpty ? null : _headerImageUrl.text.trim(),
      'local_donations_title': _localDonationsTitle.text.trim(),
      'bank_name': _bankName.text.trim(),
      'account_name': _accountName.text.trim(),
      'account_number': _accountNumber.text.trim(),
      'branch': _branch.text.trim(),
      'esewa_id': _esewaId.text.trim(),
      'esewa_qr_image_url': _esewaQrImageUrl.text.trim().isEmpty ? null : _esewaQrImageUrl.text.trim(),
      'bank_qr_image_url': _bankQrImageUrl.text.trim().isEmpty ? null : _bankQrImageUrl.text.trim(),
      'local_donations_note': _localDonationsNote.text.trim(),
      'international_donations_title': _internationalDonationsTitle.text.trim(),
      'international_donations_content': _internationalDonationsContent.text.trim(),
      'international_donations_contact_email': _internationalDonationsContactEmail.text.trim(),
      'international_qr_image_url': _internationalQrImageUrl.text.trim().isEmpty ? null : _internationalQrImageUrl.text.trim(),
      'receipt_verses': _receiptVerses.text.trim().isEmpty ? null : _receiptVerses.text.trim(),
    };
    try {
      await SupabaseService.client.from('donatepagecontent').upsert(body);
      await AdminLogService.log(action: 'Updated Donate Page Content', targetId: 'singleton');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Donate page updated.')));
      }
    } catch (e) {
      setState(() => _error = 'Save failed: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Donate Page Content', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 16),
                Text('Header', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                TextField(controller: _headerTitle, decoration: const InputDecoration(labelText: 'Header Title')),
                const SizedBox(height: 8),
                TextField(controller: _headerSubtitle, decoration: const InputDecoration(labelText: 'Header Subtitle'), maxLines: 2),
                const SizedBox(height: 8),
                ImageUploadField(controller: _headerImageUrl, bucket: 'content-media', label: 'Header Image'),
                const Divider(height: 32),
                Text('Local Donations', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                TextField(controller: _localDonationsTitle, decoration: const InputDecoration(labelText: 'Section Title')),
                const SizedBox(height: 8),
                TextField(controller: _bankName, decoration: const InputDecoration(labelText: 'Bank Name')),
                const SizedBox(height: 8),
                TextField(controller: _accountName, decoration: const InputDecoration(labelText: 'Account Name')),
                const SizedBox(height: 8),
                TextField(controller: _accountNumber, decoration: const InputDecoration(labelText: 'Account Number')),
                const SizedBox(height: 8),
                TextField(controller: _branch, decoration: const InputDecoration(labelText: 'Branch')),
                const SizedBox(height: 8),
                ImageUploadField(controller: _bankQrImageUrl, bucket: 'donation-qr', label: 'Bank QR Image'),
                const SizedBox(height: 8),
                TextField(controller: _esewaId, decoration: const InputDecoration(labelText: 'eSewa ID')),
                const SizedBox(height: 8),
                ImageUploadField(controller: _esewaQrImageUrl, bucket: 'donation-qr', label: 'eSewa QR Image'),
                const SizedBox(height: 8),
                TextField(controller: _localDonationsNote, decoration: const InputDecoration(labelText: 'Note'), maxLines: 3),
                const Divider(height: 32),
                Text('International Donations', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                TextField(controller: _internationalDonationsTitle, decoration: const InputDecoration(labelText: 'Section Title')),
                const SizedBox(height: 8),
                TextField(controller: _internationalDonationsContent, decoration: const InputDecoration(labelText: 'Content'), maxLines: 4),
                const SizedBox(height: 8),
                TextField(controller: _internationalDonationsContactEmail, decoration: const InputDecoration(labelText: 'Contact Email')),
                const SizedBox(height: 8),
                ImageUploadField(controller: _internationalQrImageUrl, bucket: 'donation-qr', label: 'International QR Image'),
                const Divider(height: 32),
                TextField(controller: _receiptVerses, decoration: const InputDecoration(labelText: 'Receipt Verses'), maxLines: 3),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Save Changes'),
                ),
              ],
            ),
    );
  }
}
