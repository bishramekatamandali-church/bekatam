import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';

const _donationPurposes = [
  'General_Fund', 'Tithe', 'Worship_Ministry', 'Sunday_School', 'Outreach_Missions',
  'Prayer_Ministry', 'Building_Fund_Maintenance', 'Leadership_Support_Pastor',
  'Leadership_Support_Elders_Ministry_Leaders', 'Benevolence_Fund',
];
const _collectionPurposes = [
  'Tithe', 'Temple_Tax', 'General_Offering', 'Saturday_Fellowship_Offering',
  'Wednesday_Fellowship_Offering', 'Friday_Program_Offering', 'Building_Fund',
  'Freewill_Offering', 'Vow_Offering', 'Redemption_Offering', 'Guilt_Offering',
  'Firstfruits', 'Alms', 'Mission_Support', 'Youth_Ministry_Support',
  'Children_Ministry_Support', 'Women_Ministry_Support', 'Men_Ministry_Support',
  'Church_Offering', 'Minister_Support', 'Thanksgiving_Offering',
  'Special_Event_Collection', 'Other_Collections',
];
const _paymentMethods = ['Cash', 'Cheque', 'Bank_Transfer', 'eSewa', 'Other'];

final _currencyFmt = NumberFormat.currency(symbol: 'NPR ', decimalDigits: 2);

class AdminFinanceScreen extends StatefulWidget {
  const AdminFinanceScreen({super.key});

  @override
  State<AdminFinanceScreen> createState() => _AdminFinanceScreenState();
}

class _AdminFinanceScreenState extends State<AdminFinanceScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finance'),
        bottom: TabBar(controller: _tabController, tabs: const [
          Tab(text: 'Donations'),
          Tab(text: 'Collections'),
          Tab(text: 'Summary'),
        ]),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_DonationsTab(), _CollectionsTab(), _FinancialSummaryTab()],
      ),
    );
  }
}

// ---------------- Donations ----------------

class _DonationsTab extends StatefulWidget {
  const _DonationsTab();
  @override
  State<_DonationsTab> createState() => _DonationsTabState();
}

class _DonationsTabState extends State<_DonationsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('donationrecord').select().order('donation_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('donationrecord').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    await showModalBottomSheet(context: context, isScrollControlled: true, builder: (ctx) => _DonationFormSheet(existing: existing));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Add')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _rows.isEmpty
                  ? const Center(child: Text('No donations recorded yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text('${r['donor_name']} · ${_currencyFmt.format(r['amount'])}'),
                            subtitle: Text('${(r['purpose'] as String? ?? '').replaceAll('_', ' ')} · ${r['payment_method'] ?? ''}'),
                            onTap: () => _openForm(existing: r),
                            trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class _DonationFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  const _DonationFormSheet({this.existing});
  @override
  State<_DonationFormSheet> createState() => _DonationFormSheetState();
}

class _DonationFormSheetState extends State<_DonationFormSheet> {
  late final TextEditingController _donorName, _donorEmail, _donorPhone, _amount, _transactionRef, _notes;
  String? _purpose;
  String? _paymentMethod;
  DateTime _donationDate = DateTime.now();
  bool _receiptSent = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _donorName = TextEditingController(text: e?['donor_name'] ?? '');
    _donorEmail = TextEditingController(text: e?['donor_email'] ?? '');
    _donorPhone = TextEditingController(text: e?['donor_phone'] ?? '');
    _amount = TextEditingController(text: e?['amount']?.toString() ?? '');
    _transactionRef = TextEditingController(text: e?['transaction_reference'] ?? '');
    _notes = TextEditingController(text: e?['notes'] ?? '');
    _purpose = e?['purpose'];
    _paymentMethod = e?['payment_method'];
    _donationDate = e?['donation_date'] != null ? DateTime.tryParse(e!['donation_date']) ?? DateTime.now() : DateTime.now();
    _receiptSent = e?['is_receipt_sent'] ?? false;
  }

  Future<void> _save() async {
    final amt = double.tryParse(_amount.text.trim());
    if (_donorName.text.trim().isEmpty || _donorEmail.text.trim().isEmpty || amt == null || _purpose == null) {
      setState(() => _error = 'Donor name, email, amount, and purpose are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final now = DateTime.now().toIso8601String();
    final body = <String, dynamic>{
      'donor_name': _donorName.text.trim(),
      'donor_email': _donorEmail.text.trim(),
      'donor_phone': _donorPhone.text.trim().isEmpty ? null : _donorPhone.text.trim(),
      'amount': amt,
      'purpose': _purpose,
      'payment_method': _paymentMethod,
      'donation_date': _donationDate.toIso8601String(),
      'transaction_reference': _transactionRef.text.trim().isEmpty ? null : _transactionRef.text.trim(),
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      'is_receipt_sent': _receiptSent,
    };
    try {
      if (widget.existing == null) {
        body['transaction_timestamp'] = now;
        await SupabaseService.client.from('donationrecord').insert(body);
      } else {
        await SupabaseService.client.from('donationrecord').update(body).eq('id', widget.existing!['id']);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() {
        _error = 'Could not save: $e';
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.existing == null ? 'Add Donation' : 'Edit Donation', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _donorName, decoration: const InputDecoration(labelText: 'Donor Name')),
            const SizedBox(height: 8),
            TextField(controller: _donorEmail, decoration: const InputDecoration(labelText: 'Donor Email')),
            const SizedBox(height: 8),
            TextField(controller: _donorPhone, decoration: const InputDecoration(labelText: 'Donor Phone')),
            const SizedBox(height: 8),
            TextField(controller: _amount, decoration: const InputDecoration(labelText: 'Amount'), keyboardType: const TextInputType.numberWithOptions(decimal: true)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _purpose,
              decoration: const InputDecoration(labelText: 'Purpose'),
              items: _donationPurposes.map((p) => DropdownMenuItem(value: p, child: Text(p.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _purpose = v),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              decoration: const InputDecoration(labelText: 'Payment Method'),
              items: _paymentMethods.map((p) => DropdownMenuItem(value: p, child: Text(p.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _paymentMethod = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_donationDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _donationDate);
                if (picked != null) setState(() => _donationDate = picked);
              },
            ),
            TextField(controller: _transactionRef, decoration: const InputDecoration(labelText: 'Transaction Reference')),
            const SizedBox(height: 8),
            TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
            const SizedBox(height: 8),
            SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Receipt sent'), value: _receiptSent, onChanged: (v) => setState(() => _receiptSent = v)),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------- Collections ----------------

class _CollectionsTab extends StatefulWidget {
  const _CollectionsTab();
  @override
  State<_CollectionsTab> createState() => _CollectionsTabState();
}

class _CollectionsTabState extends State<_CollectionsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('collectionrecord').select().order('collection_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('collectionrecord').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    await showModalBottomSheet(context: context, isScrollControlled: true, builder: (ctx) => _CollectionFormSheet(existing: existing));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Add')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _rows.isEmpty
                  ? const Center(child: Text('No collections recorded yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text('${(r['purpose'] as String? ?? '').replaceAll('_', ' ')} · ${_currencyFmt.format(r['amount'])}'),
                            subtitle: Text('${r['collector_name']} · ${r['is_deposited'] == true ? 'Deposited' : 'Not deposited'}'),
                            onTap: () => _openForm(existing: r),
                            trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class _CollectionFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  const _CollectionFormSheet({this.existing});
  @override
  State<_CollectionFormSheet> createState() => _CollectionFormSheetState();
}

class _CollectionFormSheetState extends State<_CollectionFormSheet> {
  late final TextEditingController _collectorName, _amount, _source, _notes, _countedBy, _bankRef;
  String? _purpose;
  DateTime _collectionDate = DateTime.now();
  bool _isDeposited = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _collectorName = TextEditingController(text: e?['collector_name'] ?? '');
    _amount = TextEditingController(text: e?['amount']?.toString() ?? '');
    _source = TextEditingController(text: e?['source'] ?? '');
    _notes = TextEditingController(text: e?['notes'] ?? '');
    _countedBy = TextEditingController(text: e?['counted_by'] ?? '');
    _bankRef = TextEditingController(text: e?['bank_deposit_reference'] ?? '');
    _purpose = e?['purpose'];
    _collectionDate = e?['collection_date'] != null ? DateTime.tryParse(e!['collection_date']) ?? DateTime.now() : DateTime.now();
    _isDeposited = e?['is_deposited'] ?? false;
  }

  Future<void> _save() async {
    final amt = double.tryParse(_amount.text.trim());
    if (_collectorName.text.trim().isEmpty || amt == null || _purpose == null) {
      setState(() => _error = 'Collector name, amount, and purpose are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final now = DateTime.now().toIso8601String();
    final body = <String, dynamic>{
      'collector_name': _collectorName.text.trim(),
      'amount': amt,
      'purpose': _purpose,
      'collection_date': _collectionDate.toIso8601String(),
      'source': _source.text.trim().isEmpty ? null : _source.text.trim(),
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      'counted_by': _countedBy.text.trim().isEmpty ? null : _countedBy.text.trim(),
      'is_deposited': _isDeposited,
      'deposit_date': _isDeposited ? now : null,
      'bank_deposit_reference': _bankRef.text.trim().isEmpty ? null : _bankRef.text.trim(),
    };
    try {
      if (widget.existing == null) {
        body['recorded_at'] = now;
        await SupabaseService.client.from('collectionrecord').insert(body);
      } else {
        await SupabaseService.client.from('collectionrecord').update(body).eq('id', widget.existing!['id']);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      setState(() {
        _error = 'Could not save: $e';
        _saving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(widget.existing == null ? 'Add Collection' : 'Edit Collection', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _collectorName, decoration: const InputDecoration(labelText: 'Collector Name')),
            const SizedBox(height: 8),
            TextField(controller: _amount, decoration: const InputDecoration(labelText: 'Amount'), keyboardType: const TextInputType.numberWithOptions(decimal: true)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _purpose,
              decoration: const InputDecoration(labelText: 'Purpose'),
              items: _collectionPurposes.map((p) => DropdownMenuItem(value: p, child: Text(p.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _purpose = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_collectionDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _collectionDate);
                if (picked != null) setState(() => _collectionDate = picked);
              },
            ),
            TextField(controller: _source, decoration: const InputDecoration(labelText: 'Source')),
            const SizedBox(height: 8),
            TextField(controller: _countedBy, decoration: const InputDecoration(labelText: 'Counted By')),
            const SizedBox(height: 8),
            TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
            const SizedBox(height: 8),
            SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Deposited'), value: _isDeposited, onChanged: (v) => setState(() => _isDeposited = v)),
            if (_isDeposited) TextField(controller: _bankRef, decoration: const InputDecoration(labelText: 'Bank Deposit Reference')),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------- Financial Summary ----------------

class _FinancialSummaryTab extends StatefulWidget {
  const _FinancialSummaryTab();
  @override
  State<_FinancialSummaryTab> createState() => _FinancialSummaryTabState();
}

class _FinancialSummaryTabState extends State<_FinancialSummaryTab> {
  Map<String, dynamic>? _summary;
  bool _loading = true;
  String? _error;
  DateTime? _start;
  DateTime? _end;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await SupabaseService.client.functions.invoke(
        'financial-summary',
        method: HttpMethod.get,
        queryParameters: {
          if (_start != null) 'start_date': _start!.toIso8601String(),
          if (_end != null) 'end_date': _end!.toIso8601String(),
        },
      );
      setState(() {
        _summary = Map<String, dynamic>.from(res.data as Map);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text('Failed to load summary: $_error'));
    final s = _summary!;
    final totals = s['totals'] as Map<String, dynamic>;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: DateTime.now());
                    if (picked != null) {
                      _start = picked;
                      _load();
                    }
                  },
                  child: Text(_start == null ? 'Start date' : DateFormat.yMMMd().format(_start!)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () async {
                    final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: DateTime.now());
                    if (picked != null) {
                      _end = picked;
                      _load();
                    }
                  },
                  child: Text(_end == null ? 'End date' : DateFormat.yMMMd().format(_end!)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            color: Colors.green[50],
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _totalRow('Total Income', totals['income']),
                  _totalRow('Total Expenses', totals['expenses']),
                  const Divider(),
                  _totalRow('Net Balance', totals['net'], bold: true),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _sectionCard('Donations', s['donations']),
          _sectionCard('Collections', s['collections']),
          _sectionCard('Expenses', s['expenses']),
        ],
      ),
    );
  }

  Widget _totalRow(String label, dynamic value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
          Text(_currencyFmt.format(value ?? 0), style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }

  Widget _sectionCard(String title, dynamic data) {
    final map = data as Map<String, dynamic>;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('${map['count']} records · ${_currencyFmt.format(map['total'])}'),
          ],
        ),
      ),
    );
  }
}
