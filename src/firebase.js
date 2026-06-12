import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyApKucCeDspoqLR-hLZOFm7ZKMJBza281c',
  authDomain: 'ccms-45d7d.firebaseapp.com',
  projectId: 'ccms-45d7d',
  storageBucket: 'ccms-45d7d.appspot.com',
  messagingSenderId: '386304374153',
  appId: '1:386304374153:web:a38254c2401db7bafd9d58',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ── Get FCM Token ─────────────────────────────────────────────────────────────
export const getFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: 'BLzhc9fU0Jm5Xxqp1pLAzphwK2ff20MLyjZGVO_B93KNFcBoiK1Q0EsEvVKNBcS0-KD5xeWjLfGzhs6t7HH-nls',
    });

    if (token) {
      console.log('[FCM] Token acquired:', token.substring(0, 30) + '...');
      return token;
    }
    console.warn('[FCM] No token returned — permission may be blocked');
    return null;
  } catch (err) {
    console.error('[FCM] Token retrieval failed:', err);
    return null;
  }
};

// ── Foreground Message Listener ───────────────────────────────────────────────
// Called when the app is OPEN (tab is in focus).
// Firebase suppresses the OS popup in this case, so we handle it manually.
export const listenNotification = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload);

    // Extract title/body from notification block OR data block (backend may use either)
    const title = payload.notification?.title || payload.data?.title || 'New Notification';
    const body = payload.notification?.body || payload.data?.body || '';

    // Show OS-level notification for foreground (browser requires permission to be granted)
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
        });
      }
    } catch (e) {
      console.warn('[FCM] Could not show OS notification:', e.message);
    }

    // Pass full payload up to the context
    if (callback) callback(payload);
  });
};
