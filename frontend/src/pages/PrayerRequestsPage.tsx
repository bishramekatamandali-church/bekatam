
import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { PrayerRequest, Testimonial } from '../types';

import PrayerRequestCard from '../components/prayer/PrayerRequestCard';
import TestimonialCard from '../components/prayer/TestimonialCard';
import CreatePostWidget from '../components/home/CreatePostWidget';
import CreatePostModal from '../components/post/CreatePostModal';
import AuthModal from '../components/auth/AuthModal';
import CommentModal from '../components/ui/CommentModal';
import Button from '../components/ui/Button';

const getSortDate = (item: any): Date => {
  const dateStr = item.submittedAt || item.createdAt || '1970-01-01T00:00:00Z';
  return dateStr ? new Date(dateStr) : new Date(0);
};


const PrayerRequestsPage: React.FC = () => {
    const { prayerRequests, testimonials, loadingContent, togglePrayerOnRequest, updatePrayerRequestStatusByUser, addCommentToItem } = useContent();
    const { isAuthenticated, isAdmin } = useAuth();
  
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialType, setCreateModalInitialType] = useState<'prayer' | 'testimonial'>('prayer');
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [activeRequestForComment, setActiveRequestForComment] = useState<PrayerRequest | null>(null);

    const timelineFeed = useMemo(() => {
        if (loadingContent) return [];
        
        const mapToFeedItem = (item: PrayerRequest | Testimonial, typeKey: 'prayerRequest' | 'testimonial'): any => {
            return {
                id: item.id,
                date: getSortDate(item).toISOString(),
                typeKey,
                originalItem: item
            };
        };

        const publicPrayerRequests = prayerRequests.filter(p => p.visibility === 'public' || p.visibility === 'anonymous');
        const publicTestimonials = testimonials.filter(t => t.visibility === 'public');
        
        const combined = [
            ...publicPrayerRequests.map(item => mapToFeedItem(item, 'prayerRequest')),
            ...publicTestimonials.map(item => mapToFeedItem(item, 'testimonial')),
        ];

        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [prayerRequests, testimonials, loadingContent]);

    const openCreateModal = (type: 'prayer' | 'testimonial') => {
        if (!isAdmin) return;
        if (isAuthenticated) {
            setCreateModalInitialType(type);
            setIsCreateModalOpen(true);
        } else {
            setIsAuthModalOpen(true);
        }
    };

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

    const Section: React.FC<{title: string; children: React.ReactNode;}> = ({ title, children }) => (
        <section className="py-8 sm:py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          </div>
          {children}
        </section>
      );

    return (
        <div className="min-h-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {isAdmin && <CreatePostWidget onTriggerCreate={openCreateModal} />}
                
                 <Section title="Community Prayers & Testimonies">
                    {loadingContent ? (
                         <p className="text-center text-slate-500 py-10">Loading feed...</p>
                    ) : timelineFeed.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                        {timelineFeed.map((item) => (
                            <React.Fragment key={`${item.typeKey}-${item.id}`}>
                                {(() => {
                                    const originalItem = item.originalItem;
                                    switch (item.typeKey) {
                                        case 'prayerRequest':
                                            return <PrayerRequestCard request={originalItem as PrayerRequest} onPrayedFor={togglePrayerOnRequest} onStatusUpdate={updatePrayerRequestStatusByUser} onComment={handleOpenCommentModal} />;
                                        case 'testimonial':
                                            return <TestimonialCard testimonial={originalItem as Testimonial} />;
                                        default:
                                            return null;
                                    }
                                })()}
                            </React.Fragment>
                        ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-10">No public prayer requests or testimonies are available right now.</p>
                    )}
                </Section>
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

export default PrayerRequestsPage;
