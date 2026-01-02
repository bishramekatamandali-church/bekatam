
import React, { useMemo, useState, useCallback } from 'react';
import { useContent } from '../contexts/ContentContext';
import Button from '../components/ui/Button';
import { EventItem, eventCategoriesList, EventCategory } from '../types';
import EventCard from '../components/events/EventCard';
import FeaturedEventDisplay from '../components/events/FeaturedEventDisplay'; 
import AdSlot from '../components/ads/AdSlot';
import { SearchIcon, FilterIcon } from '../components/icons/GenericIcons';
import InteractiveCalendar from '../components/calendar/InteractiveCalendar';
import MonthImageDisplay from '../components/calendar/MonthImageDisplay';
import { adToBsSimulated, formatDateADBS } from '../dateConverter';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { Link } from "react-router-dom";

type SortOption = 'date-newest' | 'date-oldest' | 'alphabetical';

const BS_MONTH_NAMES_EN_CAL = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra",
  "Ashwin", "Kartik", "Mangsir", "Poush", "Magh",
  "Falgun", "Chaitra"
];

const EventsPage: React.FC = () => {
  const { events, monthlyThemeImages, loadingContent } = useContent();
  const [sortOption, setSortOption] = useState<SortOption>('date-newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const currentADDate = useMemo(() => new Date(), []);
  const initialBsDate = useMemo(() => adToBsSimulated(currentADDate), [currentADDate]); 

  const [currentCalendarBsMonth, setCurrentCalendarBsMonth] = useState<number>(initialBsDate.month);
  const [currentCalendarBsYear, setCurrentCalendarBsYear] = useState<number>(initialBsDate.year);

  const handleCalendarMonthChange = useCallback((bsMonth: number, bsYear: number) => {
    setCurrentCalendarBsMonth(bsMonth);
    setCurrentCalendarBsYear(bsYear);
  }, []);

  const { featuredEvent, upcomingEventsSorted, pastEventsSorted, eventsForSelectedMonth } = useMemo(() => {
    if (loadingContent && !events.length) return { featuredEvent: null, upcomingEventsSorted: [], pastEventsSorted: [], eventsForSelectedMonth: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filteredEvents = events.filter(event => {
      const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
      const term = searchTerm.toLowerCase();
      const titleMatch = event.title.toLowerCase().includes(term);
      const locationMatch = event.location?.toLowerCase().includes(term) || false;
      const descriptionMatch = event.description.toLowerCase().includes(term);
      const guestsMatch = event.guests?.toLowerCase().includes(term) || false;
      const searchMatch = titleMatch || locationMatch || descriptionMatch || guestsMatch;
      return categoryMatch && searchMatch;
    });

    let upcoming = filteredEvents.filter(event => event.date && new Date(event.date) >= today);
    let past = filteredEvents.filter(event => event.date && new Date(event.date) < today);
    
    past.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
    const currentFeaturedEvent = past.length > 0 ? past[0] : null;
    
    const sortEvents = (eventArray: EventItem[], option: SortOption) => { 
      switch (option) {
        case 'date-newest':
          return eventArray.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
        case 'date-oldest':
          return eventArray.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
        case 'alphabetical':
          return eventArray.sort((a, b) => a.title.localeCompare(b.title));
        default:
          return eventArray.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()); 
      }
    };

    const sortedUpcoming = sortEvents([...upcoming], sortOption);
    const otherPast = currentFeaturedEvent ? past.filter(e => e.id !== currentFeaturedEvent.id) : past;
    const sortedPast = sortEvents([...otherPast], sortOption);

    const monthEvents = events.filter(event => {
        if (!event.date) return false;
        const eventAdDate = new Date(event.date);
        const eventBsDate = adToBsSimulated(eventAdDate);
        return eventBsDate.year === currentCalendarBsYear && eventBsDate.month === currentCalendarBsMonth;
    }).sort((a,b) => new Date(a.date!).getDate() - new Date(b.date!).getDate());

    return { 
        featuredEvent: currentFeaturedEvent, 
        upcomingEventsSorted: sortedUpcoming, 
        pastEventsSorted: sortedPast,
        eventsForSelectedMonth: monthEvents
    };
  }, [events, loadingContent, sortOption, searchTerm, selectedCategory, currentCalendarBsMonth, currentCalendarBsYear]);


  if (loadingContent && events.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-xl text-slate-600">Loading events...</p>
      </div>
    );
  }
  
  const hasActiveFilters = searchTerm || selectedCategory !== 'all';
  const currentDisplayedBsMonthName = BS_MONTH_NAMES_EN_CAL[currentCalendarBsMonth - 1];


  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-12 sm:space-y-16">
        <header className="text-center sm:text-left pt-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
            Church Events
          </h1>
        </header>

        <div className="mb-8 p-4 bg-white rounded-xl shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="lg:col-span-1">
              <label htmlFor="search-events" className="block text-sm font-medium text-slate-700 mb-1">
                Search Events
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-events"
                  placeholder="Title, location, guests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div>
              <label htmlFor="category-filter-events" className="block text-sm font-medium text-slate-700 mb-1">
                Filter by Category
              </label>
              <div className="relative">
                <select
                  id="category-filter-events"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as EventCategory | 'all')}
                  className="w-full p-2.5 pl-10 border border-slate-300 rounded-xl bg-white focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Categories</option>
                  {eventCategoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <label htmlFor="sort-events" className="block text-sm font-medium text-slate-700 mb-1">Sort by:</label>
                <select
                  id="sort-events"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-purple-500 focus:border-purple-500"
                  disabled={viewMode === 'calendar'}
                >
                  <option value="date-newest">Date (Newest First)</option>
                  <option value="date-oldest">Date (Oldest First)</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
              </div>
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <Button onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'primary' : 'ghost'} size="sm" className="!px-3 !py-1 text-xs">List</Button>
                <Button onClick={() => setViewMode('calendar')} variant={viewMode === 'calendar' ? 'primary' : 'ghost'} size="sm" className="!px-3 !py-1 text-xs">Calendar</Button>
              </div>
            </div>
          </div>
        </div>


        <AdSlot placementKey="event_list_top" className="my-6" />
        
        {viewMode === 'list' ? (
          <>
            {featuredEvent && (
              <section aria-labelledby="featured-event-title" className="mt-0">
                 <h2 id="featured-event-title" className="text-2xl font-semibold text-slate-700 mb-4 sm:mb-6 text-center sm:text-left">
                    Remember This? Our Latest Highlight!
                 </h2>
                <FeaturedEventDisplay event={featuredEvent} isPastEvent={true} />
              </section>
            )}

            <section aria-labelledby="upcoming-events-title">
              <h2 id="upcoming-events-title" className="text-2xl font-semibold text-slate-700 mb-6 sm:mb-8 text-center sm:text-left">Upcoming Events</h2>
              {upcomingEventsSorted.length === 0 && !loadingContent ? (
                <div className="bg-purple-50 rounded-xl shadow-md p-8 text-center">
                    <p className="text-slate-500 text-lg">
                        {hasActiveFilters ? 'No upcoming events match your criteria.' : 'No upcoming events scheduled. Please check back soon!'}
                    </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {upcomingEventsSorted.map((event) => (
                    <EventCard key={event.id} event={event} isPastEvent={false} />
                  ))}
                </div>
              )}
            </section>

            {pastEventsSorted.length > 0 && (
              <section aria-labelledby="past-events-title">
                <h2 id="past-events-title" className="text-2xl font-semibold text-slate-700 mb-6 sm:mb-8 text-center sm:text-left">Past Events Archive</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {pastEventsSorted.map((event) => (
                    <EventCard key={event.id} event={event} isPastEvent={true} />
                  ))}
                </div>
              </section>
            )}
            
            {(upcomingEventsSorted.length === 0 && pastEventsSorted.length === 0 && !featuredEvent && !loadingContent) && (
                <div className="bg-purple-50 rounded-xl shadow-md p-12 text-center">
                    <p className="text-slate-500 text-xl">
                        {hasActiveFilters ? 'No events found matching your criteria.' : 'No events to display at the moment.'}
                    </p>
                </div>
            )}
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <MonthImageDisplay
                currentBsMonth={currentCalendarBsMonth}
                currentBsYear={currentCalendarBsYear}
                monthlyThemeImages={monthlyThemeImages}
                loading={loadingContent}
            />
            <Card className="mt-6 shadow-xl">
                <InteractiveCalendar
                  events={events}
                  onMonthChange={handleCalendarMonthChange}
                  initialBsMonth={currentCalendarBsMonth}
                  initialBsYear={currentCalendarBsYear}
                />
                <div className="mt-4 border-t border-blue-200">
                    <CardHeader className="bg-blue-100">
                        <h2 className="text-xl font-semibold text-blue-800">
                            Events in {currentDisplayedBsMonthName} {currentCalendarBsYear} BS
                        </h2>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto custom-scrollbar p-3 sm:p-4">
                        {loadingContent && !eventsForSelectedMonth.length ? (
                            <p className="text-slate-500 text-center py-6">Loading events...</p>
                        ) : eventsForSelectedMonth.length === 0 ? (
                            <p className="text-slate-500 text-center py-6">No events scheduled for this month.</p>
                        ) : (
                            <ul className="space-y-3">
                                {eventsForSelectedMonth.map(event => {
                                    const eventBsDate = adToBsSimulated(new Date(event.date!));
                                    const adDatePart = formatDateADBS(event.date!).split(' (')[1]?.replace(')', '');
                                    return (
                                        <li key={event.id} className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <Link to={`/events/${event.id}`} className="block">
                                                <h4 className="font-semibold text-blue-700">{event.title}</h4>
                                                <div className="flex items-center text-sm text-slate-500 mt-1">
                                                    <span className="font-bold w-6 text-center mr-2">{eventBsDate.day}</span>
                                                    <span>({adDatePart})</span>
                                                    {event.time && <span className="ml-2 text-slate-400">@ {event.time}</span>}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
