import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/event_item.dart';
import 'events_list_screen.dart';
import 'event_detail_screen.dart';
import '../../widgets/app_header.dart';
import '../../widgets/app_nav_drawer.dart';
import '../../widgets/app_bottom_nav.dart';
import '../../theme/app_breakpoints.dart';

/// Ports EventCalendarPage.tsx: a month-grid view of `eventitem` grouped by
/// day, as an alternative to the plain list in EventsListScreen. Reuses
/// eventsProvider so both views share the same cache.
class EventCalendarScreen extends ConsumerStatefulWidget {
  const EventCalendarScreen({super.key});
  @override
  ConsumerState<EventCalendarScreen> createState() => _EventCalendarScreenState();
}

class _EventCalendarScreenState extends ConsumerState<EventCalendarScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month, 1);
  DateTime? _selectedDay;

  void _shiftMonth(int delta) {
    setState(() {
      _month = DateTime(_month.year, _month.month + delta, 1);
      _selectedDay = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(eventsProvider);

    return Scaffold(
      appBar: const AppHeader(),
      endDrawer: const AppNavDrawer(),
      bottomNavigationBar: MediaQuery.sizeOf(context).width < AppBreakpoints.lg ? const AppBottomNavBar() : null,
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load events: $e')),
        data: (events) {
          final byDay = <int, List<EventItem>>{};
          for (final e in events) {
            final d = e.date;
            if (d != null && d.year == _month.year && d.month == _month.month) {
              byDay.putIfAbsent(d.day, () => []).add(e);
            }
          }

          final firstWeekday = DateTime(_month.year, _month.month, 1).weekday % 7; // 0=Sun
          final daysInMonth = DateTime(_month.year, _month.month + 1, 0).day;
          final cells = <Widget>[];
          for (int i = 0; i < firstWeekday; i++) {
            cells.add(const SizedBox());
          }
          for (int day = 1; day <= daysInMonth; day++) {
            final hasEvents = byDay.containsKey(day);
            final isSelected = _selectedDay?.day == day && _selectedDay?.month == _month.month && _selectedDay?.year == _month.year;
            cells.add(
              InkWell(
                onTap: hasEvents ? () => setState(() => _selectedDay = DateTime(_month.year, _month.month, day)) : null,
                child: Container(
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isSelected ? Theme.of(context).colorScheme.primary : null,
                    border: hasEvents ? Border.all(color: Theme.of(context).colorScheme.primary) : null,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('$day', style: TextStyle(color: isSelected ? Colors.white : null)),
                      if (hasEvents)
                        Container(
                          width: 5,
                          height: 5,
                          margin: const EdgeInsets.only(top: 2),
                          decoration: BoxDecoration(color: isSelected ? Colors.white : Theme.of(context).colorScheme.primary, shape: BoxShape.circle),
                        ),
                    ],
                  ),
                ),
              ),
            );
          }

          final selectedEvents = _selectedDay == null ? <EventItem>[] : (byDay[_selectedDay!.day] ?? []);

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => _shiftMonth(-1)),
                    Expanded(
                      child: Text(DateFormat.yMMMM().format(_month), textAlign: TextAlign.center, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                    ),
                    IconButton(icon: const Icon(Icons.chevron_right), onPressed: () => _shiftMonth(1)),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: GridView.count(
                  crossAxisCount: 7,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    for (final d in const ['S', 'M', 'T', 'W', 'T', 'F', 'S'])
                      Center(child: Text(d, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
                    ...cells,
                  ],
                ),
              ),
              const Divider(),
              Expanded(
                child: selectedEvents.isEmpty
                    ? Center(
                        child: Text(
                          _selectedDay == null ? 'Tap a highlighted day to see its events.' : 'No events on this day.',
                          style: const TextStyle(color: Colors.grey),
                        ),
                      )
                    : ListView.builder(
                        itemCount: selectedEvents.length,
                        itemBuilder: (context, i) {
                          final e = selectedEvents[i];
                          return ListTile(
                            title: Text(e.title),
                            subtitle: Text(e.time ?? (e.location ?? '')),
                            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => EventDetailScreen(event: e))),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
