import React, { useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { User, EventItem } from '../../types';
import { formatDateADBS } from '../../dateConverter';
import { 
  CheckIcon, 
  XMarkIcon, 
  ChatBubbleOvalLeftEllipsisIconSolid,
  UserPlusIcon,
  UsersIconOutline,
  UserGroupIcon,
  MegaphoneIconOutline,
  PencilSquareIcon,
  HeroMagnifyingGlassIcon,
  Cog6ToothIcon,
  CalendarDaysIconOutline
} from '../icons/GenericIcons';

const RightSidebar: React.FC = () => {
  const { 
    isAuthenticated, 
    currentUser, 
    friendships, 
    getAllUsers,
    acceptFriendRequest,
    declineFriendRequest
  } = useAuth();
  const { prayerRequests, groups, events } = useContent();
  const navigate = useNavigate();

  const allUsersMap = useMemo(() => new Map(getAllUsers().map(u => [u.id, u])), [getAllUsers]);

  const { pendingRequests, friends } = useMemo(() => {
    if (!currentUser) return { pendingRequests: [], friends: [] };

    const pending: { friendshipId: string; user: User }[] = [];
    const accepted: User[] = [];

    friendships.forEach(f => {
      if (f.addresseeId === currentUser.id && f.status === 'pending') {
        const requester = allUsersMap.get(f.requesterId);
        if (requester) {
          pending.push({ friendshipId: f.id, user: requester });
        }
      } else if (f.status === 'accepted') {
        const friendId = f.requesterId === currentUser.id ? f.addresseeId : f.requesterId;
        const friendUser = allUsersMap.get(friendId);
        if (friendUser) {
          accepted.push(friendUser);
        }
      }
    });

    return { pendingRequests: pending, friends: accepted.sort((a,b) => a.fullName.localeCompare(b.fullName)) };
  }, [currentUser, friendships, allUsersMap]);

  const myGroups = useMemo(() => {
    if (!currentUser) return [];
    return groups.filter(g => g.members.some(m => m.userId === currentUser.id));
  }, [currentUser, groups]);
  
  const recentPublicPrayers = useMemo(() => {
    return prayerRequests
      .filter(p => p.visibility === 'public' || p.visibility === 'anonymous')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
  }, [prayerRequests]);
  
  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => event.date && new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      .slice(0, 3);
  }, [events]);


  if (!isAuthenticated || !currentUser) {
    return (
      <aside className="hidden lg:block w-[320px] flex-shrink-0 text-slate-700 p-4 border-l border-slate-200 h-screen sticky top-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <div className="space-y-6">
          <section>
            <h3 className="text-md font-semibold text-slate-800 mb-2 border-b pb-1.5 border-slate-300">
              Community Hub
            </h3>
            <Card>
              <CardContent>
                <p className="text-sm text-center text-slate-500 py-8">
                  Login to see your community activity, friends, and groups.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block w-[320px] flex-shrink-0 text-slate-700 p-4 border-l border-slate-200 h-screen sticky top-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
      <div className="space-y-6">
        
        <Card>
          <CardHeader className="!p-3 border-b">
            <h3 className="font-semibold text-slate-700 text-sm">Quick Actions</h3>
          </CardHeader>
          <CardContent className="!p-2 grid grid-cols-2 gap-2">
            <Button onClick={() => navigate('/community')} variant="ghost" size="sm" className="flex-col !h-16 text-xs"><HeroMagnifyingGlassIcon className="w-5 h-5 mb-1"/> Find Friends</Button>
            <Button onClick={() => navigate('/profile', { state: { initialTab: 'posts' } })} variant="ghost" size="sm" className="flex-col !h-16 text-xs"><PencilSquareIcon className="w-5 h-5 mb-1"/> Create Post</Button>
            <Button onClick={() => navigate('/profile')} variant="ghost" size="sm" className="flex-col !h-16 text-xs">
                <img src={currentUser.profileImageUrl || ''} className="w-5 h-5 rounded-full mb-1 object-cover"/> My Profile
            </Button>
            <Button onClick={() => navigate('/profile', { state: { initialTab: 'settings' } })} variant="ghost" size="sm" className="flex-col !h-16 text-xs"><Cog6ToothIcon className="w-5 h-5 mb-1"/> Settings</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="!p-3 border-b flex items-center space-x-2">
            <UserPlusIcon className="w-4 h-4 text-slate-500"/>
            <h3 className="font-semibold text-slate-700 text-sm">Friend Requests</h3>
          </CardHeader>
          <CardContent className="!p-2 space-y-2">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(({ friendshipId, user }) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100">
                  <Link to={`/profile/${user.id}`} className="flex items-center space-x-2">
                    <img src={user.profileImageUrl || ''} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-medium">{user.fullName}</span>
                  </Link>
                  <div className="flex space-x-1">
                    <Button onClick={() => acceptFriendRequest(friendshipId)} size="xs" variant="primary" className="!p-1.5 !bg-green-500 hover:!bg-green-600">
                        <CheckIcon className="w-4 h-4" />
                    </Button>
                     <Button onClick={() => declineFriendRequest(friendshipId)} size="xs" variant="secondary" className="!p-1.5 !bg-red-500 hover:!bg-red-600">
                        <XMarkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">No pending requests.</p>
            )}
            <div className="pt-1 text-center">
                <Button asLink to="/profile" state={{ initialTab: 'friends' }} variant="ghost" size="sm" className="text-xs w-full">View All</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="!p-3 border-b flex items-center space-x-2">
            <UsersIconOutline className="w-4 h-4 text-slate-500"/>
            <h3 className="font-semibold text-slate-700 text-sm">My Friends</h3>
          </CardHeader>
          <CardContent className="!p-2 space-y-1 max-h-60 overflow-y-auto">
             {friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100">
                  <Link to={`/profile/${friend.id}`} className="flex items-center space-x-2">
                    <img src={friend.profileImageUrl || ''} alt={friend.fullName} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-medium">{friend.fullName}</span>
                  </Link>
                  <Button onClick={() => navigate(`/chat/${friend.id}`)} size="xs" variant="ghost" className="!p-1.5">
                    <ChatBubbleOvalLeftEllipsisIconSolid className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">You have no friends yet.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="!p-3 border-b flex items-center space-x-2">
            <UserGroupIcon className="w-4 h-4 text-slate-500"/>
            <h3 className="font-semibold text-slate-700 text-sm">My Groups</h3>
          </CardHeader>
           <CardContent className="!p-2 space-y-1 max-h-60 overflow-y-auto">
             {myGroups.length > 0 ? (
              myGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100">
                  <Link to={`#`} onClick={(e) => { e.preventDefault(); alert("Group chat page coming soon!"); }} className="flex items-center space-x-2">
                    <img src={group.groupImageUrl || ''} alt={group.name} className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-xs font-medium">{group.name}</span>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">You are not in any groups.</p>
            )}
           </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="!p-3 border-b flex items-center space-x-2">
            <CalendarDaysIconOutline className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-700 text-sm">Upcoming Events</h3>
          </CardHeader>
          <CardContent className="!p-2 space-y-2">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <Link to={`/events/${event.id}`} key={event.id} className="block p-2 rounded-md hover:bg-slate-100">
                  <p className="text-xs font-semibold truncate" title={event.title}>{event.title}</p>
                  <p className="text-xs text-slate-500 truncate">{formatDateADBS(event.date)}</p>
                </Link>
              ))
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">No upcoming events.</p>
            )}
            <div className="pt-1 text-center">
              <Button asLink to="/events" variant="ghost" size="sm" className="text-xs w-full">View All Events</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="!p-3 border-b flex items-center space-x-2">
                <MegaphoneIconOutline className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-700 text-sm">Community Activity</h3>
            </CardHeader>
            <CardContent className="!p-2 space-y-2">
                {recentPublicPrayers.length > 0 ? (
                    recentPublicPrayers.map(prayer => (
                        <Link to={`/updates#prayer-${prayer.id}`} key={prayer.id} className="block p-2 rounded-md hover:bg-slate-100">
                            <p className="text-xs font-semibold truncate" title={prayer.title}>{prayer.title}</p>
                            <p className="text-xs text-slate-500 truncate">{prayer.userName || 'Anonymous'} - {formatDateADBS(prayer.submittedAt)}</p>
                        </Link>
                    ))
                ) : (
                    <p className="text-xs text-slate-500 p-2 text-center">No recent public prayers.</p>
                )}
                 <div className="pt-1 text-center">
                    <Button asLink to="/updates" variant="ghost" size="sm" className="text-xs w-full">View Prayer Wall</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </aside>
  );
};

export default RightSidebar;