import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../services/supabase_service.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

class AdminActivityLogScreen extends StatefulWidget {
  const AdminActivityLogScreen({super.key});
  @override
  State<AdminActivityLogScreen> createState() => _AdminActivityLogScreenState();
}

class _AdminActivityLogScreenState extends State<AdminActivityLogScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('adminactionlog').select().order('timestamp', ascending: false).limit(200);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _rows.isEmpty
              ? const Center(child: Text('No admin actions logged yet.'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _rows.length,
                    itemBuilder: (context, i) {
                      final r = _rows[i];
                      return ListTile(
                        leading: const Icon(Icons.history, color: Colors.grey),
                        title: Text('${r['admin_name'] ?? 'Admin'} · ${r['action'] ?? ''}'),
                        subtitle: Text(r['details'] ?? ''),
                        trailing: Text(
                          r['timestamp'] != null ? timeago.format(DateTime.parse(r['timestamp'])) : '',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
