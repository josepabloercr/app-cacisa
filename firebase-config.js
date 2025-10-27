// ===== Configuración Firebase =====
const firebaseConfig = {
  apiKey: "AIzaSyDtDPjwgG3EWT3CdHkqME_WHd6WD-72wrQ",
  authDomain: "pwa-cacisa.firebaseapp.com",
  projectId: "pwa-cacisa",
  storageBucket: "pwa-cacisa.firebasestorage.app",
  messagingSenderId: "1011871229398",
  appId: "1:1011871229398:web:24872ec28f277851ce7077"
};

const vapidPublicKey = "BA3ZWaJPaf7LE3oXA2-IvbwKaumGmFlzuxgozORyT54_JZAHoWLZ6-hMKaNwUT36qva8hGRy5OptVO2CQwWPkwo";

let messaging = null;

async function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase SDK no cargado desde CDN');
      return false;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase App inicializado');
    }

    if ('serviceWorker' in navigator) {
      messaging = firebase.messaging();
      console.log('✅ Firebase Messaging inicializado');
      return true;
    } else {
      console.warn('⚠️ Service Worker no disponible');
      return false;
    }
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    return false;
  }
}

async function requestFCMToken() {
  if (!messaging) {
    console.warn('⚠️ Firebase Messaging no inicializado');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('🔔 Permiso de notificaciones:', permission);
    
    if (permission !== 'granted') {
      console.log('⚠️ Permiso de notificaciones denegado');
      return null;
    }

    const token = await messaging.getToken({
      vapidKey: vapidPublicKey
    });

    if (token) {
      console.log('🔑 Token FCM obtenido:', token);
      return token;
    } else {
      console.log('⚠️ No se pudo obtener el token FCM');
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error);
    return null;
  }
}

function setupFCMListeners() {
  if (!messaging) return;

  messaging.onMessage((payload) => {
    console.log('📬 Mensaje FCM recibido:', payload);
    const { title, body } = payload.notification || {};
    const data = payload.data || {};
    
    if (typeof sendNotification === 'function') {
      sendNotification(
        title || 'Nueva notificación',
        body || '',
        { data, tag: data.tag || 'fcm-notification', icon: './icons/icon-192.png' }
      );
    }
  });

  messaging.onTokenRefresh(async () => {
    try {
      const newToken = await messaging.getToken({ vapidKey: vapidPublicKey });
      console.log('🔄 Token FCM actualizado:', newToken);
      
      if (window.state && window.state.auth && window.state.cfg && window.state.cfg.gasUrl) {
        await updateDeviceToken(newToken);
      }
    } catch (error) {
      console.error('❌ Error actualizando token:', error);
    }
  });
}

async function updateDeviceToken(token) {
  if (!window.state || !window.state.auth || !window.state.cfg || !window.state.cfg.gasUrl) {
    console.warn('⚠️ No hay autenticación o GAS_URL para actualizar token');
    return;
  }

  try {
    const payload = {
      type: "update_user",
      user_id: window.state.auth.user_id,
      device_token: token
    };

    const u = window.buildUrl(window.state.cfg.gasUrl, {
      q: "update_user",
      payload: JSON.stringify(payload)
    });

    const response = await fetch(u, { method: "GET", cache: "no-store" });
    const data = await response.json();

    if (data.ok) {
      console.log('✅ Device token guardado en Sheets');
      window.state.auth.device_token = token;
      if (typeof window.saveAuth === 'function') {
        window.saveAuth();
      }
    } else {
      console.error('❌ Error guardando device token:', data.error);
    }
  } catch (error) {
    console.error('❌ Error actualizando device token:', error);
  }
}

window.firebaseApp = {
  initialize: initializeFirebase,
  requestToken: requestFCMToken,
  setupListeners: setupFCMListeners,
  updateToken: updateDeviceToken
};

console.log('✅ firebase-config.js cargado correctamente');