// Zero Touch SOS Service Worker
const CACHE_NAME = 'zero-touch-sos-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Background sync for emergency detection
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-detection') {
    event.waitUntil(handleEmergencyDetection());
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'EMERGENCY_TRIGGERED') {
    handleEmergencyAlert(event.data.payload);
  }
});

async function handleEmergencyDetection() {
  // Background detection logic would go here
  console.log('Background emergency detection active');
}

async function handleEmergencyAlert(payload) {
  // Show notification
  self.registration.showNotification('🚨 Emergency Alert Sent', {
    body: `Alert sent to ${payload.contactCount} emergency contacts`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      }
    ]
  });
}