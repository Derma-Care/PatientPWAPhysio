import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFCMToken, listenNotification } from '../firebase';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

// ── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = 'physiocare_notifications';
const STORE = 'notifications';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllFromDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => { db.close(); resolve(req.result || []); };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch { return []; }
}

async function putToDB(notification) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(notification);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch { /* silent */ }
}

async function deleteFromDB(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch { /* silent */ }
}

async function clearDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch { /* silent */ }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Core sync: always re-read IndexedDB as source of truth ────────────────
  const refreshFromDB = useCallback(async () => {

    const all = await getAllFromDB();
    const sorted = [...all].sort((a, b) => new Date(b.date) - new Date(a.date));
    setNotifications(sorted);
    setUnreadCount(sorted.filter(n => !n.read).length);
  }, []);

  // 1. Load on login
  useEffect(() => {
    if (!user) return;
    refreshFromDB();
  }, [user, refreshFromDB]);

  // 2. Re-sync when tab becomes visible again (user returns from background)
  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshFromDB();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, refreshFromDB]);

  // 3. Get FCM token and send to backend
  useEffect(() => {
    if (!user) return;
    const setup = async () => {
      const token = await getFCMToken();
      if (token) {
        try {
          await api.post('/api/customer/update-fcm-token', {
            customerId: user.customerId,
            token,
          });
          console.log('[FCM] Token synced to backend');
        } catch (e) {
          console.warn('[FCM] Backend token sync skipped:', e.message);
        }
      }
    };
    setup();
  }, [user]);

  // 4. Foreground FCM listener (app is OPEN and focused)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenNotification(async (payload) => {
      console.log('[FCM Foreground] Raw payload:', JSON.stringify(payload));

      const n = payload.notification || {};
      const d = payload.data || {};

      const title = n.title || d.title || d.subject || 'New Notification';
      const body = n.body || d.body || d.message || '';
      const notificationKey = `${title}_${body}`;
      const existing = await getAllFromDB();

      const isDuplicate = existing.some(
        n => n.title === title && n.body === body
      );

      if (isDuplicate) {
        console.log('Duplicate notification ignored');
        return;
      }

      const notif = {
        id: crypto.randomUUID(),
        title,
        body,
        date: new Date().toISOString(),
        read: false,
        data: d,
      };


      // Save to IndexedDB first, then refresh state from DB (single source of truth)
      await putToDB(notif);
      await refreshFromDB();
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, refreshFromDB]);

  // 5. BroadcastChannel — receives messages from service worker while app is open
  useEffect(() => {
    if (!user) return;
    let channel;
    try {
      channel = new BroadcastChannel('physiocare_notifications');
      channel.onmessage = async (event) => {
        if (event.data?.type === 'NEW_NOTIFICATION') {
          console.log('[BroadcastChannel] Received from SW:', event.data.notification);
          // SW already saved to IndexedDB; just refresh state
          await refreshFromDB();
        }
      };
    } catch (e) {
      console.warn('[BroadcastChannel] Not supported:', e.message);
    }
    return () => { try { channel?.close(); } catch { /**/ } };
  }, [user, refreshFromDB]);

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    const target = notifications.find(n => n.id === id);
    if (target) {
      await putToDB({ ...target, read: true });
      await refreshFromDB();
    }
  }, [notifications, refreshFromDB]);

  const markAllAsRead = useCallback(async () => {
    await Promise.all(notifications.map(n => putToDB({ ...n, read: true })));
    await refreshFromDB();
  }, [notifications, refreshFromDB]);

  const clearNotification = useCallback(async (id) => {
    await deleteFromDB(id);
    await refreshFromDB();
  }, [refreshFromDB]);

  const clearAllNotifications = useCallback(async () => {
    await clearDB();
    await refreshFromDB();
  }, [refreshFromDB]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
      refreshFromDB,          // exposed so pages can trigger manual refresh
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
