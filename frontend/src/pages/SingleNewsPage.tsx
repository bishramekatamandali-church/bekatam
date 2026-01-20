import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { useContent } from '../contexts/ContentContext'; 
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ShareModal from '../components/ui/ShareModal';
import AuthModal from '../components/auth/AuthModal';
import { NewsItem, Comment as CommentType } from '../types';
import { formatDateADBS } from '../dateConverter'; 
import AdSlot from '../components/ads/AdSlot';
import CommentItem from '../components/comments/CommentItem';
import { ChatBubbleLeftEllipsisIcon, HandThumbUpIcon as HandThumbUpIconOutline, ShareIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpIconSolid } from '@heroicons/react/24/solid';
const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.75a.75.75 0 00-1.5 0V7.5H9.75a.75.75 0 000 1.5H11V10.5a.75.75 0 001.5 0V9h.75a.75.75 0 000-1.5H12.5V6.25z" clipRule="evenodd" /></svg>
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


const SingleNewsPage: React.FC = () => {
  const { newsItemId } = useParams<{ newsItemId: string }>();
  const { newsItems, loadingContent, addCommentToItem, logContentActivity, toggleLikeOnItem } = useContent(); 
  const { currentUser, isAuthenticated } = useAuth();
  
  const [newsItem, setNewsItem] = React.useState<NewsItem | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false); 
  const [likeCount, setLikeCount] = useState(0); 
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);

  React.useEffect(() => {
    if (newsItemId && !loadingContent) {
        const foundItem = newsItems.find(item => item.id === newsItemId);
        setNewsItem(foundItem);
        if (foundItem) {
          setLikeCount(foundItem.likes || 0);
          setIsLiked(foundItem.likedByMe ?? false);
        }
    }
  }, [newsItemId, loadingContent, newsItems]); 

  const handleLike = async () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    if (!newsItem) return;
    const updated = await toggleLikeOnItem('news', newsItem.id, isLiked);
    if (updated?.likes !== undefined) {
      setLikeCount(updated.likes);
      setIsLiked(!isLiked);
      logContentActivity(
        `${currentUser?.fullName || 'User'} ${!isLiked ? 'liked' : 'unliked'} news item: "${newsItem.title}"`,
        'content_update',
        'news',
        newsItem.id
      );
    }
  };

  const handleAddCommentClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setShowCommentForm(prev => !prev);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!newsItem || !currentUser) return;
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(newsItem.id, 'news', commentText);
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
      setShowCommentForm(false);
    } else {
      setCommentError("There was an issue submitting your comment. Please try again.");
    }
  };

  if (loadingContent) { return <div className="container mx-auto px-4 py-12 text-center"><p className="text-xl text-gray-600">Loading news details...</p></div>; }
  if (!newsItem) { return <div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-semibold text-gray-700">News Item not found</h1><p className="text-gray-500 mt-2">The news item you are looking for does not exist or has been moved.</p><Button asLink to="/news" variant="primary" className="mt-6">Back to News</Button></div>; }
  
  const detailUrl = `/news/${newsItem.id}`;
  const currentCommentCount = newsItem.comments?.length || 0;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(newsItem.videoUrl);
  const hasVideo = !!youtubeEmbedUrl || !!newsItem.videoUrl;

  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto">
          {youtubeEmbedUrl && (<div className="aspect-w-16 aspect-h-9 bg-black rounded-t-xl overflow-hidden"><iframe src={youtubeEmbedUrl} title={newsItem.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="w-full h-full"></iframe></div>)}
          {!youtubeEmbedUrl && newsItem.videoUrl && (<div className="bg-black rounded-t-xl overflow-hidden"><video src={newsItem.videoUrl} controls className="w-full max-h-[500px] object-contain" aria-label={`Video player for ${newsItem.title}`} /></div>)}
          {newsItem.imageUrl && !hasVideo && (<img src={newsItem.imageUrl} alt={newsItem.title} className="w-full h-auto max-h-[500px] object-cover rounded-t-xl"/>)}
          <CardHeader>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{newsItem.title}</h1>
            <p className="text-md text-gray-500">Published on <span className="font-semibold text-gray-700">{formatDateADBS(newsItem.date)}</span></p>
            {newsItem.category && <p className="mt-1 text-sm font-medium uppercase tracking-wider text-purple-600">{newsItem.category}</p>}
             {newsItem.postedByAdminName && (<p className="text-xs text-slate-400 mt-2 flex items-center"><UserCircleIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />Posted by: {newsItem.postedByAdminName}</p>)}
          </CardHeader>
          <CardContent>
             {newsItem.audioUrl && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 mb-2">Listen to Audio:</h3><audio controls src={newsItem.audioUrl} className="w-full">Your browser does not support the audio element.</audio></div>)}
            <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: newsItem.description }} />
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-around items-center">
                <Button variant="ghost" onClick={handleLike} className="flex items-center text-slate-600 hover:text-blue-500" aria-pressed={isLiked}>
                  {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1.5" />}
                  {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
                </Button>
                <Button variant="ghost" onClick={handleAddCommentClick} className="flex items-center text-slate-600 hover:text-purple-500">
                  <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-1.5" /> {currentCommentCount} <span className="ml-1 hidden sm:inline">Comment</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500">
                  <ShareIcon className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span>
                </Button>
            </div>
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Comments ({currentCommentCount})</h3>
              {showCommentForm && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setCommentError('');
                    if (!commentText.trim()) {
                      setCommentError('Comment cannot be empty.');
                      return;
                    }
                    handleSubmitComment(commentText.trim());
                  }}
                  className="mb-6 space-y-2"
                >
                  <label htmlFor="single-news-comment" className="sr-only">
                    Add a comment
                  </label>
                  <textarea
                    id="single-news-comment"
                    rows={4}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Write your comment..."
                    className="w-full rounded-md border border-slate-200 p-3 text-sm text-slate-700 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isSubmittingComment}
                  />
                  {commentError && <p className="text-xs text-red-500">{commentError}</p>}
                  <Button type="submit" variant="primary" disabled={isSubmittingComment || !commentText.trim()}>
                    {isSubmittingComment ? 'Submitting...' : 'Post Comment'}
                  </Button>
                </form>
              )}
              {newsItem.comments && newsItem.comments.length > 0 ? (
                <div className="space-y-4">
                  {newsItem.comments
                    .slice()
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((comment: CommentType) => (
                      <CommentItem key={comment.id} comment={comment} itemType="news" itemId={newsItem.id} />
                    ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
            <AdSlot placementKey="single_page_bottom" className="mt-8" />
          </CardContent>
        </Card>
        <div className="text-center mt-8"><Button asLink to="/news" variant="outline">Back to News</Button></div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share "${newsItem.title}"`} url={detailUrl} eventTitle={newsItem.title}/>
    </div>
  );
};

export default SingleNewsPage; 
