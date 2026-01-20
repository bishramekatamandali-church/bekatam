
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Notification, NotificationContextType, NotificationAddData, User } from '../types';
import { useAuth } from './AuthContext';

const NOTIFICATIONS_STORAGE_KEY_PREFIX = 'bem_notifications_';
const LAST_SEEN_CONTENT_KEY = 'bem_last_seen_content';
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const getGuestId = (): string => {
  const existing = localStorage.getItem('bem_guest_id');
  if (existing) return existing;
  const guestId = `guest-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
  localStorage.setItem('bem_guest_id', guestId);
  return guestId;
};
const getStorageKey = (userId: string, isGuest: boolean) =>
  `${NOTIFICATIONS_STORAGE_KEY_PREFIX}${isGuest ? 'guest' : userId}`;
const readLastSeenContent = (): string | null => {
  try {
    return localStorage.getItem(LAST_SEEN_CONTENT_KEY);
  } catch (error) {
    console.error('Error reading last seen content timestamp', error);
    return null;
  }
};
const writeLastSeenContent = (timestamp: string) => {
  try {
    localStorage.setItem(LAST_SEEN_CONTENT_KEY, timestamp);
  } catch (error) {
    console.error('Error saving last seen content timestamp', error);
  }
};
const pushNotification = (
  notification: Notification,
  storageKey: string,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) => {
  setNotifications(prev => {
    const next = [notification, ...prev].slice(0, 250);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving notifications', error);
    }
    return next;
  });
};
const readNotifications = (storageKey: string): Notification[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading notifications', error);
    return [];
  }
};
const writeNotifications = (storageKey: string, next: Notification[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch (error) {
    console.error('Error saving notifications', error);
  }
};
const sendBrowserNotification = async (notification: Notification) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.showNotification) {
      registration.showNotification('BEM Update', {
        body: notification.message,
        tag: notification.id,
        data: { link: notification.link },
      });
    } else {
      new Notification('BEM Update', { body: notification.message });
    }
  } catch (error) {
    console.error('Unable to show browser notification', error);
  }
};
const removeNotifications = (
  storageKey: string,
  predicate: (notification: Notification) => boolean,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
) => {
  setNotifications(prev => {
    const next = prev.filter(predicate);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving notifications', error);
    }
    return next;
  });
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, getAllUsers } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [lastSeenContent, setLastSeenContent] = useState<string | null>(readLastSeenContent());

  const activeUserId = currentUser?.id ?? getGuestId();
  const isGuest = !currentUser;
  const storageKey = useMemo(
    () => getStorageKey(activeUserId, isGuest),
    [activeUserId, isGuest],
  );

  useEffect(() => {
    setLoadingNotifications(true);
    try {
      const storedNotifications = localStorage.getItem(storageKey);
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
  }, [storageKey]);

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
      if (target === 'admin_group') {
        return allUsers.filter(u => u.role === 'admin');
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
      const notificationsByUser = newNotifications.reduce((acc, notification) => {
        const list = acc.get(notification.targetUserId) ?? [];
        list.push(notification);
        acc.set(notification.targetUserId, list);
        return acc;
      }, new Map<string, Notification[]>());
      notificationsByUser.forEach((userNotifications, userId) => {
        const key = getStorageKey(userId, userId.startsWith('guest-'));
        const existing = readNotifications(key);
        const next = [...userNotifications, ...existing].slice(0, 250);
        writeNotifications(key, next);
        if (userId === activeUserId) {
          setNotifications(next);
          userNotifications.forEach(sendBrowserNotification);
        }
      });
    }

  }, [getAllUsers, currentUser, activeUserId]);

  const addGuestNotification = useCallback((notificationData: NotificationAddData) => {
    if (notificationData.targetUserId !== activeUserId) {
      return;
    }
    const notification: Notification = {
      ...notificationData,
      id: generateId(`notif-${activeUserId}`),
      targetUserId: activeUserId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    pushNotification(notification, storageKey, setNotifications);
    sendBrowserNotification(notification);
  }, [activeUserId, storageKey]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prevNotifications => {
      const next = prevNotifications.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      writeNotifications(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => {
      const next = prevNotifications.map(notif =>
        !notif.read ? { ...notif, read: true } : notif
      );
      writeNotifications(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const unreadCount = useMemo(() => {
    if (loadingNotifications) return 0;
    return notifications.filter(notif => notif.targetUserId === activeUserId && !notif.read).length;
  }, [notifications, activeUserId, loadingNotifications]);

  const replaceNotificationsForUser = useCallback((userId: string, next: Notification[]) => {
    const key = getStorageKey(userId, userId.startsWith('guest-'));
    writeNotifications(key, next);
    if (userId === activeUserId) {
      setNotifications(next);
    }
  }, [activeUserId]);

  const updateLastSeenContent = useCallback((timestamp: string) => {
    writeLastSeenContent(timestamp);
    setLastSeenContent(timestamp);
  }, []);

  const pruneSeenNotifications = useCallback((sinceTimestamp?: string | null) => {
    const lastSeen = sinceTimestamp ?? readLastSeenContent();
    if (!lastSeen) return;
    removeNotifications(
      storageKey,
      notification => {
        if (notification.type !== 'new_content_published') return true;
        return new Date(notification.timestamp).getTime() > new Date(lastSeen).getTime();
      },
      setNotifications,
    );
  }, [storageKey]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      activeUserId,
      isGuest,
      lastSeenContent,
      addNotification,
      addGuestNotification,
      replaceNotificationsForUser,
      updateLastSeenContent,
      pruneSeenNotifications,
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
