import React from 'react';
import ChatBotHeadIcon from '../icons/ChatBotHeadIcon';
import { CloseIcon } from '../icons/GenericIcons'; // Assuming you might create a generic icons file

interface ChatbotFabProps {
  onToggle: () => void;
  isOpen: boolean;
}

const ChatbotFab: React.FC<ChatbotFabProps> = ({ onToggle, isOpen }) => {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-transform duration-200 ease-in-out hover:scale-110 z-[1000]"
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      aria-expanded={isOpen}
    >
      {isOpen ? <CloseIcon className="w-6 h-6" /> : <ChatBotHeadIcon className="w-6 h-6" />}
    </button>
  );
};

export default ChatbotFab;
