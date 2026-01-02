
import React, { useState } from 'react';
import { Testimonial } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { formatDateADBS } from '../../dateConverter';
import { UserCircleIcon as HeroUserCircleIcon, TrashIcon, MapPinIcon, FaceSmileIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { Link } from "react-router-dom";
import PostMediaDisplay from '../post/PostMediaDisplay';
import { TestimonyIcon } from '../icons/GenericIcons';
import AdminDeleteModal from '../admin/AdminDeleteModal';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  const { isAdmin, logAdminAction } = useAuth();
  const { deleteContent } = useContent();
  const hasBackground = testimonial.backgroundTheme && testimonial.backgroundTheme !== 'post-theme-default';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const handleDelete = (reason: string) => {
    if (!isAdmin) return;
    setIsSubmittingDelete(true);
    deleteContent('testimonial', testimonial.id).then(() => {
        logAdminAction("Deleted Testimonial", testimonial.id, `Title: "${testimonial.title}", Reason: ${reason}`);
        setIsSubmittingDelete(false);
        setIsDeleteModalOpen(false);
    });
  };
  
  const getCardClasses = () => {
    return `flex flex-col h-full shadow-lg transition-all duration-300 ease-in-out border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800`;
  };
  
  const PostMeta: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-3 ${className}`}>
        {testimonial.feelingActivity && <span className="flex items-center"><FaceSmileIcon className="w-3.5 h-3.5 mr-1"/> feeling {testimonial.feelingActivity}</span>}
        {testimonial.taggedFriends && <span className="flex items-center"><UserGroupIcon className="w-3.5 h-3.5 mr-1"/> with {testimonial.taggedFriends}</span>}
        {testimonial.location && <span className="flex items-center"><MapPinIcon className="w-3.5 h-3.5 mr-1"/> at {testimonial.location}</span>}
    </div>
  );

  return (
    <>
    <Card id={`testimonial-${testimonial.id}`} className={getCardClasses()}>
      <CardHeader className="dark:border-slate-700 pb-2 relative overflow-hidden">
        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
           <Link to={`/profile/${testimonial.userId}`}>
            {testimonial.userProfileImageUrl ? (
                <img src={testimonial.userProfileImageUrl} alt={testimonial.userName} className="w-10 h-10 rounded-full mr-2 object-cover"/>
            ) : (
                <HeroUserCircleIcon className="w-10 h-10 mr-2 text-slate-400 dark:text-slate-500" />
            )}
           </Link>
          <div>
            <Link to={`/profile/${testimonial.userId}`} className="font-semibold text-sm hover:underline text-slate-800 dark:text-slate-200">{testimonial.userName}</Link>
            <p>{formatDateADBS(testimonial.submittedAt)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow py-3 space-y-3">
        <div className={`p-4 rounded-lg ${testimonial.backgroundTheme || 'post-theme-default'}`}>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${hasBackground ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}`}>
                <TestimonyIcon className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400"/>
                TESTIMONY
            </div>
            <h3 className={`font-semibold mt-2 ${hasBackground ? 'text-2xl text-white' : 'text-lg text-slate-800 dark:text-slate-200'}`} title={testimonial.title}>
            {testimonial.title}
            </h3>
            <p className={`text-sm leading-relaxed whitespace-pre-line mt-2 ${hasBackground ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
            {testimonial.contentText}
            </p>
        </div>

        <PostMediaDisplay mediaUrls={testimonial.mediaUrls || []} title={testimonial.title} />
        <PostMeta className="text-slate-500 dark:text-slate-400" />
      </CardContent>
      {isAdmin && (
        <CardFooter className="p-1 border-t bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800">
          <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="w-full text-xs !text-red-600 dark:!text-red-300 hover:!bg-red-200 dark:hover:!bg-red-900">
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
    </>
  );
};

export default TestimonialCard;
