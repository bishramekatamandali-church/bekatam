
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { NewsItem } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import ShareModal from '../ui/ShareModal';
import CommentModal from '../ui/CommentModal'; 
import AuthModal from '../auth/AuthModal'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { useContent } from '../../contexts/ContentContext'; 
import { formatDateADBS } from '../../dateConverter'; 
import useAITranslate from '../../../src/hooks/useAITranslate';
import CommentItem from '../comments/CommentItem';
import { ChatBubbleLeftRightIcon, HandThumbUpIcon as HandThumbUpIconOutline, ShareIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

// Icons (can be centralized)
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 006 19.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" />
  </svg>
);

interface NewsItemCardProps {
  item: NewsItem;
  className?: string;
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, className = "" }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem, toggleLikeOnItem } = useContent(); 

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(item.likedByMe ?? false); 
  const [showComments, setShowComments] = useState(false);

  const { translatedText: title } = useAITranslate(item.title, 'en');
  const { translatedText: description } = useAITranslate(item.description, 'en');
  const { translatedText: category } = useAITranslate(item.category, 'en');

  const commentCount = item.comments?.length || 0;
  const sortedComments = useMemo(
    () => (item.comments ?? []).slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [item.comments]
  );

  useEffect(() => {
    setLikeCount(item.likes ?? 0);
    setIsLiked(item.likedByMe ?? false);
  }, [item.likes, item.likedByMe]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const updated = await toggleLikeOnItem('news', item.id, isLiked);
    if (updated?.likes !== undefined) {
      setLikeCount(updated.likes);
      setIsLiked(!isLiked);
      logContentActivity(
        `${currentUser?.fullName || 'User'} ${!isLiked ? 'liked' : 'unliked'} news item: "${item.title}"`,
        'content_update', 
        'news',
        item.id
     );
    }
  };

  const handleCommentClick = () => {
    setShowComments(prev => !prev);
  };

  const handleAddCommentClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!currentUser) return;
    const newComment = await addCommentToItem(item.id, 'news', commentText);
    if (newComment) {
      alert(`Comment submitted for "${item.title}"`);
      setIsCommentModalOpen(false);
    } else {
      alert(`Failed to submit comment for "${item.title}"`);
    }
  };
  
  const detailUrl = `/news/${item.id}`;

  return (
    <>
      <Card className={`flex flex-col ${className} h-full bg-purple-50 border border-purple-200`}>
        {item.imageUrl && (
          <Link to={detailUrl} aria-label={`Read more about ${title}`}>
            <img src={item.imageUrl} alt={title} className="w-full h-56 object-cover" />
          </Link>
        )}
        <CardHeader className="border-b border-purple-200">
          <p className="text-xs text-slate-500 mb-1">
            Posted by: {item.postedByAdminName || 'Admin'}
          </p>
          <h2 className="font-semibold text-slate-800 mb-1 text-xl">
            <Link to={detailUrl} className="hover:text-purple-700 transition-colors">
              {title}
            </Link>
          </h2>
          {item.category && <span className="text-xs font-medium uppercase tracking-wider text-purple-600">{category}</span>}
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="text-sm text-slate-500 mb-2 flex items-center">
            <CalendarDaysIcon className="mr-2 text-slate-400 flex-shrink-0" />
            <span>{formatDateADBS(item.date)}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{description}</p>
        </CardContent>
        <CardFooter className="bg-purple-100 mt-auto grid grid-cols-3 gap-px p-0 border-t border-purple-200">
            <Button variant="ghost" onClick={handleLike} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-purple-200" aria-pressed={isLiked} aria-label={isLiked ? `Unlike news, ${likeCount} likes` : `Like news, ${likeCount} likes`}>
                {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1.5" />}
                {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
            </Button>
            <Button variant="ghost" onClick={handleCommentClick} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-purple-200" aria-label="Comment on news">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-1.5" />
                {commentCount} <span className="ml-1 hidden sm:inline">Comment</span>
            </Button>
            <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-purple-200" aria-label="Share news">
                <ShareIcon className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span>
            </Button>
        </CardFooter>
        {showComments && (
          <div className="p-4 border-t border-purple-200 bg-purple-50">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300">
              {sortedComments.length > 0 ? (
                sortedComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} itemType="news" itemId={item.id} />
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-3">No comments yet.</p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <Button onClick={handleAddCommentClick} size="sm" variant="primary" className="w-full">
                Add a Comment
              </Button>
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
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        eventTitle={title} 
        onSubmitComment={handleSubmitComment}
      />
    </>
  );
};

export default NewsItemCard; 
