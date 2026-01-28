import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Notification as AppNotification, NotificationContextType, NotificationAddData, User } from '../types';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

const NOTIFICATIONS_STORAGE_KEY_PREFIX = 'bem_notifications_';
const LAST_SEEN_CONTENT_KEY = 'bem_last_seen_content';
const AUTH_TOKEN_KEY = 'bem_auth_token';
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
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
  notification: AppNotification,
  storageKey: string,
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>,
) => {
  setNotifications(prev => {
    const safePrev = Array.isArray(prev) ? prev : [];
    const next = [notification, ...safePrev].slice(0, 250);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error('Error saving notifications', error);
    }
    return next;
  });
};

const readNotifications = (storageKey: string): AppNotification[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading notifications', error);
    return [];
  }
};

const writeNotifications = (storageKey: string, next: AppNotification[]) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch (error) {
    console.error('Error saving notifications', error);
  }
};

const sendBrowserNotification = async (notification: AppNotification) => {
  if (!('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration?.showNotification) {
      registration.showNotification('BEM Update', {
        body: notification.message,
        tag: notification.id,
        data: { link: notification.link },
      });
    } else {
      new window.Notification('BEM Update', { body: notification.message });
    }
  } catch (error) {
    console.error('Unable to show browser notification', error);
  }
};

const removeNotifications = (
  storageKey: string,
  predicate: (notification: AppNotification) => boolean,
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>,
) => {
  setNotifications(prev => {
    const safePrev = Array.isArray(prev) ? prev : [];
    const next = safePrev.filter(predicate);
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [lastSeenContent, setLastSeenContent] = useState<string | null>(readLastSeenContent());
  const [serverNotificationIds, setServerNotificationIds] = useState<Set<string>>(new Set());

  const activeUserId = currentUser?.id ?? getGuestId();
  const isGuest = !currentUser;
  const storageKey = useMemo(() => getStorageKey(activeUserId, isGuest), [activeUserId, isGuest]);

  useEffect(() => {
    setLoadingNotifications(true);
    try {
      const storedNotifications = localStorage.getItem(storageKey);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(Array.isArray(parsed) ? parsed : []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [storageKey, serverNotificationIds]);

  useEffect(() => {
    if (!currentUser) return;

    let isActive = true;
    const fetchServerNotifications = async () => {
      if (!isActive) return;
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { ...getAuthHeaders() },
        });
        if (!res.ok) return;
        const serverNotifications: AppNotification[] = await res.json();
        if (!Array.isArray(serverNotifications)) return;

        setServerNotificationIds(new Set(serverNotifications.map((notification) => notification.id)));

        const localNotifications = readNotifications(storageKey);
        const merged = new Map<string, AppNotification>();
        localNotifications.forEach((notification) => merged.set(notification.id, notification));
        serverNotifications.forEach((notification) => merged.set(notification.id, notification));

        const next = Array.from(merged.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 250);

        writeNotifications(storageKey, next);
        setNotifications(next);
      } catch (error) {
        console.error('Error loading notifications from API', error);
      }
    };

    fetchServerNotifications();
    const intervalId = window.setInterval(fetchServerNotifications, 60000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [currentUser, storageKey]);

  const addNotification = useCallback((notificationData: NotificationAddData) => {
    // 🔥 CRITICAL HARDENING: getAllUsers() must be treated as array
    const rawUsers = getAllUsers() as unknown;
    const allUsers: User[] = Array.isArray(rawUsers) ? (rawUsers as User[]) : [];

    let newNotifications: AppNotification[] = [];

    const getTargetUsers = (target: string): User[] => {
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

      const singleUser = allUsers.find(u => u.id === target);
      return singleUser ? [singleUser] : [];
    };

    const targetUsers = getTargetUsers(notificationData.targetUserId);

    if (targetUsers.length > 0) {
      newNotifications = targetUsers.map(user => ({
        ...notificationData,
        id: generateId(`notif-${user.id}`),
        targetUserId: user.id,
        timestamp: new Date().toISOString(),
        read: false,
      }));
    } else if (!notificationData.targetUserId.includes('_')) {
      console.warn(`addNotification: targetUserId "${notificationData.targetUserId}" not found.`);
    }

    if (newNotifications.length > 0) {
      const notificationsByUser = newNotifications.reduce((acc, notification) => {
        const list = acc.get(notification.targetUserId) ?? [];
        list.push(notification);
        acc.set(notification.targetUserId, list);
        return acc;
      }, new Map<string, AppNotification[]>());

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
  }, [getAllUsers, activeUserId]);

  const addGuestNotification = useCallback((notificationData: NotificationAddData) => {
    if (notificationData.targetUserId !== activeUserId) return;

    const notification: AppNotification = {
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
      const safePrev = Array.isArray(prevNotifications) ? prevNotifications : [];
      const next = safePrev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );
      writeNotifications(storageKey, next);
      return next;
    });

    if (serverNotificationIds.has(notificationId)) {
      fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      }).catch((error) => {
        console.error('Failed to mark notification as read', error);
      });
    }
  }, [storageKey, currentUser]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => {
      const safePrev = Array.isArray(prevNotifications) ? prevNotifications : [];
      const next = safePrev.map(notif =>
        !notif.read ? { ...notif, read: true } : notif
      );
      writeNotifications(storageKey, next);
      return next;
    });

    if (currentUser) {
      fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      }).catch((error) => {
        console.error('Failed to mark all notifications as read', error);
      });
    }
  }, [storageKey]);

  const unreadCount = useMemo(() => {
    if (loadingNotifications) return 0;
    const safe = Array.isArray(notifications) ? notifications : [];
    return safe.filter(notif => notif.targetUserId === activeUserId && !notif.read).length;
  }, [notifications, activeUserId, loadingNotifications]);

  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    const updateBadge = async () => {
      try {
        if (isGuest) {
          if ('clearAppBadge' in navigator) {
            await navigator.clearAppBadge();
          }
          return;
        }
        if (unreadCount > 0) {
          await navigator.setAppBadge(unreadCount);
        } else if ('clearAppBadge' in navigator) {
          await navigator.clearAppBadge();
        }
      } catch (error) {
        console.error('Failed to update app badge', error);
      }
    };

    updateBadge();
  }, [unreadCount, isGuest]);

  const replaceNotificationsForUser = useCallback((userId: string, next: AppNotification[]) => {
    const key = getStorageKey(userId, userId.startsWith('guest-'));
    writeNotifications(key, next);
    if (userId === activeUserId) {
      setNotifications(Array.isArray(next) ? next : []);
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
      notifications: Array.isArray(notifications) ? notifications : [],
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
