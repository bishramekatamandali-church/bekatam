
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { NewsItem } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import ShareModal from '../ui/ShareModal';
import AuthModal from '../auth/AuthModal'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { useContent } from '../../contexts/ContentContext'; 
import useAITranslate from '../../../src/hooks/useAITranslate';
import CommentItem from '../comments/CommentItem';
import { ChatBubbleLeftEllipsisIcon, HandThumbUpIcon as HandThumbUpIconOutline, ShareIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';

interface NewsItemCardProps {
  item: NewsItem;
  className?: string;
}

const NewsItemCard: React.FC<NewsItemCardProps> = ({ item, className = "" }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem, toggleLikeOnItem } = useContent(); 

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(item.likedByMe ?? false); 
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError('');
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const trimmedComment = commentText.trim();
    if (!trimmedComment) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(item.id, 'news', trimmedComment);
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
    } else {
      setCommentError(`Failed to submit comment for "${item.title}".`);
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
          <div
            className="prose prose-sm max-w-none text-slate-600 leading-relaxed line-clamp-3 prose-img:rounded-lg prose-img:my-2"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </CardContent>
        <CardFooter className="bg-purple-100 mt-auto grid grid-cols-3 gap-px p-0 border-t border-purple-200">
            <Button variant="ghost" onClick={handleLike} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-purple-200" aria-pressed={isLiked} aria-label={isLiked ? `Unlike news, ${likeCount} likes` : `Like news, ${likeCount} likes`}>
                {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1.5" />}
                {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
            </Button>
            <Button variant="ghost" onClick={handleCommentClick} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-purple-200" aria-label="Comment on news">
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-1.5" />
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
            <form onSubmit={handleSubmitComment} className="mt-3 pt-3 border-t border-purple-200 space-y-2">
              <label htmlFor={`news-comment-${item.id}`} className="sr-only">
                Add a comment
              </label>
              <textarea
                id={`news-comment-${item.id}`}
                rows={3}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write your comment..."
                className="w-full rounded-md border border-purple-200 p-2 text-sm text-slate-700 focus:border-purple-500 focus:ring-purple-500"
                disabled={isSubmittingComment}
              />
              {commentError && <p className="text-xs text-red-500">{commentError}</p>}
              <Button type="submit" size="sm" variant="primary" className="w-full" disabled={isSubmittingComment || !commentText.trim()}>
                {isSubmittingComment ? 'Submitting...' : 'Post Comment'}
              </Button>
            </form>
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

export default NewsItemCard; 
