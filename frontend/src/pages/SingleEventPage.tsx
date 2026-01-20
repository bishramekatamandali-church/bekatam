 
import React, { useState } from 'react';
import { useParams, Link } from "react-router-dom"; 
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AuthModal from '../components/auth/AuthModal';
import ShareModal from '../components/ui/ShareModal';
import { EventItem, Comment as CommentType } from '../types'; 
import { formatDateADBS } from '../dateConverter';
import AdSlot from '../components/ads/AdSlot';
import CommentItem from '../components/comments/CommentItem';
import { ChatBubbleLeftRightIcon, ShareIcon } from '@heroicons/react/24/outline';

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

const stripHtml = (value?: string): string =>
  value ? value.replace(/<[^>]*>/g, '').trim() : '';

const SingleEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { events, loadingContent, addCommentToItem } = useContent();
  const { currentUser, isAuthenticated } = useAuth();

  const [event, setEvent] = React.useState<EventItem | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentFormOpen, setIsCommentFormOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  React.useEffect(() => {
    if (eventId && !loadingContent) {
        const foundEvent = events.find(e => e.id === eventId);
        setEvent(foundEvent);
    }
  }, [eventId, loadingContent, events]);

  const handleAddCommentClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setIsCommentFormOpen((prev) => !prev);
  };

  const handleSubmitComment = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;
    if (!event || !currentUser) return;
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(event.id, 'event', trimmedComment);
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
      setIsCommentFormOpen(false);
    } 
    else { alert("There was an issue submitting your comment. Please try again."); }
  };

  if (loadingContent && !event) { return <div className="container mx-auto px-4 py-12 text-center"><p className="text-xl text-slate-600 dark:text-slate-300">Loading event details...</p></div>; }
  if (!event) { return <div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-semibold text-gray-700 dark:text-slate-100">Event not found</h1><p className="text-gray-500 dark:text-slate-400 mt-2">The event you are looking for does not exist or has been moved.</p><Button asLink to="/events" variant="primary" className="mt-6">Back to Events</Button></div>; }
  
  const detailUrl = `/events/${event.id}`;
  const currentCommentCount = event.comments?.length || 0;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(event.videoUrl);
  const hasVideo = !!youtubeEmbedUrl || !!event.videoUrl;
  const resolvedEventType = event.eventType || 'REGULAR';
  const locationDisplay =
    event.location || (event.locations && event.locations.length > 0 ? event.locations.join(', ') : '');
  const conductedByDisplay =
    event.conductedBy && event.conductedBy.length > 0 ? event.conductedBy.join(', ') : '';
  const speakersDisplay =
    event.speakers && event.speakers.length > 0 ? event.speakers.join(', ') : '';
  const scheduleTypeLabels: Record<string, string> = {
    ONE_TIME: 'One-time (single date)',
    SATURDAY_SERVICE: 'Saturday Service',
    WEDNESDAY_SERVICE: 'Wednesday Service',
    MONTHLY_15TH: '15th Day of Each Month',
    FIRST_WEEKEND_LORDS_SUPPER: "First Weekend: Lord's Supper",
    SECOND_WEEKEND_BIBLE_STUDY: 'Second Weekend: Bible Study',
    FOURTH_WEEKEND_LEADERS_MEETING: 'Fourth Weekend: Leaders Meeting',
    LAST_SUNDAY_PRAYER_TEAM_VISIT: 'Last Sunday: Prayer Team Visit',
    OTHER: 'Other / Custom',
  };
  const scheduleTypeLabel = event.scheduleType
    ? scheduleTypeLabels[event.scheduleType] || event.scheduleType
    : '';
  const descriptionText = stripHtml(event.description);

  const renderDetailRow = (
    label: string,
    value?: React.ReactNode,
    iconElement?: React.ReactElement<{ className?: string }>
  ) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const iconWithClass = iconElement
      ? React.cloneElement(iconElement, {
          className: 'w-5 h-5 mr-2 text-slate-400 dark:text-slate-500 flex-shrink-0',
        })
      : null;
    return (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 items-start">
        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center">
          {iconWithClass}
          <span>{label}</span>
        </dt>
        <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 sm:mt-0 sm:col-span-2 whitespace-pre-line break-words">
          {value}
        </dd>
      </div>
    );
  };


  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto dark:bg-slate-800">
          {youtubeEmbedUrl && (<div className="aspect-w-16 aspect-h-9 bg-black rounded-t-xl overflow-hidden"><iframe src={youtubeEmbedUrl} title={event.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="w-full h-full"></iframe></div>)}
          {!youtubeEmbedUrl && event.videoUrl && (<div className="bg-black rounded-t-xl overflow-hidden"><video src={event.videoUrl} controls className="w-full max-h-[500px] object-contain" aria-label={`Video player for ${event.title}`}/></div>)}
          {event.imageUrl && (<div className={`${!hasVideo ? 'bg-black rounded-t-xl overflow-hidden' : 'mt-4'}`}><img src={event.imageUrl} alt={event.title} className={`w-full h-auto object-contain ${!hasVideo ? 'max-h-[600px]' : 'max-h-[450px] rounded-lg'}`}/></div>)}
          <CardHeader className={`dark:border-slate-700 ${!(hasVideo || event.imageUrl) ? 'rounded-t-xl' : ''}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">{event.title}</h1>
            <p className="text-md text-gray-500 dark:text-slate-400"><CalendarDaysIconSolid className="inline-block w-5 h-5 mr-2 align-text-bottom" />{formatDateADBS(event.date)} {event.time ? `at ${event.time}` : ''}</p>
            {locationDisplay && (<p className="text-md text-gray-500 dark:text-slate-400 mt-1"><MapPinIconSolid className="inline-block w-5 h-5 mr-2 align-text-bottom" />{locationDisplay}</p>)}
            {event.category && <p className="mt-2 text-sm font-medium uppercase tracking-wider text-purple-600 dark:text-purple-400">{event.category}</p>}
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {resolvedEventType === 'REGULAR' ? 'Regular Event' : 'Special Event'}
            </p>
            {event.postedByAdminName && (<p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center"><UserCircleIcon className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />Posted by: {event.postedByAdminName}</p>)}
          </CardHeader>
          <CardContent>
             {event.audioUrl && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2">Listen to Audio:</h3><audio controls src={event.audioUrl} className="w-full">Your browser does not support the audio element.</audio></div>)}
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-slate-300 leading-relaxed">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b dark:border-slate-700 pb-2">
                {resolvedEventType === 'REGULAR' ? 'Event Overview' : 'Event Summary'}
              </h3>
              <p className="whitespace-pre-line">{descriptionText}</p>
            </div>
            {resolvedEventType === 'REGULAR' ? (
              <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {renderDetailRow('Schedule Type', scheduleTypeLabel, <CalendarDaysIconSolid />)}
                {renderDetailRow('Schedule Notes', event.scheduleNotes, <LightBulbIcon />)}
                {renderDetailRow('Locations', locationDisplay, <MapPinIconSolid />)}
                {renderDetailRow('Conducted By', conductedByDisplay, <UsersIconSolid />)}
                {renderDetailRow('Speakers', speakersDisplay, <UsersIconSolid />)}
                {renderDetailRow('What to Expect', event.expectations, <LightBulbIcon />)}
                {renderDetailRow('Special Guests', event.guests, <UsersIconSolid />)}
                {event.isFeeRequired && renderDetailRow('Fee', event.feeAmount || 'Details in link', <TicketIcon />)}
                {event.capacity && event.capacity > 0 && renderDetailRow('Capacity', `${event.capacity} attendees`, <UsersIconSolid />)}
                {renderDetailRow(
                  'Contact',
                  event.contactPerson || event.contactEmail || event.contactPhone ? (
                    <div className="space-y-1">
                      {event.contactPerson && <p>Person: {event.contactPerson}</p>}
                      {event.contactEmail && (
                        <p>
                          Email:{' '}
                          <a href={`mailto:${event.contactEmail}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                            {event.contactEmail}
                          </a>
                        </p>
                      )}
                      {event.contactPhone && (
                        <p>
                          Phone:{' '}
                          <a href={`tel:${event.contactPhone}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                            {event.contactPhone}
                          </a>
                        </p>
                      )}
                    </div>
                  ) : null,
                  <UserCircleIcon />
                )}
              </div>
            ) : (
              <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {renderDetailRow('Date & Time', `${formatDateADBS(event.date)}${event.time ? ` at ${event.time}` : ''}`, <CalendarDaysIconSolid />)}
                {renderDetailRow('Location', locationDisplay, <MapPinIconSolid />)}
                {event.isFeeRequired && renderDetailRow('Fee', event.feeAmount || 'Details in link', <TicketIcon />)}
                {renderDetailRow(
                  'Contact',
                  event.contactPerson || event.contactEmail || event.contactPhone ? (
                    <div className="space-y-1">
                      {event.contactPerson && <p>Person: {event.contactPerson}</p>}
                      {event.contactEmail && (
                        <p>
                          Email:{' '}
                          <a href={`mailto:${event.contactEmail}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                            {event.contactEmail}
                          </a>
                        </p>
                      )}
                      {event.contactPhone && (
                        <p>
                          Phone:{' '}
                          <a href={`tel:${event.contactPhone}`} className="text-purple-600 dark:text-purple-400 hover:underline">
                            {event.contactPhone}
                          </a>
                        </p>
                      )}
                    </div>
                  ) : null,
                  <UserCircleIcon />
                )}
              </div>
            )}

            {event.registrationLink && event.registrationLink !== '#' && (
              <div className="mt-5">
                <Button asLink to={event.registrationLink} target="_blank" rel="noopener noreferrer" variant="primary" size="lg">
                  Register for this Event
                </Button>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center">
                <Button variant="ghost" onClick={handleAddCommentClick} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400" aria-expanded={isCommentFormOpen}><ChatBubbleLeftRightIcon className="w-5 h-5 mr-1.5" /> {currentCommentCount} <span className="ml-1 hidden sm:inline">Comment</span></Button>
                <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-purple-500 dark:hover:text-purple-400"><ShareIcon className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span></Button>
            </div>
            {isCommentFormOpen && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="event-comment-input">
                    Add a comment
                  </label>
                  <textarea
                    id="event-comment-input"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    placeholder="Share your thoughts about this event."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setIsCommentFormOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isSubmittingComment}>
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
            <div className="mt-8 pt-6 border-t dark:border-slate-700"><h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Comments ({currentCommentCount})</h3>{event.comments && event.comments.length > 0 ? (<div className="space-y-4">{event.comments.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment: CommentType) => (<CommentItem key={comment.id} comment={comment} itemType="event" itemId={event.id} />))}</div>) : (<p className="text-slate-500 dark:text-slate-400 text-center py-4">No comments yet. Be the first to share your thoughts!</p>)}</div>
            <AdSlot placementKey="single_page_bottom" className="mt-8" />
          </CardContent>
        </Card>
        <div className="text-center mt-8"><Button asLink to="/events" variant="outline" className="dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-700 dark:hover:text-white">Back to All Events</Button></div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share "${event.title}"`} url={detailUrl} eventTitle={event.title}/>
    </div>
  );
};

export default SingleEventPage; 
