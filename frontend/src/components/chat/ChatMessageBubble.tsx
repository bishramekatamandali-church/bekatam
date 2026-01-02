

import React from 'react';
import { ChatMessage, User } from '../../types';
import { formatTimestampADBS } from '../../dateConverter';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isSender: boolean;
  friend: User | null;
  currentUser: User | null;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, isSender, friend, currentUser }) => {
  if (message.sender === 'bot') {
    return (
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 my-2">
        {message.text}
      </div>
    );
  }
  
  const profileImageUrl = isSender ? currentUser?.profileImageUrl : friend?.profileImageUrl;

  return (
    <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {!isSender && (
         <img src={profileImageUrl || undefined} alt={friend?.fullName} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
      )}
      <div
        className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isSender
            ? 'bg-purple-600 text-white rounded-br-none'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-bl-none'
        }`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessageBubble;