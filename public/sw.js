// Service Worker for Push Notifications
const CACHE_NAME = 'tradespot-notifications-v1';
const API_BASE_URL = 'https://api-tradespot.onrender.com';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {

  let notificationData = {
    title: 'TradeSpot',
    body: 'You have a new notification',
    icon: '/tradespot.jpeg',
    badge: '/tradespot.jpeg',
    tag: 'tradespot-notification',
    data: {
      url: '/notifications'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      // Error parsing push data
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions || [
        {
          action: 'view',
          title: 'View'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      timestamp: notificationData.timestamp || Date.now(),
      vibrate: notificationData.vibrate || [200]
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {

  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the app
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Focus existing window and navigate to notification
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notificationData
          });
          return;
        }
      }

      // Open new window if no existing window found
      if (clients.openWindow) {
        const url = notificationData.url || '/notifications';
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline notification handling
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

// Message event - Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper function to sync notifications when back online
async function syncNotifications() {
  try {
    // This would typically sync any pending notification actions
    // when the user comes back online
  } catch (error) {
    // Error syncing notifications
  }
}

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  // Track notification dismissal if needed
  const notificationData = event.notification.data || {};
  
  // You could send analytics data here
  if (notificationData.notificationId) {
    // Track notification dismissal
    fetch(`${API_BASE_URL}/api/notifications/${notificationData.notificationId}/dismiss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      // Error tracking notification dismissal
    });
  }
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    // Re-subscribe to push notifications
    // Note: VAPID key should be passed from main thread or fetched from server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true
    }).then((subscription) => {
      // Send new subscription to server
      return fetch(`${API_BASE_URL}/api/notifications/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getStoredToken()}`
        },
        body: JSON.stringify({
          subscription: subscription,
          userAgent: 'ServiceWorker'
        })
      });
    }).catch(error => {
      // Error re-subscribing to push notifications
    })
  );
});

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper function to get stored auth token
function getStoredToken() {
  // This would typically get the token from IndexedDB or other storage
  // For now, return null - the main app should handle token management
  return null;
}
