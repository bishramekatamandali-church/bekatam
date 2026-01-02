import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import { API_BASE_URL } from "../../utils/apiConfig";
import { SendIcon, CloseIcon, SparklesIcon, ClearIcon } from '../icons/GenericIcons';

interface ChatbotPanelProps {
  onClose: () => void;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'bot',
        text: "Hello! I'm the BEM AI Assistant. How can I help you find information about Bishram Ekata Mandali today?",
        timestamp: new Date().toISOString(),
      },
      {
        id: 'disclaimer-' + Date.now(),
        sender: 'bot',
        text: "I'm an AI assistant and can sometimes make mistakes. Please verify important information if needed.",
        timestamp: new Date().toISOString(),
      }
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: userInput,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    
    const botLoadingMessage: ChatMessage = {
      id: 'bot-loading-' + Date.now(),
      sender: 'bot',
      text: 'BEM AI is thinking...',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
    setMessages(prev => [...prev, botLoadingMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/query`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ queryText: newUserMessage.text }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get a response.');
      }
      
      const data = await response.json();
      
      const newBotMessage: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: data.text || "Sorry, I couldn't generate a response. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => prev.filter(msg => msg.id !== botLoadingMessage.id).concat(newBotMessage));

    } catch (error: any) {
      console.error("Error calling chatbot backend:", error);
      const errorBotMessage: ChatMessage = {
        id: 'bot-error-' + Date.now(),
        sender: 'bot',
        text: error.message || "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toISOString(),
        error: true,
      };
      setMessages(prev => prev.filter(msg => msg.id !== botLoadingMessage.id).concat(errorBotMessage));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'bot',
        text: "Hello! I'm the BEM AI Assistant. How can I help you find information about Bishram Ekata Mandali today?",
        timestamp: new Date().toISOString(),
      },
      {
        id: 'disclaimer-' + Date.now(),
        sender: 'bot',
        text: "I'm an AI assistant and can sometimes make mistakes. Please verify important information if needed.",
        timestamp: new Date().toISOString(),
      }
    ]);
  };


  return (
    <div className="fixed bottom-20 right-6 w-full max-w-[360px] h-[70vh] max-h-[550px] bg-white rounded-xl shadow-2xl flex flex-col border border-purple-200 dark:border-slate-700 z-[999] animate-slideInUpSm dark:bg-slate-800">
      <header className="bg-purple-600 text-white p-3 flex justify-between items-center rounded-t-xl">
        <div className="flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-semibold">BEM AI Assistant</h3>
        </div>
        <div>
          <button onClick={handleClearChat} className="p-1.5 hover:bg-purple-500 rounded-full mr-2" aria-label="Clear chat">
            <ClearIcon className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-purple-500 rounded-full" aria-label="Close chat">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-grow p-4 space-y-3 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'bot' && !msg.isLoading && <SparklesIcon className="w-6 h-6 text-purple-500 flex-shrink-0 mb-1" />}
            <div
              className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : `bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 rounded-bl-none ${msg.error ? 'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-200' : ''} ${msg.isLoading ? 'animate-pulse' : ''}`
              }`}
            >
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
        <div className="relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="w-full p-2 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full text-purple-600 hover:bg-purple-100 dark:hover:bg-slate-600 disabled:text-slate-400 disabled:hover:bg-transparent"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </footer>
       <style>{`
        .animate-slideInUpSm {
          animation: slideInUpSm 0.3s ease-out forwards;
        }
        @keyframes slideInUpSm {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotPanel;