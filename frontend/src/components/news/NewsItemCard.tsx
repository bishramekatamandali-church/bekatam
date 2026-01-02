
import React, { useState } from 'react';
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
import { ChatBubbleOvalLeftEllipsisIcon } from '../icons/GenericIcons';

// Icons (can be centralized)
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className || ''}`}>
    <path fillRule="evenodd" d="M5.75 2.25A.75.75 0 016.5 3v.75h11V3A.75.75 0 0118.25 3v.75h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5a3 3 0 01-3-3V7.5a3 3 0 013-3H5.75V3A.75.75 0 015.75 2.25ZM4.5 10.5V18A1.5 1.5 0 006 19.5h12A1.5 1.5 0 0019.5 18v-7.5H4.5Z" clipRule="evenodd" />
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
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.383.05.571.078m-1.571 2.032c.195.025.383.05.571.078m13.48 0a2.25 2.25 0 01-.621 1.628l-3.029 3.028a2.25 2.25 0 01-3.182 0l-3.029-3.028a2.25 2.25 0 01-.621-1.628m13.48 0L19.25 12l-1.521-.078m13.48 0c0 2.042-.832 3.901-2.186 5.256L16.5 21.75m1.217-9.843c-.195-.025-.383-.05-.571-.078m-1.571-2.032c-.195-.025-.383-.05-.571-.078m-1.412 5.690c.195.025.383.05.571.078" /></svg>
);

interface NewsItemCardProps {
  item: NewsItem;
  className?: string;
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, className = "" }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem } = useContent(); 

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(false); 

  const { translatedText: title } = useAITranslate(item.title, 'en');
  const { translatedText: description } = useAITranslate(item.description, 'en');
  const { translatedText: category } = useAITranslate(item.category, 'en');

  const handleLike = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    logContentActivity(
        `${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} news item: "${item.title}"`,
        'content_update', 
        'news',
        item.id
    );
    alert(`Like action simulated for "${item.title}"!`);
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
    const newComment = await addCommentToItem(item.id, 'news', commentText);
    if (newComment) {
      alert(`Comment submitted for "${item.title}"`);
      setIsCommentModalOpen(false);
    } else {
      alert(`Failed to submit comment for "${item.title}"`);
    }
  };
  
  const detailUrl = `/news/${item.id}`;
  const commentCount = item.comments?.length || 0;

  return (
    <>
      <Card className={`flex flex-col ${className} h-full bg-purple-50 border border-purple-200`}>
        {item.imageUrl && (
          <Link to={detailUrl} aria-label={`Read more about ${title}`}>
            <img src={item.imageUrl} alt={title} className="w-full h-56 object-cover" />
          </Link>
        )}
        <CardHeader className="border-b border-purple-200">
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
        <CardFooter className="flex justify-around items-center flex-wrap gap-1 sm:gap-2 bg-purple-100 border-t border-purple-200">
            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center text-slate-600 hover:text-red-500 px-1.5 sm:px-2 py-1" aria-pressed={isLiked} aria-label={isLiked ? `Unlike news, ${likeCount} likes` : `Like news, ${likeCount} likes`}>
                <HeartIcon className="w-5 h-5 mr-1" isFilled={isLiked} /> {likeCount > 0 ? likeCount : ''} <span className="sr-only sm:not-sr-only ml-1">Like</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCommentClick} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5 sm:px-2 py-1" aria-label="Comment on news">
                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-1" /> 
                {commentCount > 0 ? commentCount : ''} <span className="sr-only sm:not-sr-only ml-1">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5 sm:px-2 py-1" aria-label="Share news">
                <ShareIcon className="w-5 h-5 mr-1" /> <span className="sr-only sm:not-sr-only">Share</span>
            </Button>
            <Button asLink to={detailUrl} variant="outline" size="sm" className="px-1.5 sm:px-2 py-1 text-purple-600 border-purple-600 hover:bg-purple-200">Read More</Button>
        </CardFooter>
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