
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
import GuestPrayerModal from '../components/prayer/GuestPrayerModal';

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
    const [activeItemForComment, setActiveItemForComment] = useState<{ item: PrayerRequest | Testimonial; type: 'prayerRequest' | 'testimonial' } | null>(null);
    const [isGuestPrayerModalOpen, setIsGuestPrayerModalOpen] = useState(false);
    const [activeRequestForPrayer, setActiveRequestForPrayer] = useState<PrayerRequest | null>(null);

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

    const handleOpenCommentModal = (item: PrayerRequest | Testimonial, type: 'prayerRequest' | 'testimonial') => {
        if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
        setActiveItemForComment({ item, type });
        setIsCommentModalOpen(true);
    };

    const handleSubmitComment = async (commentText: string) => {
        if (!activeItemForComment) return;
        const result = await addCommentToItem(activeItemForComment.item.id, activeItemForComment.type, commentText);
        if (result) { setIsCommentModalOpen(false); setActiveItemForComment(null); } 
        else { alert("Failed to add comment."); }
    };

    const handlePray = async (request: PrayerRequest) => {
        if (isAuthenticated) {
            await togglePrayerOnRequest(request.id);
            return;
        }
        setActiveRequestForPrayer(request);
        setIsGuestPrayerModalOpen(true);
    };

    const handleGuestPrayerSubmit = async (contact: { email?: string; phone?: string }) => {
        if (!activeRequestForPrayer) return;
        const success = await togglePrayerOnRequest(activeRequestForPrayer.id, contact);
        if (success) {
            const guestKey = `bem_guest_prayer_${activeRequestForPrayer.id}`;
            const storedValue = contact.email || contact.phone || '';
            if (storedValue) {
                window.localStorage.setItem(guestKey, storedValue);
            }
            setIsGuestPrayerModalOpen(false);
            setActiveRequestForPrayer(null);
        } else {
            alert('Unable to record your prayer. Please check your details and try again.');
        }
    };

    const Section: React.FC<{title: string; children: React.ReactNode;}> = ({ title, children }) => (
        <section className="py-8 sm:py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{title}</h2>
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
                        <div className="flex flex-col divide-y divide-slate-200">
                        {timelineFeed.map((item) => (
                            <div key={`${item.typeKey}-${item.id}`} className="py-6 first:pt-0 last:pb-0">
                                {(() => {
                                    const originalItem = item.originalItem;
                                    switch (item.typeKey) {
                                        case 'prayerRequest':
                                            return <PrayerRequestCard request={originalItem as PrayerRequest} onPrayedFor={handlePray} onStatusUpdate={updatePrayerRequestStatusByUser} onComment={(request) => handleOpenCommentModal(request, 'prayerRequest')} />;
                                        case 'testimonial':
                                            return <TestimonialCard testimonial={originalItem as Testimonial} onComment={(testimonial) => handleOpenCommentModal(testimonial, 'testimonial')} />;
                                        default:
                                            return null;
                                    }
                                })()}
                            </div>
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
            {isCommentModalOpen && activeItemForComment && (
                <CommentModal 
                    isOpen={isCommentModalOpen} 
                    onClose={() => setIsCommentModalOpen(false)} 
                    eventTitle={`Comment on "${activeItemForComment.item.title}"`}  
                    onSubmitComment={handleSubmitComment} 
                />
            )}
            {isGuestPrayerModalOpen && (
                <GuestPrayerModal
                    isOpen={isGuestPrayerModalOpen}
                    onClose={() => {
                        setIsGuestPrayerModalOpen(false);
                        setActiveRequestForPrayer(null);
                    }}
                    onSubmit={handleGuestPrayerSubmit}
                />
            )}
        </div>
    );
};

export default PrayerRequestsPage;
