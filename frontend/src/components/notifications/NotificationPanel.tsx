


import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Notification } from '../../types';
import Button from '../ui/Button';
import { formatTimestampADBS } from '../../dateConverter';

// Simple relative time formatter
const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatTimestampADBS(timestamp).split('📆')[0].trim(); // Show AD date part if older than a week
};

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead, loadingNotifications } = useNotification();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const userNotifications = useMemo(() => {
    if (!currentUser || loadingNotifications) return [];
    return notifications
      .filter(n => n.targetUserId === currentUser.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Show up to 10 most recent
  }, [notifications, currentUser, loadingNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    onClose();
  };

  const handleMarkAllReadClick = () => {
    markAllAsRead();
  };

  if (loadingNotifications && !currentUser) {
    return (
      <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4">
        <p className="text-sm text-slate-500">Loading notifications...</p>
      </div>
    );
  }
  
  return (
    <div 
      className="absolute right-0 z-20 mt-3 w-80 sm:w-96 origin-top-right rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[70vh] flex flex-col"
      role="menu" 
      aria-orientation="vertical" 
      aria-labelledby="notifications-button"
    >
      <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-md font-semibold text-slate-700">Notifications</h3>
        {userNotifications.some(n => !n.read) && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllReadClick} className="text-xs !text-purple-600 hover:!bg-purple-50">
                Mark all as read
            </Button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">No new notifications.</p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-y-auto flex-grow">
          {userNotifications.map(notification => (
            <li key={notification.id}>
              <button
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${!notification.read ? 'bg-purple-50' : 'bg-white'}`}
                role="menuitem"
              >
                <p className={`text-sm ${!notification.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                  {notification.message}
                </p>
                <p className={`text-xs mt-0.5 ${!notification.read ? 'text-purple-500' : 'text-slate-400'}`}>
                  {formatTimeAgo(notification.timestamp)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="px-4 py-2 border-t border-slate-200 text-center">
        <Link to="/profile" state={{ from: 'notifications' }} onClick={onClose} className="text-sm text-purple-600 hover:underline">
            View All
        </Link>
      </div>
    </div>
  );
};

export default NotificationPanel;