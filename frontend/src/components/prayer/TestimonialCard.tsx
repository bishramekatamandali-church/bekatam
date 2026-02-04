
import React, { useEffect, useMemo, useState } from 'react';
import { Testimonial } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { formatDateADBS } from '../../dateConverter';
import { UserCircleIcon as HeroUserCircleIcon, TrashIcon, MapPinIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { Link } from "react-router-dom";
import PostMediaDisplay from '../post/PostMediaDisplay';
import { HeartIcon, ShareIcon, TestimonyIcon } from '../icons/GenericIcons';
import AdminDeleteModal from '../admin/AdminDeleteModal';
import ShareModal from '../ui/ShareModal';
import CommentItem from '../comments/CommentItem';

interface TestimonialCardProps {
  testimonial: Testimonial;
  onComment?: (testimonial: Testimonial) => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, onComment }) => {
  const { isAdmin, logAdminAction, isAuthenticated } = useAuth();
  const { deleteContent, toggleLikeOnItem } = useContent();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(testimonial.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(testimonial.likes ?? 0);
  const mediaUrls = testimonial.mediaUrls && testimonial.mediaUrls.length > 0
    ? testimonial.mediaUrls
    : (testimonial as any).imageUrl
      ? [(testimonial as any).imageUrl]
      : [];
  const commentCount = testimonial.comments?.length ?? 0;
  const displayDate = testimonial.createdAt || testimonial.submittedAt;
  const profileId = testimonial.postedByAdminId || testimonial.userId;
  const displayName = testimonial.postedByAdminName || testimonial.userName;
  const postedByAdmin = testimonial.postedByAdminName || testimonial.postedByAdminId;
  const sortedComments = useMemo(
    () => (testimonial.comments ?? []).slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    [testimonial.comments]
  );

  useEffect(() => {
    setLikeCount(testimonial.likes ?? 0);
  }, [testimonial.likes]);

  const handleDelete = (reason: string) => {
    if (!isAdmin) return;
    setIsSubmittingDelete(true);
    deleteContent('testimonial', testimonial.id, reason).then(() => {
        logAdminAction("Deleted Testimonial", testimonial.id, `Title: "${testimonial.title}", Reason: ${reason}`);
        setIsSubmittingDelete(false);
        setIsDeleteModalOpen(false);
    });
  };
  
  const getCardClasses = () => {
    return `flex flex-col h-full shadow-lg transition-all duration-300 ease-in-out border border-slate-200 bg-white`;
  };
  
  const PostMeta: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-3 ${className}`}>
        {testimonial.location && <span className="flex items-center"><MapPinIcon className="w-3.5 h-3.5 mr-1"/> at {testimonial.location}</span>}
    </div>
  );

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like testimonies.');
      return;
    }
    const updated = await toggleLikeOnItem('testimonial', testimonial.id, isLiked);
    if (updated?.likes !== undefined) {
      setLikeCount(updated.likes);
      setIsLiked(!isLiked);
    }
  };

  return (
    <>
    <Card id={`testimonial-${testimonial.id}`} className={getCardClasses()}>
      <CardHeader className="border-slate-200 pb-2 relative overflow-hidden">
        <div className="flex items-center text-xs text-slate-500">
           <Link to={profileId ? `/profile/${profileId}` : '#'}>
            {testimonial.userProfileImageUrl ? (
                <img src={testimonial.userProfileImageUrl} alt={displayName || 'Profile'} className="w-10 h-10 rounded-full mr-2 object-cover"/>
            ) : (
                <HeroUserCircleIcon className="w-10 h-10 mr-2 text-slate-400" />
            )}
           </Link>
          <div>
            <div className="flex items-center gap-2">
              {profileId ? (
                <Link to={`/profile/${profileId}`} className="font-semibold text-sm hover:underline text-slate-800">{displayName}</Link>
              ) : (
                <span className="font-semibold text-sm text-slate-800">{displayName}</span>
              )}
              {postedByAdmin && (
                <span className="inline-flex items-center text-[0.65rem] uppercase tracking-wide text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
                  Admin
                </span>
              )}
            </div>
            <p>{formatDateADBS(displayDate)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow py-3 space-y-3">
        <div className="p-4 rounded-lg bg-white">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-slate-100 text-slate-700">
                <TestimonyIcon className="w-4 h-4 mr-1.5 text-slate-500"/>
                TESTIMONY
            </div>
            <h3 className="font-semibold mt-2 text-lg text-slate-900" title={testimonial.title}>
            {testimonial.title}
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line mt-2 text-slate-700">
            {testimonial.contentText}
            </p>
            {testimonial.moderationReason && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <strong className="mr-1">Admin note:</strong>
                {testimonial.moderationReason}
              </div>
            )}
        </div>

        <PostMediaDisplay mediaUrls={mediaUrls} title={testimonial.title} />
        <PostMeta className="text-slate-500" />
      </CardContent>
      <CardFooter className="bg-slate-50 mt-auto grid grid-cols-3 gap-px p-0">
        <Button
          variant="ghost"
          onClick={handleLike}
          className={`flex items-center justify-center w-full !rounded-none py-2 ${isLiked ? '!text-rose-600' : 'text-slate-600'} hover:!bg-rose-50 transition-colors`}
          aria-pressed={isLiked}
        >
          <HeartIcon className="w-5 h-5 mr-1.5" />
          {likeCount > 0 ? likeCount : ''} <span className="ml-1">Like</span>
        </Button>
        <Button
          variant="ghost"
          className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-slate-200 transition-colors"
          onClick={() => setShowComments(p => !p)}
        >
          <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-1.5" />
          Comments ({commentCount})
        </Button>
        <Button
          variant="ghost"
          className="flex items-center justify-center w-full !rounded-none py-2 text-slate-600 hover:!bg-slate-200 transition-colors"
          onClick={() => setIsShareModalOpen(true)}
        >
          <ShareIcon className="w-5 h-5 mr-1.5" />
          Share
        </Button>
      </CardFooter>
      {showComments && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
            {sortedComments.length > 0 ? (
              sortedComments.map(c => (
                <CommentItem key={c.id} comment={c} itemId={testimonial.id} itemType="testimonial" />
              ))
            ) : (
              <p className="text-center text-xs text-slate-500 py-3">No comments yet.</p>
            )}
          </div>
          {onComment && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <Button onClick={() => onComment(testimonial)} size="sm" variant="primary" className="w-full">
                Add a Comment
              </Button>
            </div>
          )}
        </div>
      )}
      {isAdmin && (
        <CardFooter className="p-1 border-t bg-red-50 border-red-200">
          <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="w-full text-xs !text-red-600 hover:!bg-red-100">
              <TrashIcon className="w-4 h-4 mr-1.5" /> Admin: Delete Testimonial
          </Button>
        </CardFooter>
      )}
    </Card>
    {isAdmin && isDeleteModalOpen && (
        <AdminDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          itemName={testimonial.title}
          isSubmitting={isSubmittingDelete}
        />
      )}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Share Testimony: "${testimonial.title}"`}
        url={`/prayer-requests#testimonial-${testimonial.id}`}
        eventTitle={testimonial.title}
      />
    </>
  );
};

export default TestimonialCard;
