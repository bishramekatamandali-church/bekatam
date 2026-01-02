import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { useContent } from '../contexts/ContentContext'; 
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ShareModal from '../components/ui/ShareModal';
import CommentModal from '../components/ui/CommentModal';
import AuthModal from '../components/auth/AuthModal';
import { NewsItem, Comment as CommentType } from '../types';
import { formatDateADBS, formatTimestampADBS } from '../dateConverter'; 
import AdSlot from '../components/ads/AdSlot';
import CommentItem from '../components/comments/CommentItem';
import { ChatBubbleOvalLeftEllipsisIcon } from '../components/icons/GenericIcons';

// Icons
const HeartIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={isFilled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} ${isFilled ? 'text-red-500' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
);
const ShareIconUI: React.FC<{ className?: string }> = ({ className }) => ( 
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.383.05.571.078m-1.571 2.032c.195.025.383.05.571.078m13.48 0a2.25 2.25 0 01-.621 1.628l-3.029 3.028a2.25 2.25 0 01-3.182 0l-3.029-3.028a2.25 2.25 0 01-.621-1.628m13.48 0L19.25 12l-1.521-.078m13.48 0c0 2.042-.832 3.901-2.186 5.256L16.5 21.75m1.217-9.843c-.195-.025-.383-.05-.571-.078m-1.571-2.032c-.195-.025-.383-.05-.571-.078m-1.412 5.690c.195.025.383.05.571.078" /></svg>
);
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
  const { newsItems, loadingContent, addCommentToItem, logContentActivity } = useContent(); 
  const { currentUser, isAuthenticated } = useAuth();
  
  const [newsItem, setNewsItem] = React.useState<NewsItem | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false); 
  const [likeCount, setLikeCount] = useState(0); 

  React.useEffect(() => {
    if (newsItemId && !loadingContent) {
        const foundItem = newsItems.find(item => item.id === newsItemId);
        setNewsItem(foundItem);
        if (foundItem) { setLikeCount(foundItem.likes || 0); }
    }
  }, [newsItemId, loadingContent, newsItems]); 

  const handleLike = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    if(newsItem) { logContentActivity(`${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} news item: "${newsItem.title}"`, 'content_update', 'news', newsItem.id); alert(`Like action simulated for "${newsItem.title}"!`); }
  };

  const handleAddCommentClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!newsItem || !currentUser) return;
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(newsItem.id, 'news', commentText);
    setIsSubmittingComment(false);
    if (newComment) { setIsCommentModalOpen(false); } 
    else { alert("There was an issue submitting your comment. Please try again."); }
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
             {newsItem.postedByOwnerName && (<p className="text-xs text-slate-400 mt-2 flex items-center"><UserCircleIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />Posted by: {newsItem.postedByOwnerName}</p>)}
          </CardHeader>
          <CardContent>
             {newsItem.audioUrl && (<div className="mb-6"><h3 className="text-lg font-semibold text-gray-700 mb-2">Listen to Audio:</h3><audio controls src={newsItem.audioUrl} className="w-full">Your browser does not support the audio element.</audio></div>)}
            <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: newsItem.description }} />
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-around items-center">
                <Button variant="ghost" onClick={handleLike} className="flex items-center text-slate-600 hover:text-red-500" aria-pressed={isLiked}><HeartIcon className="w-5 h-5 mr-1.5" isFilled={isLiked} /> {likeCount} <span className="ml-1 hidden sm:inline">Like</span></Button>
                <Button variant="ghost" onClick={handleAddCommentClick} className="flex items-center text-slate-600 hover:text-purple-500"><ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5 mr-1.5" /> {currentCommentCount} <span className="ml-1 hidden sm:inline">Comment</span></Button>
                <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500"><ShareIconUI className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span></Button>
            </div>
            <div className="mt-8 pt-6 border-t"><h3 className="text-xl font-semibold text-gray-700 mb-4">Comments ({currentCommentCount})</h3>{newsItem.comments && newsItem.comments.length > 0 ? (<div className="space-y-4">{newsItem.comments.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment: CommentType) => (<CommentItem key={comment.id} comment={comment} itemType="news" itemId={newsItem.id} />))}</div>) : (<p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>)}</div>
            <AdSlot placementKey="single_page_bottom" className="mt-8" />
          </CardContent>
        </Card>
        <div className="text-center mt-8"><Button asLink to="/news" variant="outline">Back to News</Button></div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share "${newsItem.title}"`} url={detailUrl} eventTitle={newsItem.title}/>
      {isCommentModalOpen && newsItem && (<CommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} eventTitle={newsItem.title} onSubmitComment={handleSubmitComment} isSubmitting={isSubmittingComment}/>)}
    </div>
  );
};

export default SingleNewsPage;
