import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { User, PrayerRequest } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import PrayerRequestCard from '../components/prayer/PrayerRequestCard';
import Button from '../components/ui/Button';
import CommentModal from '../components/ui/CommentModal';
import AuthModal from '../components/auth/AuthModal';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/solid';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, getAllUsers } = useAuth();
  const { prayerRequests, togglePrayerOnRequest, addCommentToItem } = useContent(); 
  
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [activeRequestForComment, setActiveRequestForComment] = useState<PrayerRequest | null>(null);
  
  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);

  useEffect(() => {
    if (!userId) return;
    if (userId === currentUser?.id) {
      navigate('/profile', { replace: true });
      return;
    }
    const foundUser = allUsers.find((user) => user.id === userId);
    setTargetUser(foundUser || null);
  }, [userId, allUsers, currentUser, navigate]);

  

  const userPublicPrayers = useMemo(() => {
    if (!targetUser) return [];
    return prayerRequests.filter(
      (pr) =>
        pr.postedByOwnerId === targetUser.id &&
        (pr.visibility === 'public' || pr.visibility === 'anonymous')
    );
  }, [prayerRequests, targetUser]);
  
  const handleOpenCommentModal = (request: PrayerRequest) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveRequestForComment(request);
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!activeRequestForComment) return;
    const result = await addCommentToItem(activeRequestForComment.id, 'prayerRequest', commentText);
    if (result) {
      setIsCommentModalOpen(false);
      setActiveRequestForComment(null);
    } else {
      alert('Failed to add comment.');
    }
  };

  if (!targetUser) {
    return <div className="text-center py-10">User not found.</div>;
  }
 
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 space-y-8">
        <div className="max-w-3xl mx-auto mb-4">
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="mb-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
       
         <Card className="max-w-3xl mx-auto dark:bg-slate-800">
          <CardHeader className="flex flex-col items-center sm:flex-row sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6 dark:border-slate-700">
            {targetUser.profileImageUrl ? (
              <img
                src={targetUser.profileImageUrl}
                alt={targetUser.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
              />
            ) : (
              <UserCircleIcon className="w-24 h-24 text-slate-400 dark:text-slate-500" />
            )}
            <div className="flex-grow">
              <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{targetUser.fullName}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{targetUser.username}</p>
              {targetUser.bio && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{targetUser.bio}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{targetUser.email}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/70">
              <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{targetUser.phone || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {targetUser.fullName.split(' ')[0]}'s Public Prayer Requests
          </h2>
          {userPublicPrayers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {userPublicPrayers.map((pr) => (
                <PrayerRequestCard
                  key={pr.id}
                  request={pr}
                  onPrayedFor={togglePrayerOnRequest}
                  onStatusUpdate={() => {}}
                  onComment={handleOpenCommentModal}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400">
              No public prayer requests available.
            </p>
          )}  
        </div>
    </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      {isCommentModalOpen && activeRequestForComment && (
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={() => setIsCommentModalOpen(false)}
          eventTitle={`Comment on "${activeRequestForComment.title}"`}
          onSubmitComment={handleSubmitComment}
        />
     )}
    </div>
  );
};

export default PublicProfilePage;
