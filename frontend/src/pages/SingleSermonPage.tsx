import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from "react-router-dom";
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import ShareModal from '../components/ui/ShareModal';
import AuthModal from '../components/auth/AuthModal';
import { Sermon, Comment as CommentType } from '../types';
import { formatDateADBS, formatTimestampADBS } from '../dateConverter';
import AdSlot from '../components/ads/AdSlot';
import CommentItem from '../components/comments/CommentItem';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import {
  HandThumbUpIcon as HandThumbUpIconOutline,
  ChatBubbleLeftRightIcon,
  ShareIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  let videoId = null;
  const regExpStandard = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const matchStandard = url.match(regExpStandard);
  if (matchStandard && matchStandard[2].length === 11) {
    videoId = matchStandard[2];
  } else {
    const regExpShorts = /^.*(youtube.com\/shorts\/)([^#\&\?]*).*/;
    const matchShorts = url.match(regExpShorts);
    if (matchShorts && matchShorts[2]) {
      videoId = matchShorts[2];
    }
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};


const SingleSermonPage: React.FC = () => {
  const { sermonId } = useParams<{ sermonId: string }>();
  const location = useLocation();
  const { sermons, loadingContent, addCommentToItem, logContentActivity, toggleLikeOnItem } = useContent();
  const { currentUser, isAuthenticated } = useAuth();

  const [sermon, setSermon] = React.useState<Sermon | undefined>(undefined);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (sermonId && !loadingContent) {
      const foundSermon = sermons.find(s => s.id === sermonId);
      setSermon(foundSermon);
      if (foundSermon) {
        setLikeCount(foundSermon.likes || 0);
        setIsLiked(foundSermon.likedByMe ?? false);
      }
    }
  }, [sermonId, loadingContent, sermons]);

  useEffect(() => {
    const state = location.state as { focusComments?: boolean } | null;
    if (state?.focusComments) {
      setShowCommentForm(true);
      requestAnimationFrame(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        commentInputRef.current?.focus();
      });
    }
  }, [location.state]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!sermon) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    const updated = await toggleLikeOnItem('sermon', sermon.id, isLiked);

    if (updated?.likes !== undefined) {
      setLikeCount(updated.likes);
    } else {
      setIsLiked(!newLikedState);
    }

    logContentActivity(
      `${currentUser?.fullName || 'User'} ${newLikedState ? 'liked' : 'unliked'} sermon: "${sermon.title}"`,
      'content_update',
      'sermon',
      sermon.id
    );
  };

  const handleAddCommentClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setShowCommentForm(true);
    requestAnimationFrame(() => {
      commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      commentInputRef.current?.focus();
    });
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sermon || !currentUser) return;
    if (!commentText.trim()) {
      alert('Comment cannot be empty.');
      return;
    }
    setIsSubmittingComment(true);
    const newComment = await addCommentToItem(sermon.id, 'sermon', commentText.trim());
    setIsSubmittingComment(false);
    if (newComment) {
      setCommentText('');
      setShowCommentForm(false);
    } else {
      alert("There was an issue submitting your comment. Please try again.");
    }
  };

  if (loadingContent && !sermon) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-600">Loading sermon details...</p>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-700">Sermon not found</h1>
        <p className="text-gray-500 mt-2">The sermon you are looking for does not exist or has been moved.</p>
        <Button asLink to="/sermons" variant="primary" className="mt-6">Back to Sermons</Button>
      </div>
    );
  }
  const detailUrl = `/sermons/${sermon.id}`;
  const currentCommentCount = sermon.comments?.length || 0;
  const youtubeEmbedUrl = getYouTubeEmbedUrl(sermon.videoUrl);
  const hasVideo = !!youtubeEmbedUrl || !!sermon.videoUrl;
  const showRecognition = true;
  const postedDate = sermon.publishedAt || sermon.createdAt || sermon.date;

  return (
    <div className="pb-12">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          {showRecognition && (
            <div className="rounded-t-xl bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-2">
              <UserCircleIcon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">
                {sermon.postedByAdminName || 'Admin'}
              </span>
              <span className="text-slate-400">•</span>
              <span>{postedDate ? formatTimestampADBS(postedDate) : 'Date unavailable'}</span>
            </div>
          )}
          {youtubeEmbedUrl && (
            <div className={`aspect-w-16 aspect-h-9 bg-black overflow-hidden ${showRecognition ? '' : 'rounded-t-xl'}`}>
              <iframe src={youtubeEmbedUrl} title={sermon.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="w-full h-full"></iframe>
            </div>
          )}
          {!youtubeEmbedUrl && sermon.videoUrl && (
            <div className={`bg-black overflow-hidden ${showRecognition ? '' : 'rounded-t-xl'}`}><video src={sermon.videoUrl} controls className="w-full max-h-[500px] object-contain" aria-label={`Video player for ${sermon.title}`}/></div>
          )}
          {sermon.imageUrl && (
            <div className={`${!hasVideo ? `bg-black overflow-hidden ${showRecognition ? '' : 'rounded-t-xl'}` : 'mt-4'}`}>
              <img src={sermon.imageUrl} alt={sermon.title} className={`w-full h-auto object-cover ${!hasVideo ? 'max-h-[500px]' : 'max-h-[400px] rounded-lg'}`}/>
            </div>
          )}
          
          <CardHeader className={`${!(hasVideo || sermon.imageUrl) && !showRecognition ? 'rounded-t-xl' : ''}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{sermon.title}</h1>
            <p className="text-md text-gray-500">By <span className="font-semibold text-gray-700">{sermon.speaker}</span> on <span className="font-semibold text-gray-700">{formatDateADBS(sermon.date)}</span></p>
            {sermon.scripture && <p className="text-sm text-teal-600 mt-2">Scripture: {sermon.scripture}</p>}
            {sermon.category && <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">{sermon.category}</p>}
            {sermon.location && (
              <div className="mt-2 flex items-center text-xs text-slate-500">
                <MapPinIcon className="w-4 h-4 mr-1 text-slate-400" /> {sermon.location}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {sermon.audioUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Listen to Audio:</h3>
                <audio controls src={sermon.audioUrl} className="w-full">Your browser does not support the audio element.</audio>
              </div>
            )}
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-xl font-semibold text-gray-700 mb-2 border-b pb-2">Sermon Overview</h3>
              <div dangerouslySetInnerHTML={{ __html: sermon.description }} />
            </div>
            {sermon.fullContent && (
              <div className="prose max-w-none text-gray-700 mt-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-2 border-b pb-2">Full Sermon Content/Transcript</h3>
                <div className="bg-gray-100 p-4 rounded-md" dangerouslySetInnerHTML={{ __html: sermon.fullContent }} />
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-around items-center">
                <Button variant="ghost" onClick={handleLike} className="flex items-center text-slate-600 hover:text-blue-600" aria-pressed={isLiked}>
                  {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1.5 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1.5" />}
                  {likeCount} <span className="ml-1 hidden sm:inline">Like</span>
                </Button>
                <Button variant="ghost" onClick={handleAddCommentClick} className="flex items-center text-slate-600 hover:text-teal-500">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-1.5" /> {currentCommentCount} <span className="ml-1 hidden sm:inline">Comment</span>
                </Button>
                <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-teal-500">
                  <ShareIcon className="w-5 h-5 mr-1.5" /> <span className="hidden sm:inline">Share</span>
                </Button>
            </div>
            <div ref={commentsRef} className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Comments ({currentCommentCount})</h3>
              {sermon.comments && sermon.comments.length > 0 ? (
                <div className="space-y-4">{sermon.comments.slice().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comment: CommentType) => (<CommentItem key={comment.id} comment={comment} itemType="sermon" itemId={sermon.id} />))}</div>
              ) : (<p className="text-slate-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>)}
              {showCommentForm && (
                <form onSubmit={handleSubmitComment} className="mt-6 space-y-3">
                  <label htmlFor="sermon-comment" className="sr-only">
                    Add a comment
                  </label>
                  <textarea
                    id="sermon-comment"
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={4}
                    placeholder="Write your comment here..."
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-700 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    disabled={isSubmittingComment}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="primary" disabled={isSubmittingComment || !commentText.trim()}>
                      {isSubmittingComment ? 'Submitting...' : 'Submit Comment'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCommentForm(false)}
                      disabled={isSubmittingComment}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
            <AdSlot placementKey="single_page_bottom" className="mt-8" />
          </CardContent>
        </Card>
        <div className="text-center mt-8"><Button asLink to="/sermons" variant="outline">Back to All Sermons</Button></div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title={`Share "${sermon.title}"`} url={detailUrl} eventTitle={sermon.title}/>
    </div>
  );
};

export default SingleSermonPage;  
