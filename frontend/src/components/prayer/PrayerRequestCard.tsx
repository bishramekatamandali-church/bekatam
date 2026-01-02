
import React, { useState } from 'react';
import { PrayerRequest, PrayerRequestStatus, prayerRequestStatusList } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { formatDateADBS } from '../../dateConverter';
import { UserCircleIcon as HeroUserCircleIcon, HandRaisedIcon, ChatBubbleBottomCenterTextIcon, ShareIcon, TrashIcon, MapPinIcon, FaceSmileIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import ShareModal from '../ui/ShareModal';
import { Link } from "react-router-dom";
import CommentItem from '../comments/CommentItem';
import PostMediaDisplay from '../post/PostMediaDisplay';
import { PrayerHandsIcon } from '../icons/GenericIcons';
import AdminDeleteModal from '../admin/AdminDeleteModal';

interface PrayerRequestCardProps {
  request: PrayerRequest;
  onPrayedFor: (id: string) => void;
  onStatusUpdate: (id: string, newStatus: PrayerRequestStatus) => void;
  onComment: (request: PrayerRequest) => void; 
}

const PrayerStatusText: React.FC<{ prayers: Array<{ userId: string; userName: string; }>, currentUserId?: string }> = ({ prayers, currentUserId }) => {
    const prayerCount = prayers.length;
    if (prayerCount === 0) {
        return <span className="text-slate-500 dark:text-slate-400">Be the first to pray.</span>;
    }

    const isPrayedByUser = currentUserId ? prayers.some(p => p.userId === currentUserId) : false;
    const otherPrayers = prayers.filter(p => p.userId !== currentUserId);

    if (isPrayedByUser) {
        if (otherPrayers.length === 0) {
            return <span className="text-blue-600 dark:text-blue-400 font-medium">You prayed for this.</span>;
        }
        if (otherPrayers.length === 1) {
            return <span className="text-blue-600 dark:text-blue-400 font-medium">You and {otherPrayers[0].userName.split(' ')[0]} prayed.</span>;
        }
        return <span className="text-blue-600 dark:text-blue-400 font-medium">You and {otherPrayers.length} others prayed.</span>;
    } else {
        if (prayerCount === 1) {
             return <span>{prayers[0].userName.split(' ')[0]} prayed for this.</span>;
        }
        return <span>{prayers[0].userName.split(' ')[0]} and {prayerCount - 1} others prayed.</span>;
    }
};

const PrayerRequestCard: React.FC<PrayerRequestCardProps> = ({ request, onPrayedFor, onStatusUpdate, onComment }) => {
  const { currentUser, isAuthenticated, isAdmin, logAdminAction } = useAuth();
  const { deleteContent } = useContent();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  
  const isOwnRequest = currentUser?.id === request.postedByOwnerId;
  const canPray = isAuthenticated && request.status !== 'answered' && request.status !== 'archived';
  const isPrayedByUser = isAuthenticated && request.prayers.some(p => p.userId === currentUser?.id);
  const isAnswered = request.status === 'answered';
  const hasBackground = request.backgroundTheme && request.backgroundTheme !== 'post-theme-default';

  const TEXT_TRUNCATE_LENGTH = 120;
  const isTruncated = request.requestText.length > TEXT_TRUNCATE_LENGTH;
  
  const handleDelete = (reason: string) => {
    if (!isAdmin) return;
    setIsSubmittingDelete(true);
    deleteContent('prayerRequest', request.id).then(() => {
        logAdminAction("Deleted Prayer Request", request.id, `Title: "${request.title}", Reason: ${reason}`);
        setIsSubmittingDelete(false);
        setIsDeleteModalOpen(false);
    });
  };

  const getCardClasses = () => {
    let classes = `flex flex-col h-full shadow-lg transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600`;
    if (isAnswered) {
      classes += ' border-2 border-amber-400 dark:border-amber-500 animate-radiant-glow';
    } else if (request.status === 'active' && !hasBackground) {
       classes += ' border-2 border-transparent hover:border-teal-400/50 animate-pulse-light';
    }
    return classes;
  }

  const PostMeta: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-3 ${className}`}>
        {request.feelingActivity && <span className="flex items-center"><FaceSmileIcon className="w-3.5 h-3.5 mr-1"/> feeling {request.feelingActivity}</span>}
        {request.taggedFriends && <span className="flex items-center"><UserGroupIcon className="w-3.5 h-3.5 mr-1"/> with {request.taggedFriends}</span>}
        {request.location && <span className="flex items-center"><MapPinIcon className="w-3.5 h-3.5 mr-1"/> at {request.location}</span>}
    </div>
  );

  return (
    <>
      <Card id={`prayer-${request.id}`} className={getCardClasses()}>
        {isAnswered && (
          <div className="absolute top-2 -right-11 transform rotate-45 bg-amber-400 text-amber-800 font-bold text-xs px-10 py-1 shadow-md z-10">
            Answered!
          </div>
        )}
        <CardHeader className="dark:border-slate-700 pb-2 relative overflow-hidden">
           <div className="flex justify-between items-start">
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                {request.visibility === 'anonymous' || !request.userName ? (
                  <>
                    <HeroUserCircleIcon className="w-10 h-10 mr-2 text-slate-400 dark:text-slate-500" />
                    <div>
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Anonymous</span>
                      <p>{formatDateADBS(request.submittedAt)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to={`/profile/${request.postedByOwnerId}`}>
                      {request.userProfileImageUrl ? (
                        <img src={request.userProfileImageUrl} alt={request.userName} className="w-10 h-10 rounded-full mr-2 object-cover"/>
                      ) : (
                        <HeroUserCircleIcon className="w-10 h-10 mr-2 text-slate-400 dark:text-slate-500" />
                      )}
                    </Link>
                    <div>
                      <Link to={`/profile/${request.postedByOwnerId}`} className="font-semibold text-sm hover:underline text-slate-800 dark:text-slate-200">{request.userName}</Link>
                      <p>{formatDateADBS(request.submittedAt)}</p>
                    </div>
                  </>
                )}
              </div>
              {isOwnRequest && (
                   <select
                      value={request.status}
                      onChange={(e) => onStatusUpdate(request.id, e.target.value as PrayerRequestStatus)}
                      className="text-xs p-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500"
                      aria-label="Update prayer request status"
                      >
                      {prayerRequestStatusList.filter(s => s !== 'archived' && s !== 'prayed_for').map(s => (
                          <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                      ))}
                   </select>
              )}
           </div>
        </CardHeader>
        <CardContent className="flex-grow py-3 space-y-3">
          <div className={`p-4 rounded-lg ${request.backgroundTheme || 'post-theme-default'}`}>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${hasBackground ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'}`}>
                <PrayerHandsIcon className="w-4 h-4 mr-1.5 text-teal-600 dark:text-teal-400"/>
                PRAYER REQUEST
              </div>
              <h3 className={`font-semibold mt-2 ${hasBackground ? 'text-2xl text-white' : 'text-lg text-slate-800 dark:text-slate-200'}`} title={request.title}>
                {request.title}
              </h3>
              <p className={`text-sm leading-relaxed whitespace-pre-line mt-2 ${hasBackground ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
                {isExpanded ? request.requestText : `${request.requestText.substring(0, TEXT_TRUNCATE_LENGTH)}${isTruncated ? '...' : ''}`}
                {isTruncated && (
                  <button onClick={() => setIsExpanded(!isExpanded)} className={`ml-1 font-semibold text-sm ${hasBackground ? 'text-white/70 hover:text-white underline' : 'text-purple-600 dark:text-purple-400 hover:underline'}`}>
                    {isExpanded ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </p>
          </div>
          <PostMediaDisplay mediaUrls={request.mediaUrls || []} title={request.title} />
          <PostMeta className={'text-slate-500 dark:text-slate-400'} />
        </CardContent>
        
        <div className="px-4 py-2 border-y dark:border-slate-700 bg-white dark:bg-slate-800">
            <PrayerStatusText prayers={request.prayers} currentUserId={currentUser?.id} />
        </div>

        <CardFooter className="bg-slate-50 dark:bg-slate-700/50 mt-auto grid grid-cols-3 gap-px p-0">
            <Button 
                onClick={() => onPrayedFor(request.id)} 
                variant="ghost" 
                disabled={!canPray}
                className={`flex items-center justify-center w-full !rounded-none py-2 ${isPrayedByUser ? '!text-blue-600 dark:!text-blue-400 font-semibold' : 'text-slate-600 dark:text-slate-300'} hover:!bg-blue-100 dark:hover:!bg-slate-600 transition-colors`}
                title={!isAuthenticated ? "Login to pray" : (canPray ? (isPrayedByUser ? "Undo Prayer" : "I Prayed") : "Prayer answered/archived")}
            >
                <HandRaisedIcon className="w-5 h-5 mr-1.5" />
                {isPrayedByUser ? "Prayed" : "Pray"}
            </Button>
            <Button 
                variant="ghost" 
                className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 dark:text-slate-300 hover:!bg-slate-200 dark:hover:!bg-slate-600 transition-colors"
                onClick={() => setShowComments(p => !p)} 
            >
                <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-1.5"/>
                Comments ({request.comments.length})
            </Button>
            <Button 
                variant="ghost" 
                className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 dark:text-slate-300 hover:!bg-slate-200 dark:hover:!bg-slate-600 transition-colors"
                onClick={() => setIsShareModalOpen(true)}
            >
                <ShareIcon className="w-5 h-5 mr-1.5"/>
                Share
            </Button>
        </CardFooter>
        {showComments && (
            <div className="p-4 border-t dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50">
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600">
                    {request.comments && request.comments.length > 0 ? (
                        request.comments.slice().sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(c => (
                            <CommentItem key={c.id} comment={c} itemId={request.id} itemType="prayerRequest" />
                        ))
                    ) : (
                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-3">No comments yet.</p>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t dark:border-slate-700">
                    <Button onClick={() => onComment(request)} size="sm" variant="primary" className="w-full">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1.5" />
                        Add a Comment
                    </Button>
                </div>
            </div>
        )}
        {isAdmin && (
          <div className="p-1 bg-red-100 dark:bg-red-900/50 border-t border-red-200 dark:border-red-800">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="w-full text-xs !text-red-600 dark:!text-red-300 hover:!bg-red-200 dark:hover:!bg-red-900">
                <TrashIcon className="w-4 h-4 mr-1.5" /> Admin: Delete Request
            </Button>
          </div>
        )}
      </Card>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Share Prayer: "${request.title}"`}
        url={`/prayer-requests#prayer-${request.id}`}
        eventTitle={request.title}
      />
      {isDeleteModalOpen && (
        <AdminDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemName={request.title}
          isSubmitting={isSubmittingDelete}
        />
      )}
    </>
  );
};

export default PrayerRequestCard;
