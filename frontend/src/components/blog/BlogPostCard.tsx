 
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { BlogPost } from '../../types';
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

interface BlogPostCardProps {
  post: BlogPost;
  className?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, className = "" }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const { logContentActivity, addCommentToItem, toggleLikeOnItem } = useContent(); 

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(post.likedByMe ?? false); 
  const [showComments, setShowComments] = useState(false); 
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const { translatedText: title } = useAITranslate(post.title, 'en'); // Target language doesn't matter now
  const { translatedText: description } = useAITranslate(post.description, 'en');
  const { translatedText: category } = useAITranslate(post.category, 'en');
  
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;

  const commentCount = post.comments?.length || 0;
  const sortedComments = useMemo(
    () => (post.comments ?? []).slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [post.comments]
  );

  useEffect(() => {
    setLikeCount(post.likes ?? 0);
    setIsLiked(post.likedByMe ?? false);
  }, [post.likes, post.likedByMe]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const updated = await toggleLikeOnItem('blogPost', post.id, isLiked);
    if (updated?.likes !== undefined) {
      setLikeCount(updated.likes);
      setIsLiked(!isLiked);
      logContentActivity(
        `${currentUser?.fullName || 'User'} ${!isLiked ? 'liked' : 'unliked'} blog post: "${post.title}"`,
        'content_update', 
        'blogPost',
        post.id
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
    const newComment = await addCommentToItem(post.id, 'blogPost', trimmedComment);
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
    } else {
      setCommentError('Failed to submit comment. Please try again.');
    }
  };
  
  const detailUrl = `/blog/${post.id}`;
  
  return (
    <>
      <Card className={`flex flex-col ${className} h-full bg-white`}>
        {hasMedia ? (
             <Link to={detailUrl} aria-label={`Read more about ${title}`}>
                <img src={post.mediaUrls![0]} alt={title} className="w-full h-56 object-cover" />
            </Link>
        ) : post.imageUrl ? (
            <Link to={detailUrl} aria-label={`Read more about ${title}`}>
                <img src={post.imageUrl} alt={title} className="w-full h-56 object-cover" />
            </Link>
        ) : null}
        
        <CardHeader>
          <p className="text-xs text-slate-500 mb-1">
            Posted by: {post.postedByAdminName || 'Admin'}
          </p>
          <h2 className="font-semibold mb-1 text-xl text-slate-800">
            <Link to={detailUrl} className="hover:text-purple-600 transition-colors">{title}</Link>
          </h2>
          {post.category && <span className="text-xs font-medium uppercase tracking-wider text-purple-600">{category}</span>}
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{description}</p>
        </CardContent>
        
        
        <CardFooter className="bg-slate-50 mt-auto grid grid-cols-3 gap-px p-0 border-t border-slate-200">
            <Button variant="ghost" onClick={handleLike} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-blue-50" aria-pressed={isLiked} aria-label={isLiked ? `Unlike post, ${likeCount} likes` : `Like post, ${likeCount} likes`}>
                {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1.5" />}
                {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
            </Button>
            <Button variant="ghost" onClick={handleCommentClick} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-slate-200" aria-label="Comment on post">
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-1.5" />
                {commentCount} <span className="ml-1 hidden sm:inline">Comment</span>
            </Button>
            <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-slate-200" aria-label="Share post">
                <ShareIcon className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span>
            </Button>
         </CardFooter>
         {showComments && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
              {sortedComments.length > 0 ? (
                sortedComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} itemType="blogPost" itemId={post.id} />
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

export default BlogPostCard; 
