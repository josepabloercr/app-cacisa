// ===== Firebase Messaging Service Worker =====
// Este archivo debe estar en la RAÍZ del proyecto

// Importa Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuración de tu proyecto pwa-cacisa
const firebaseConfig = {
  apiKey: "AIzaSyDtDPjwgG3EWT3CdHkqME_WHd6WD-72wrQ",
  authDomain: "pwa-cacisa.firebaseapp.com",
  projectId: "pwa-cacisa",
  storageBucket: "pwa-cacisa.firebasestorage.app",
  messagingSenderId: "1011871229398",
  appId: "1:1011871229398:web:24872ec28f277851ce7077"
};

// Inicializa Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// Obtiene instancia de messaging
const messaging = firebase.messaging();

// Maneja mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en segundo plano:', payload);

  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  const notificationTitle = title || 'CACISA PWA';
  const notificationOptions = {
    body: body || '',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data,
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction === 'true',
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});