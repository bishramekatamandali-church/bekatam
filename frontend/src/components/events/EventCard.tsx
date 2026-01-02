
import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { EventItem } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import ShareModal from '../ui/ShareModal';
import CommentModal from '../ui/CommentModal'; 
import AuthModal from '../auth/AuthModal'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { useContent } from '../../contexts/ContentContext'; 
import { formatDateADBS } from '../../dateConverter'; 

// Icon components
export const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM17.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    <path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 001.5 1.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" />
  </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}>
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 5.159-4.502 16.975 16.975 0 0 0 2.243-7.53A9.75 9.75 0 0 0 12 2.25a9.75 9.75 0 0 0-9.75 9.75c0 4.11 2.086 7.917 5.234 10.35l.028.015.07.041Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5Z" clipRule="evenodd" />
  </svg>
);

const HeartIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" 
         fill={isFilled ? "currentColor" : "none"} 
         viewBox="0 0 24 24" 
         strokeWidth={1.5} 
         stroke="currentColor" 
         className={`${className} ${isFilled ? 'text-red-500' : ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);
const ChatBubbleOvalLeftEllipsisIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25a9.765 9.765 0 01-1.935-.274A7.707 7.707 0 0012 15.75a7.71 7.71 0 00-3.935 1.085A9.754 9.754 0 013 12c0-4.556-3.86-8.25 8.625-8.25S21 7.444 21 12z" /></svg>
);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.383.05.571.078m-1.571 2.032c.195.025.383.05.571.078m13.48 0a2.25 2.25 0 01-.621 1.628l-3.029 3.028a2.25 2.25 0 01-3.182 0l-3.029-3.028a2.25 2.25 0 01-.621-1.628m13.48 0L19.25 12l-1.521-.078m13.48 0c0 2.042-.832 3.901-2.186 5.256L16.5 21.75m1.217-9.843c-.195-.025-.383-.05-.571-.078m-1.571-2.032c-.195-.025-.383-.05-.571-.078m-1.412 5.690c.195.025.383.05.571.078" /></svg>
);

const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    let videoId = null;
    const regExp1 = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match1 = url.match(regExp1);
    if (match1 && match1[2].length === 11) {
      videoId = match1[2];
    } else {
      const regExp2 = /^.*(youtube.com\/shorts\/)([^#\&\?]*).*/;
      const match2 = url.match(regExp2);
      if (match2 && match2[2]) {
        videoId = match2[2];
      }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

interface EventCardProps {
  event: EventItem;
  isFeatured?: boolean; // For subtle highlight, not the main page featured display
  isPastEvent?: boolean;
  className?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event, isFeatured = false, isPastEvent = false, className = "" }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem, getContentById } = useContent(); 

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [currentEventData, setCurrentEventData] = useState(event);
  const [likeCount, setLikeCount] = useState(currentEventData.likes || 0);
  const [isLiked, setIsLiked] = useState(false); 

  const handleLike = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    logContentActivity(
        `${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} event: "${currentEventData.title}"`,
        'content_update', 
        'event',
        currentEventData.id
    );
    alert(`Like action simulated for "${currentEventData.title}"!`);
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!currentUser) return;
    const newComment = await addCommentToItem(currentEventData.id, 'event', commentText);
    if (newComment) {
      const updatedEvent = getContentById('event', currentEventData.id) as EventItem | undefined;
      if(updatedEvent) setCurrentEventData(updatedEvent);
      setIsCommentModalOpen(false);
    } else {
      alert(`Failed to submit comment for "${currentEventData.title}"`);
    }
  };
  
  const detailUrl = `/events/${currentEventData.id}`;
  const commentCount = currentEventData.comments?.length || 0;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(currentEventData.videoUrl);

  return (
    <>
      <Card className={`flex flex-col ${isFeatured ? 'shadow-lg border border-purple-300' : 'bg-purple-50 border border-purple-200'} ${className} h-full`}>
        <div className={`w-full h-56 bg-slate-200 flex items-center justify-center overflow-hidden`}>
            <Link to={detailUrl} aria-label={`View details for ${currentEventData.title}`} className="w-full h-full">
            {youtubeEmbedUrl ? (
                <div className="aspect-w-16 aspect-h-9 w-full h-full">
                <iframe
                    src={youtubeEmbedUrl}
                    title={currentEventData.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
                </div>
            ) : currentEventData.videoUrl ? (
                <video
                    src={currentEventData.videoUrl}
                    controls={false} 
                    className="w-full h-full object-cover"
                    aria-label={`Video player for ${currentEventData.title}`}
                >
                    Your browser does not support the video tag.
                </video>
            ) : currentEventData.imageUrl ? (
                <img src={currentEventData.imageUrl} alt={currentEventData.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-300">
                    <CalendarDaysIcon className="w-16 h-16 text-slate-500" />
                </div>
            )}
            </Link>
        </div>

        <CardHeader className="border-b border-purple-200">
          <h2 className={`font-semibold text-slate-800 mb-1 text-xl`}>
            <Link to={detailUrl} className="hover:text-purple-600 transition-colors">
              {currentEventData.title}
            </Link>
          </h2>
          {currentEventData.category && <span className="text-xs font-medium uppercase tracking-wider text-purple-600">{currentEventData.category}</span>}
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="text-sm text-slate-500 mb-2 flex items-center">
            <CalendarDaysIcon className="mr-2 text-slate-400 flex-shrink-0" />
            <span>{formatDateADBS(currentEventData.date)} {currentEventData.time ? `at ${currentEventData.time}`: ''}</span>
          </div>
          {currentEventData.location && (
            <div className="flex items-center text-sm text-slate-500 mb-3">
              <MapPinIcon className="mr-2 text-slate-400 flex-shrink-0" />
              <span>{currentEventData.location}</span>
            </div>
          )}
          <p className={`text-sm text-slate-600 leading-relaxed line-clamp-3`}>
            {currentEventData.description}
          </p>
        </CardContent>
        <CardFooter className={`flex ${isPastEvent ? 'justify-around items-center flex-wrap gap-1 sm:gap-2' : 'justify-start'} bg-purple-100 border-t border-purple-200`}>
          {isPastEvent ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center text-slate-600 hover:text-red-500 px-1.5 sm:px-2 py-1" aria-pressed={isLiked} aria-label={isLiked ? `Unlike event, ${likeCount} likes` : `Like event, ${likeCount} likes`}>
                <HeartIcon className={`w-5 h-5 mr-1`} isFilled={isLiked} /> {likeCount > 0 ? likeCount : ''} <span className="sr-only sm:not-sr-only ml-1">Like</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCommentClick} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5 sm:px-2 py-1" aria-label="Comment on event">
                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-1" /> 
                {commentCount > 0 ? commentCount : ''} <span className="sr-only sm:not-sr-only ml-1">Comment</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5 sm:px-2 py-1" aria-label="Share event">
                <ShareIcon className="w-5 h-5 mr-1" /> <span className="sr-only sm:not-sr-only">Share</span>
              </Button>
              <Button asLink to={detailUrl} variant="outline" size="sm" className="px-1.5 sm:px-2 py-1 text-purple-600 border-purple-600 hover:bg-purple-200">View Details</Button>
            </>
          ) : (
            <Button asLink to={detailUrl} variant={"ghost"} size="sm" className={'text-purple-600 hover:bg-purple-200'}>
              View Details
            </Button>
          )}
        </CardFooter>
      </Card>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {isPastEvent && (
        <>
          <ShareModal 
            isOpen={isShareModalOpen} 
            onClose={() => setIsShareModalOpen(false)} 
            title={`Share "${currentEventData.title}"`}
            url={detailUrl} 
            eventTitle={currentEventData.title}
          />
          <CommentModal
            isOpen={isCommentModalOpen}
            onClose={() => setIsCommentModalOpen(false)}
            eventTitle={currentEventData.title}
            onSubmitComment={handleSubmitComment}
          />
        </>
      )}
    </>
  );
};

export default EventCard;
