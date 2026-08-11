import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import '../../services/auth_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../widgets/image_upload_field.dart';

class AdminSiteContentScreen extends StatefulWidget {
  const AdminSiteContentScreen({super.key});
  @override
  State<AdminSiteContentScreen> createState() => _AdminSiteContentScreenState();
}

class _AdminSiteContentScreenState extends State<AdminSiteContentScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Site Content'),
          bottom: TabBar(controller: _tabController, isScrollable: true, tabs: const [
            Tab(text: 'About'),
            Tab(text: 'Branches'),
            Tab(text: 'Key Persons'),
            Tab(text: 'Media'),
          ]),
        ),
        body: TabBarView(controller: _tabController, children: const [
          _AboutSectionsTab(),
          _BranchChurchesTab(),
          _KeyPersonsTab(),
          _DirectMediaTab(),
        ]),
      ),
    );
  }
}

// Small shared helper: a simple list+FAB+bottom-sheet-form pattern used by
// each tab below with its own field set.

// ---------------- About Sections ----------------

class _AboutSectionsTab extends ConsumerStatefulWidget {
  const _AboutSectionsTab();
  @override
  ConsumerState<_AboutSectionsTab> createState() => _AboutSectionsTabState();
}

class _AboutSectionsTabState extends ConsumerState<_AboutSectionsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('aboutsection').select().order('display_order');
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('aboutsection').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    final titleC = TextEditingController(text: existing?['title'] ?? '');
    final contentC = TextEditingController(text: existing?['content'] ?? '');
    final imageC = TextEditingController(text: existing?['image_url'] ?? '');
    final orderC = TextEditingController(text: existing?['display_order']?.toString() ?? '0');
    bool isCore = existing?['is_core_section'] ?? false;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(existing == null ? 'Add About Section' : 'Edit About Section', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                TextField(controller: titleC, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 8),
                TextField(controller: contentC, decoration: const InputDecoration(labelText: 'Content'), maxLines: 5),
                const SizedBox(height: 8),
                ImageUploadField(controller: imageC, bucket: 'content-media', label: 'Image'),
                const SizedBox(height: 8),
                TextField(controller: orderC, decoration: const InputDecoration(labelText: 'Display Order'), keyboardType: TextInputType.number),
                SwitchListTile(contentPadding: EdgeInsets.zero, title: const Text('Core section'), value: isCore, onChanged: (v) => setSheetState(() => isCore = v)),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    final body = <String, dynamic>{
                      'title': titleC.text.trim(),
                      'content': contentC.text.trim(),
                      'image_url': imageC.text.trim().isEmpty ? null : imageC.text.trim(),
                      'display_order': int.tryParse(orderC.text.trim()) ?? 0,
                      'is_core_section': isCore,
                    };
                    if (existing == null) {
                      body['posted_by_admin_id'] = profile?.id;
                      body['posted_by_admin_name'] = profile?.fullName;
                      await SupabaseService.client.from('aboutsection').insert(body);
                    } else {
                      await SupabaseService.client.from('aboutsection').update(body).eq('id', existing['id']);
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Save'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
                  ? const Center(child: Text('No about sections yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return ListTile(
                          title: Text(r['title'] ?? ''),
                          subtitle: Text(r['is_core_section'] == true ? 'Core section' : 'Additional section'),
                          onTap: () => _openForm(existing: r),
                          trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                        );
                      },
                    ),
            ),
    );
  }
}

// ---------------- Branch Churches ----------------

class _BranchChurchesTab extends ConsumerStatefulWidget {
  const _BranchChurchesTab();
  @override
  ConsumerState<_BranchChurchesTab> createState() => _BranchChurchesTabState();
}

class _BranchChurchesTabState extends ConsumerState<_BranchChurchesTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('branchchurch').select().order('name');
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('branchchurch').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    final nameC = TextEditingController(text: existing?['name'] ?? '');
    final addressC = TextEditingController(text: existing?['address'] ?? '');
    final pastorC = TextEditingController(text: existing?['pastor_name'] ?? '');
    final phoneC = TextEditingController(text: existing?['phone'] ?? '');
    final emailC = TextEditingController(text: existing?['email'] ?? '');
    final serviceTimesC = TextEditingController(text: existing?['service_times'] ?? '');
    final mapC = TextEditingController(text: existing?['map_embed_url'] ?? '');
    final imageC = TextEditingController(text: existing?['image_url'] ?? '');
    final descC = TextEditingController(text: existing?['description'] ?? '');
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(existing == null ? 'Add Branch Church' : 'Edit Branch Church', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              TextField(controller: nameC, decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 8),
              TextField(controller: addressC, decoration: const InputDecoration(labelText: 'Address'), maxLines: 2),
              const SizedBox(height: 8),
              TextField(controller: pastorC, decoration: const InputDecoration(labelText: 'Pastor Name')),
              const SizedBox(height: 8),
              TextField(controller: phoneC, decoration: const InputDecoration(labelText: 'Phone')),
              const SizedBox(height: 8),
              TextField(controller: emailC, decoration: const InputDecoration(labelText: 'Email')),
              const SizedBox(height: 8),
              TextField(controller: serviceTimesC, decoration: const InputDecoration(labelText: 'Service Times'), maxLines: 2),
              const SizedBox(height: 8),
              TextField(controller: mapC, decoration: const InputDecoration(labelText: 'Map Embed URL')),
              const SizedBox(height: 8),
              ImageUploadField(controller: imageC, bucket: 'content-media', label: 'Image'),
              const SizedBox(height: 8),
              TextField(controller: descC, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () async {
                  final body = <String, dynamic>{
                    'name': nameC.text.trim(),
                    'address': addressC.text.trim().isEmpty ? null : addressC.text.trim(),
                    'pastor_name': pastorC.text.trim().isEmpty ? null : pastorC.text.trim(),
                    'phone': phoneC.text.trim().isEmpty ? null : phoneC.text.trim(),
                    'email': emailC.text.trim().isEmpty ? null : emailC.text.trim(),
                    'service_times': serviceTimesC.text.trim().isEmpty ? null : serviceTimesC.text.trim(),
                    'map_embed_url': mapC.text.trim().isEmpty ? null : mapC.text.trim(),
                    'image_url': imageC.text.trim().isEmpty ? null : imageC.text.trim(),
                    'description': descC.text.trim().isEmpty ? null : descC.text.trim(),
                  };
                  if (existing == null) {
                    body['posted_by_admin_id'] = profile?.id;
                    body['posted_by_admin_name'] = profile?.fullName;
                    await SupabaseService.client.from('branchchurch').insert(body);
                  } else {
                    await SupabaseService.client.from('branchchurch').update(body).eq('id', existing['id']);
                  }
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
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
                  ? const Center(child: Text('No branch churches yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return ListTile(
                          title: Text(r['name'] ?? ''),
                          subtitle: Text(r['pastor_name'] ?? ''),
                          onTap: () => _openForm(existing: r),
                          trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                        );
                      },
                    ),
            ),
    );
  }
}

// ---------------- Key Persons ----------------

class _KeyPersonsTab extends ConsumerStatefulWidget {
  const _KeyPersonsTab();
  @override
  ConsumerState<_KeyPersonsTab> createState() => _KeyPersonsTabState();
}

class _KeyPersonsTabState extends ConsumerState<_KeyPersonsTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('keyperson').select().order('name');
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('keyperson').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    final nameC = TextEditingController(text: existing?['name'] ?? '');
    final roleC = TextEditingController(text: existing?['role'] ?? '');
    final imageC = TextEditingController(text: existing?['image_url'] ?? '');
    final bioC = TextEditingController(text: existing?['bio'] ?? '');
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(existing == null ? 'Add Key Person' : 'Edit Key Person', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 12),
              TextField(controller: nameC, decoration: const InputDecoration(labelText: 'Name')),
              const SizedBox(height: 8),
              TextField(controller: roleC, decoration: const InputDecoration(labelText: 'Role')),
              const SizedBox(height: 8),
              ImageUploadField(controller: imageC, bucket: 'content-media', label: 'Image'),
              const SizedBox(height: 8),
              TextField(controller: bioC, decoration: const InputDecoration(labelText: 'Bio'), maxLines: 4),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () async {
                  final body = <String, dynamic>{
                    'name': nameC.text.trim(),
                    'role': roleC.text.trim().isEmpty ? null : roleC.text.trim(),
                    'image_url': imageC.text.trim().isEmpty ? null : imageC.text.trim(),
                    'bio': bioC.text.trim().isEmpty ? null : bioC.text.trim(),
                  };
                  if (existing == null) {
                    body['posted_by_admin_id'] = profile?.id;
                    body['posted_by_admin_name'] = profile?.fullName;
                    await SupabaseService.client.from('keyperson').insert(body);
                  } else {
                    await SupabaseService.client.from('keyperson').update(body).eq('id', existing['id']);
                  }
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                child: const Text('Save'),
              ),
            ],
          ),
        ),
      ),
    );
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
                  ? const Center(child: Text('No key persons yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return ListTile(
                          title: Text(r['name'] ?? ''),
                          subtitle: Text(r['role'] ?? ''),
                          onTap: () => _openForm(existing: r),
                          trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                        );
                      },
                    ),
            ),
    );
  }
}

// ---------------- Direct Media ----------------

class _DirectMediaTab extends ConsumerStatefulWidget {
  const _DirectMediaTab();
  @override
  ConsumerState<_DirectMediaTab> createState() => _DirectMediaTabState();
}

class _DirectMediaTabState extends ConsumerState<_DirectMediaTab> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await SupabaseService.client.from('directmediaitem').select().order('upload_date', ascending: false);
    setState(() {
      _rows = List<Map<String, dynamic>>.from(rows as List);
      _loading = false;
    });
  }

  Future<void> _delete(Map<String, dynamic> r) async {
    await SupabaseService.client.from('directmediaitem').delete().eq('id', r['id']);
    _load();
  }

  Future<void> _openForm({Map<String, dynamic>? existing}) async {
    final profile = ref.read(currentProfileProvider).valueOrNull;
    final titleC = TextEditingController(text: existing?['title'] ?? '');
    final descC = TextEditingController(text: existing?['description'] ?? '');
    final urlC = TextEditingController(text: existing?['url'] ?? '');
    final categoryC = TextEditingController(text: existing?['category'] ?? '');
    String mediaType = existing?['media_type'] ?? 'image';
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(existing == null ? 'Add Media Item' : 'Edit Media Item', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                TextField(controller: titleC, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 8),
                TextField(controller: descC, decoration: const InputDecoration(labelText: 'Description'), maxLines: 2),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: mediaType,
                  decoration: const InputDecoration(labelText: 'Media Type'),
                  items: const [DropdownMenuItem(value: 'image', child: Text('Image')), DropdownMenuItem(value: 'video', child: Text('Video'))],
                  onChanged: (v) => setSheetState(() => mediaType = v ?? 'image'),
                ),
                const SizedBox(height: 8),
                TextField(controller: urlC, decoration: const InputDecoration(labelText: 'URL')),
                const SizedBox(height: 8),
                TextField(controller: categoryC, decoration: const InputDecoration(labelText: 'Category')),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    final body = <String, dynamic>{
                      'title': titleC.text.trim(),
                      'description': descC.text.trim().isEmpty ? null : descC.text.trim(),
                      'url': urlC.text.trim(),
                      'media_type': mediaType,
                      'category': categoryC.text.trim().isEmpty ? null : categoryC.text.trim(),
                      'upload_date': DateTime.now().toIso8601String(),
                    };
                    if (existing == null) {
                      body['posted_by_admin_id'] = profile?.id;
                      body['posted_by_admin_name'] = profile?.fullName;
                      await SupabaseService.client.from('directmediaitem').insert(body);
                    } else {
                      await SupabaseService.client.from('directmediaitem').update(body).eq('id', existing['id']);
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                  },
                  child: const Text('Save'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
                  ? const Center(child: Text('No media items yet.'))
                  : ListView.builder(
                      itemCount: _rows.length,
                      itemBuilder: (context, i) {
                        final r = _rows[i];
                        return ListTile(
                          leading: Icon(r['media_type'] == 'video' ? Icons.videocam : Icons.image),
                          title: Text(r['title'] ?? ''),
                          subtitle: Text(r['category'] ?? ''),
                          onTap: () => _openForm(existing: r),
                          trailing: IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: () => _delete(r)),
                        );
                      },
                    ),
            ),
    );
  }
}
