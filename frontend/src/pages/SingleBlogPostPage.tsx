import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { useContent } from '../contexts/ContentContext'; 
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ShareModal from '../components/ui/ShareModal';
import AuthModal from '../components/auth/AuthModal';
import { BlogPost, Comment as CommentType } from '../types';
import { formatDateADBS } from '../dateConverter'; 
import AdSlot from '../components/ads/AdSlot';
import CommentItem from '../components/comments/CommentItem';
import PostMediaDisplay from '../components/post/PostMediaDisplay';
import { ChatBubbleLeftEllipsisIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';


const ShareIconUI: React.FC<{ className?: string }> = ({ className }) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.383.05.571.078m-1.571 2.032c.195.025.383.05.571.078m13.48 0a2.25 2.25 0 01-.621 1.628l-3.029 3.028a2.25 2.25 0 01-3.182 0l-3.029-3.028a2.25 2.25 0 01-.621-1.628m13.48 0L19.25 12l-1.521-.078m13.48 0c0 2.042-.832 3.901-2.186 5.256L16.5 21.75m1.217-9.843c-.195-.025-.383-.05-.571-.078m-1.571-2.032c-.195-.025-.383-.05-.571-.078m-1.412 5.690c.195.025.383.05.571.078" /></svg>
);
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" /></svg>
);


const SingleBlogPostPage: React.FC = () => {
  const { blogPostId } = useParams<{ blogPostId: string }>();
  const { blogPosts, loadingContent, addCommentToItem, logContentActivity, toggleLikeOnItem } = useContent(); 
  const { currentUser, isAuthenticated } = useAuth();
  
  const [post, setPost] = React.useState<BlogPost | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false); 
  const [likeCount, setLikeCount] = useState(0); 
  const [commentText, setCommentText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  React.useEffect(() => {
    if (blogPostId && !loadingContent) {
        const foundPost = blogPosts.find(p => p.id === blogPostId);
        setPost(foundPost);
        if (foundPost) {
          setLikeCount(foundPost.likes || 0);
          setIsLiked(foundPost.likedByMe ?? false);
        }
    }
  }, [blogPostId, loadingContent, blogPosts]); 

  const handleLike = async () => {
    if (!isAuthenticated || !post) { setIsAuthModalOpen(true); return; }
    const updated = await toggleLikeOnItem('blogPost', post.id, isLiked);
    if (updated?.likes !== undefined) {
      const nextLikedState = !isLiked;
      setIsLiked(nextLikedState);
      setLikeCount(updated.likes);
      logContentActivity(
        `${currentUser?.fullName || 'User'} ${nextLikedState ? 'liked' : 'unliked'} blog post: "${post.title}"`,
        'content_update',
        'blogPost',
        post.id
      );
    }
  };

  const handleAddCommentClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setShowCommentForm(prev => !prev);
  };

  const handleSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!post || !currentUser) return;
    const trimmedComment = commentText.trim();
    if (!trimmedComment) {
      setCommentError('Please enter a comment before submitting.');
      return;
    }
    setCommentError(null);
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(post.id, 'blogPost', trimmedComment);
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
      setShowCommentForm(false);
    }
    else { alert("There was an issue submitting your comment. Please try again."); }
  };

  if (loadingContent) { return <div className="container mx-auto px-4 py-12 text-center"><p className="text-xl text-gray-600">Loading post details...</p></div>; }
  if (!post) { return <div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-semibold text-gray-700">Blog Post not found</h1><p className="text-gray-500 mt-2">The post you are looking for does not exist or has been moved.</p><Button asLink to="/blog" variant="primary" className="mt-6">Back to Blog</Button></div>; }
  
  const detailUrl = `/blog/${post.id}`;
  const currentCommentCount = post.comments?.length || 0;
  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto bg-white">
          {(post.mediaUrls && post.mediaUrls.length > 0) ? (<PostMediaDisplay mediaUrls={post.mediaUrls} title={post.title} />) : post.imageUrl ? (<img src={post.imageUrl} alt={post.title} className="w-full h-auto max-h-[500px] object-cover rounded-t-xl"/>) : null}
          <CardHeader>
            <h1 className="font-bold text-3xl md:text-4xl text-gray-800">{post.title}</h1>
            <p className="text-md mt-2 text-gray-500">Published on <span className="font-semibold">{formatDateADBS(post.date)}</span></p>
            {post.category && <p className="mt-1 text-sm font-medium uppercase tracking-wider text-purple-600">{post.category}</p>}
             {post.postedByAdminName && (<p className="text-xs mt-2 flex items-center text-slate-400"><UserCircleIcon className="w-3.5 h-3.5 mr-1" />Posted by: {post.postedByAdminName}</p>)}
             <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-3 text-slate-500">          
            {post.location && <span className="flex items-center"><MapPinIcon className="w-4 h-4 mr-1"/> at {post.location}</span>}
            </div>
          </CardHeader>
          <CardContent>
            {post.audioUrl && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 mb-2">Listen to Audio:</h3><audio controls src={post.audioUrl} className="w-full">Your browser does not support the audio element.</audio></div>)}
            <div className="prose max-w-none leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: post.description }}/>
            <div className="mt-8 pt-6 flex justify-around items-center border-t border-gray-200">
                <Button variant="ghost" onClick={handleLike} className="flex items-center text-slate-600 hover:text-blue-600" aria-pressed={isLiked}>
                  {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIcon className="w-5 h-5 mr-1.5" />}
                  {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
                </Button>
                <Button variant="ghost" onClick={handleAddCommentClick} className="flex items-center text-slate-600 hover:text-purple-500">
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-1.5" />
                  {currentCommentCount} <span className="ml-1 hidden sm:inline">Comment</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500"><ShareIconUI className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span></Button>
            </div>
            {showCommentForm && (
              <form onSubmit={handleSubmitComment} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Add a comment</label>
                <textarea
                  value={commentText}
                  onChange={(event) => {
                    setCommentText(event.target.value);
                    if (commentError) {
                      setCommentError(null);
                    }
                  }}
                  rows={4}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Write your comment here..."
                />
                {commentError && <p className="text-xs text-red-500">{commentError}</p>}
                <Button type="submit" variant="primary" disabled={isSubmittingComment} className="w-full">
                  {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
                </Button>
              </form>
            )}
            <div className="mt-8 pt-6 border-t"><h3 className="text-xl font-semibold text-gray-700 mb-4">Comments ({currentCommentCount})</h3>{post.comments && post.comments.length > 0 ? (<div className="space-y-4">{post.comments.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment: CommentType) => (<CommentItem key={comment.id} comment={comment} itemType="blogPost" itemId={post.id} />))}</div>) : (<p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>)}</div>
            <AdSlot placementKey="single_page_bottom" className="mt-8" />
          </CardContent>
        </Card>
        <div className="text-center mt-8"><Button asLink to="/blog" variant="outline">Back to Blog</Button></div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share "${post.title}"`} url={detailUrl} eventTitle={post.title} />
    </div>
  );
};

export default SingleBlogPostPage;
