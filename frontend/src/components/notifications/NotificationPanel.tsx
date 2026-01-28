


import React, { useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useNotification } from '../../contexts/NotificationContext';
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
  const { notifications, markAsRead, markAllAsRead, loadingNotifications, activeUserId, isGuest } = useNotification();
  const navigate = useNavigate();

  const userNotifications = useMemo(() => {
    if (loadingNotifications) return [];
    return notifications
      .filter(n => n.targetUserId === activeUserId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Show up to 10 most recent
  }, [notifications, activeUserId, loadingNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      const [, hash] = notification.link.split('#');
      if (hash) {
        window.setTimeout(() => {
          const target = document.getElementById(hash);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }
    onClose();
  };

  const handleMarkAllReadClick = () => {
    markAllAsRead();
  };

  if (loadingNotifications) {
    return (
      <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-4">
        <p className="text-sm text-slate-500">Loading notifications...</p>
      </div>
    );
  }
  
  return (
    <div 
      className="fixed inset-x-4 top-20 z-50 max-h-[calc(100vh-6rem)] w-auto origin-top-right rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-96 sm:max-h-[70vh]"
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
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className={!notification.read ? 'text-purple-500' : 'text-slate-400'}>
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      notification.read
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {notification.read ? 'Read' : 'Unread'}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!isGuest && (
        <div className="px-4 py-2 border-t border-slate-200 text-center">
          <Link to="/profile" state={{ from: 'notifications' }} onClick={onClose} className="text-sm text-purple-600 hover:underline">
              View All
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
