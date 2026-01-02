import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { ContentItem, FeatureInfo, PrayerRequest } from '../types';

import FeatureCard from '../components/home/FeatureCard';
import PrayerRequestCard from '../components/prayer/PrayerRequestCard';
import TestimonialCard from '../components/prayer/TestimonialCard';
import Button from '../components/ui/Button';
import AdSlot from '../components/ads/AdSlot';
import CommentModal from '../components/ui/CommentModal';
import CreatePostWidget from '../components/home/CreatePostWidget';
import CreatePostModal from '../components/post/CreatePostModal';
import AuthModal from '../components/auth/AuthModal';

// Helper to get a consistent, sortable date from any content item
const getSortDate = (item: any): Date => {
  const dateStr = item.date || item.lastPublishedAt || item.submittedAt || item.uploadDate || item.createdAt || item.expenseDate || item.collectionDate || item.meetingDate || item.decisionDate;
  return dateStr ? new Date(dateStr) : new Date(0);
};

const HomePage: React.FC = () => {
  const { 
    sermons, events, newsItems, blogPosts, homeSlides, historyChapters, 
    directMediaItems, prayerRequests, testimonials,
    loadingContent,
    togglePrayerOnRequest, updatePrayerRequestStatusByUser, addCommentToItem
  } = useContent();

  const { isAuthenticated, isAdmin } = useAuth();
  
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialType, setCreateModalInitialType] = useState<'prayer' | 'testimonial'>('prayer');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeRequestForComment, setActiveRequestForComment] = useState<PrayerRequest | null>(null);

  const upcomingEvents = useMemo(() => 
    events
      .filter(event => event.date && new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 3), // Show up to 3 upcoming events
  [events]);

  const allContentFeed = useMemo(() => {
    if (loadingContent) return [];
    
    // Using a 'type guard' to safely check for properties.
    const hasProperty = <T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> => {
        return key in obj;
    }

    const mapToFeedItem = (item: ContentItem, typeKey: string): any => {
        let feedItem: Partial<FeatureInfo> & { typeKey: string, originalItem: ContentItem } = {
            id: (item as any).id,
            title: (item as any).title || (item as any).name || 'Untitled',
            description: (item as any).description || (item as any).summary || (item as any).content || (item as any).contentText || (item as any).requestText || 'No description available.',
            imageUrl: (item as any).imageUrl || ((item as any).mediaType === 'image' ? (item as any).url : undefined),
            linkPath: (item as any).linkPath || `/${typeKey}s/${(item as any).id}`,
            category: (item as any).category,
            date: getSortDate(item).toISOString(),
            typeKey,
            originalItem: item
        };
        return feedItem;
    };
    
    const pastEvents = events.filter(e => e.date && new Date(e.date) < new Date());
    
    const contentSources = [
      { items: sermons, type: 'sermon' },
      { items: pastEvents, type: 'event' },
      { items: newsItems, type: 'news' },
      { items: blogPosts, type: 'blogPost' },
      { items: historyChapters.filter(c => c.status === 'published'), type: 'historyChapter' },
      { items: directMediaItems, type: 'directMedia' },
      { items: prayerRequests.filter(p => p.visibility === 'public' || p.visibility === 'anonymous'), type: 'prayerRequest' },
      { items: testimonials.filter(t => t.visibility === 'public'), type: 'testimonial' },
    ];

    const combined = contentSources.flatMap(source => source.items.map(item => mapToFeedItem(item, source.type)));

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sermons, events, newsItems, blogPosts, historyChapters, directMediaItems, prayerRequests, testimonials, loadingContent]);

  const handleOpenCommentModal = (request: PrayerRequest) => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setActiveRequestForComment(request);
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!activeRequestForComment) return;
    const result = await addCommentToItem(activeRequestForComment.id, 'prayerRequest', commentText);
    if (result) { setIsCommentModalOpen(false); setActiveRequestForComment(null); } 
    else { alert("Failed to add comment."); }
  };
  
  const openCreateModal = (type: 'prayer' | 'testimonial') => {
    if (!isAdmin) return;
    if (isAuthenticated) {
      setCreateModalInitialType(type);
      setIsCreateModalOpen(true);
    } else {
        setIsAuthModalOpen(true);
    }
  };


  const Section: React.FC<{title: string; children: React.ReactNode; viewAllLink?: string; viewAllText?: string;}> = ({ title, children, viewAllLink, viewAllText }) => (
    <section className="py-8 sm:py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        {viewAllLink && (
          <Button asLink to={viewAllLink} variant="outline" size="sm" className="hidden sm:inline-flex dark:text-teal-400 dark:border-teal-400 dark:hover:bg-teal-700 dark:hover:text-white">
            {viewAllText || 'View All'}
          </Button>
        )}
      </div>
      {children}
      {viewAllLink && (
          <div className="mt-6 text-center sm:hidden">
            <Button asLink to={viewAllLink} variant="outline" size="sm" className="w-full">
                {viewAllText || 'View All'}
            </Button>
          </div>
      )}
    </section>
  );

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AdSlot placementKey="homepage_banner_top" className="my-8" />
        
        {isAdmin && <CreatePostWidget onTriggerCreate={openCreateModal} />}
        
        {!loadingContent && (
          <>
            {upcomingEvents.length > 0 && (
              <Section title="Upcoming Events" viewAllLink="/events" viewAllText="View All Events">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {upcomingEvents.map(event => <FeatureCard key={event.id} feature={event} />)}
                </div>
              </Section>
            )}

            <Section title="Latest Updates from Our Community">
                {allContentFeed.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {allContentFeed.map((item, index) => (
                        <React.Fragment key={`${item.id}-${index}`}>
                            {(() => {
                                const originalItem = item.originalItem;
                                switch (item.typeKey) {
                                    case 'prayerRequest':
                                        return <PrayerRequestCard request={originalItem as PrayerRequest} onPrayedFor={togglePrayerOnRequest} onStatusUpdate={updatePrayerRequestStatusByUser} onComment={handleOpenCommentModal} />;
                                    case 'testimonial':
                                        return <TestimonialCard testimonial={originalItem as any} />;
                                    default:
                                        return <FeatureCard feature={item as FeatureInfo} />;
                                }
                            })()}
                            {(index + 1) % 6 === 0 && (
                                <div className="md:col-span-2 xl:col-span-3">
                                <AdSlot placementKey="content_list_interspersed" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-10">No recent updates to show.</p>
                )}
            </Section>
          </>
        )}

        {loadingContent && <p className="text-center py-10 text-slate-500 dark:text-slate-400">Loading content...</p>}
        
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
        {isCommentModalOpen && activeRequestForComment && (
            <CommentModal 
                isOpen={isCommentModalOpen} 
                onClose={() => setIsCommentModalOpen(false)} 
                eventTitle={`Comment on "${activeRequestForComment.title}"`} 
                onSubmitComment={handleSubmitComment} 
            />
        )}
    </div>
  );
};

export default HomePage;