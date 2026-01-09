import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { ContentItem, FeatureInfo } from '../types';

import Button from '../components/ui/Button';
import AdSlot from '../components/ads/AdSlot';
import CreatePostModal from '../components/post/CreatePostModal';
import AuthModal from '../components/auth/AuthModal';

// Helper to get a consistent, sortable date from any content item
const getSortDate = (item: any): Date => {
  const dateStr = item.date || item.lastPublishedAt || item.submittedAt || item.uploadDate || item.createdAt || item.expenseDate || item.collectionDate || item.meetingDate || item.decisionDate;
  return dateStr ? new Date(dateStr) : new Date(0);
};

const HomePage: React.FC = () => {
  const {
    sermons,
    events,
    newsItems,
    blogPosts,
    loadingContent,
  } = useContent();

  const { isAuthenticated, isAdmin, currentUser } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<'prayer' | 'testimonial'>('prayer');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openCreateModal = (type: 'prayer' | 'testimonial') => {
    if (!isAdmin) return;
    if (isAuthenticated) {
      setCreateModalInitialType(type);
      setIsCreateModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const mapToFeatureInfo = (item: ContentItem, typeKey: string): FeatureInfo => ({
    id: (item as any).id,
    title: (item as any).title || (item as any).name || 'Untitled',
    description: (item as any).description || (item as any).summary || (item as any).content || (item as any).contentText || (item as any).requestText || 'No description available.',
    imageUrl: (item as any).imageUrl || ((item as any).mediaType === 'image' ? (item as any).url : undefined),
    linkPath: (item as any).linkPath || `/${typeKey}/${(item as any).id}`,
    category: (item as any).category || typeKey,
    date: getSortDate(item).toISOString(),
  });

  const sortedEvents = useMemo(
    () => [...events].filter(Boolean).sort((a, b) => getSortDate(b).getTime() - getSortDate(a).getTime()),
    [events]
  );
  const sortedSermons = useMemo(
    () => [...sermons].filter(Boolean).sort((a, b) => getSortDate(b).getTime() - getSortDate(a).getTime()),
    [sermons]
  );
  const sortedBlogs = useMemo(
    () => [...blogPosts].filter(Boolean).sort((a, b) => getSortDate(b).getTime() - getSortDate(a).getTime()),
    [blogPosts]
  );
  const sortedNews = useMemo(
    () => [...newsItems].filter(Boolean).sort((a, b) => getSortDate(b).getTime() - getSortDate(a).getTime()),
    [newsItems]
  );

  const NEWS_BATCH_SIZE = 6;
  const [visibleNewsCount, setVisibleNewsCount] = useState(NEWS_BATCH_SIZE);
  const newsSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleNewsCount(NEWS_BATCH_SIZE);
  }, [newsItems]);

  useEffect(() => {
    const sentinel = newsSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleNewsCount((prev) => Math.min(prev + NEWS_BATCH_SIZE, sortedNews.length));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sortedNews.length]);

  const renderMediaCard = (
    item: ContentItem,
    typeKey: string,
    options: { containerClass: string; imageClass: string; titleClass: string }
  ) => {
    const info = mapToFeatureInfo(item, typeKey);
    return (
      <Link
        to={info.linkPath}
        key={`${typeKey}-${info.id}`}
        className={`group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${options.containerClass}`}
      >
        <div className={`bg-slate-100 rounded-xl overflow-hidden ${options.imageClass}`}>
          {info.imageUrl ? (
            <img src={info.imageUrl} alt={info.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
          )}
        </div>
        <div className="mt-2 px-1">
          <h3 className={`font-semibold text-slate-900 line-clamp-2 ${options.titleClass}`}>{info.title}</h3>
        </div>
      </Link>
    );
  };

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
            {[
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
                    <div className="space-y-3">
                      {sortedNews.slice(0, visibleNewsCount).map((item) => {
                        const info = mapToFeatureInfo(item, 'news');
                        return (
                          <Link
                            key={(item as any).id}
                            to={info.linkPath}
                            className="group flex flex-col sm:flex-row gap-3 border border-slate-200 rounded-2xl p-3 bg-white hover:shadow-md transition-shadow"
                          >
                            <div className="sm:w-48 w-full h-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                              {info.imageUrl ? (
                                <img src={info.imageUrl} alt={info.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold text-slate-900">{info.title}</h3>
                              <p className="text-sm text-slate-600 line-clamp-3">{info.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    {visibleNewsCount < sortedNews.length && (
                      <div ref={newsSentinelRef} className="h-6" />
                    )}
                  </section>
                ),
              },
            ]
              .filter((section) => section.items.length > 0)
              .sort((a, b) => getSortDate(b.items[0]).getTime() - getSortDate(a.items[0]).getTime())
              .map((section) => (
                <React.Fragment key={section.key}>{section.render()}</React.Fragment>
              ))}
          </div>
        )}

        {!loadingContent && sortedEvents.length === 0 && sortedSermons.length === 0 && sortedBlogs.length === 0 && sortedNews.length === 0 && (
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
