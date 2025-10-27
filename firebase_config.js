// ===== Configuración Firebase =====
// Configuración de tu proyecto pwa-cacisa

const firebaseConfig = {
  apiKey: "AIzaSyDtDPjwgG3EWT3CdHkqME_WHd6WD-72wrQ",
  authDomain: "pwa-cacisa.firebaseapp.com",
  projectId: "pwa-cacisa",
  storageBucket: "pwa-cacisa.firebasestorage.app",
  messagingSenderId: "1011871229398",
  appId: "1:1011871229398:web:24872ec28f277851ce7077"
};

// VAPID Public Key (Cloud Messaging → Web Push certificates)
const vapidPublicKey = "BA3ZWaJPaf7LE3oXA2-IvbwKaumGmFlzuxgozORyT54_JZAHoWLZ6-hMKaNwUT36qva8hGRy5OptVO2CQwWPkwo";

// Inicializar Firebase
// Este código se carga desde CDN en el HTML
let messaging = null;

async function initializeFirebase() {
  try {
    // Importa Firebase desde CDN (ya cargado en HTML)
    if (typeof firebase === 'undefined') {
      console.error('Firebase no está cargado. Verifica que el script CDN esté en index.html');
      return false;
    }

    // Inicializa Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    // Inicializa Messaging
    if ('serviceWorker' in navigator) {
      messaging = firebase.messaging();
      console.log('✅ Firebase Messaging inicializado');
      return true;
    } else {
      console.warn('Service Worker no disponible');
      return false;
    }
  } catch (error) {
    console.error('Error inicializando Firebase:', error);
    return false;
  }
}

// Solicitar permisos y obtener token FCM
async function requestFCMToken() {
  if (!messaging) {
    console.warn('Firebase Messaging no inicializado');
    return null;
  }

  try {
    // Solicita permiso de notificaciones
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // Obtiene el token FCM
    const token = await messaging.getToken({
      vapidKey: vapidPublicKey
    });

    if (token) {
      console.log('🔑 Token FCM obtenido:', token);
      return token;
    } else {
      console.log('No se pudo obtener el token FCM');
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo token FCM:', error);
    return null;
  }
}

// Escuchar mensajes en primer plano
function setupFCMListeners() {
  if (!messaging) return;

  // Mensajes cuando la app está abierta
  messaging.onMessage((payload) => {
    console.log('📬 Mensaje FCM recibido:', payload);

    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    // Muestra notificación incluso si la app está abierta
    sendNotification(
      title || 'Nueva notificación',
      body || '',
      {
        data,
        tag: data.tag || 'fcm-notification',
        icon: './icons/icon-192.png'
      }
    );
  });

  // Cuando el token se actualiza
  messaging.onTokenRefresh(async () => {
    try {
      const newToken = await messaging.getToken({
        vapidKey: vapidPublicKey
      });
      console.log('🔄 Token FCM actualizado:', newToken);
      
      // Actualiza el token en el servidor
      if (state.auth && state.cfg.gasUrl) {
        await updateDeviceToken(newToken);
      }
    } catch (error) {
      console.error('Error actualizando token:', error);
    }
  });
}

// Actualiza el device_token en Sheets
async function updateDeviceToken(token) {
  if (!state.auth || !state.cfg.gasUrl) return;

  try {
    const payload = {
      type: "update_user",
      user_id: state.auth.user_id,
      device_token: token
    };

    const u = buildUrl(state.cfg.gasUrl, {
      q: "update_user",
      payload: JSON.stringify(payload)
    });

    const response = await fetch(u, { method: "GET", cache: "no-store" });
    const data = await response.json();

    if (data.ok) {
      console.log('✅ Device token guardado en Sheets');
      state.auth.device_token = token;
      saveAuth();
    } else {
      console.error('Error guardando device token:', data.error);
    }
  } catch (error) {
    console.error('Error actualizando device token:', error);
  }
}

// Exportar funciones para uso en app.js
window.firebaseApp = {
  initialize: initializeFirebase,
  requestToken: requestFCMToken,
  setupListeners: setupFCMListeners,
  updateToken: updateDeviceToken
};