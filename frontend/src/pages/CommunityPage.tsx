


import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { User, Group } from '../types';
import { MagnifyingGlassIcon, EllipsisVerticalIcon, UsersIcon, MegaphoneIcon, Cog6ToothIcon, UserPlusIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import ContactListItem from '../components/community/ContactListItem';
import GroupListItem from '../components/community/GroupListItem';
import CreateGroupModal from '../components/community/CreateGroupModal';

const CommunityPage: React.FC = () => {
  const { getAllUsers, currentUser, friendships } = useAuth();
  const { groups } = useContent();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { friends, myGroups } = useMemo(() => {
    if (!currentUser) return { friends: [], myGroups: [] };
    const allUsersMap = new Map(getAllUsers().map(u => [u.id, u]));

    const myFriends: User[] = [];
    friendships.forEach(f => {
      if (f.status === 'accepted') {
        const friendId = f.requesterId === currentUser.id ? f.addresseeId : f.requesterId;
        const friendUser = allUsersMap.get(friendId);
        if (friendUser) myFriends.push(friendUser);
      }
    });
    
    const userGroups = groups.filter(g => g.members.some(m => m.userId === currentUser.id));

    return { friends: myFriends, myGroups: userGroups };
  }, [getAllUsers, currentUser, friendships, groups]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'chats') {
      return friends.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return myGroups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }, [friends, myGroups, searchTerm, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    navigate('/profile', { state: { initialTab: 'settings' } });
  };
  
  const handleNewGroupClick = () => {
    setIsMenuOpen(false);
    setIsCreateGroupModalOpen(true);
  };

  const menuItems = [
    { label: 'New group', icon: UserPlusIcon, action: handleNewGroupClick },
    { label: 'Broadcast', icon: MegaphoneIcon, action: () => alert('Feature coming soon: Broadcast') },
    { label: 'Settings', icon: Cog6ToothIcon, action: handleSettingsClick },
  ];

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Community</h1>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              <EllipsisVerticalIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="py-1">
                  {menuItems.map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center"
                    >
                      <item.icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 relative">
          <input
            type="search"
            placeholder={activeTab === 'chats' ? "Search friends..." : "Search groups..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 text-sm"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </header>
      
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-2 px-4">
          <button onClick={() => setActiveTab('chats')} className={`px-3 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'chats' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:border-slate-300 dark:text-slate-400 dark:hover:border-slate-600'}`}>
            <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" /> Chats
          </button>
          <button onClick={() => setActiveTab('groups')} className={`px-3 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${activeTab === 'groups' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:border-slate-300 dark:text-slate-400 dark:hover:border-slate-600'}`}>
            <UsersIcon className="w-4 h-4" /> Groups
          </button>
        </nav>
      </div>

      {/* List */}
      <main className="flex-grow overflow-y-auto">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeTab === 'chats' && (
                filteredItems.length > 0 ? (
                    (filteredItems as User[]).map(user => (
                        <ContactListItem key={user.id} user={user} />
                    ))
                ) : (
                    <div className="text-center py-10"><p className="text-slate-500 dark:text-slate-400">{searchTerm ? `No friends found matching "${searchTerm}".` : "You have no friends yet. Send some friend requests!"}</p></div>
                )
            )}
             {activeTab === 'groups' && (
                filteredItems.length > 0 ? (
                    (filteredItems as Group[]).map(group => (
                        <GroupListItem key={group.id} group={group} />
                    ))
                ) : (
                    <div className="text-center py-10"><p className="text-slate-500 dark:text-slate-400">{searchTerm ? `No groups found matching "${searchTerm}".` : "You are not a member of any groups."}</p></div>
                )
            )}
        </div>
      </main>
    </div>
    {isCreateGroupModalOpen && <CreateGroupModal isOpen={isCreateGroupModalOpen} onClose={() => setIsCreateGroupModalOpen(false)} />}
    </>
  );
};

export default CommunityPage;