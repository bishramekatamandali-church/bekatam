import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { MinistryJoinRequest, User, BlogPost, PrayerRequest, Testimonial, Notification, FontSize, PrivacySetting } from '../types';
import { formatTimestampADBS, formatDateADBS } from '../dateConverter';
import ProfileEditModal from '../components/auth/ProfileEditModal';
import { UserCircleIcon, PencilIcon, CheckIcon, XMarkIcon, UserMinusIcon, PaperAirplaneIcon, ArrowLeftIcon, BellAlertIcon } from '@heroicons/react/24/solid';
import BlogPostCard from '../components/blog/BlogPostCard';
import PrayerRequestCard from '../components/prayer/PrayerRequestCard';
import TestimonialCard from '../components/prayer/TestimonialCard';
import CommentModal from '../components/ui/CommentModal';

// --- Imports from pages to be merged ---
import { useNotification } from '../contexts/NotificationContext';
import { useFontSize } from '../contexts/FontSizeContext';
import ChangePasswordForm from '../components/auth/ChangePasswordForm';
import NotificationSettings from '../components/auth/NotificationSettings';
import { CogIcon as HeroCogIcon, AdjustmentsHorizontalIcon, LockClosedIcon, BellIcon as BellIconOutline, EyeIcon, EyeSlashIcon, UserGroupIcon, MagnifyingGlassIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import PrivacySettings from '../components/auth/PrivacySettings';


// New tab type
type ProfileTab = 'posts' | 'about' | 'friends' | 'notifications' | 'settings';
type NotificationFilter = 'all' | 'unread';


const ITEMS_PER_PAGE_NOTIFICATIONS = 10;

// Helper component for user display (from FriendsPage)
const UserDisplayCard: React.FC<{ user: User; children?: React.ReactNode }> = ({ user, children }) => (
    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3">
            <Link to={`/profile/${user.id}`}>
              <img src={user.profileImageUrl || `https://picsum.photos/seed/${user.id}/100/100`} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
            </Link>
            <div>
                <Link to={`/profile/${user.id}`} className="font-semibold text-slate-800 dark:text-slate-100 hover:underline">{user.fullName}</Link>
                <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
            </div>
        </div>
        <div className="flex space-x-2">
            {children}
        </div>
    </div>
);


const ProfilePage: React.FC = () => {
  const { currentUser, loadingAuthState, logout, updateUserProfile, friendships, acceptFriendRequest, declineFriendRequest, removeFriend, getAllUsers } = useAuth();
  const { blogPosts, prayerRequests, testimonials, getMinistryJoinRequestsForUser, addCommentToItem, togglePrayerOnRequest } = useContent();
  const { notifications, markAsRead, markAllAsRead, loadingNotifications } = useNotification();
  const { fontSize, setFontSize } = useFontSize();
  
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    return (location.state as { initialTab?: ProfileTab })?.initialTab || 'posts';
  });

  useEffect(() => {
    if (location.state && (location.state as { initialTab?: ProfileTab })?.initialTab) {
      setActiveTab((location.state as { initialTab: ProfileTab }).initialTab);
    }
  }, [location.state]);


  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [activeItemForComment, setActiveItemForComment] = useState<PrayerRequest | null>(null);
  
  // State for merged pages
  const [friendsActiveTab, setFriendsActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [notificationsCurrentPage, setNotificationsCurrentPage] = useState(1);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('all');


  // --- Logic from ProfilePage ---
  const userPosts = useMemo(() => {
    if (!currentUser) return [];
    
    const posts: (BlogPost | PrayerRequest | Testimonial)[] = [
        ...blogPosts.filter(p => p.postedByOwnerId === currentUser.id),
        ...prayerRequests.filter(p => p.postedByOwnerId === currentUser.id),
        ...testimonials.filter(p => p.userId === currentUser.id)
    ];

    return posts.sort((a,b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

  }, [currentUser, blogPosts, prayerRequests, testimonials]);

  const userRequests = useMemo(() => {
    if (!currentUser) return [];
    return getMinistryJoinRequestsForUser(currentUser.id);
  }, [currentUser, getMinistryJoinRequestsForUser]);

  // --- Logic from FriendsPage ---
  const allUsers = useMemo(() => getAllUsers(), [getAllUsers]);
  const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);

  const { friends, pendingRequests, sentRequests } = useMemo(() => {
    if (!currentUser) return { friends: [], pendingRequests: [], sentRequests: [] };

    const myFriends: User[] = [];
    const myPending: { friendship: typeof friendships[0], user: User }[] = [];
    const mySent: { friendship: typeof friendships[0], user: User }[] = [];

    friendships.forEach(friendship => {
        if (friendship.status === 'accepted') {
            const friendId = friendship.requesterId === currentUser.id ? friendship.addresseeId : friendship.requesterId;
            const friendUser = userMap.get(friendId);
            if (friendUser) myFriends.push(friendUser);
        } else if (friendship.status === 'pending') {
            if (friendship.addresseeId === currentUser.id) {
                const requesterUser = userMap.get(friendship.requesterId);
                if (requesterUser) myPending.push({ friendship, user: requesterUser });
            } else if (friendship.requesterId === currentUser.id) {
                const addresseeUser = userMap.get(friendship.addresseeId);
                if (addresseeUser) mySent.push({ friendship, user: addresseeUser });
            }
        }
    });

    return { friends: myFriends, pendingRequests: myPending, sentRequests: mySent };
  }, [currentUser, friendships, userMap]);

  // --- Logic from NotificationsPage ---
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    const filtered = notifications.filter(n => n.targetUserId === currentUser.id && (notificationFilter === 'all' || !n.read));
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, currentUser, notificationFilter]);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (notificationsCurrentPage - 1) * ITEMS_PER_PAGE_NOTIFICATIONS;
    return userNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE_NOTIFICATIONS);
  }, [userNotifications, notificationsCurrentPage]);
  const totalNotificationPages = Math.ceil(userNotifications.length / ITEMS_PER_PAGE_NOTIFICATIONS);


  const handleUpdateSuccess = () => {
    setEditFeedback({type: 'success', message: 'Profile updated successfully!'});
    setTimeout(() => setEditFeedback(null), 3000);
  };
  const handleUpdateFailure = (error: string) => {
    setEditFeedback({type: 'error', message: error});
     setTimeout(() => setEditFeedback(null), 5000);
  };

  const handleOpenCommentModal = (request: PrayerRequest) => {
    setActiveItemForComment(request);
    setIsCommentModalOpen(true);
  };

  const handleSubmitComment = async (commentText: string) => {
    if (!activeItemForComment) return;
    await addCommentToItem(activeItemForComment.id, 'prayerRequest', commentText);
    setIsCommentModalOpen(false);
    setActiveItemForComment(null);
  };


  if (loadingAuthState) {
    return <div className="container mx-auto px-4 py-12 text-center"><p className="text-xl text-slate-600 dark:text-slate-300">Loading profile...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  const profileNavItems: { key: ProfileTab; label: string; icon: React.FC<{className?: string}> }[] = [
    { key: 'posts', label: 'Posts', icon: PencilSquareIcon },
    { key: 'about', label: 'About', icon: UserCircleIcon },
    { key: 'friends', label: 'Friends', icon: UserGroupIcon },
    { key: 'notifications', label: 'Notifications', icon: BellIconOutline },
    { key: 'settings', label: 'Settings', icon: HeroCogIcon },
  ];
  
  const navLinkClasses = (isActive: boolean) => 
    `w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-colors duration-150 whitespace-nowrap ${
      isActive 
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-800/50 dark:text-purple-200' 
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;
    
  const mobileNavLinkClasses = (isActive: boolean) => 
     `px-3 py-2 rounded-md font-medium text-sm transition-colors duration-150 whitespace-nowrap ${
      isActive ? 'bg-purple-100 text-purple-700 dark:bg-purple-800/50 dark:text-purple-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  const renderDetailItem = (label: string, value?: string) => {
    if (!value) return null;
    return <div className="py-2"><dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{value}</dd></div>;
  };

  const renderPosts = () => (
    <div className="grid grid-cols-1 gap-6">
        {userPosts.length === 0 ? (
            <Card className="dark:bg-slate-800"><CardContent><p className="text-center py-8 text-slate-500 dark:text-slate-400">You haven't posted anything yet.</p></CardContent></Card>
        ) : (
            userPosts.map(item => {
                if ('requestText' in item) { // PrayerRequest
                    return <PrayerRequestCard key={item.id} request={item} onPrayedFor={togglePrayerOnRequest} onStatusUpdate={()=>{}} onComment={handleOpenCommentModal} />;
                } else if ('contentText' in item) { // Testimonial
                    return <TestimonialCard key={item.id} testimonial={item} />;
                } else { // It must be a BlogPost
                    return <BlogPostCard key={item.id} post={item as BlogPost} />;
                }
            })
        )}
    </div>
  );

  const renderAbout = () => (
    <Card className="dark:bg-slate-800">
        <CardHeader className="flex justify-between items-center dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-100">About {currentUser.fullName}</h3>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentUser.bio && <div className="py-3"><p className="text-center italic text-slate-600 dark:text-slate-300">{currentUser.bio}</p></div>}
            
            <dl className="py-3">
                {renderDetailItem("Work", currentUser.work)}
                {renderDetailItem("Education", currentUser.education)}
                {renderDetailItem("Hometown", currentUser.hometown)}
                {renderDetailItem("Current City", currentUser.currentCity)}
                {renderDetailItem("Relationship Status", currentUser.relationshipStatus)}
                {renderDetailItem("Interests", currentUser.interests)}
                {renderDetailItem("Favorite Scripture", currentUser.favoriteScripture)}
            </dl>
            
             <div className="py-3">
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Contact</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{currentUser.email}</dd>
                {currentUser.phone && <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{currentUser.phone}</dd>}
             </div>
        </CardContent>
        {userRequests.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
                <CardHeader><h3 className="text-xl font-semibold text-slate-700 dark:text-slate-100">My Ministry Engagements</h3></CardHeader>
                <CardContent>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {userRequests.map(req => (
                        <li key={req.id} className="py-3">
                            <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{req.ministryName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Requested: {formatDateADBS(req.requestDate)}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${req.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300' : req.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-700/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300'}`}>{req.status}</span>
                            </div>
                        </li>
                        ))}
                    </ul>
                </CardContent>
            </div>
        )}
    </Card>
  );
  
  const renderFriends = () => {
    const renderFriendTabContent = () => {
      switch(friendsActiveTab) {
        case 'friends':
          return friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map(friend => (
                <UserDisplayCard key={friend.id} user={friend}>
                  <Button size="sm" variant="secondary" onClick={() => {
                      const friendship = friendships.find(f => ((f.requesterId === currentUser.id && f.addresseeId === friend.id) || (f.addresseeId === currentUser.id && f.requesterId === friend.id)) && f.status === 'accepted');
                      if(friendship && window.confirm(`Are you sure you want to remove ${friend.fullName} as a friend?`)) removeFriend(friendship.id);
                  }} className="!bg-red-600 hover:!bg-red-700">
                      <UserMinusIcon className="w-4 h-4 mr-1"/> Remove
                  </Button>
                </UserDisplayCard>
              ))}
            </div>
          ) : <p className="text-center text-slate-500 dark:text-slate-400 py-6">You have no friends yet.</p>;
        case 'pending':
          return pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map(({ friendship, user }) => (
                <UserDisplayCard key={user.id} user={user}>
                  <Button size="sm" variant="primary" onClick={() => acceptFriendRequest(friendship.id)} className="!bg-green-500 hover:!bg-green-600"><CheckIcon className="w-4 h-4"/></Button>
                  <Button size="sm" variant="secondary" onClick={() => declineFriendRequest(friendship.id)} className="!bg-red-600 hover:!bg-red-700"><XMarkIcon className="w-4 h-4"/></Button>
                </UserDisplayCard>
              ))}
            </div>
          ) : <p className="text-center text-slate-500 dark:text-slate-400 py-6">No pending friend requests.</p>;
        case 'sent':
          return sentRequests.length > 0 ? (
            <div className="space-y-3">
              {sentRequests.map(({ friendship, user }) => (
                <UserDisplayCard key={user.id} user={user}>
                  <Button size="sm" variant="secondary" onClick={() => { if(window.confirm(`Are you sure you want to cancel the friend request to ${user.fullName}?`)) removeFriend(friendship.id); }} className="!bg-slate-500 hover:!bg-slate-600">
                      <PaperAirplaneIcon className="w-4 h-4 mr-1"/> Cancel
                  </Button>
                </UserDisplayCard>
              ))}
            </div>
          ) : <p className="text-center text-slate-500 dark:text-slate-400 py-6">No sent friend requests.</p>;
        default: return null;
      }
    };
    
    return (
      <Card className="dark:bg-slate-800">
        <CardHeader className="dark:border-slate-700">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-2 -mb-px">
              {[{k:'friends', l:'Friends', c:friends.length}, {k:'pending', l:'Pending', c:pendingRequests.length}, {k:'sent', l:'Sent', c:sentRequests.length}].map(tab => (
                 <button key={tab.k} onClick={() => setFriendsActiveTab(tab.k as any)} className={`px-3 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${friendsActiveTab === tab.k ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:border-slate-300 dark:text-slate-400 dark:hover:border-slate-500'}`}>
                   {tab.l}
                   {tab.c > 0 && <span className="bg-purple-100 text-purple-600 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-purple-800 dark:text-purple-200">{tab.c}</span>}
                 </button>
              ))}
            </nav>
          </div>
        </CardHeader>
        <CardContent>
          {renderFriendTabContent()}
        </CardContent>
      </Card>
    );
  };

  const renderNotifications = () => {
    return (
       <Card className="dark:bg-slate-800">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 sm:mb-0">My Notifications</h2>
            <div className="flex space-x-2">
                <Button variant={notificationFilter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setNotificationFilter('all')}>All</Button>
                <Button variant={notificationFilter === 'unread' ? 'primary' : 'outline'} size="sm" onClick={() => setNotificationFilter('unread')}>Unread</Button>
                {userNotifications.some(n => !n.read) && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs !text-purple-600 dark:!text-purple-300">Mark all as read</Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
             {userNotifications.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-lg">You have no {notificationFilter} notifications.</p>
            ) : (
              <ul className="space-y-3">
                {paginatedNotifications.map(notification => (
                  <li key={notification.id} 
                      className={`p-4 border rounded-lg shadow-sm transition-all duration-200 ease-in-out ${!notification.read ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-grow pr-3">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>{notification.message}</p>
                        <p className={`text-xs mt-1 ${!notification.read ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}`}>{formatTimestampADBS(notification.timestamp)}</p>
                      </div>
                      <div className="flex-shrink-0 space-x-2">
                        {notification.link && <Button variant="ghost" size="sm" onClick={() => navigate(notification.link!)} className="text-xs !text-purple-600 dark:!text-purple-300 hover:!bg-purple-100 dark:hover:!bg-purple-800/50">View</Button>}
                        {!notification.read && <Button variant="outline" size="sm" onClick={() => markAsRead(notification.id)} className="text-xs">Mark Read</Button>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
             {totalNotificationPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <Button onClick={() => setNotificationsCurrentPage(p => Math.max(1, p - 1))} disabled={notificationsCurrentPage === 1} variant="outline" size="sm">Previous</Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">Page {notificationsCurrentPage} of {totalNotificationPages}</span>
                <Button onClick={() => setNotificationsCurrentPage(p => Math.min(totalNotificationPages, p + 1))} disabled={notificationsCurrentPage === totalNotificationPages} variant="outline" size="sm">Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
    );
  };
  
  const renderSettings = () => {
    const fontSizeOptions: { value: FontSize; label: string; }[] = [
      { value: 'xs', label: 'XS' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' },
    ];
    
    return (
       <div className="space-y-8">
        <Card className="dark:bg-slate-800">
          <CardHeader className="dark:border-slate-700"><div className="flex items-center"><AdjustmentsHorizontalIcon className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400"/><h2 className="text-xl font-semibold">Appearance</h2></div></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-md font-medium text-slate-700 dark:text-slate-200 mb-2">Font Size</label>
              <div className="flex flex-wrap gap-3">
                {fontSizeOptions.map(option => (
                  <Button key={option.value} onClick={() => setFontSize(option.value)} variant={fontSize === option.value ? 'primary' : 'outline'} className={`text-sm px-4 py-2`} aria-pressed={fontSize === option.value}>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:bg-slate-800">
          <CardHeader className="dark:border-slate-700"><div className="flex items-center"><UserGroupIcon className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" /><h2 className="text-xl font-semibold">Privacy Settings</h2></div></CardHeader>
          <CardContent><PrivacySettings /></CardContent>
        </Card>

        <Card className="dark:bg-slate-800">
          <CardHeader className="dark:border-slate-700"><div className="flex items-center"><BellIconOutline className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400"/><h2 className="text-xl font-semibold">Notification Settings</h2></div></CardHeader>
          <CardContent><NotificationSettings /></CardContent>
        </Card>
        
        <Card className="dark:bg-slate-800">
          <CardHeader className="dark:border-slate-700"><div className="flex items-center"><LockClosedIcon className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400"/><h2 className="text-xl font-semibold">Change Password</h2></div></CardHeader>
          <CardContent><ChangePasswordForm /></CardContent>
        </Card>
      </div>
    );
  };
  
  const renderTabContent = () => {
      switch(activeTab) {
          case 'posts': return renderPosts();
          case 'about': return renderAbout();
          case 'friends': return renderFriends();
          case 'notifications': return renderNotifications();
          case 'settings': return renderSettings();
          default: return null;
      }
  }


  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-2 sm:px-4 pb-12">
        {/* NEW Profile Header */}
        <div className="max-w-5xl mx-auto">
          <header className="relative">
            <div className="h-48 sm:h-64 bg-slate-200 dark:bg-slate-700 rounded-lg shadow-md">
              {currentUser.coverPhotoUrl && (
                <img src={currentUser.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover rounded-lg"/>
              )}
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 sm:left-12 sm:translate-x-0 sm:translate-y-0 sm:bottom-[-40px] flex flex-col sm:flex-row items-center space-x-0 sm:space-x-5">
              <div className="relative">
                {currentUser.profileImageUrl ? (
                  <img src={currentUser.profileImageUrl} alt={currentUser.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"/>
                ) : (
                  <UserCircleIcon className="w-32 h-32 text-slate-400 bg-white dark:bg-slate-800 rounded-full"/>
                )}
              </div>
              <div className="mt-2 sm:mt-16 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">{currentUser.fullName}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">@{currentUser.username}</p>
              </div>
            </div>
             <div className="absolute top-4 right-4">
                 <Button variant="primary" size="sm" onClick={() => setIsEditModalOpen(true)} className="bg-white/80 dark:bg-slate-800/80 !text-slate-700 dark:!text-slate-200 hover:!bg-white dark:hover:!bg-slate-700 shadow-md">
                    <PencilIcon className="w-4 h-4 mr-2"/> Edit Profile
                </Button>
             </div>
          </header>
        </div>
        
        {editFeedback && (
            <div className={`max-w-5xl mx-auto p-3 mt-24 sm:mt-8 rounded-md text-sm ${editFeedback.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-200'}`} role="alert">
                {editFeedback.message}
            </div>
        )}

        {/* NEW Layout with sidebar nav */}
        <div className="max-w-5xl mx-auto mt-24 sm:mt-12 lg:flex lg:gap-8">
            {/* Left Sidebar Nav (Desktop) */}
            <aside className="hidden lg:block w-1/4 flex-shrink-0">
                <nav className="space-y-1 sticky top-24">
                  {profileNavItems.map(item => (
                    <button key={item.key} onClick={() => setActiveTab(item.key)} className={navLinkClasses(activeTab === item.key)}>
                      <item.icon className="w-5 h-5 mr-3"/>
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                     <button onClick={logout} className="w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                        Logout
                    </button>
                  </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="lg:w-3/4">
                {/* Top Tab Bar (Mobile/Tablet) */}
                <div className="lg:hidden mb-6">
                    <nav className="flex space-x-1 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                      {profileNavItems.map(item => (
                        <button key={item.key} onClick={() => setActiveTab(item.key)} className={mobileNavLinkClasses(activeTab === item.key)}>
                          <item.icon className="w-4 h-4 mr-2"/>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>
                </div>
                {renderTabContent()}
            </main>
        </div>
      </div>
      {isEditModalOpen && currentUser && (
          <ProfileEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            user={currentUser}
            onUpdateSuccess={handleUpdateSuccess}
            onUpdateFailure={handleUpdateFailure}
          />
      )}
      {isCommentModalOpen && activeItemForComment && (
        <CommentModal 
            isOpen={isCommentModalOpen} 
            onClose={() => setIsCommentModalOpen(false)} 
            eventTitle={`Comment on "${activeItemForComment.title}"`} 
            onSubmitComment={handleSubmitComment} 
        />
      )}
    </div>
  );
};

export default ProfilePage;