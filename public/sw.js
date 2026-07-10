self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  let data = { title: 'STYLE X Update', body: 'New premium luxury collection available!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: 'STYLE X Update', body: event.data.text() };
    }
  }

  const title = data.title;
  const options = {
    body: data.body,
    icon: data.icon || '/stylex_logo.jpg',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/'
    },
    vibrate: [200, 100, 200],
    tag: 'stylex-push-notification',
    renotify: true,
    actions: [
      { action: 'open_url', title: '👁️ View Collection' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked.');
  event.notification.close();

  let targetUrl = '/';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      // If a tab is already open with the target, focus it
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf(targetUrl) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
