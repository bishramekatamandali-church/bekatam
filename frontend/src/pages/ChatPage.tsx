


import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { User, ChatMessage } from '../types';
import Button from '../components/ui/Button';
import { ArrowLeftIcon, PhoneIcon, VideoCameraIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import ChatMessageBubble from '../components/chat/ChatMessageBubble';
import CallModal from '../components/calls/CallModal';

const ChatPage: React.FC = () => {
  const { userId: friendId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser, getAllUsers, getFriendshipStatus } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<User | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = useMemo(() => `chat_history_${currentUser?.id}_${friendId}`, [currentUser, friendId]);

  const friendshipStatus = useMemo(() => {
    if (!currentUser || !friendId) return 'not_friends';
    return getFriendshipStatus(friendId).status;
  }, [currentUser, friendId, getFriendshipStatus]);

  useEffect(() => {
    const foundFriend = getAllUsers().find(u => u.id === friendId);
    if (!foundFriend) {
      navigate('/community', { replace: true });
      return;
    }
    setFriend(foundFriend);

    // Authorization Check
    if (friendshipStatus !== 'friends') {
        alert("You can only chat with your friends.");
        navigate('/community', { replace: true });
        return;
    }

    const storedHistory = localStorage.getItem(storageKey);
    if (storedHistory) {
      setMessages(JSON.parse(storedHistory));
    } else {
      setMessages([{
        id: `initial-${Date.now()}`,
        sender: 'bot',
        text: `This is the beginning of your conversation with ${foundFriend.fullName}.`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [friendId, getAllUsers, navigate, friendshipStatus, storageKey]);


  // Save chat history to local storage
  useEffect(() => {
    if (messages.length > 0 && friendshipStatus === 'friends') {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey, friendshipStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCallModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: currentUser.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate friend's reply
    setTimeout(() => {
        const replyTextOptions = [
            `Echo: ${newMessage}`,
            "That's interesting!",
            "I see what you mean.",
            "Tell me more.",
            "Okay, got it.",
            "Haha, classic!",
        ];
        const randomReply = replyTextOptions[Math.floor(Math.random() * replyTextOptions.length)];

        const friendReply: ChatMessage = {
            id: `msg-reply-${Date.now()}`,
            sender: friendId!,
            text: randomReply,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, friendReply]);
    }, 1500 + Math.random() * 1000); // Add some delay for realism
  };
  
  if (!friend || friendshipStatus !== 'friends') {
    return <div className="flex items-center justify-center h-full">Loading chat or redirecting...</div>;
  }

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-5rem)] rounded-lg shadow-lg">
      {/* Header */}
      <header className="flex items-center p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2 !p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <img src={friend.profileImageUrl || undefined} alt={friend.fullName} className="w-10 h-10 rounded-full object-cover"/>
        <div className="flex-grow ml-3">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">{friend.fullName}</h2>
          <p className="text-xs text-green-500">Online</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => startCall('audio')} className="!p-2"><PhoneIcon className="w-5 h-5"/></Button>
          <Button variant="ghost" size="sm" onClick={() => startCall('video')} className="!p-2"><VideoCameraIcon className="w-5 h-5"/></Button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <ChatMessageBubble 
            key={msg.id} 
            message={msg} 
            isSender={msg.sender === currentUser?.id} 
            friend={friend} 
            currentUser={currentUser}
          />
        ))}
         <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-lg flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="w-full p-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-slate-200"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 !p-2.5 !rounded-full"
            >
            <PaperAirplaneIcon className="w-5 h-5"/>
          </Button>
        </div>
      </footer>
    </div>
    {isCallModalOpen && friend && (
        <CallModal 
            isOpen={isCallModalOpen}
            onClose={() => setIsCallModalOpen(false)}
            targetUser={friend}
            callType={callType}
        />
     )}
    </>
  );
};

export default ChatPage;