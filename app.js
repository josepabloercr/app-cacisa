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
const cfgInput   = $("#cfg-url");
const loginUser  = $("#login-user");
const loginPin   = $("#login-pin");
const btnLogin   = $("#btn-login");
const btnCfgSave = $("#cfg-save");
const loginMsg   = $("#login-msg");

// ----- Perfil / recordatorios -----
const txtUser    = $("#txt-user");
const txtEstado  = $("#txt-estado");
const chkSalida  = $("#chk-salida");
const timeRem    = $("#time-rem");
const btnSaveRem = $("#btn-save-rem");

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
  gpsWatchId: null  // << ID del watcher de GPS continuo
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
  state.online = v;
  statusPill.textContent = v ? "online" : "offline";
  statusPill.className = "pill " + (v ? "ok" : "bad");
  if (v) trySync();
}
window.addEventListener("online",  () => setOnline(true));
window.addEventListener("offline", () => setOnline(false));
setOnline(navigator.onLine);

// ================== Storage ==================
function loadCfg(){
  try { state.cfg = JSON.parse(localStorage.getItem(CFG_KEY) || "{}"); } catch {}
  if (!state.cfg) state.cfg = {};
  cfgInput.value = state.cfg.gasUrl || "";
}
function saveCfg(){
  state.cfg.gasUrl = cfgInput.value.trim();
  localStorage.setItem(CFG_KEY, JSON.stringify(state.cfg));
}
function loadAuth(){ try { state.auth = JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { state.auth = null; } }
function saveAuth(){ localStorage.setItem(AUTH_KEY, JSON.stringify(state.auth)); }
function loadOutbox(){ try { state.outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); } catch { state.outbox = []; } }
function saveOutbox(){ localStorage.setItem(OUTBOX_KEY, JSON.stringify(state.outbox)); }

loadCfg(); loadAuth(); loadOutbox();

btnCfgSave?.addEventListener("click", () => { saveCfg(); toastMsg(loginMsg, "GAS_URL guardada ✅"); });

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
  saveCfg();
  
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
    await requestGPSPermission(); // << Solicita GPS al login
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
  chkSalida.checked = (state.auth.estado === "salida");
  timeRem.value = state.auth.reminder_hhmm || "";
}

btnSaveRem?.addEventListener("click", async ()=>{
  if (!state.auth || !state.cfg.gasUrl) return;

  const newEstado = chkSalida.checked ? "salida" : "activo";
  const reminder  = timeRem.value || "";

  const payload = {
    type: "update_user",
    user_id: state.auth.user_id,
    estado: newEstado,
    reminder_hhmm: reminder,
    recibir_notif: true
  };

  try {
    const r = await fetch(state.cfg.gasUrl, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { ok:false, error:"non_json_response" }; }
    if (!data.ok) throw new Error(data.error || "post_failed");

    state.auth.estado = newEstado; state.auth.reminder_hhmm = reminder;
    saveAuth(); hydrateProfileUI(); scheduleLocalReminder();
    alert("Preferencias guardadas ✅");
    return;
  } catch (e) { console.warn("POST update_user falló, probando GET:", e); }

  try {
    const u = buildUrl(state.cfg.gasUrl, {
      q: "update_user",
      payload: JSON.stringify({
        user_id: state.auth.user_id,
        estado: newEstado,
        reminder_hhmm: reminder,
        recibir_notif: true
      })
    });
    const r2 = await fetch(u, { method: "GET", cache:"no-store" });
    const data2 = await r2.json();
    if (!data2.ok) throw new Error(data2.error || "get_failed");

    state.auth.estado = newEstado; state.auth.reminder_hhmm = reminder;
    saveAuth(); hydrateProfileUI(); scheduleLocalReminder();
    alert("Preferencias guardadas ✅ (vía respaldo)");
  } catch (e2) {
    console.error("Fallback GET update_user falló:", e2);
    alert("Error guardando preferencias.");
  }
});

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
$("#btn-wa")?.addEventListener("click", ()=>{
  let mensajeFinal = mensaje.value || "";
  
  // Agrega enlace de Google Maps si hay coordenadas
  if (state.currentLocation) {
    const lat = state.currentLocation.latitude.toFixed(6);
    const lon = state.currentLocation.longitude.toFixed(6);
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    
    // Agrega el enlace al final del mensaje si no está ya
    if (!mensajeFinal.includes(mapsUrl)) {
      mensajeFinal += `\n\n📍 Ubicación: ${mapsUrl}`;
    }
  }
  
  const url = "https://wa.me/?text=" + encodeURIComponent(mensajeFinal);
  window.open(url, "_blank");
});

// ================== Guardado ==================
$("#btn-guardar")?.addEventListener("click", async ()=>{
  // Verifica si hay GPS disponible
  if (!state.currentLocation) {
    console.warn("⚠️ No hay coordenadas GPS disponibles al guardar");
  } else {
    console.log("✅ Guardando con GPS:", {
      lat: state.currentLocation.latitude,
      lon: state.currentLocation.longitude,
      accuracy: state.currentLocation.accuracy
    });
  }
  
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
    // << CAMPOS DE GPS (actualizados automáticamente)
    latitud: state.currentLocation?.latitude || null,
    longitud: state.currentLocation?.longitude || null,
    gps_accuracy: state.currentLocation?.accuracy || null,
    gps_timestamp: state.currentLocation?.timestamp || null
  };
  
  console.log("📦 Payload a enviar:", JSON.stringify(payload, null, 2));

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

  if (Notification && Notification.permission === "default") Notification.requestPermission();

  state.reminderTimer = setInterval(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,"0");
    const m = String(now.getMinutes()).padStart(2,"0");
    if (`${h}:${m}` === hhmm) {
      if (window.__lastReminderStamp === `${h}:${m}`) return;
      window.__lastReminderStamp = `${h}:${m}`;
      const body = `Hola ${state.auth.nombre}, este es tu recordatorio diario.\n(Se desactiva si marcas "Estoy de salida".)`;
      if (Notification && Notification.permission === "granted") new Notification("Recordatorio", { body });
      else alert(body);
    }
  }, 15 * 1000);
}

// ================== Historial ==================
function renderLogs(rows){
  if (!rows || !rows.length){ logsContainer.innerHTML = "Sin datos"; return; }
  const html = [
    `<div style="overflow:auto"><table style="width:100%; border-collapse:collapse">`,
    `<thead><tr>
      <th style="text-align:left; border-bottom:1px solid #444; padding:.25rem .4rem;">Fecha</th>
      <th style="text-align:left; border-bottom:1px solid #444; padding:.25rem .4rem;">Prefijo</th>
      <th style="text-align:left; border-bottom:1px solid #444; padding:.25rem .4rem;">Mensaje</th>
      <th style="text-align:left; border-bottom:1px solid #444; padding:.25rem .4rem;">Acción</th>
    </tr></thead><tbody>`
  ];
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
    html.push(`<tr>
      <td style="padding:.25rem .4rem; vertical-align:top">${fecha}</td>
      <td style="padding:.25rem .4rem; vertical-align:top; white-space:nowrap">${pref}</td>
      <td style="padding:.25rem .4rem; vertical-align:top">${(r.mensaje || "").replace(/\n/g,"<br>")}</td>
      <td style="padding:.25rem .4rem; vertical-align:top">
        <button data-msg='${encodeURIComponent(r.mensaje || "")}' data-pref='${encodeURIComponent(pref)}' class="btn-use">Usar</button>
      </td>
    </tr>`);
  });
  html.push(`</tbody></table></div>`);
  logsContainer.innerHTML = html.join("");

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
(async function boot(){
  if (state.cfg.gasUrl && state.auth) {
    await initCatalogs();
    hydrateProfileUI();
    scheduleLocalReminder();
    await requestGPSPermission(); // << Solicita GPS al cargar
    await loadLogs(50);
    showApp();
  } else {
    showLogin();
  }
})();