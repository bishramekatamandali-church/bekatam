import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom"; 
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import CommentModal from '../components/ui/CommentModal'; 
import ShareModal from '../components/ui/ShareModal';
import { EventItem, Comment as CommentType } from '../types'; 
import { formatDateADBS, formatTimestampADBS } from '../dateConverter';
import AdSlot from '../components/ads/AdSlot';
import CommentItem from '../components/comments/CommentItem';
import { ChatBubbleOvalLeftEllipsisIcon } from '../components/icons/GenericIcons';

// Icons (can be centralized)
const CalendarDaysIconSolid: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 001.5 1.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" /><path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0ZM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5ZM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0ZM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5ZM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0ZM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5ZM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0ZM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5ZM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0ZM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5ZM17.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0Z" /></svg>
);
const MapPinIconSolid: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 005.159-4.502 16.975 16.975 0 002.243-7.53A9.75 9.75 0 0012 2.25a9.75 9.75 0 00-9.75 9.75c0 4.11 2.086 7.917 5.234 10.35l.028.015.07.041Z" clipRule="evenodd" /><path fillRule="evenodd" d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5Z" clipRule="evenodd" /></svg>
);
const UsersIconSolid: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63L12.5 21.75l-.435.145a.75.75 0 01-.63 0l-2.955-.985a.75.75 0 01-.363-.63l-.001-.122v-.002zM17.25 19.128l-.001.121a.75.75 0 01-.363.63l-2.955.985a.75.75 0 01-.63 0l-.435-.145L10 21.75a.75.75 0 01-.363-.63l-.001-.119v-.004a5.625 5.625 0 0111.25 0z" /></svg>
);
const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75ZM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0ZM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59Z" /><path fillRule="evenodd" d="M9 12.75A5.25 5.25 0 0012 21a5.25 5.25 0 003-9.25V8.379a.75.75 0 01.408-.668l3.574-1.931a.75.75 0 00.497-1.035A11.248 11.248 0 0012 2.25a11.248 11.248 0 00-7.824 3.495.75.75 0 00.497 1.035l3.574 1.931a.75.75 0 01.408.668v4.371Z" clipRule="evenodd" /></svg>
);
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" /></svg>
);
const TicketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${className}`}><path d="M1.5 8.67v.58a3 3 0 003 3V15a3 3 0 003 3h12a3 3 0 003-3v-2.75a3 3 0 003-3V8.67L19.09 12l-2.56 3.33a.75.75 0 01-1.11-.09l-1.301-1.71a.75.75 0 00-1.11-.09L10.5 16.94a.75.75 0 01-1.11-.09L6.09 12l-2.677-3.33A3.001 3.001 0 001.5 8.67z" /><path d="M1.5 6.75a3 3 0 013-3h15a3 3 0 013 3v.089c-.54-.393-1.13-.69-1.78-.907L19.5 3.75h-15l-.97.974A2.983 2.983 0 001.5 6.75z" /></svg>
);
const ShareIconUI: React.FC<{ className?: string }> = ({ className }) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.383.05.571.078m-1.571 2.032c.195.025.383.05.571.078m13.48 0a2.25 2.25 0 01-.621 1.628l-3.029 3.028a2.25 2.25 0 01-3.182 0l-3.029-3.028a2.25 2.25 0 01-.621-1.628m13.48 0L19.25 12l-1.521-.078m13.48 0c0 2.042-.832 3.901-2.186 5.256L16.5 21.75m1.217-9.843c-.195-.025-.383-.05-.571-.078m-1.571-2.032c-.195-.025-.383-.05-.571-.078m-1.412 5.690c.195.025.383.05.571.078" /></svg>
);
const HeartIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={isFilled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} ${isFilled ? 'text-red-500' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
);

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  let videoId = null;
  const regExpStandard = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const matchStandard = url.match(regExpStandard);
  if (matchStandard && matchStandard[2].length === 11) { videoId = matchStandard[2]; } 
  else {
    const regExpShorts = /^.*(youtube.com\/shorts\/)([^#\&\?]*).*/;
    const matchShorts = url.match(regExpShorts);
    if (matchShorts && matchShorts[2]) { videoId = matchShorts[2]; }
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};


const SingleEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loadingContent, addCommentToItem, logContentActivity } = useContent();
  const { currentUser, isAuthenticated } = useAuth();

  const [event, setEvent] = React.useState<EventItem | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  React.useEffect(() => {
    if (eventId && !loadingContent) {
        const foundEvent = events.find(e => e.id === eventId);
        setEvent(foundEvent);
        if (foundEvent) { setLikeCount(foundEvent.likes || 0); }
    }
  }, [eventId, loadingContent, events]);


  const handleLike = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    if(event) { logContentActivity(`${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} event: "${event.title}"`, 'content_update', 'event', event.id); alert(`Like action simulated for "${event.title}"!`); }
  };

  const handleAddCommentClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!event || !currentUser) return;
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(event.id, 'event', commentText);
    setIsSubmittingComment(false);
    if (newComment) { setIsCommentModalOpen(false); } 
    else { alert("There was an issue submitting your comment. Please try again."); }
  };

  if (loadingContent && !event) { return <div className="container mx-auto px-4 py-12 text-center"><p className="text-xl text-slate-600 dark:text-slate-300">Loading event details...</p></div>; }
  if (!event) { return <div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-semibold text-gray-700 dark:text-slate-100">Event not found</h1><p className="text-gray-500 dark:text-slate-400 mt-2">The event you are looking for does not exist or has been moved.</p><Button asLink to="/events" variant="primary" className="mt-6">Back to Events</Button></div>; }
  
  const detailUrl = `/events/${event.id}`;
  const currentCommentCount = event.comments?.length || 0;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(event.videoUrl);
  const hasVideo = !!youtubeEmbedUrl || !!event.videoUrl;


  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto dark:bg-slate-800">
          {youtubeEmbedUrl && (<div className="aspect-w-16 aspect-h-9 bg-black rounded-t-xl overflow-hidden"><iframe src={youtubeEmbedUrl} title={event.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="w-full h-full"></iframe></div>)}
          {!youtubeEmbedUrl && event.videoUrl && (<div className="bg-black rounded-t-xl overflow-hidden"><video src={event.videoUrl} controls className="w-full max-h-[500px] object-contain" aria-label={`Video player for ${event.title}`}/></div>)}
          {event.imageUrl && (<div className={`${!hasVideo ? 'bg-black rounded-t-xl overflow-hidden' : 'mt-4'}`}><img src={event.imageUrl} alt={event.title} className={`w-full h-auto object-cover ${!hasVideo ? 'max-h-[500px]' : 'max-h-[400px] rounded-lg'}`}/></div>)}
          <CardHeader className={`dark:border-slate-700 ${!(hasVideo || event.imageUrl) ? 'rounded-t-xl' : ''}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">{event.title}</h1>
            <p className="text-md text-gray-500 dark:text-slate-400"><CalendarDaysIconSolid className="inline-block w-5 h-5 mr-2 align-text-bottom" />{formatDateADBS(event.date)} {event.time ? `at ${event.time}` : ''}</p>
            {event.location && (<p className="text-md text-gray-500 dark:text-slate-400 mt-1"><MapPinIconSolid className="inline-block w-5 h-5 mr-2 align-text-bottom" />{event.location}</p>)}
            {event.category && <p className="mt-2 text-sm font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400">{event.category}</p>}
            {event.postedByOwnerName && (<p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center"><UserCircleIcon className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />Posted by: {event.postedByOwnerName}</p>)}
          </CardHeader>
          <CardContent>
             {event.audioUrl && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">Listen to Audio:</h3><audio controls src={event.audioUrl} className="w-full">Your browser does not support the audio element.</audio></div>)}
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 leading-relaxed">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b dark:border-slate-700 pb-2">Event Details</h3>
              <div dangerouslySetInnerHTML={{ __html: event.description }} />
            </div>
            <div className="mt-6 space-y-3 text-sm">
                {event.expectations && (<div className="flex items-start"><LightBulbIcon className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5"/><strong className="text-gray-700 dark:text-slate-200">What to Expect:</strong><span className="ml-1.5 text-gray-600 dark:text-slate-300">{event.expectations}</span></div>)}
                {event.guests && (<div className="flex items-start"><UsersIconSolid className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5"/><strong className="text-gray-700 dark:text-slate-200">Special Guests:</strong><span className="ml-1.5 text-gray-600 dark:text-slate-300">{event.guests}</span></div>)}
                {event.isFeeRequired && event.feeAmount && (<div className="flex items-start"><TicketIcon className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5"/><strong className="text-gray-700 dark:text-slate-200">Fee:</strong><span className="ml-1.5 text-gray-600 dark:text-slate-300">{event.feeAmount}</span></div>)}
                {event.capacity && event.capacity > 0 && (<p className="text-gray-600 dark:text-slate-300">Capacity: {event.capacity} attendees</p>)}
                 {(event.contactPerson || event.contactEmail || event.contactPhone) && (<div className="pt-3 mt-3 border-t dark:border-slate-700"><h4 className="font-semibold text-gray-700 dark:text-slate-200 mb-1">Contact Information:</h4>{event.contactPerson && <p className="text-gray-600 dark:text-slate-300">Person: {event.contactPerson}</p>}{event.contactEmail && <p className="text-gray-600 dark:text-slate-300">Email: <a href={`mailto:${event.contactEmail}`} className="text-purple-600 dark:text-purple-400 hover:underline">{event.contactEmail}</a></p>}{event.contactPhone && <p className="text-gray-600 dark:text-slate-300">Phone: <a href={`tel:${event.contactPhone}`} className="text-purple-600 dark:text-purple-400 hover:underline">{event.contactPhone}</a></p>}</div>)}
                {event.registrationLink && event.registrationLink !== '#' && (<div className="mt-5"><Button asLink to={event.registrationLink} target="_blank" rel="noopener noreferrer" variant="primary" size="lg">Register for this Event</Button></div>)}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center">
                <Button variant="ghost" onClick={handleLike} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400" aria-pressed={isLiked}><HeartIcon className="w-5 h-5 mr-1.5" isFilled={isLiked} /> {likeCount} <span className="ml-1 hidden sm:inline">Like</span></Button>
                <Button variant="ghost" onClick={handleAddCommentClick} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400"><ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-1.5" /> {currentCommentCount} <span className="ml-1 hidden sm:inline">Comment</span></Button>
                <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400"><ShareIconUI className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span></Button>
            </div>
            <div className="mt-8 pt-6 border-t dark:border-slate-700"><h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Comments ({currentCommentCount})</h3>{event.comments && event.comments.length > 0 ? (<div className="space-y-4">{event.comments.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment: CommentType) => (<CommentItem key={comment.id} comment={comment} itemType="event" itemId={event.id} />))}</div>) : (<p className="text-slate-500 dark:text-slate-400 text-center py-4">No comments yet. Be the first to share your thoughts!</p>)}</div>
            <AdSlot placementKey="single_page_bottom" className="mt-8" />
          </CardContent>
        </Card>
        <div className="text-center mt-8"><Button asLink to="/events" variant="outline" className="dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-700 dark:hover:text-white">Back to All Events</Button></div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share "${event.title}"`} url={detailUrl} eventTitle={event.title}/>
      {isCommentModalOpen && event && (<CommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} eventTitle={event.title} onSubmitComment={handleSubmitComment} isSubmitting={isSubmittingComment}/>)}
    </div>
  );
};

export default SingleEventPage;
