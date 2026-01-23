import React, { useEffect, useMemo, useState } from 'react'; 
import { Link } from "react-router-dom";
import { Sermon } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import ShareModal from '../ui/ShareModal';
import AuthModal from '../auth/AuthModal'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { useContent } from '../../contexts/ContentContext'; 
import { formatDateADBS } from '../../dateConverter'; 
import useAITranslate from '../../../src/hooks/useAITranslate';
import CommentItem from '../comments/CommentItem';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
} from '@heroicons/react/24/solid';
import {
  HandThumbUpIcon as HandThumbUpIconOutline,
  ChatBubbleLeftEllipsisIcon,
  ShareIcon as ShareIconOutline,
} from '@heroicons/react/24/outline';

// Icons
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 006 19.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" />
  </svg>
);
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" /></svg>
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

interface SermonCardProps {
  sermon: Sermon;
  className?: string;
}

const SermonCard: React.FC<SermonCardProps> = ({ sermon, className = "" }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem, toggleLikeOnItem } = useContent(); 

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [likeCount, setLikeCount] = useState(sermon.likes || 0);
  const [isLiked, setIsLiked] = useState(sermon.likedByMe ?? false); 
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const { translatedText: title } = useAITranslate(sermon.title, 'en');
  const { translatedText: description } = useAITranslate(sermon.description, 'en');
  const { translatedText: speaker } = useAITranslate(sermon.speaker, 'en');
  const { translatedText: category } = useAITranslate(sermon.category, 'en');
  const detailUrl = `/sermons/${sermon.id}`;
  const commentCount = sermon.comments?.length || 0;
  const sortedComments = useMemo(
    () => (sermon.comments ?? []).slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [sermon.comments]
  );

  useEffect(() => {
    setLikeCount(sermon.likes ?? 0);
    setIsLiked(sermon.likedByMe ?? false);
  }, [sermon.likes, sermon.likedByMe]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const updated = await toggleLikeOnItem('sermon', sermon.id, isLiked);
    if (updated?.likes !== undefined) {
      setLikeCount(updated.likes);
      setIsLiked(!isLiked);
      logContentActivity(
        `${currentUser?.fullName || 'User'} ${!isLiked ? 'liked' : 'unliked'} sermon: "${sermon.title}"`,
        'content_update',
        'sermon',
        sermon.id
      );
    }
  };

  const handleCommentClick = () => {
    setShowComments(prev => !prev);
  };

  const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const trimmedComment = commentText.trim();
    if (!trimmedComment) {
      setCommentError('Please enter a comment before submitting.');
      return;
    }
    setIsSubmittingComment(true);
    setCommentError(null);
    const newComment = await addCommentToItem(sermon.id, 'sermon', trimmedComment);
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
    } else {
      setCommentError('Failed to submit comment. Please try again.');
    }
  };
  
  const youtubeEmbedUrl = getYouTubeEmbedUrl(sermon.videoUrl);

  return (
    <>
      <Card className={`flex flex-col ${className} h-full bg-white`}>
        <div className="w-full h-48 bg-slate-200 flex items-center justify-center overflow-hidden">
          <Link to={detailUrl} aria-label={`View details for ${title}`} className="w-full h-full">
            {youtubeEmbedUrl ? (
              <div className="aspect-w-16 aspect-h-9 w-full h-full">
                <iframe
                  src={youtubeEmbedUrl}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            ) : sermon.videoUrl ? (
                <video
                    src={sermon.videoUrl}
                    controls={false} 
                    className="w-full h-full object-cover"
                    aria-label={`Video player for ${title}`}
                >
                    Your browser does not support the video tag.
                </video>
            ) : sermon.imageUrl ? (
              <img src={sermon.imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-300">
                <UserIcon className="w-16 h-16 text-slate-500" /> {/* Default placeholder */}
              </div>
            )}
          </Link>
        </div>
        
        <CardHeader>
          <div className="flex items-center text-xs text-slate-500 mb-1">
            <UserIcon className="mr-2 text-slate-300 flex-shrink-0" />
            <span>Posted by: {sermon.postedByAdminName || 'Admin'}</span>
          </div>
          <h2 className="font-semibold text-slate-800 mb-1 text-xl">
            <Link to={detailUrl} className="hover:text-purple-600 transition-colors">
              {title}
            </Link>
          </h2>
          {sermon.category && <span className="text-xs font-medium uppercase tracking-wider text-purple-600">{category}</span>}
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="text-sm text-slate-500 mb-1 flex items-center">
            <CalendarDaysIcon className="mr-2 text-slate-400 flex-shrink-0" />
            <span>{formatDateADBS(sermon.date)}</span>
          </div>
          {sermon.speaker && (
            <div className="flex items-center text-sm text-slate-500 mb-2">
              <UserIcon className="mr-2 text-slate-400 flex-shrink-0" />
              <span>By: {speaker}</span>
            </div>
          )}
          {sermon.audioUrl && (
            <div className="my-2">
                <audio controls src={sermon.audioUrl} className="w-full h-10 text-sm">
                    Your browser does not support the audio element.
                </audio>
            </div>
          )}
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {description}
          </p>
        </CardContent>
        <CardFooter className="bg-slate-50 mt-auto grid grid-cols-3 gap-px p-0 border-t border-slate-200">
          <Button variant="ghost" onClick={handleLike} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-blue-50" aria-pressed={isLiked} aria-label={isLiked ? `Unlike sermon, ${likeCount} likes` : `Like sermon, ${likeCount} likes`}>
            {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1.5" />}
            {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
          </Button>
          <Button variant="ghost" onClick={handleCommentClick} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-slate-200" aria-label="Comment on sermon">
            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-1.5" />
            {commentCount} <span className="ml-1 hidden sm:inline">Comment</span>
          </Button>
          <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-slate-200" aria-label="Share sermon">
            <ShareIconOutline className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span>
          </Button>
        </CardFooter>
        {showComments && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
              {sortedComments.length > 0 ? (
                sortedComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} itemType="sermon" itemId={sermon.id} />
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-3">No comments yet.</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <form onSubmit={handleSubmitComment} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">Add a comment</label>
                <textarea
                  value={commentText}
                  onChange={(event) => {
                    setCommentText(event.target.value);
                    if (commentError) {
                      setCommentError(null);
                    }
                  }}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Write your comment here..."
                />
                {commentError && <p className="text-xs text-red-500">{commentError}</p>}
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmittingComment}
                >
                  {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </Card>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={`Share "${title}"`}
        url={detailUrl} 
        eventTitle={title} 
      />
    </>
  );
};

export default SermonCard;  
