import React, { useState } from 'react'; 
import { Link, useNavigate } from "react-router-dom";
import { Sermon } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import ShareModal from '../ui/ShareModal';
import AuthModal from '../auth/AuthModal'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { useContent } from '../../contexts/ContentContext'; 
import { formatDateADBS } from '../../dateConverter'; 
import useAITranslate from '../../../src/hooks/useAITranslate';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
} from '@heroicons/react/24/solid';
import {
  HandThumbUpIcon as HandThumbUpIconOutline,
  ChatBubbleLeftRightIcon,
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
  const { logContentActivity, toggleLikeOnItem } = useContent(); 
  const navigate = useNavigate();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [likeCount, setLikeCount] = useState(sermon.likes || 0);
  const [isLiked, setIsLiked] = useState(false); 

  const { translatedText: title } = useAITranslate(sermon.title, 'en');
  const { translatedText: description } = useAITranslate(sermon.description, 'en');
  const { translatedText: speaker } = useAITranslate(sermon.speaker, 'en');
  const { translatedText: category } = useAITranslate(sermon.category, 'en');
  const detailUrl = `/sermons/${sermon.id}`;

  const handleLike = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
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

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    navigate(detailUrl, { state: { focusComments: true } });
  };
  
  const commentCount = sermon.comments?.length || 0;
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
            <div className="flex items-center text-xs text-slate-400 mb-2">
             <UserIcon className="mr-2 text-slate-300 flex-shrink-0" />
             <span>Posted by: {sermon.postedByAdminName || 'Admin'}</span>
            </div>
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
        <CardFooter className="flex justify-around items-center flex-wrap gap-1 sm:gap-2 bg-slate-50">
            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center text-slate-600 hover:text-blue-600 px-1.5 sm:px-2 py-1" aria-pressed={isLiked} aria-label={isLiked ? `Unlike sermon, ${likeCount} likes` : `Like sermon, ${likeCount} likes`}>
                {isLiked ? <HandThumbUpIconSolid className="w-5 h-5 mr-1 text-blue-600" /> : <HandThumbUpIconOutline className="w-5 h-5 mr-1" />}
                {likeCount > 0 ? likeCount : ''} <span className="sr-only sm:not-sr-only ml-1">Like</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommentClick}
              className="flex items-center text-slate-600 hover:text-teal-500 px-1.5 sm:px-2 py-1"
              aria-label="Comment on sermon"
            >
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-1" /> 
                {commentCount > 0 ? commentCount : ''} <span className="sr-only sm:not-sr-only ml-1">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsShareModalOpen(true)} className="flex items-center text-slate-600 hover:text-purple-500 px-1.5 sm:px-2 py-1" aria-label="Share sermon">
                <ShareIconOutline className="w-5 h-5 mr-1" /> <span className="sr-only sm:not-sr-only">Share</span>
            </Button>
            <Button asLink to={detailUrl} variant="outline" size="sm" className="px-1.5 sm:px-2 py-1">View Details</Button>
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
    </>
  );
};

export default SermonCard;  
