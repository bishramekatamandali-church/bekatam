import 'package:flutter/material.dart';
import '../models/sermon.dart';
import '../models/event_item.dart';
import '../models/blog_post.dart';
import '../models/news_item.dart';
import '../services/supabase_service.dart';
import '../screens/sermons/sermon_detail_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/blog/blog_detail_screen.dart';
import '../screens/news/news_detail_screen.dart';
import '../theme/app_colors.dart';

/// Ports the function of components/search/GlobalSearchModal.tsx: search by
/// title across the main content types and jump straight to the result.
/// Simplified to the 4 highest-traffic content types (sermons, events,
/// blog, news) rather than every searchable field in the real modal.
class _SearchHit {
  final String title;
  final String typeLabel;
  final VoidCallback onTap;
  const _SearchHit(this.title, this.typeLabel, this.onTap);
}

Future<void> showGlobalSearchSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
    builder: (context) => const _GlobalSearchSheet(),
  );
}

class _GlobalSearchSheet extends StatefulWidget {
  const _GlobalSearchSheet();

  @override
  State<_GlobalSearchSheet> createState() => _GlobalSearchSheetState();
}

class _GlobalSearchSheetState extends State<_GlobalSearchSheet> {
  final _controller = TextEditingController();
  List<_SearchHit> _results = [];
  bool _loading = false;
  String _lastQuery = '';

  Future<void> _search(String query) async {
    final q = query.trim();
    _lastQuery = q;
    if (q.isEmpty) {
      setState(() => _results = []);
      return;
    }
    setState(() => _loading = true);
    try {
      final results = <_SearchHit>[];
      final sermonsRows = await SupabaseService.client.from('sermon').select().ilike('title', '%$q%').limit(5);
      for (final r in (sermonsRows as List)) {
        final sermon = Sermon.fromMap(r as Map<String, dynamic>);
        results.add(_SearchHit(sermon.title, 'Sermon', () {
          Navigator.of(context).pop();
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => SermonDetailScreen(sermon: sermon)));
        }));
      }
      final eventsRows = await SupabaseService.client.from('eventitem').select().ilike('title', '%$q%').limit(5);
      for (final r in (eventsRows as List)) {
        final event = EventItem.fromMap(r as Map<String, dynamic>);
        results.add(_SearchHit(event.title, 'Event', () {
          Navigator.of(context).pop();
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: event)));
        }));
      }
      final blogRows = await SupabaseService.client.from('blogpost').select().ilike('title', '%$q%').limit(5);
      for (final r in (blogRows as List)) {
        final post = BlogPost.fromMap(r as Map<String, dynamic>);
        results.add(_SearchHit(post.title, 'Blog', () {
          Navigator.of(context).pop();
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => BlogDetailScreen(post: post)));
        }));
      }
      final newsRows = await SupabaseService.client.from('newsitem').select().ilike('title', '%$q%').limit(5);
      for (final r in (newsRows as List)) {
        final item = NewsItem.fromMap(r as Map<String, dynamic>);
        results.add(_SearchHit(item.title, 'News', () {
          Navigator.of(context).pop();
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => NewsDetailScreen(newsItem: item)));
        }));
      }
      if (mounted && _lastQuery == q) setState(() => _results = results);
    } catch (_) {
      if (mounted) setState(() => _results = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.search, color: AppColors.purple600),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _controller,
                  autofocus: true,
                  decoration: const InputDecoration(
                    hintText: 'Search sermons, events, blog, news…',
                    border: InputBorder.none,
                  ),
                  onChanged: _search,
                  onSubmitted: _search,
                ),
              ),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
            ],
          ),
          const Divider(),
          SizedBox(
            height: 320,
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _results.isEmpty
                    ? Center(
                        child: Text(
                          _controller.text.trim().isEmpty ? 'Start typing to search.' : 'No results.',
                          style: const TextStyle(color: AppColors.slate500),
                        ),
                      )
                    : ListView.builder(
                        itemCount: _results.length,
                        itemBuilder: (context, i) {
                          final hit = _results[i];
                          return ListTile(
                            title: Text(hit.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                            trailing: Chip(label: Text(hit.typeLabel, style: const TextStyle(fontSize: 11)), backgroundColor: AppColors.slate100),
                            onTap: hit.onTap,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
