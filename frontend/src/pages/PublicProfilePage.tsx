

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { User, PrayerRequest } from '../types';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import PrayerRequestCard from '../components/prayer/PrayerRequestCard';
import { UserCircleIcon, PaperAirplaneIcon, UserPlusIcon, UserMinusIcon, CheckIcon, XMarkIcon, ArrowLeftIcon, PhoneIcon, VideoCameraIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import CommentModal from '../components/ui/CommentModal';
import CallModal from '../components/calls/CallModal';
import AuthModal from '../components/auth/AuthModal';

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, getAllUsers, getFriendshipStatus, sendFriendRequest, removeFriend, acceptFriendRequest, declineFriendRequest } = useAuth();
  const { prayerRequests, togglePrayerOnRequest, addCommentToItem } = useContent(); 
  
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeRequestForComment, setActiveRequestForComment] = useState<PrayerRequest | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');

  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);

  useEffect(() => {
    if (userId) {
      if (userId === currentUser?.id) {
          navigate('/profile', { replace: true });
          return;
      }
      const foundUser = allUsers.find(u => u.id === userId);
      setTargetUser(foundUser || null);
    }
  }, [userId, allUsers, currentUser, navigate]);

  const friendshipInfo = useMemo<{ status: 'friends' | 'pending_sent' | 'pending_received' | 'not_friends'; friendshipId?: string }>(() => {
    if (!currentUser || !targetUser) return { status: 'not_friends' };
    return getFriendshipStatus(targetUser.id);
  }, [currentUser, targetUser, getFriendshipStatus]);

  const userPublicPrayers = useMemo(() => {
    if (!targetUser) return [];
    return prayerRequests.filter(pr => pr.postedByOwnerId === targetUser.id && (pr.visibility === 'public' || pr.visibility === 'anonymous'));
  }, [prayerRequests, targetUser]);
  
  const handleFriendAction = () => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (!targetUser) return;

    if (friendshipInfo.status === 'not_friends') {
        const canSendRequest = targetUser.privacySettings?.whoCanSendFriendRequest !== 'friends_of_friends'; // Simplified check
        if (!canSendRequest) {
            alert("This user only accepts friend requests from friends of friends.");
            return;
        }
        sendFriendRequest(targetUser.id);
    } else if (friendshipInfo.status === 'friends') {
        if (window.confirm(`Are you sure you want to remove ${targetUser.fullName} as a friend?`)) {
            if (friendshipInfo.friendshipId) removeFriend(friendshipInfo.friendshipId);
        }
    } else if (friendshipInfo.status === 'pending_sent') {
        if (window.confirm(`Are you sure you want to cancel the friend request to ${targetUser.fullName}?`)) {
             if (friendshipInfo.friendshipId) removeFriend(friendshipInfo.friendshipId);
        }
    }
  };
  
   const handleOpenCommentModal = (request: PrayerRequest) => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setActiveRequestForComment(request);
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!activeRequestForComment) return;
    const result = await addCommentToItem(activeRequestForComment.id, 'prayerRequest', commentText);
    if (result) { setIsCommentModalOpen(false); setActiveRequestForComment(null); } 
    else { alert("Failed to add comment."); }
  };
  
  const startCall = (type: 'audio' | 'video') => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    setCallType(type);
    setIsCallModalOpen(true);
  };

  const handleMessageClick = () => {
    if (!isAuthenticated) { setIsAuthModalOpen(true); return; }
    if (targetUser) navigate(`/chat/${targetUser.id}`);
  };


  if (!targetUser) {
    return <div className="text-center py-10">User not found.</div>;
  }
  
  const renderFriendshipButtons = () => {
    if (!currentUser) {
        return (
            <Button onClick={() => setIsAuthModalOpen(true)} size="sm" variant="primary">
                Login to Interact
            </Button>
        );
    }

    if (currentUser.id === targetUser.id) return null;
    
    if (friendshipInfo.status === 'friends') {
        return (
            <div className="flex flex-wrap gap-2">
                 <Button onClick={handleMessageClick} variant="primary" size="sm">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-1.5"/>Message
                </Button>
                <Button onClick={() => startCall('audio')} variant="outline" size="sm" className="dark:border-slate-500 dark:text-slate-300">
                    <PhoneIcon className="w-4 h-4 mr-1.5"/>Audio Call
                </Button>
                 <Button onClick={() => startCall('video')} variant="outline" size="sm" className="dark:border-slate-500 dark:text-slate-300">
                    <VideoCameraIcon className="w-4 h-4 mr-1.5"/>Video Call
                </Button>
                 <Button onClick={handleFriendAction} variant="secondary" size="sm" className="!bg-red-600 hover:!bg-red-700">
                    <UserMinusIcon className="w-4 h-4 mr-1.5"/> Unfriend
                </Button>
            </div>
        )
    }

    if (friendshipInfo.status === 'pending_received') {
        return (
            <div className="flex space-x-2">
                <Button onClick={() => friendshipInfo.friendshipId && acceptFriendRequest(friendshipInfo.friendshipId)} variant="primary" size="sm" className="!bg-green-500 hover:!bg-green-600"><CheckIcon className="w-4 h-4 mr-1"/> Accept Request</Button>
                <Button onClick={() => friendshipInfo.friendshipId && declineFriendRequest(friendshipInfo.friendshipId)} variant="secondary" size="sm" className="!bg-red-600 hover:!bg-red-700"><XMarkIcon className="w-4 h-4 mr-1"/> Decline</Button>
            </div>
        );
    }
    
    const canSendRequest = targetUser.privacySettings?.whoCanSendFriendRequest !== 'friends_of_friends'; // Simplified simulation
    const addFriendTitle = canSendRequest ? 'Send a friend request' : 'This user only accepts requests from friends of friends.';

    return (
        <Button 
            onClick={handleFriendAction}
            size="sm"
            disabled={!canSendRequest || friendshipInfo.status === 'pending_sent'}
            variant={friendshipInfo.status === 'pending_sent' ? 'outline' : 'primary'}
            className="disabled:opacity-60 disabled:cursor-not-allowed"
            title={addFriendTitle}
        >
            {friendshipInfo.status === 'pending_sent' 
                ? <><PaperAirplaneIcon className="w-4 h-4 mr-1"/> Request Sent</>
                : <><UserPlusIcon className="w-4 h-4 mr-1"/> Add Friend</>
            }
        </Button>
    );
  };

  return (
    <>
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
                        <img src={targetUser.profileImageUrl} alt={targetUser.fullName} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"/>
                    ) : (
                        <UserCircleIcon className="w-24 h-24 text-slate-400 dark:text-slate-500"/>
                    )}
                    <div className="flex-grow">
                        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{targetUser.fullName}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">@{targetUser.username}</p>
                         <div className="mt-3">
                            {renderFriendshipButtons()}
                         </div>
                    </div>
                   
                </CardHeader>
            </Card>

            <div className="max-w-3xl mx-auto">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">{targetUser.fullName.split(' ')[0]}'s Public Prayer Requests</h2>
                {userPublicPrayers.length > 0 ? (
                     <div className="grid grid-cols-1 gap-6">
                        {userPublicPrayers.map(pr => (
                             <PrayerRequestCard 
                                key={pr.id} 
                                request={pr} 
                                onPrayedFor={togglePrayerOnRequest}
                                onStatusUpdate={()=>{}} // Users can't update others' statuses
                                onComment={handleOpenCommentModal} 
                             />
                        ))}
                    </div>
                ) : (
                    <Card className="dark:bg-slate-800">
                        <CardContent>
                            <p className="text-center text-slate-500 dark:text-slate-400 py-6">This user has no public prayer requests.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
    <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    {isCommentModalOpen && activeRequestForComment && (
        <CommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} eventTitle={`Comment on "${activeRequestForComment.title}"`} onSubmitComment={handleSubmitComment} />
    )}
     {isCallModalOpen && targetUser && (
        <CallModal 
            isOpen={isCallModalOpen}
            onClose={() => setIsCallModalOpen(false)}
            targetUser={targetUser}
            callType={callType}
        />
     )}
    </>
  );
};

export default PublicProfilePage;