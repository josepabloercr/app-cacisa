// firebase-messaging-sw.js (compat, simple y sólido)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyADeV6ITu-SQkS6Ad7Zmc8cC1zmUKGWWOU",
  authDomain: "cacisa-app-notifications.firebaseapp.com",
  projectId: "cacisa-app-notifications",
  storageBucket: "cacisa-app-notifications.firebasestorage.app",
  messagingSenderId: "482196917295",
  appId: "1:482196917295:web:525558468fdc28263a4ada",
  measurementId: "G-SXBWW51XKC"
});

const messaging = firebase.messaging();

// Notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Notificación';
  const body  = (payload.notification && payload.notification.body)  || '';
  const icon  = (payload.notification && payload.notification.icon)  || '/icons/icon-192.png';
  self.registration.showNotification(title, { body, icon, data: payload.data || {} });
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});