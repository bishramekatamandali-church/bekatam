import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { ContentItem, FeatureInfo } from '../types';

import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import AdSlot from '../components/ads/AdSlot';
import CreatePostModal from '../components/post/CreatePostModal';
import AuthModal from '../components/auth/AuthModal';
import InteractiveCalendar, { CalendarEntry } from '../components/calendar/InteractiveCalendar';
import ContentSection from '../components/home/ContentSection';
import MinistryPreviewList from '../components/home/MinistryPreviewList';
import BranchChurchPreviewList from '../components/home/BranchChurchPreviewList';
import { adToBs, BS_MONTH_NAMES_NP, formatDateADBS, getLocalToday, getNepalDateParts } from '../dateConverter';

// Helper to get a consistent, sortable date from any content item
  const getPublishedAt = (item: any): Date => {
  const dateStr = item.publishedAt || item.createdAt || item.submittedAt || item.date || item.incidentAt || item.lastPublishedAt || item.uploadDate || item.updatedAt || item.expenseDate || item.collectionDate || item.meetingDate || item.decisionDate;
  return dateStr ? new Date(dateStr) : new Date(0);
};

const getContentUpdatedAt = (item: any): Date => {
  const dateStr = item.updatedAt || item.lastPublishedAt || item.publishedAt || item.createdAt || item.submittedAt || item.date || item.incidentAt;
  return dateStr ? new Date(dateStr) : new Date(0);
};


const getIncidentAt = (item: any): Date | null => {
  const dateStr = item.incidentAt || item.date;
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateLabel = (dateValue?: string | Date | null): string => {
  if (!dateValue) return 'Unknown';
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  let videoId = null;
  const regExpStandard = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const matchStandard = url.match(regExpStandard);
  if (matchStandard && matchStandard[2].length === 11) {
    videoId = matchStandard[2];
  } else {
    const regExpShorts = /^.*(youtube.com\/shorts\/)([^#\&\?]*).*/;
    const matchShorts = url.match(regExpShorts);
    if (matchShorts && matchShorts[2]) {
      videoId = matchShorts[2];
    }
  }
  const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
  return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1${origin}` : null;
};

const isDirectVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
};

const incidentLabels: Record<string, string> = {
  events: 'Event date',
  sermons: 'Sermon date',
  blog: 'Happened on',
  'prayer-requests': 'Happened on',
  testimonials: 'Happened on',
  news: 'Happened on',
};

const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 006 19.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" />
  </svg>
);

const HomePage: React.FC = () => {
  const {
    sermons,
    events,
    newsItems,
    blogPosts,
    prayerRequests,
    testimonials,
    ministries,
    branchChurches,
    donatePageContent,
    fellowshipRosters,
    generatedSchedules,
    loadingContent,
  } = useContent();

  const { isAuthenticated, currentUser } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<'prayer' | 'testimonial'>('prayer');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const currentADDate = getLocalToday();
  const initialBsDate = useMemo(() => adToBs(currentADDate), [currentADDate]);
  const [currentCalendarBsMonth, setCurrentCalendarBsMonth] = useState<number>(initialBsDate.month);
  const [currentCalendarBsYear, setCurrentCalendarBsYear] = useState<number>(initialBsDate.year);
  const pauseHomepageHtmlVideos = (currentElement?: HTMLElement | null) => {
    document.querySelectorAll<HTMLVideoElement>('video[data-homepage-video]').forEach((video) => {
      if (video !== currentElement) {
        video.pause();
      }
    });
   };

    const pauseHomepageEmbeds = (currentElement?: HTMLElement | null) => {
    document.querySelectorAll<HTMLIFrameElement>('iframe[data-homepage-video]').forEach((iframe) => {
      if (iframe === currentElement) return;
      const contentWindow = iframe.contentWindow;
      if (!contentWindow) return;
      const src = iframe.getAttribute('src') || '';

      if (src.includes('youtube.com/embed')) {
        contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
        return;
      }

      if (src.includes('player.vimeo.com')) {
        contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
        return;
      }

      contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
      contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
    });
  };

  const pauseHomepageMedia = (currentElement?: HTMLElement | null) => {
    pauseHomepageHtmlVideos(currentElement);
    pauseHomepageEmbeds(currentElement);
  };

  const handleCalendarMonthChange = useCallback((month: number, year: number) => {
    setCurrentCalendarBsMonth(month);
    setCurrentCalendarBsYear(year);
  }, []);

  const eventsForSelectedMonth = useMemo(() => {
    return events
      .filter((event) => {
        if (!event.date) return false;
        const eventAdDate = new Date(event.date);
        const eventBsDate = adToBs(eventAdDate);
        return eventBsDate.year === currentCalendarBsYear && eventBsDate.month === currentCalendarBsMonth;
      })
      .sort((a, b) => getNepalDateParts(new Date(a.date!)).day - getNepalDateParts(new Date(b.date!)).day);
  }, [events, currentCalendarBsMonth, currentCalendarBsYear]);

  const noticesForSelectedMonth = useMemo(() => {
    const rosterNotices = fellowshipRosters
      .filter((item) => !!item.assignedDate)
      .map((item) => ({
        id: `roster-${item.id}`,
        title: item.groupNameOrEventTitle,
        date: item.assignedDate,
        timeSlot: item.timeSlot,
        rosterType: item.rosterType,
      }));

    const scheduleNotices = generatedSchedules
      .filter((item) => !!item.scheduledDate)
      .map((item) => ({
        id: `schedule-${item.id}`,
        title: item.groupNameOrEventTitle,
        date: item.scheduledDate,
        timeSlot: item.timeSlot,
        rosterType: item.rosterType,
      }));

    return [...rosterNotices, ...scheduleNotices]
      .filter((notice) => {
        const noticeAdDate = new Date(notice.date);
        if (Number.isNaN(noticeAdDate.getTime())) return false;
        const noticeBsDate = adToBs(noticeAdDate);
        return noticeBsDate.year === currentCalendarBsYear && noticeBsDate.month === currentCalendarBsMonth;
      })
      .sort((a, b) => getNepalDateParts(new Date(a.date)).day - getNepalDateParts(new Date(b.date)).day);
  }, [fellowshipRosters, generatedSchedules, currentCalendarBsMonth, currentCalendarBsYear]);

  const calendarItems: CalendarEntry[] = useMemo(() => {
    const mappedEvents: CalendarEntry[] = events
      .filter((event) => !!event.date)
      .map((event) => ({ id: event.id, title: event.title, date: event.date!, type: 'event', link: `/events/${event.id}` }));

    const mappedNotices: CalendarEntry[] = [
      ...fellowshipRosters
        .filter((item) => !!item.assignedDate)
        .map((item) => ({
          id: `roster-${item.id}`,
          title: item.groupNameOrEventTitle,
          date: item.assignedDate,
          type: 'notice' as const,
          link: '/notices',
        })),
      ...generatedSchedules
        .filter((item) => !!item.scheduledDate)
        .map((item) => ({
          id: `schedule-${item.id}`,
          title: item.groupNameOrEventTitle,
          date: item.scheduledDate,
          type: 'notice' as const,
          link: '/notices',
        })),
    ];

    return [...mappedEvents, ...mappedNotices];
  }, [events, fellowshipRosters, generatedSchedules]);

  const currentDisplayedBsMonthName = BS_MONTH_NAMES_NP[currentCalendarBsMonth - 1];

  useEffect(() => {
    const handleEmbedMessage = (event: MessageEvent) => {
      if (!event.data) return;
      let payload: any = null;

      if (typeof event.data === 'string') {
        try {
          payload = JSON.parse(event.data);
        } catch (error) {
          return;
        }
      } else if (typeof event.data === 'object') {
        payload = event.data;
      }

      if (!payload) return;

      const eventName = String(payload.event || payload.method || payload.type || '').toLowerCase();
      const isYouTubePlay = payload.event === 'onStateChange' && (payload.info === 1 || payload.info === '1');
      const isGenericPlay = eventName === 'play' || eventName === 'playing';

      if (isYouTubePlay || isGenericPlay) {
        pauseHomepageHtmlVideos();
      }
    };

    window.addEventListener('message', handleEmbedMessage);
    return () => window.removeEventListener('message', handleEmbedMessage);
  }, []);

  const openCreateModal = (type: 'prayer' | 'testimonial') => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setCreateModalInitialType(type);
    setIsCreateModalOpen(true);
  };

  const mapToFeatureInfo = (item: ContentItem, typeKey: string): FeatureInfo => {
    const id = (item as any).id;
    const defaultLinkPath = typeKey === 'prayer-requests'
      ? `/prayer-requests#prayer-${id}`
      : typeKey === 'testimonials'
        ? `/prayer-requests#testimonial-${id}`
        : `/${typeKey}/${id}`;
    const rawLinkPath = (item as any).linkPath || defaultLinkPath;
    const linkPath = ['prayer-requests', 'testimonials'].includes(typeKey)
      ? defaultLinkPath
      : rawLinkPath || defaultLinkPath;
    const mediaUrls = Array.isArray((item as any).mediaUrls) ? (item as any).mediaUrls : [];

    return ({
      id,
      title: (item as any).title || (item as any).name || 'Untitled',
      description: (item as any).description || (item as any).summary || (item as any).content || (item as any).contentText || (item as any).requestText || 'No description available.',
      imageUrl: (item as any).imageUrl || mediaUrls[0] || ((item as any).mediaType === 'image' ? (item as any).url : undefined),
      linkPath,
      category: (item as any).category || typeKey,
      date: getPublishedAt(item).toISOString(),
      incidentAt: (item as any).incidentAt || (item as any).date,
      publishedAt: (item as any).publishedAt || (item as any).createdAt || (item as any).submittedAt,
    });
  };

  const sortedEvents = useMemo(
    () => [...events].filter(Boolean).sort((a, b) => getPublishedAt(b).getTime() - getPublishedAt(a).getTime()),
    [events]
  );
  const sortedSermons = useMemo(
    () => [...sermons].filter(Boolean).sort((a, b) => getPublishedAt(b).getTime() - getPublishedAt(a).getTime()),
    [sermons]
  );
  const sortedBlogs = useMemo(
    () => [...blogPosts].filter(Boolean).sort((a, b) => getPublishedAt(b).getTime() - getPublishedAt(a).getTime()),
    [blogPosts]
  );
  const sortedNews = useMemo(
    () => [...newsItems].filter(Boolean).sort((a, b) => getPublishedAt(b).getTime() - getPublishedAt(a).getTime()),
    [newsItems]
  );
  const sortedPrayerRequests = useMemo(
    () => [...prayerRequests]
      .filter((item) => item && (item.visibility === 'public' || item.visibility === 'anonymous'))	
      .sort((a, b) => getPublishedAt(b).getTime() - getPublishedAt(a).getTime()),
    [prayerRequests]
  );
  const sortedTestimonials = useMemo(
    () => [...testimonials]
      .filter((item) => item && item.visibility === 'public')
      .sort((a, b) => getPublishedAt(b).getTime() - getPublishedAt(a).getTime()),
    [testimonials]
  );
 const sortedCommunityStories = useMemo(() => {
    const combined = [
      ...sortedPrayerRequests.map((item) => ({ item, typeKey: 'prayer-requests' })),
      ...sortedTestimonials.map((item) => ({ item, typeKey: 'testimonials' })),
    ];

    return combined.sort((a, b) => getPublishedAt(b.item).getTime() - getPublishedAt(a.item).getTime());
  }, [sortedPrayerRequests, sortedTestimonials]);

  const renderMediaCard = (
    item: ContentItem,
    typeKey: string,
    options: { containerClass: string; imageClass: string; titleClass: string }
  ) => {
    const info = mapToFeatureInfo(item, typeKey);
    const publishedAt = info.publishedAt || getPublishedAt(item).toISOString();
    const incidentAt = info.incidentAt || getIncidentAt(item)?.toISOString();
    const incidentLabel = incidentLabels[typeKey] || 'Happened on';
    const showIncident = Boolean(incidentAt) && !['blog', 'news'].includes(typeKey);
    const mediaUrls = Array.isArray((item as any).mediaUrls) ? (item as any).mediaUrls : [];
    const candidateVideoUrl =
      (item as any).videoUrl ||
      mediaUrls.find((url: string) => isDirectVideoUrl(url) || Boolean(getYouTubeEmbedUrl(url)));
    const youtubeEmbedUrl = getYouTubeEmbedUrl(candidateVideoUrl);
    const showVideo = ['sermons', 'events', 'prayer-requests', 'testimonials', 'news', 'blog'].includes(typeKey) && Boolean(candidateVideoUrl);
    const useVideoPlayer = showVideo && isDirectVideoUrl(candidateVideoUrl);
    const embedUrl = youtubeEmbedUrl || candidateVideoUrl;
    const handleVideoPlay = (event: React.SyntheticEvent<HTMLVideoElement>) => {
      pauseHomepageMedia(event.currentTarget);
    };

    const handleVideoClick = (event: React.SyntheticEvent<HTMLVideoElement>) => {
      pauseHomepageMedia(event.currentTarget);
    };

    const handleEmbedInteract = (event: React.SyntheticEvent<HTMLElement>) => {
      const currentTarget = event.currentTarget;
      const iframe = currentTarget instanceof HTMLIFrameElement
        ? currentTarget
        : currentTarget.querySelector('iframe');
      pauseHomepageMedia(iframe ?? currentTarget);
    };
    return (
      <Link
        to={info.linkPath}
        key={`${typeKey}-${info.id}`}
        className={`group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${options.containerClass}`}
      >
        <div className={`relative bg-slate-100 rounded-xl overflow-hidden ${options.imageClass}`}>
          {showVideo ? (
            useVideoPlayer ? (
              <video
                src={candidateVideoUrl}
                controls
                onPlay={handleVideoPlay}
                onClick={handleVideoClick}
                data-homepage-video
                className="w-full h-full object-cover"
                aria-label={`Video preview for ${info.title}`}
              />
            ) : (
              embedUrl && (
                <div                 
                  className="w-full h-full"
                  onPointerDownCapture={handleEmbedInteract}
                  onFocusCapture={handleEmbedInteract}
                >
                  <iframe
                    src={embedUrl}
                    title={`Video embed for ${info.title}`}
                    className="w-full h-full"
                    data-homepage-video
                    onClick={handleEmbedInteract}
                    onPointerDown={handleEmbedInteract}
                    onFocus={handleEmbedInteract}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              )
            )
          ) : info.imageUrl ? (
            <img src={info.imageUrl} alt={info.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
          )}
        </div>
        <div className="mt-2 px-1 space-y-1">
          <h3 className={`font-semibold text-slate-900 line-clamp-2 ${options.titleClass}`}>{info.title}</h3>
          <div className="text-[0.7rem] text-slate-500 space-y-0.5">
            <div>Posted on: {formatDateLabel(publishedAt)}</div>
            {showIncident && <div>{incidentLabel}: {formatDateLabel(incidentAt)}</div>}
          </div>
        </div>
      </Link>
    );
  };

  const orderedSections = useMemo(() => {
    return ([
      {
        key: 'events',
        items: sortedEvents,
        render: () => (
          <section className="bg-white border border-slate-200 rounded-3xl px-2 sm:px-3 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-xl font-bold text-slate-900">Events</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Stories</span>
              </div>
              <Button asLink to="/events" variant="outline" size="sm">View all</Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory pl-0.5 pr-1">
              {sortedEvents.map((item) => (
                <div key={(item as any).id} className="snap-start">
                  {renderMediaCard(item, 'events', {
                    containerClass: 'w-40 sm:w-44 md:w-48',
                    imageClass: 'h-28',
                    titleClass: 'text-sm',
                  })}
                </div>
              ))}
            </div>
          </section>
        ),
      },
      {
        key: 'sermons',
        items: sortedSermons,
        render: () => (
          <section className="bg-white border border-slate-200 rounded-3xl px-2 sm:px-3 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-xl font-bold text-slate-900">Sermons</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Recommended</span>
              </div>
              <Button asLink to="/sermons" variant="outline" size="sm">View all</Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory pl-0.5 pr-1">
              {sortedSermons.map((item) => (
                <div key={(item as any).id} className="snap-start">
                  {renderMediaCard(item, 'sermons', {
                    containerClass: 'w-56 sm:w-60',
                    imageClass: 'h-60',
                    titleClass: 'text-base',
                  })}
                </div>
              ))}
            </div>
          </section>
        ),
      },
      {
        key: 'blogs',
        items: sortedBlogs,
        render: () => (
          <section className="bg-white border border-slate-200 rounded-3xl px-2 sm:px-3 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-xl font-bold text-slate-900">Blogs</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Featured</span>
              </div>
              <Button asLink to="/blog" variant="outline" size="sm">View all</Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory pl-0.5 pr-1">
              {sortedBlogs.map((item) => (
                <div key={(item as any).id} className="snap-start">
                  {renderMediaCard(item, 'blog', {
                    containerClass: 'w-48 sm:w-52 md:w-56',
                    imageClass: 'h-36',
                    titleClass: 'text-sm sm:text-base',
                  })}
                </div>
              ))}
            </div>
          </section>
        ),
      },
      {
        key: 'community',
        items: sortedCommunityStories.map(({ item }) => item),
        render: () => (
          <section className="bg-white border border-slate-200 rounded-3xl px-2 sm:px-3 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-xl font-bold text-slate-900">Prayers & Testimonies</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Community</span>
              </div>
              <Button asLink to="/prayer-requests" variant="outline" size="sm">View all</Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory pl-0.5 pr-1">
              {sortedCommunityStories.map(({ item, typeKey }) => (
                <div key={`${typeKey}-${(item as any).id}`} className="snap-start">
                  {renderMediaCard(item, typeKey, {
                    containerClass: 'w-52 sm:w-56 md:w-60',
                    imageClass: 'h-32',
                    titleClass: 'text-sm sm:text-base',
                  })}
                </div>
              ))}
            </div>
          </section>
        ),
      },
      {
        key: 'news',
        items: sortedNews,
        render: () => (
          <section className="bg-white border border-slate-200 rounded-3xl px-2 sm:px-3 py-2.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-xl font-bold text-slate-900">News</h2>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Latest updates</span>
              </div>
              <Button asLink to="/news" variant="outline" size="sm">View all</Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory pl-0.5 pr-1">
              {sortedNews.map((item) => (
                <div key={(item as any).id} className="snap-start">
                  {renderMediaCard(item, 'news', {
                    containerClass: 'w-56 sm:w-60',
                    imageClass: 'h-36',
                    titleClass: 'text-sm sm:text-base',
                  })}
                </div>
              ))}
            </div>
          </section>
        ),
      },
    ] as Array<{ key: string; items: ContentItem[]; render: () => React.ReactNode }>)
      .filter((section) => section.items.length > 0)
      .map((section, index) => ({
        ...section,
        sortDate: Math.max(...section.items.map((item) => getPublishedAt(item).getTime())),
        fallbackIndex: index,
      }))
      .sort((a, b) => {
        const dateDiff = b.sortDate - a.sortDate;
        if (dateDiff !== 0) return dateDiff;
        return a.fallbackIndex - b.fallbackIndex;
      });
  }, [sortedEvents, sortedSermons, sortedBlogs, sortedCommunityStories, sortedNews]);

  useEffect(() => {
    if (import.meta.env.MODE === 'production') return;
    console.debug('Homepage item ordering by publishedAt', {
      events: sortedEvents.map((item) => getPublishedAt(item).toISOString()),
      sermons: sortedSermons.map((item) => getPublishedAt(item).toISOString()),
      blogs: sortedBlogs.map((item) => getPublishedAt(item).toISOString()),
      prayers: sortedPrayerRequests.map((item) => getPublishedAt(item).toISOString()),
      testimonials: sortedTestimonials.map((item) => getPublishedAt(item).toISOString()),
      news: sortedNews.map((item) => getPublishedAt(item).toISOString()),
    });
    console.debug('Homepage section ordering by latest publishedAt', orderedSections.map((section) => ({
      key: section.key,
      latestPublishedAt: new Date(section.sortDate).toISOString(),
    })));
  }, [orderedSections, sortedBlogs, sortedEvents, sortedNews, sortedPrayerRequests, sortedSermons, sortedTestimonials]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-1 sm:px-2">
        <AdSlot placementKey="homepage_banner_top" className="my-8" />

        {isAuthenticated && currentUser && (
          <div className="bg-white border border-slate-200 shadow-md shadow-slate-300/60 rounded-2xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {currentUser.profileImageUrl ? (
                <img src={currentUser.profileImageUrl} alt={currentUser.fullName || 'Admin user'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-semibold text-slate-600">{currentUser.fullName?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => openCreateModal('prayer')}>Share Prayer</Button>
              <Button size="sm" variant="secondary" onClick={() => openCreateModal('testimonial')}>Share Testimony</Button>
            </div>
          </div>
        )}

        {loadingContent && <p className="text-center py-10 text-slate-500 dark:text-slate-400">Loading content...</p>}

        {!loadingContent && (
          <div className="space-y-6">
            {orderedSections.map((section) => (
              <React.Fragment key={section.key}>{section.render()}</React.Fragment>
            ))}
          </div>
        )}

        {!loadingContent
          && sortedEvents.length === 0
          && sortedSermons.length === 0
          && sortedBlogs.length === 0
          && sortedPrayerRequests.length === 0
          && sortedTestimonials.length === 0
          && sortedNews.length === 0 && (
          <p className="text-center text-slate-500 py-10">No recent updates to show.</p>
        )}

        {!loadingContent && (
          <Link to="/donate" className="block">
            <div className="group relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 text-white shadow-xl shadow-cyan-500/30 transition-transform duration-300 hover:-translate-y-1">
              {donatePageContent.homepageCardImageUrl && (
                <img
                  src={donatePageContent.homepageCardImageUrl}
                  alt={donatePageContent.homepageCardTitle}
                  className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 group-hover:opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-transparent" />
              <div className="relative z-10 grid gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.2fr_auto] lg:items-center">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                    Make an Impact Today
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {donatePageContent.homepageCardTitle}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
                    {donatePageContent.homepageCardSubtitle}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-cyan-100">
                    {donatePageContent.homepageCardHighlight}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-start">
                  <span className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80">
                    Secure Giving
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/20">
                    {donatePageContent.homepageCardCtaText}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}
        
        <div className="mt-10">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl">
              {loadingContent && !events.length && !fellowshipRosters.length && !generatedSchedules.length ? (
                <div className="p-4 sm:p-6 h-full flex items-center justify-center min-h-[400px]">
                  <p className="text-center text-slate-500 py-10">Loading calendar...</p>
                </div>
              ) : (
                <>
                  <InteractiveCalendar
                    items={calendarItems}
                    onMonthChange={handleCalendarMonthChange}
                    initialBsMonth={currentCalendarBsMonth}
                    initialBsYear={currentCalendarBsYear}
                  />
                  <div className="mt-4 border-t border-blue-200">
                    <CardHeader className="bg-blue-100">
                      <h2 className="text-xl font-semibold text-blue-800">
                        Events & Notices in {currentDisplayedBsMonthName} {currentCalendarBsYear} BS
                      </h2>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto custom-scrollbar p-3 sm:p-4">
                      {loadingContent && !eventsForSelectedMonth.length && !noticesForSelectedMonth.length ? (
                        <p className="text-slate-500 text-center py-6">Loading events...</p>
                      ) : eventsForSelectedMonth.length === 0 && noticesForSelectedMonth.length === 0 ? (
                        <p className="text-slate-500 text-center py-6">No events or notices scheduled for this month.</p>
                      ) : (
                        <ul className="space-y-3">
                          {eventsForSelectedMonth.map((event) => {
                            const eventBsDate = adToBs(new Date(event.date!));
                            const adDatePart = formatDateADBS(event.date!).split(' (')[1]?.replace(')', '');
                            return (
                              <li key={event.id} className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <Link to={`/events/${event.id}`} className="block">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                                      Event
                                    </span>
                                    <h4 className="font-semibold text-blue-700">{event.title}</h4>
                                  </div>
                                  <div className="flex items-center text-sm text-slate-500 mt-1">
                                    <CalendarDaysIcon className="w-4 h-4 mr-2 text-slate-400" />
                                    <span>{eventBsDate.day} {currentDisplayedBsMonthName} ({adDatePart})</span>
                                    {event.time && <span className="ml-2">@ {event.time}</span>}
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                          {noticesForSelectedMonth.map((notice) => {
                            const noticeBsDate = adToBs(new Date(notice.date));
                            const adDatePart = formatDateADBS(notice.date).split(' (')[1]?.replace(')', '');
                            return (
                              <li key={notice.id} className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <Link to="/notices" className="block">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                      Notice
                                    </span>
                                    <h4 className="font-semibold text-rose-700">{notice.title}</h4>
                                    {notice.rosterType && (
                                      <span className="text-xs text-slate-500">({notice.rosterType})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center text-sm text-slate-500 mt-1">
                                    <CalendarDaysIcon className="w-4 h-4 mr-2 text-slate-400" />
                                    <span>{noticeBsDate.day} {currentDisplayedBsMonthName} ({adDatePart})</span>
                                    {notice.timeSlot && <span className="ml-2">@ {notice.timeSlot}</span>}
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>

        <ContentSection
          title="Community Life"
          subtitle="Explore our ministries"
          action={(
            <Button asLink to="/ministries" variant="outline" size="sm">
              View All Ministries
            </Button>
          )}
        >
          <MinistryPreviewList ministries={ministries} loading={loadingContent} maxItems={3} />
        </ContentSection>

        <ContentSection
          title="Church Network"
          subtitle="Find a branch church near you"
          action={(
            <Button asLink to="/branches" variant="outline" size="sm">
              View All Branches
            </Button>
          )}
        >
          <BranchChurchPreviewList branchChurches={branchChurches} loading={loadingContent} maxItems={3} />
        </ContentSection>

        <AdSlot placementKey="homepage_banner_bottom" className="my-8" />
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      `}</style>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {isAuthenticated && isCreateModalOpen && (
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialPostType={createModalInitialType}
        />
      )}
    </div>
  );
};

export default HomePage; 
