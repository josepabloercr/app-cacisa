// ===== Sheets → WhatsApp (PWA) =====
// app.js HÍBRIDO: Caché dinámico + fallback embebido

// --- UUID compatible (polyfill) ---
function uuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (_) {}
  const arr = (typeof crypto !== "undefined" && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint8Array(16))
    : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = [...arr].map(b => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") + "-" +
    hex.slice(4, 6).join("") + "-" +
    hex.slice(6, 8).join("") + "-" +
    hex.slice(8,10).join("") + "-" +
    hex.slice(10,16).join("")
  );
}

const $ = (sel) => document.querySelector(sel);

// ----- Vistas -----
const viewLogin = $("#view-login");
const viewApp   = $("#view-app");

// ----- Header / estado -----
const statusPill = $("#status");
const btnInstall = $("#btn-install");

// ----- Login -----
const loginUser  = $("#login-user");
const loginPin   = $("#login-pin");
const btnLogin   = $("#btn-login");
const loginMsg   = $("#login-msg");

// ----- Perfil -----
const txtUser    = $("#txt-user");
const txtEstado  = $("#txt-estado");

// ----- Controles de app -----
const zona       = $("#zona");
const contrato   = $("#contrato");
const ruta       = $("#ruta");
const seccion    = $("#seccion");
const itemInput  = $("#item");
const itemList   = $("#item-list");
const mensaje    = $("#mensaje");
const debug      = $("#debug");
const gpsStatus  = $("#gps-status");
const gpsCoords  = $("#gps-coords");

// ----- Historial / logout -----
const logsContainer  = $("#logs");
const btnReloadLogs  = $("#btn-reload-logs");
const btnLogout      = $("#btn-logout");

// ----- Claves de storage -----
const CFG_KEY    = "pwa_cfg";
const AUTH_KEY   = "pwa_auth";
const OUTBOX_KEY = "pwa_outbox";
const CATS_KEY   = "pwa_catalog_cache";

// ----- Estado -----
const state = {
  online: navigator.onLine,
  cfg: { gasUrl: "" },
  auth: null,
  zonas: [], contratos: [], rutas: [], secciones: [], items: [],
  outbox: [],
  reminderTimer: null,
  deferredPrompt: null,
  _cats: {},
  currentLocation: null,
  gpsWatchId: null
};

// ================== Helpers ==================
function showLogin(){ viewLogin.classList.remove("hide"); viewApp.classList.add("hide"); }
function showApp(){ viewLogin.classList.add("hide"); viewApp.classList.remove("hide"); }
function setEstadoPill(estado){
  txtEstado.textContent = estado || "-";
  txtEstado.className = "pill " + ((estado === "salida") ? "bad" : "ok");
}
function toastMsg(el, msg){ if (!el) { alert(msg); return; } el.textContent = msg; setTimeout(()=>{ el.textContent=""; }, 2000); }

function buildUrl(base, params = {}) {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

// ================== Caché dinámico ==================
function saveCatalogCache(cache) { 
  localStorage.setItem(CATS_KEY, JSON.stringify(cache || {})); 
}

function loadCatalogCache() {
  try { 
    return JSON.parse(localStorage.getItem(CATS_KEY) || "{}"); 
  } catch { 
    return {}; 
  }
}

// ================== Install PWA ==================
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function updateInstallButtonVisibility() {
  if (!btnInstall) return;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isiOS) { btnInstall.style.display = "none"; return; }
  btnInstall.style.display = (!isStandalone() && state.deferredPrompt) ? "inline-block" : "none";
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  state.deferredPrompt = e;
  updateInstallButtonVisibility();
});
if (btnInstall) {
  btnInstall.addEventListener("click", async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    updateInstallButtonVisibility();
  });
}
window.addEventListener("appinstalled", () => {
  state.deferredPrompt = null;
  updateInstallButtonVisibility();
});

// ================== Online/Offline ==================
function setOnline(v){
  const wasOffline = !state.online;
  state.online = v;
  statusPill.textContent = v ? "online" : "offline";
  statusPill.className = "pill " + (v ? "ok" : "bad");
  
  if (v) {
    trySync();
    
    // Notifica cuando vuelve internet
    if (wasOffline && state.auth) {
      const pendientes = state.outbox.length;
      if (pendientes > 0) {
        sendNotification(
          "✅ Conexión restaurada", 
          `Sincronizando ${pendientes} mensaje${pendientes > 1 ? 's' : ''} pendiente${pendientes > 1 ? 's' : ''}...`,
          { tag: 'connection-restored' }
        );
      }
    }
  } else {
    // Notifica cuando se pierde internet
    if (state.auth) {
      sendNotification(
        "⚠️ Sin conexión",
        "Tus mensajes se guardarán localmente y se sincronizarán cuando vuelva el internet.",
        { tag: 'connection-lost', requireInteraction: false }
      );
    }
  }
}
window.addEventListener("online",  () => setOnline(true));
window.addEventListener("offline", () => setOnline(false));
setOnline(navigator.onLine);

// ================== Storage ==================
function loadCfg(){
  state.cfg.gasUrl = "https://script.google.com/macros/s/AKfycbwHK_IZzL7uDck_wY_25uaKsokrtZxKgFlhYqPXimbd9BR5TPDmP4q7JlkhoaIf7imF/exec";
}
function saveCfg(){
  // Eliminar guardado manual, la URL es automática
}
function loadAuth(){ try { state.auth = JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { state.auth = null; } }
function saveAuth(){ localStorage.setItem(AUTH_KEY, JSON.stringify(state.auth)); }
function loadOutbox(){ try { state.outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); } catch { state.outbox = []; } }
function saveOutbox(){ localStorage.setItem(OUTBOX_KEY, JSON.stringify(state.outbox)); }

loadCfg(); loadAuth(); loadOutbox();



// ================== GEOLOCALIZACIÓN ==================
function updateGPSStatus(status, coords = null) {
  if (!gpsStatus) return;
  
  if (status === "getting") {
    gpsStatus.textContent = "📍 Obteniendo...";
    gpsStatus.className = "pill";
  } else if (status === "success") {
    gpsStatus.textContent = "📍 GPS activo";
    gpsStatus.className = "pill ok";
    if (coords && gpsCoords) {
      const lat = coords.latitude.toFixed(6);
      const lon = coords.longitude.toFixed(6);
      const acc = coords.accuracy ? Math.round(coords.accuracy) : '?';
      gpsCoords.innerHTML = `<a href="https://maps.google.com/?q=${lat},${lon}" target="_blank" style="color:inherit;text-decoration:underline">📍 Lat: ${lat}, Lon: ${lon}</a> (±${acc}m)`;
    }
  } else if (status === "error") {
    gpsStatus.textContent = "📍 GPS no disponible";
    gpsStatus.className = "pill bad";
    if (gpsCoords) gpsCoords.innerHTML = "<small>⚠️ Geolocalización no disponible. Necesitas HTTPS o estar en la app instalada.</small>";
  } else {
    gpsStatus.textContent = "📍 GPS desactivado";
    gpsStatus.className = "pill";
    if (gpsCoords) gpsCoords.textContent = "";
  }
}

function requestLocation() {
  if (!navigator.geolocation) {
    console.warn("Geolocalización no soportada");
    updateGPSStatus("error");
    return Promise.reject(new Error("not_supported"));
  }

  updateGPSStatus("getting");

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        state.currentLocation = coords;
        updateGPSStatus("success", coords);
        console.log("📍 Coordenadas obtenidas:", coords);
        resolve(coords);
      },
      (error) => {
        console.error("Error GPS:", error.message, "Code:", error.code);
        updateGPSStatus("error");
        state.currentLocation = null;
        
        let errorMsg = "Error obteniendo ubicación";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Permiso de ubicación denegado. Ve a Configuración → Privacidad → Ubicación";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Ubicación no disponible. Verifica que el GPS esté activado.";
            break;
          case error.TIMEOUT:
            errorMsg = "Tiempo agotado obteniendo ubicación";
            break;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000 // Acepta ubicación de hasta 30 segundos atrás
      }
    );
  });
}

// Monitoreo continuo de GPS
function startGPSWatch() {
  if (!navigator.geolocation) {
    console.warn("Geolocalización no soportada");
    updateGPSStatus("error");
    return;
  }

  // Detiene watcher anterior si existe
  if (state.gpsWatchId !== null) {
    navigator.geolocation.clearWatch(state.gpsWatchId);
  }

  console.log("🔄 Iniciando monitoreo continuo de GPS...");
  
  state.gpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      state.currentLocation = coords;
      updateGPSStatus("success", coords);
      console.log("📍 GPS actualizado:", coords);
    },
    (error) => {
      console.error("Error GPS watch:", error.message);
      updateGPSStatus("error");
      state.currentLocation = null;
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000 // Actualiza cada 10 segundos
    }
  );
}

function stopGPSWatch() {
  if (state.gpsWatchId !== null) {
    navigator.geolocation.clearWatch(state.gpsWatchId);
    state.gpsWatchId = null;
    console.log("⏹️ Monitoreo GPS detenido");
  }
}

// Solicitar permisos al hacer login
async function requestGPSPermission() {
  try {
    await requestLocation();
    // Si tuvo éxito, inicia monitoreo continuo
    startGPSWatch();
  } catch (e) {
    console.warn("No se pudo obtener ubicación inicial:", e.message);
  }
}

// ================== LOGIN ==================
btnLogin?.addEventListener("click", async ()=>{
  if (!state.online) {
    loginMsg.textContent = "⚠️ Sin conexión. Necesitas internet para iniciar sesión la primera vez.";
    loginMsg.style.color = "#ff8080";
    return;
  }
  
  if (!state.cfg.gasUrl) { 
    loginMsg.textContent = "Configura la GAS_URL primero."; 
    return; 
  }

  const user = (loginUser.value || "").trim();
  const pin  = (loginPin.value  || "").trim();
  if (!user || !pin) { 
    loginMsg.textContent = "Usuario y PIN son obligatorios."; 
    return; 
  }

  loginMsg.textContent = "Conectando...";
  loginMsg.style.color = "#6b7280";

  try {
    const urlLogin = buildUrl(state.cfg.gasUrl, { q: "login", user_id: user, pin });
    const resp = await fetch(urlLogin);
    const raw  = await resp.text();
    let data; try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no JSON: " + raw.slice(0,200)); }
    if (!data.ok) { 
      loginMsg.textContent = data.error || "Error de aplicación";
      loginMsg.style.color = "#ff8080";
      return; 
    }

    state.auth = data.user; saveAuth();
    await initCatalogs();
    hydrateProfileUI();
    scheduleLocalReminder();
    await requestGPSPermission();
    await initializeFCM(); // << Inicializa Firebase Cloud Messaging
    await loadLogs(50);
    showApp();
  } catch (e) {
    loginMsg.textContent = "Error conectando: " + String(e).slice(0,200);
    loginMsg.style.color = "#ff8080";
  }
});

function hydrateProfileUI(){
  if (!state.auth) return;
  txtUser.textContent = `${state.auth.nombre} (${state.auth.user_id})`;
  setEstadoPill(state.auth.estado || "activo");
}



// ================== Carga de catálogos HÍBRIDA ==================
async function initCatalogs(){
  let cache = loadCatalogCache();
  
  // Si hay conexión, intenta refrescar desde GAS
  if (state.online && state.cfg.gasUrl) {
    try{
      const r = await fetch(buildUrl(state.cfg.gasUrl, { q: "catalogos" }), { cache: "no-store" });
      const data = await r.json();
      state.zonas = data.zonas || [];
      state.contratos = data.contratos || [];
      
      // Actualiza caché manteniendo datos previos de rutas/secciones/items
      cache = {
        zonas: state.zonas,
        contratos: state.contratos,
        rutasByZona: cache.rutasByZona || {},
        seccionesByZR: cache.seccionesByZR || {},
        itemsByKey: cache.itemsByKey || {}
      };
      saveCatalogCache(cache);
      console.log("✅ Catálogos actualizados desde Sheets");
    }catch(err){
      console.warn("⚠️ Error cargando desde Sheets, usando caché/fallback:", err);
      // Si falla online, usar caché si existe
      if (cache.zonas && cache.zonas.length) {
        state.zonas = cache.zonas;
        state.contratos = cache.contratos || [];
      } else {
        // Último fallback: datos embebidos
        state.zonas = (typeof LOCAL_ZONAS !== "undefined") ? LOCAL_ZONAS.slice() : [];
        state.contratos = (typeof LOCAL_CONTRATOS !== "undefined") ? LOCAL_CONTRATOS.slice() : [];
        console.log("📦 Usando datos embebidos como fallback");
      }
    }
  } else {
    // Offline: usar caché primero, luego fallback embebido
    if (cache.zonas && cache.zonas.length) {
      state.zonas = cache.zonas;
      state.contratos = cache.contratos || [];
      console.log("💾 Usando caché offline");
    } else {
      state.zonas = (typeof LOCAL_ZONAS !== "undefined") ? LOCAL_ZONAS.slice() : [];
      state.contratos = (typeof LOCAL_CONTRATOS !== "undefined") ? LOCAL_CONTRATOS.slice() : [];
      console.log("📦 Usando datos embebidos (sin caché previo)");
    }
  }

  state._cats = loadCatalogCache();
  fillZonas();
  
  // Aviso UX si no hay datos
  if (!state.zonas.length) {
    alert("⚠️ Estás sin conexión y no hay datos locales. Conéctate una vez para cargar catálogos.");
  }
  
  await onZonaChange();
}

function fillZonas(){
  zona.innerHTML = `<option value="">Selecciona una zona</option>` +
    state.zonas.map(z => `<option value="${z.zona_id}">${z.zona_nombre || z.zona_id}</option>`).join("");
  zona.value = "";
}

function fillContratos(){
  const z = zona.value;
  const filtrados = state.contratos.filter(c => (c.zona_id === z || c.zona_id === "ambas"));
  contrato.innerHTML = `<option value="">Selecciona un contrato</option>` +
    filtrados.map(c => `<option value="${c.contrato_id}">${c.contrato_id}</option>`).join("");
  contrato.value = "";
}

function fillRutas(){
  ruta.innerHTML = `<option value="">Selecciona una ruta</option>` +
    state.rutas.map(r => `<option value="${r.ruta_codigo}">${r.ruta_nombre || r.ruta_codigo}</option>`).join("");
  ruta.value = "";
}

function fillSecciones(){
  seccion.innerHTML = `<option value="">Selecciona una sección</option>` +
    state.secciones.map(s => `<option value="${s.seccion_control}">${s.seccion_control}</option>`).join("");
  seccion.value = "";
}

// ========== FETCH con caché + fallback embebido ==========
async function fetchRutas(z){
  const key = String(z || "");
  
  // Online primero
  if (state.online && state.cfg.gasUrl) {
    try{
      const r = await fetch(buildUrl(state.cfg.gasUrl, { q:"rutas", zona: key }), { cache: "no-store" });
      const data = await r.json();
      state.rutas = data.rutas || [];
      
      // Guarda en caché
      const cache = loadCatalogCache();
      cache.rutasByZona = cache.rutasByZona || {};
      cache.rutasByZona[key] = state.rutas;
      saveCatalogCache(cache);
      state._cats = cache;
      return;
    }catch(e){ console.warn("Error fetchRutas online:", e); }
  }
  
  // Offline o fallo: usa caché
  const cache = state._cats || loadCatalogCache();
  if (cache.rutasByZona && cache.rutasByZona[key]) {
    state.rutas = cache.rutasByZona[key];
  } else {
    // Fallback embebido
    state.rutas = (typeof LOCAL_RUTAS !== "undefined" && LOCAL_RUTAS[key]) ? LOCAL_RUTAS[key] : [];
  }
}

async function fetchSecciones(z, rcode){
  const key = `${z||""}:${rcode||""}`;
  
  if (state.online && state.cfg.gasUrl) {
    try{
      const x = await fetch(buildUrl(state.cfg.gasUrl, { q:"secciones", zona: z, ruta: rcode }), { cache:"no-store" });
      const data = await x.json();
      state.secciones = data.secciones || [];
      
      const cache = loadCatalogCache();
      cache.seccionesByZR = cache.seccionesByZR || {};
      cache.seccionesByZR[key] = state.secciones;
      saveCatalogCache(cache);
      state._cats = cache;
      return;
    }catch(e){ console.warn("Error fetchSecciones online:", e); }
  }
  
  // Offline o fallo
  const cache = state._cats || loadCatalogCache();
  if (cache.seccionesByZR && cache.seccionesByZR[key]) {
    state.secciones = cache.seccionesByZR[key];
  } else {
    state.secciones = (typeof LOCAL_SECCIONES !== "undefined" && LOCAL_SECCIONES[key]) ? LOCAL_SECCIONES[key] : [];
  }
}

async function fetchItems(contratoId, search=""){
  const z = zona.value || "";
  const itemsKey = `${contratoId}::${z}`;
  
  if (state.online && state.cfg.gasUrl) {
    try{
      const r = await fetch(buildUrl(state.cfg.gasUrl, { q:"items", contrato: contratoId, zona: z, search }), { cache:"no-store" });
      const d = await r.json();
      state.items = d.items || [];
      
      // Cachea resultado base (sin filtro)
      const cache = loadCatalogCache();
      cache.itemsByKey = cache.itemsByKey || {};
      if (!search) cache.itemsByKey[itemsKey] = state.items;
      saveCatalogCache(cache);
      state._cats = cache;
      
      itemList.innerHTML = state.items.map(x => `<option value="${(x.item_codigo||"")+" - "+(x.item_nombre||"")}"></option>`).join("");
      return;
    }catch(e){ console.warn("Error fetchItems online:", e); }
  }
  
  // Offline o fallo: usa caché primero
  const cache = state._cats || loadCatalogCache();
  let list = [];
  
  if (cache.itemsByKey && cache.itemsByKey[itemsKey]) {
    list = cache.itemsByKey[itemsKey].slice();
  } else {
    // Fallback embebido
    const keyAmbas = `${contratoId}::ambas`;
    if (typeof LOCAL_ITEMS !== "undefined") {
      list = (LOCAL_ITEMS[itemsKey] || []).concat(LOCAL_ITEMS[keyAmbas] || []);
    }
  }
  
  // Filtrar si hay búsqueda
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(x =>
      String(x.item_codigo||"").toLowerCase().includes(s) ||
      String(x.item_nombre||"").toLowerCase().includes(s)
    );
  }
  
  state.items = list;
  itemList.innerHTML = state.items.map(x => `<option value="${(x.item_codigo||"")+" - "+(x.item_nombre||"")}"></option>`).join("");
}

// ========== Flujos de cambio ==========
async function onZonaChange(){
  fillContratos();
  await fetchRutas(zona.value || "");
  fillRutas();
  state.secciones = []; fillSecciones();
  itemInput.value = ""; state.items = []; itemList.innerHTML = "";
  applyPreview(); showDebug();
}

async function onContratoChange(){
  itemInput.value = "";
  await fetchItems(contrato.value || "", "");
  applyPreview(); showDebug();
}

async function onRutaChange(){
  await fetchSecciones(zona.value || "", ruta.value || "");
  fillSecciones();
  applyPreview(); showDebug();
}

// ================== Eventos ==================
zona?.addEventListener("change", onZonaChange);
contrato?.addEventListener("change", onContratoChange);
ruta?.addEventListener("change", onRutaChange);
seccion?.addEventListener("change", () => { applyPreview(); showDebug(); });

let itemTimer = null;
itemInput?.addEventListener("input", ()=>{
  applyPreview();
  const c = contrato.value; if (!c) return;
  const q = itemInput.value || "";
  clearTimeout(itemTimer);
  itemTimer = setTimeout(()=> fetchItems(c, q), 200);
});

function showDebug(){
  if (!debug) return;
  debug.textContent = `Usuario: ${state.auth?.user_id || "-"} | Estado: ${state.auth?.estado || "-"} | Zona: ${zona.value || "-"} | Contrato: ${contrato.value || "-"} | Ruta: ${ruta.value || "-"} | Sección: ${seccion.value || "-"} | Item: ${itemInput.value || "-"}`;
}

// ================== Previsualización ==================
const PREFIX_RE = /^(?:\[[^\]]+\]\s+){1,6}—\s*/;
function currentPrefix() {
  const parts = [];
  if (zona.value)     parts.push(`[${zona.value}]`);
  if (contrato.value) parts.push(`[${contrato.value}]`);
  if (ruta.value)     parts.push(`[${ruta.value}]`);
  if (seccion.value)  parts.push(`[${seccion.value}]`);
  const itemVal = (itemInput.value || "").trim();
  if (itemVal)        parts.push(`[${itemVal}]`);
  return parts.length ? parts.join(" ") + " — " : "";
}
function applyPreview(opts = { force:false }) {
  const prefix = currentPrefix();
  const txt = mensaje.value || "";
  if (PREFIX_RE.test(txt)) {
    mensaje.value = prefix ? txt.replace(PREFIX_RE, prefix) : txt.replace(PREFIX_RE, "");
  } else if (opts.force || !txt.trim()) {
    mensaje.value = prefix + txt;
  }
}
$("#btn-preview")?.addEventListener("click", ()=>{ applyPreview({ force:true }); });

// ================== WhatsApp ==================
$("#btn-wa")?.addEventListener("click", async ()=>{
  let mensajeFinal = mensaje.value || "";
  
  // Agrega enlace de Google Maps si hay coordenadas
  if (state.currentLocation) {
    const lat = state.currentLocation.latitude.toFixed(6);
    const lon = state.currentLocation.longitude.toFixed(6);
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    
    if (!mensajeFinal.includes(mapsUrl)) {
      mensajeFinal += `\n\n📍 Ubicación: ${mapsUrl}`;
    }
  }

  // Si hay foto Y Share API disponible, usamos método híbrido
  if (state.currentPhoto && navigator.share) {
    console.log('📸 Intentando Share API con texto...');
    
    try {
      // Convierte base64 a blob
      const blob = await fetch(state.currentPhoto).then(r => r.blob());
      const file = new File([blob], 'foto-cacisa.jpg', { type: 'image/jpeg' });
      
      // Verificamos si puede compartir archivos
      const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
      
      if (canShareFiles) {
        console.log('✅ Share API disponible, intentando compartir...');
        
        // CLAVE: Usa 'text' en lugar de 'title' y separa bien los campos
        await navigator.share({
          text: mensajeFinal,  // El texto completo aquí
          files: [file]
        });
        
        console.log('✅ Compartido vía Share API');
        return;
      } else {
        console.log('⚠️ Share API no puede compartir archivos en este dispositivo');
      }
    } catch (e) {
      // Si el usuario cancela, no es error
      if (e.name === 'AbortError') {
        console.log('ℹ️ Usuario canceló el share');
        return;
      }
      console.warn('Share API falló:', e.message);
      // Continúa con método alternativo
    }
  }

  // Fallback: Subir a ImgBB (funciona siempre)
  if (state.currentPhoto) {
    console.log('📸 Usando método alternativo (ImgBB)...');
    
    if (uploadStatus) {
      uploadStatus.style.display = 'block';
      uploadStatus.textContent = '📤 Subiendo foto a la nube...';
    }
    
    console.log('📤 Subiendo foto a ImgBB...');
    const imgUrl = await uploadToImgBB(state.currentPhoto);
    
    if (uploadStatus) uploadStatus.style.display = 'none';
    
    if (imgUrl) {
      mensajeFinal += `\n\n📸 Foto: ${imgUrl}`;
      console.log('✅ Foto subida:', imgUrl);
    } else {
      const continuar = confirm('⚠️ No se pudo subir la foto automáticamente.\n\n¿Deseas enviar el mensaje sin la foto?');
      if (!continuar) {
        console.log('❌ Usuario canceló el envío');
        return;
      }
      mensajeFinal += `\n\n📸 [Foto no disponible - enviar manualmente]`;
    }
  }
  
  // Abre WhatsApp con el mensaje completo
  const url = "https://wa.me/?text=" + encodeURIComponent(mensajeFinal);
  window.open(url, "_blank");
  
  console.log('✅ WhatsApp abierto');
  
  // Guarda en Google Sheets automáticamente
  $("#btn-guardar")?.click();
});

// Sube imagen a ImgBB (servicio gratuito de hosting de imágenes)
async function uploadToImgBB(base64Image) {
  try {
    // API Key pública de ImgBB (puedes crear tu propia cuenta gratis en imgbb.com)
    const apiKey = '6d207e02198a847aa98d0a2a901485a5';
    
    // Remueve el prefijo data:image/jpeg;base64,
    const base64Data = base64Image.split(',')[1];
    
    const formData = new FormData();
    formData.append('image', base64Data);
    formData.append('expiration', 15552000); // 6 meses
    
    console.log('📤 Enviando a ImgBB...');
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.url) {
      console.log('✅ Imagen subida a ImgBB:', data.data.url);
      return data.data.url;
    } else {
      console.error('❌ Respuesta inválida de ImgBB:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error subiendo imagen a ImgBB:', error);
    return null;
  }
}

// ================== Guardado ==================
$("#btn-guardar")?.addEventListener("click", async ()=>{
  let item_codigo = "", item_nombre = "";
  const raw = (itemInput.value || "").trim();
  const m = raw.match(/^\s*([^-\[]+?)\s*-\s*(.+)\s*$/);
  if (m) { item_codigo = m[1].trim(); item_nombre = m[2].trim(); }
  else   { item_nombre = raw; }

  const payload = {
    type:"append_log",
    zona_id: zona.value || "",
    contrato_id: contrato.value || "",
    ruta_codigo: ruta.value || "",
    seccion_control: seccion.value || "",
    item_codigo, item_nombre,
    kilometraje: "",
    mensaje: mensaje.value || "",
    estado_sync: state.online ? "online" : "offline",
    timestamp: Date.now(),
    msg_id: uuid(),
    usuario_id: state.auth?.user_id || "",
    latitud: state.currentLocation?.latitude || null,
    longitud: state.currentLocation?.longitude || null,
    gps_accuracy: state.currentLocation?.accuracy || null,
    gps_timestamp: state.currentLocation?.timestamp || null
  };

  if (!state.cfg.gasUrl){
    enqueue(payload);
    alert("Sin GAS_URL: guardado en cola local. Configura GAS_URL para sincronizar.");
    return;
  }

  try{
    const res = await fetch(state.cfg.gasUrl, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    alert("Guardado en Google Sheets ✅");
    await loadLogs(50);
  }catch(e){
    try{
      const u2 = buildUrl(state.cfg.gasUrl, { action:"append_log", payload: JSON.stringify(payload) });
      const res2 = await fetch(u2, { method:"GET", cache:"no-store" });
      if (!res2.ok) throw new Error("HTTP " + res2.status);
      alert("Guardado en Google Sheets (vía respaldo) ✅");
      await loadLogs(50);
    }catch(e2){
      enqueue(payload);
      alert("Error guardando. Queda en cola para reintentar.");
    }
  }
});

function enqueue(item){ state.outbox.push({ id: uuid(), item, attempts: 0 }); saveOutbox(); }

async function trySync(){
  if (!state.online || !state.outbox.length || !state.cfg.gasUrl) return;
  const next = state.outbox[0];
  
  console.log("🔄 Intentando sincronizar:", next.item.msg_id);
  
  // Usa GET directamente (evita problemas de CORS)
  try{
    const u = buildUrl(state.cfg.gasUrl, { 
      action: "append_log", 
      payload: JSON.stringify(next.item) 
    });
    
    const res = await fetch(u, { method:"GET", cache:"no-store" });
    
    if (!res.ok) throw new Error("HTTP " + res.status);
    
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "response_not_ok");
    
    // Éxito: elimina de cola
    state.outbox.shift(); 
    saveOutbox();
    console.log("✅ Sincronizado desde cola:", next.item.msg_id);
    
    if (state.outbox.length) setTimeout(trySync, 200);
  }catch(e){
    console.error("❌ Error sincronizando:", e.message);
    // Incrementa intentos y reintenta más tarde
    next.attempts++; 
    const delay = Math.min(30000, 1000 * Math.pow(2, next.attempts));
    console.log(`⏱️ Reintentando en ${delay/1000}s (intento ${next.attempts})`);
    saveOutbox();
    setTimeout(trySync, delay);
  }
}

// ================== Recordatorio local ==================
function scheduleLocalReminder(){
  if (state.reminderTimer) { clearInterval(state.reminderTimer); state.reminderTimer = null; }
  if (!state.auth) return;

  const hhmm = state.auth.reminder_hhmm || "";
  const salida = state.auth.estado === "salida";
  if (!hhmm || salida) return;

  // Solicita permisos de notificación si no los tiene
  if (Notification && Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      console.log("🔔 Permiso de notificaciones:", permission);
    });
  }

  state.reminderTimer = setInterval(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,"0");
    const m = String(now.getMinutes()).padStart(2,"0");
    if (`${h}:${m}` === hhmm) {
      if (window.__lastReminderStamp === `${h}:${m}`) return;
      window.__lastReminderStamp = `${h}:${m}`;
      
      const title = "📍 Recordatorio CACISA";
      const body = `Hola ${state.auth.nombre}, es hora de tu registro diario.`;
      
      sendNotification(title, body, {
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: 'reminder-daily',
        requireInteraction: false,
        actions: [
          { action: 'open', title: '✅ Abrir App' }
        ]
      });
    }
  }, 15 * 1000);
}

// Función universal para enviar notificaciones
function sendNotification(title, body, options = {}) {
  const defaultOptions = {
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    ...options
  };

  // Si la app está en segundo plano o cerrada, usa Service Worker
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        ...defaultOptions
      });
    });
  } 
  // Si la app está abierta, notificación regular
  else if (Notification && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      ...defaultOptions
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } 
  // Fallback a alert si no hay permisos
  else {
    alert(`${title}\n\n${body}`);
  }
}

// ================== Historial ==================
function renderLogs(rows){
  if (!rows || !rows.length){ logsContainer.innerHTML = "Sin datos"; return; }
  
  let html = `<div style="display:flex; flex-direction:column; gap:0.5rem;">`;
  
  rows.forEach(r => {
    const fecha = new Date(r.timestamp).toLocaleString();
    const pref = [
      r.zona_id && `[${r.zona_id}]`,
      r.contrato_id && `[${r.contrato_id}]`,
      r.ruta_codigo && `[${r.ruta_codigo}]`,
      r.seccion_control && `[${r.seccion_control}]`,
      r.item_nombre && `[${r.item_codigo ? r.item_codigo + " - " : ""}${r.item_nombre}]`,
      r.kilometraje && `[${r.kilometraje}]`
    ].filter(Boolean).join(" ");
    
    // Limpiar saltos de línea repetidos excesivos para evitar "espacios grandes"
    const msgLimpio = (r.mensaje || "").trim().replace(/\n{3,}/g, '\n\n').replace(/\n/g, "<br>");
    
    html += `
    <div style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 0.5rem; background: var(--bg-color);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.4rem;">
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">${fecha}</span>
        <button data-msg='${encodeURIComponent(r.mensaje || "")}' data-pref='${encodeURIComponent(pref)}' class="btn-use pill" style="margin:0; background:var(--primary-color); color:white; border:none; cursor:pointer;">Usar</button>
      </div>
      
      <div style="font-size:0.8rem; font-weight:600; color:var(--primary-color); word-break:break-word; line-height:1.3; margin-bottom:0.3rem;">
        ${pref}
      </div>
      
      ${msgLimpio ? `<div style="font-size:0.85rem; color:var(--text-main); word-break:break-word; max-height:80px; overflow-y:auto; line-height:1.4;">${msgLimpio}</div>` : ''}
    </div>`;
  });
  
  html += `</div>`;
  logsContainer.innerHTML = html;

  logsContainer.querySelectorAll(".btn-use").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const pref = decodeURIComponent(btn.getAttribute("data-pref"));
      const msg  = decodeURIComponent(btn.getAttribute("data-msg"));
      mensaje.value = (pref ? pref + " — " : "") + (msg || "");
      mensaje.focus();
    });
  });
}

async function loadLogs(limit=50){
  if (!state.cfg.gasUrl || !state.auth) { renderLogs([]); return; }
  try{
    const url = buildUrl(state.cfg.gasUrl, { q:"logs", user_id: state.auth.user_id, limit });
    const r = await fetch(url);
    const data = await r.json();
    if (data.ok) renderLogs(data.rows);
    else logsContainer.textContent = "Error cargando historial.";
  }catch(e){
    logsContainer.textContent = "Error de red cargando historial.";
  }
}
btnReloadLogs?.addEventListener("click", ()=> loadLogs(50));

// Logout
btnLogout?.addEventListener("click", ()=>{
  stopGPSWatch(); // Detiene monitoreo GPS
  localStorage.removeItem(AUTH_KEY);
  state.auth = null;
  showLogin();
});

// ================== Service Worker ==================
if ("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").then(() => {
    updateInstallButtonVisibility();
  });
} else {
  updateInstallButtonVisibility();
}
document.addEventListener("visibilitychange", updateInstallButtonVisibility);
window.addEventListener("load", updateInstallButtonVisibility);

// ================== Bootstrap ==================
async function initializeFCM() {
  const fcmStatus = document.getElementById('fcm-status');
  
  if (!window.firebaseApp) {
    if (fcmStatus) fcmStatus.textContent = "🔔 Notificaciones: Firebase no configurado";
    console.warn('Firebase config no encontrado. Crea firebase-config.js con tus credenciales.');
    return;
  }

  try {
    const initialized = await window.firebaseApp.initialize();
    
    if (!initialized) {
      if (fcmStatus) fcmStatus.textContent = "🔔 Notificaciones: No disponibles";
      return;
    }

    // Configura listeners
    window.firebaseApp.setupListeners();

    // Solicita token FCM
    const token = await window.firebaseApp.requestToken();
    
    if (token) {
      // Guarda el token en Sheets
      await window.firebaseApp.updateToken(token);
      if (fcmStatus) fcmStatus.textContent = "🔔 Notificaciones Push: ✅ Activadas";
      console.log('✅ FCM configurado correctamente');
    } else {
      if (fcmStatus) fcmStatus.textContent = "🔔 Notificaciones: Permisos denegados";
    }
  } catch (error) {
    console.error('Error inicializando FCM:', error);
    if (fcmStatus) fcmStatus.textContent = "🔔 Notificaciones: Error de configuración";
  }
}

(async function boot(){
  if (state.cfg.gasUrl && state.auth) {
    await initCatalogs();
    hydrateProfileUI();
    scheduleLocalReminder();
    await requestGPSPermission();
    await initializeFCM(); // << Inicializa FCM al cargar
    await loadLogs(50);
    showApp();
  } else {
    showLogin();
  }
})();