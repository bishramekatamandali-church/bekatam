import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _expenseCategories = [
  'Ministry_Supplies', 'Utilities', 'Outreach_Events', 'Benevolence', 'Salaries_Stipends',
  'Building_Maintenance', 'Office_Supplies', 'Travel', 'Bank_Charges', 'IT_Subscriptions', 'Other',
];
const _expensePaymentMethods = ['Cash', 'Cheque', 'Bank_Transfer', 'eSewa', 'Other'];
const _expenseStatuses = ['paid', 'pending', 'overdue', 'cancelled'];
final _currencyFmt = NumberFormat.currency(symbol: 'NPR ', decimalDigits: 2);

class AdminExpensesScreen extends ConsumerStatefulWidget {
  const AdminExpensesScreen({super.key});
  @override
  ConsumerState<AdminExpensesScreen> createState() => _AdminExpensesScreenState();
}

class _AdminExpensesScreenState extends ConsumerState<AdminExpensesScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('expenserecord').select().order('expense_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('expenserecord').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).value;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _ExpenseFormSheet(existing: existing, adminId: profile?.id, adminName: profile?.fullName),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Expenses')),
      floatingActionButton: FloatingActionButton.extended(onPressed: () => _openForm(), icon: const Icon(Icons.add), label: const Text('Add')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _rows.isEmpty
                  ? const Center(child: Text('No expenses recorded yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        final statusColor = switch (r['status']) {
                          'paid' => Colors.green,
                          'overdue' => Colors.red,
                          'cancelled' => Colors.grey,
                          _ => Colors.orange,
                        };
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text('${(r['category'] as String? ?? '').replaceAll('_', ' ')} · ${_currencyFmt.format(r['amount'])}'),
                            subtitle: Text(r['description'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                            trailing: SizedBox(
                              width: 96,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.circle, size: 10, color: statusColor),
                                  const SizedBox(width: 4),
                                  Text(r['status'] ?? '', style: TextStyle(color: statusColor, fontSize: 12)),
                                  IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20), onPressed: () => _delete(r)),
                                ],
                              ),
                            ),
                            onTap: () => _openForm(existing: r),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

class _ExpenseFormSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final String? adminId;
  final String? adminName;
  const _ExpenseFormSheet({this.existing, this.adminId, this.adminName});
  @override
  State<_ExpenseFormSheet> createState() => _ExpenseFormSheetState();
}

class _ExpenseFormSheetState extends State<_ExpenseFormSheet> {
  late final TextEditingController _description, _amount, _payee, _transactionRef, _receiptUrl, _approvedBy, _notes, _source, _location;
  String? _category;
  String? _paymentMethod;
  String? _status;
  DateTime _expenseDate = DateTime.now();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _description = TextEditingController(text: e?['description'] ?? '');
    _amount = TextEditingController(text: e?['amount']?.toString() ?? '');
    _payee = TextEditingController(text: e?['payee'] ?? '');
    _transactionRef = TextEditingController(text: e?['transaction_reference'] ?? '');
    _receiptUrl = TextEditingController(text: e?['receipt_url'] ?? '');
    _approvedBy = TextEditingController(text: e?['approved_by'] ?? '');
    _notes = TextEditingController(text: e?['notes'] ?? '');
    _source = TextEditingController(text: e?['source'] ?? '');
    _location = TextEditingController(text: e?['location'] ?? '');
    _category = e?['category'];
    _paymentMethod = e?['payment_method'];
    _status = e?['status'] ?? 'pending';
    _expenseDate = e?['expense_date'] != null ? DateTime.tryParse(e!['expense_date']) ?? DateTime.now() : DateTime.now();
  }

  Future<void> _save() async {
    final amt = double.tryParse(_amount.text.trim());
    if (_description.text.trim().isEmpty || amt == null || _category == null) {
      setState(() => _error = 'Description, amount, and category are required.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final body = <String, dynamic>{
      'description': _description.text.trim(),
      'amount': amt,
      'category': _category,
      'payee': _payee.text.trim().isEmpty ? null : _payee.text.trim(),
      'payment_method': _paymentMethod,
      'transaction_reference': _transactionRef.text.trim().isEmpty ? null : _transactionRef.text.trim(),
      'receipt_url': _receiptUrl.text.trim().isEmpty ? null : _receiptUrl.text.trim(),
      'approved_by': _approvedBy.text.trim().isEmpty ? null : _approvedBy.text.trim(),
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      'source': _source.text.trim().isEmpty ? null : _source.text.trim(),
      'location': _location.text.trim().isEmpty ? null : _location.text.trim(),
      'status': _status,
      'expense_date': _expenseDate.toIso8601String(),
    };
    try {
      if (widget.existing == null) {
        body['posted_by_admin_id'] = widget.adminId;
        body['posted_by_admin_name'] = widget.adminName;
        await SupabaseService.client.from('expenserecord').insert(body);
      } else {
        await SupabaseService.client.from('expenserecord').update(body).eq('id', widget.existing!['id']);
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
            Text(widget.existing == null ? 'Add Expense' : 'Edit Expense', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
            const SizedBox(height: 8),
            TextField(controller: _amount, decoration: const InputDecoration(labelText: 'Amount'), keyboardType: const TextInputType.numberWithOptions(decimal: true)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _expenseCategories.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _category = v),
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Date: ${DateFormat.yMMMd().format(_expenseDate)}'),
              trailing: const Icon(Icons.edit_calendar),
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime(2000), lastDate: DateTime(2100), initialDate: _expenseDate);
                if (picked != null) setState(() => _expenseDate = picked);
              },
            ),
            TextField(controller: _payee, decoration: const InputDecoration(labelText: 'Payee')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              decoration: const InputDecoration(labelText: 'Payment Method'),
              items: _expensePaymentMethods.map((p) => DropdownMenuItem(value: p, child: Text(p.replaceAll('_', ' ')))).toList(),
              onChanged: (v) => setState(() => _paymentMethod = v),
            ),
            const SizedBox(height: 8),
            TextField(controller: _transactionRef, decoration: const InputDecoration(labelText: 'Transaction Reference')),
            const SizedBox(height: 8),
            TextField(controller: _receiptUrl, decoration: const InputDecoration(labelText: 'Receipt URL')),
            const SizedBox(height: 8),
            TextField(controller: _approvedBy, decoration: const InputDecoration(labelText: 'Approved By')),
            const SizedBox(height: 8),
            TextField(controller: _source, decoration: const InputDecoration(labelText: 'Source')),
            const SizedBox(height: 8),
            TextField(controller: _location, decoration: const InputDecoration(labelText: 'Location')),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _expenseStatuses.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
              onChanged: (v) => setState(() => _status = v),
            ),
            const SizedBox(height: 8),
            TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 2),
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
