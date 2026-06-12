// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: 'AIzaSyApKucCeDspoqLR-hLZOFm7ZKMJBza281c',
  authDomain: 'ccms-45d7d.firebaseapp.com',
  projectId: 'ccms-45d7d',
  storageBucket: 'ccms-45d7d.appspot.com',
  messagingSenderId: '386304374153',
  appId: '1:386304374153:web:a38254c2401db7bafd9d58',
};

// eslint-disable-next-line no-undef
firebase.initializeApp(firebaseConfig);
// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-restricted-globals
    const req = self.indexedDB.open('physiocare_notifications', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

function saveNotificationToDB(notification) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notifications', 'readwrite');
      tx.objectStore('notifications').put(notification);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror    = (e) => reject(e.target.error);
    });
  });
}

function broadcastToApp(notification) {
  try {
    // eslint-disable-next-line no-undef
    const channel = new BroadcastChannel('physiocare_notifications');
    channel.postMessage({ type: 'NEW_NOTIFICATION', notification });
    channel.close();
  } catch (e) {
    console.warn('[SW] BroadcastChannel not supported:', e.message);
  }
}

// ── RAW PUSH EVENT — fires for EVERY incoming FCM message ────────────────────
// This runs BEFORE Firebase SDK processes anything, so it catches:
//   • notification-only messages   (Firebase auto-shows popup, skips onBackgroundMessage)
//   • data-only messages           (onBackgroundMessage handles display)
//   • notification + data messages (hybrid)
// eslint-disable-next-line no-restricted-globals
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try { payload = event.data.json(); }
  catch (e) { console.error('[SW] Failed to parse push payload:', e); return; }

  console.log('[SW] Raw push received:', payload);

  // Normalise — backend may put title/body inside `notification` or `data`
  const notification = payload.notification || {};
  const data         = payload.data         || {};

  const title = notification.title || data.title || data.subject || 'New Notification';
  const body  = notification.body  || data.body  || data.message || '';

  const notifRecord = {
    id:    Date.now().toString(),
    title,
    body,
    date:  new Date().toISOString(),
    read:  false,
    data,
  };

  // Always persist + broadcast to app tabs
  event.waitUntil(
    Promise.all([
      saveNotificationToDB(notifRecord).catch(console.error),
      Promise.resolve(broadcastToApp(notifRecord)),
    ])
  );
});

// ── BACKGROUND MESSAGE — only called for data-only messages (no notification block) ──
// We still register it so Firebase SDK is initialised correctly.
// Display is handled here for data-only; for notification messages Firebase auto-shows.
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] onBackgroundMessage (data-only):', payload);

  const data  = payload.data || {};
  const title = data.title || data.subject || 'New Notification';
  const body  = data.body  || data.message || '';

  // Show manual OS notification for data-only messages
  // eslint-disable-next-line no-restricted-globals
  return self.registration.showNotification(title, {
    body,
    icon:  '/favicon.png',
    badge: '/favicon.png',
    data,
  });
});

// ── NOTIFICATION CLICK — bring app to front ───────────────────────────────────
// eslint-disable-next-line no-restricted-globals
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    // eslint-disable-next-line no-undef
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes('/notifications') && 'focus' in client) {
          return client.focus();
        }
      }
      // Or open new tab at /notifications
      // eslint-disable-next-line no-undef
      if (clients.openWindow) {
        // eslint-disable-next-line no-undef
        return clients.openWindow('/notifications');
      }
    })
  );
});
