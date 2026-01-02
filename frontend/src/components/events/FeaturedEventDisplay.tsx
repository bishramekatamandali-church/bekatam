
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { EventItem } from '../../types';
import Button from '../ui/Button';
import ShareModal from '../ui/ShareModal';
import CommentModal from '../ui/CommentModal';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { formatDateADBS } from '../../dateConverter';
import useAITranslate from '../../../src/hooks/useAITranslate';
import {
  CalendarDaysIcon as CalendarIconOutline,
  MapPinIcon as LocationIconOutline,
  HeartIcon as HeartIconOutline,
  ChatBubbleOvalLeftEllipsisIcon as CommentIconOutline,
  ShareIcon as ShareIconOutline,
  TicketIcon as TicketIconOutline,
  UsersIcon as GuestsIconOutline,
  LightBulbIcon as ExpectationsIconOutline // Corrected: LightBulbIcon with capital B
} from '@heroicons/react/24/outline';

const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    let videoId = null;
    const regExp1 = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match1 = url.match(regExp1);
    if (match1 && match1[2].length === 11) videoId = match1[2];
    else {
        const regExp2 = /^.*(youtube.com\/shorts\/)([^#\&\?]*).*/;
        const match2 = url.match(regExp2);
        if (match2 && match2[2]) videoId = match2[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

interface FeaturedEventDisplayProps {
  event: EventItem;
  isPastEvent?: boolean;
}

const FeaturedEventDisplay: React.FC<FeaturedEventDisplayProps> = ({ event, isPastEvent = false }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem, getContentById } = useContent();

  const [currentEventState, setCurrentEventState] = useState(event);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false); 
  const [likeCount, setLikeCount] = useState(currentEventState.likes || 0);

  const { translatedText: title, isLoading: isLoadingTitle } = useAITranslate(currentEventState.title, 'en');
  const { translatedText: description, isLoading: isLoadingDescription } = useAITranslate(currentEventState.description, 'en');
  const { translatedText: category, isLoading: isLoadingCategory } = useAITranslate(currentEventState.category, 'en');
  const { translatedText: location, isLoading: isLoadingLocation } = useAITranslate(currentEventState.location, 'en');
  const { translatedText: expectations, isLoading: isLoadingExpectations } = useAITranslate(currentEventState.expectations, 'en');
  const { translatedText: guests, isLoading: isLoadingGuests } = useAITranslate(currentEventState.guests, 'en');


  const handleLike = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    logContentActivity(
        `${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} event: "${currentEventState.title}"`,
        'content_update', 'event', currentEventState.id
    );
    alert(`Like action simulated for "${currentEventState.title}"!`);
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!currentUser) return;
    const newComment = await addCommentToItem(currentEventState.id, 'event', commentText);
    if (newComment) {
      const updatedEvent = getContentById('event', currentEventState.id) as EventItem | undefined;
      if (updatedEvent) setCurrentEventState(updatedEvent);
      setIsCommentModalOpen(false);
    } else {
      alert("Failed to submit comment.");
    }
  };

  const detailUrl = `/events/${currentEventState.id}`;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(currentEventState.videoUrl);
  const currentCommentCount = currentEventState.comments?.length || 0;

  return (
    <>
      <div className="md:flex items-stretch bg-purple-50 border border-purple-200 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden">
        {/* Media Side */}
        <div className="md:w-5/12 flex-shrink-0 bg-slate-200">
          {youtubeEmbedUrl ? (
            <div className="aspect-video w-full h-full">
              <iframe
                src={youtubeEmbedUrl}
                title={isLoadingTitle ? currentEventState.title : title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          ) : currentEventState.imageUrl ? (
            <img src={currentEventState.imageUrl} alt={isLoadingTitle ? currentEventState.title : title} className="w-full h-64 md:h-full object-cover" />
          ) : (
            <div className="w-full h-64 md:h-full flex items-center justify-center">
              <CalendarIconOutline className="w-24 h-24 text-slate-400" />
            </div>
          )}
        </div>

        {/* Content Side */}
        <div className="md:w-7/12 flex flex-col p-6 md:p-8">
          <div className="flex-grow">
            {currentEventState.category && (
              <p className="text-sm font-semibold text-purple-600 mb-1">
                {isLoadingCategory ? currentEventState.category : category}
              </p>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-3 leading-tight">
              {isLoadingTitle ? currentEventState.title : title}
            </h1>
            <div className="space-y-2 text-sm text-slate-600 mb-4">
              <p className="flex items-center"><CalendarIconOutline className="w-4 h-4 mr-2 text-slate-500" /> {formatDateADBS(currentEventState.date)} {currentEventState.time ? `at ${currentEventState.time}` : ''}</p>
              {currentEventState.location && <p className="flex items-center"><LocationIconOutline className="w-4 h-4 mr-2 text-slate-500" /> {isLoadingLocation ? currentEventState.location : location}</p>}
            </div>
            <p className="text-slate-700 leading-relaxed mb-4 text-sm md:text-base">
              {isLoadingDescription ? currentEventState.description : description}
            </p>
            {currentEventState.expectations && <p className="text-sm text-slate-600 mb-2 flex items-start"><ExpectationsIconOutline className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0"/> <strong>Expect:</strong> <span className="ml-1">{isLoadingExpectations ? currentEventState.expectations : expectations}</span></p>}
            {currentEventState.guests && <p className="text-sm text-slate-600 mb-2 flex items-start"><GuestsIconOutline className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0"/> <strong>Guests:</strong> <span className="ml-1">{isLoadingGuests ? currentEventState.guests : guests}</span></p>}
            {currentEventState.isFeeRequired && <p className="text-sm text-slate-600 mb-2 flex items-start"><TicketIconOutline className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0"/> <strong>Fee:</strong> {currentEventState.feeAmount || 'Details in link'}</p>}

          </div>
          
          <div className="mt-6 pt-6 border-t border-purple-200">
            {isPastEvent && (
              <div className="flex items-center justify-start space-x-4 mb-4">
                <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center text-slate-600 hover:text-red-500 px-1.5" aria-pressed={isLiked}>
                  <HeartIconOutline className="w-5 h-5 mr-1.5" /> {likeCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleCommentClick} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5">
                  <CommentIconOutline className="w-5 h-5 mr-1.5" /> {currentCommentCount}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5">
                  <ShareIconOutline className="w-5 h-5 mr-1.5" />
                </Button>
              </div>
            )}
            <Button asLink to={detailUrl} variant="primary" size="md" className="w-full sm:w-auto">
              {currentEventState.registrationLink && currentEventState.registrationLink !== '#' ? "Register / View Details" : "View Details"}
            </Button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={`Share "${isLoadingTitle ? currentEventState.title : title}"`}
        url={detailUrl} 
        eventTitle={isLoadingTitle ? currentEventState.title : title}
      />
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        eventTitle={isLoadingTitle ? currentEventState.title : title}
        onSubmitComment={handleSubmitComment}
      />
    </>
  );
};

export default FeaturedEventDisplay;