import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { ContentItem, FeatureInfo } from '../types';

import Button from '../components/ui/Button';
import AdSlot from '../components/ads/AdSlot';
import CreatePostModal from '../components/post/CreatePostModal';
import AuthModal from '../components/auth/AuthModal';

// Helper to get a consistent, sortable date from any content item
  const getPublishedAt = (item: any): Date => {
  const dateStr = item.publishedAt || item.createdAt || item.submittedAt || item.date || item.incidentAt || item.lastPublishedAt || item.uploadDate || item.updatedAt || item.expenseDate || item.collectionDate || item.meetingDate || item.decisionDate;
  return dateStr ? new Date(dateStr) : new Date(0);
};

const getContentUpdatedAt = (item: any): Date => {
  const dateStr = item.updatedAt || item.lastPublishedAt || item.publishedAt || item.createdAt || item.submittedAt || item.date || item.incidentAt;
  return dateStr ? new Date(dateStr) : new Date(0);
};

const buildContentKey = (typeKey: string, id: string | number) => `home:${typeKey}:${id}`;
const guestSeenStorageKey = 'homepage_seen_content_v1:guest';
const userSeenStorageKey = (userId: string) => `homepage_seen_content_v1:user:${userId}`;

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
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
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

const HomePage: React.FC = () => {
  const {
    sermons,
    events,
    newsItems,
    blogPosts,
    prayerRequests,
    testimonials,
    loadingContent,
  } = useContent();

  const { isAuthenticated, isAdmin, currentUser } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<'prayer' | 'testimonial'>('prayer');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [seenContentMap, setSeenContentMap] = useState<Record<string, number>>({});
  const seenStorageKey = currentUser ? userSeenStorageKey(currentUser.id) : guestSeenStorageKey;

  useEffect(() => {
    try {
      if (currentUser) {
        const storedUser = window.localStorage.getItem(seenStorageKey);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as Record<string, number>;
          if (parsedUser && typeof parsedUser === 'object') {
            setSeenContentMap(parsedUser);
            return;
          }
        }
        const storedGuest = window.localStorage.getItem(guestSeenStorageKey);
        if (storedGuest) {
          const parsedGuest = JSON.parse(storedGuest) as Record<string, number>;
          if (parsedGuest && typeof parsedGuest === 'object') {
            setSeenContentMap(parsedGuest);
            window.localStorage.setItem(seenStorageKey, JSON.stringify(parsedGuest));
            return;
          }
        }
      }
      const storedGuest = window.localStorage.getItem(guestSeenStorageKey);
      if (storedGuest) {
        const parsedGuest = JSON.parse(storedGuest) as Record<string, number>;
        if (parsedGuest && typeof parsedGuest === 'object') {
          setSeenContentMap(parsedGuest);
          return;
        }
      }
      setSeenContentMap({});
    } catch (error) {
      console.warn('Failed to load homepage seen content state.', error);
    }
  }, [currentUser, seenStorageKey]);

  const openCreateModal = (type: 'prayer' | 'testimonial') => {
    if (!isAdmin) return;
    if (isAuthenticated) {
      setCreateModalInitialType(type);
      setIsCreateModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
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

  const markContentSeen = (item: ContentItem, typeKey: string) => {
    const id = (item as any).id;
    if (!id) return;
    const key = buildContentKey(typeKey, id);
    const updatedAt = getContentUpdatedAt(item).getTime();
    setSeenContentMap((prev) => {
      if (prev[key] && prev[key] >= updatedAt) {
        return prev;
      }
      const next = {
        ...prev,
        [key]: updatedAt,
      };
      try {
        window.localStorage.setItem(seenStorageKey, JSON.stringify(next));
      } catch (error) {
        console.warn('Failed to persist homepage seen content state.', error);
      }
      return next;
    });
  };

  const isContentNew = (item: ContentItem, typeKey: string) => {
    const id = (item as any).id;
    if (!id) return false;
    const key = buildContentKey(typeKey, id);
    const updatedAt = getContentUpdatedAt(item).getTime();
    const seenAt = seenContentMap[key] || 0;
    return updatedAt > seenAt;
  };

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
    const showNewBadge = isContentNew(item, typeKey);
    const videoUrl = ['sermons', 'events'].includes(typeKey) ? (item as any).videoUrl : undefined;
    const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);
    const showVideo = ['sermons', 'events'].includes(typeKey) && Boolean(videoUrl);
    const useVideoPlayer = showVideo && isDirectVideoUrl(videoUrl);
    const embedUrl = youtubeEmbedUrl || videoUrl;
    const pauseOtherVideos = (currentVideo: HTMLVideoElement) => {
      document.querySelectorAll('video').forEach((video) => {
        if (video !== currentVideo) {
          video.pause();
        }
      });
    };

    const handleVideoPlay = (event: React.SyntheticEvent<HTMLVideoElement>) => {
      pauseOtherVideos(event.currentTarget);
    };

    const handleVideoClick = (event: React.SyntheticEvent<HTMLVideoElement>) => {
      pauseOtherVideos(event.currentTarget);
    };
    return (
      <Link
        to={info.linkPath}
        key={`${typeKey}-${info.id}`}
        onClick={() => markContentSeen(item, typeKey)}
        className={`group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${options.containerClass}`}
      >
        <div className={`relative bg-slate-100 rounded-xl overflow-hidden ${options.imageClass}`}>
          {showVideo ? (
            useVideoPlayer ? (
              <video
                src={videoUrl}
                controls
                onPlay={handleVideoPlay}
                onClick={handleVideoClick}
                className="w-full h-full object-cover"
                aria-label={`Video preview for ${info.title}`}
              />
            ) : (
              embedUrl && (
                <iframe
                  src={embedUrl}
                  title={`Video embed for ${info.title}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              )
            )
          ) : info.imageUrl ? (
            <img src={info.imageUrl} alt={info.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
          )}
          {showNewBadge && (
            <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white shadow">
              New
            </span>
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

        {isAdmin && currentUser && (
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

        <AdSlot placementKey="homepage_banner_bottom" className="my-8" />
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {isAdmin && isCreateModalOpen && (
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
