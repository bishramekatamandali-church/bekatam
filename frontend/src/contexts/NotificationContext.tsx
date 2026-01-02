
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Notification, NotificationContextType, NotificationAddData, User } from '../types';
import { useAuth } from './AuthContext';

const NOTIFICATIONS_STORAGE_KEY_PREFIX = 'bem_notifications_';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, getAllUsers, friendships } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const getStorageKey = useCallback(() => {
    return `${NOTIFICATIONS_STORAGE_KEY_PREFIX}all_users`;
  }, []);
  
  useEffect(() => {
    setLoadingNotifications(true);
    try {
      const storedNotifications = localStorage.getItem(getStorageKey());
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        setNotifications([]); 
      }
    } catch (error) {
      console.error("Error loading notifications from localStorage", error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [getStorageKey]);

  useEffect(() => {
    if (!loadingNotifications) {
        localStorage.setItem(getStorageKey(), JSON.stringify(notifications));
    }
  }, [notifications, getStorageKey, loadingNotifications]);


  const addNotification = useCallback((notificationData: NotificationAddData) => {
    const allUsers = getAllUsers();
    let newNotifications: Notification[] = [];

    // --- Special Target Broadcasting ---
    const getTargetUsers = (target: string, fromUserId?: string): User[] => {
      if (target === 'all_users_for_content') {
        return allUsers.filter(user => user.receiveContentUpdateNotifications);
      }
      if (target === 'all_users_for_prayers') {
          return allUsers.filter(user => user.receivePrayerRequestNotifications);
      }
      if (target === 'all_users_for_testimonials') {
          return allUsers.filter(user => user.receiveTestimonialNotifications);
      }
      if (target.startsWith('friends_of_')) {
          const authorId = target.split('_')[2];
          const friendIds = new Set<string>();
          friendships.forEach(f => {
              if (f.status === 'accepted') {
                  if (f.requesterId === authorId) friendIds.add(f.addresseeId);
                  if (f.addresseeId === authorId) friendIds.add(f.requesterId);
              }
          });
          return allUsers.filter(user => friendIds.has(user.id) && user.receiveFriendActivityNotifications);
      }
      if (target === 'admin_group') {
        return allUsers.filter(u => u.role === 'admin' || u.role === 'owner');
      }
      // --- End Special Target ---

      // Handle single user target
      const singleUser = allUsers.find(u => u.id === target);
      return singleUser ? [singleUser] : [];
    };

    const targetUsers = getTargetUsers(notificationData.targetUserId, currentUser?.id);
    
    if (targetUsers.length > 0) {
        newNotifications = targetUsers.map(user => ({
            ...notificationData,
            id: generateId(`notif-${user.id}`),
            targetUserId: user.id, // Overwrite targetUserId with the specific user's ID
            timestamp: new Date().toISOString(),
            read: false,
        }));
    } else if (!notificationData.targetUserId.includes('_')) { // It was a single user ID that was not found.
        console.warn(`addNotification: targetUserId "${notificationData.targetUserId}" not found.`);
    }

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 250)); // Keep a reasonable amount of notifications
    }

  }, [getAllUsers, friendships, currentUser]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === notificationId && notif.targetUserId === currentUser?.id ? { ...notif, read: true } : notif
      )
    );
  }, [currentUser]);

  const markAllAsRead = useCallback(() => {
    if (!currentUser) return;
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.targetUserId === currentUser.id && !notif.read ? { ...notif, read: true } : notif
      )
    );
  }, [currentUser]);

  const unreadCount = useMemo(() => {
    if (!currentUser || loadingNotifications) return 0;
    return notifications.filter(notif => notif.targetUserId === currentUser.id && !notif.read).length;
  }, [notifications, currentUser, loadingNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      loadingNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
