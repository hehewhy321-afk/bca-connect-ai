// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Get the notification data
  const data = event.notification.data;
  const urlToOpen = data?.link ? new URL(data.link, self.location.origin).href : self.location.origin;

  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events (for future web push implementation)
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message || data.body,
      icon: '/pwa-192x192.png',
      badge: '/favicon.png',
      vibrate: [200, 100, 200], // Vibration pattern
      silent: false, // Enable sound
      requireInteraction: false,
      tag: data.id || 'notification',
      data: {
        link: data.link || '/',
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'BCA Association', options)
    );
  }
});
