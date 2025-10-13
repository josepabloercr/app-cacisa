// ===== Sheets → WhatsApp (PWA) =====
// app.js COMPLETO (móvil + PWA install + offline + logs)

// --- UUID compatible (polyfill) ---
function uuid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (_) {}
  const arr = (typeof crypto !== "undefined" && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint8Array(16))
    : Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  arr[6] = (arr[6] & 0x0f) | 0x40; // v4
  arr[8] = (arr[8] & 0x3f) | 0x80; // variant
  const hex = [...arr].map(b => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") + "-" +
    hex.slice(4, 6).join("") + "-" +
    hex.slice(6, 8).join("") + "-" +
    hex.slice(8,10).join("") + "-" +
    hex.slice(10,16).join("")
  );
}

// Utilidad para seleccionar
const $ = (sel) => document.querySelector(sel);

// ----- Vistas -----
const viewLogin = $("#view-login");
const viewApp   = $("#view-app");

// ----- Header / estado -----
const statusPill = $("#status");
const btnInstall = $("#btn-install"); // debe existir en HTML

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

// ----- Historial / logout -----
const logsContainer  = $("#logs");
const btnReloadLogs  = $("#btn-reload-logs");
const btnLogout      = $("#btn-logout");

// ----- Claves de storage -----
const CFG_KEY    = "pwa_cfg";
const AUTH_KEY   = "pwa_auth";
const OUTBOX_KEY = "pwa_outbox";

// ----- Estado -----
const state = {
  online: navigator.onLine,
  cfg: { gasUrl: "" },
  auth: null, // { user_id, nombre, estado, recibir_notif, reminder_hhmm }
  zonas: [], contratos: [], rutas: [], secciones: [], items: [],
  outbox: [],
  reminderTimer: null,
  deferredPrompt: null
};

// ================== Helpers ==================
function placeholderOption(label){ return `<option value="" disabled selected hidden>${label}</option>`; }
function showLogin(){ viewLogin.classList.remove("hide"); viewApp.classList.add("hide"); }
function showApp(){ viewLogin.classList.add("hide"); viewApp.classList.remove("hide"); }
function setEstadoPill(estado){
  txtEstado.textContent = estado || "-";
  txtEstado.className = "pill " + ((estado === "salida") ? "bad" : "ok");
}
function toastMsg(el, msg){ if (!el) { alert(msg); return; } el.textContent = msg; setTimeout(()=>{ el.textContent=""; }, 2000); }

// Construye URL segura aun si la base ya trae ?param=...
function buildUrl(base, params = {}) {
  const u = new URL(base);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.toString();
}

// ================== Install PWA (robusto) ==================
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function updateInstallButtonVisibility() {
  if (!btnInstall) return;
  // iOS no soporta beforeinstallprompt; muestra botón solo en navegadores compatibles
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
    await state.deferredPrompt.userChoice; // { outcome: "accepted" | "dismissed" }
    state.deferredPrompt = null;
    updateInstallButtonVisibility();
  });
}
window.addEventListener("appinstalled", () => {
  state.deferredPrompt = null;
  updateInstallButtonVisibility();
  try { console.log("PWA instalada"); } catch {}
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

// Init storage
loadCfg(); loadAuth(); loadOutbox();

// Botón “Guardar GAS_URL”
btnCfgSave?.addEventListener("click", () => { saveCfg(); toastMsg(loginMsg, "GAS_URL guardada ✅"); });

// ================== LOGIN ==================
btnLogin?.addEventListener("click", async ()=>{
  saveCfg();
  if (!state.cfg.gasUrl) { loginMsg.textContent = "Configura la GAS_URL primero."; return; }

  const user = (loginUser.value || "").trim();
  const pin  = (loginPin.value  || "").trim();
  if (!user || !pin) { loginMsg.textContent = "Usuario y PIN son obligatorios."; return; }

  try {
    const urlLogin = buildUrl(state.cfg.gasUrl, { q: "login", user_id: user, pin });
    const resp = await fetch(urlLogin);
    const raw  = await resp.text();
    let data; try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no JSON: " + raw.slice(0,200)); }
    if (!data.ok) { loginMsg.textContent = data.error || "Error de aplicación"; return; }

    state.auth = data.user; saveAuth();
    await initCatalogs();
    hydrateProfileUI();
    scheduleLocalReminder();
    await loadLogs(50);
    showApp();
  } catch (e) {
    loginMsg.textContent = "Error conectando con el servidor: " + String(e).slice(0,200);
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

  // 1) Intento por POST
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

  // 2) Fallback por GET
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

// ================== Carga de catálogos ==================
async function initCatalogs(){
  try{
    const r = await fetch(buildUrl(state.cfg.gasUrl, { q: "catalogos" }));
    const data = await r.json();
    state.zonas = data.zonas || [];
    state.contratos = data.contratos || [];
  }catch(err){
    state.zonas = (typeof LOCAL_ZONAS !== "undefined") ? LOCAL_ZONAS.slice() : [];
    state.contratos = (typeof LOCAL_CONTRATOS !== "undefined") ? LOCAL_CONTRATOS.slice() : [];
  }
  fillZonas();
  await onZonaChange();
}

function fillZonas(){
  zona.innerHTML = placeholderOption("Selecciona una zona") +
    state.zonas.map(z => `<option value="${z.zona_id}">${z.zona_nombre || z.zona_id}</option>`).join("");
  zona.value = "";
}
function fillContratos(){
  const z = zona.value;
  const filtrados = state.contratos.filter(c => (c.zona_id === z || c.zona_id === "ambas"));
  contrato.innerHTML = placeholderOption("Selecciona un contrato") +
    filtrados.map(c => `<option value="${c.contrato_id}">${c.contrato_id}</option>`).join("");
  contrato.value = "";
}
function fillRutas(){
  ruta.innerHTML = placeholderOption("Selecciona una ruta") +
    state.rutas.map(r => `<option value="${r.ruta_codigo}">${r.ruta_nombre || r.ruta_codigo}</option>`).join("");
  ruta.value = "";
}
function fillSecciones(){
  seccion.innerHTML = placeholderOption("Selecciona una sección") +
    state.secciones.map(s => `<option value="${s.seccion_control}">${s.seccion_control}</option>`).join("");
  seccion.value = "";
}

async function fetchRutas(z){
  try{
    const r = await fetch(buildUrl(state.cfg.gasUrl, { q:"rutas", zona: z }));
    const data = await r.json();
    state.rutas = data.rutas || [];
  }catch(e){
    state.rutas = (typeof LOCAL_RUTAS !== "undefined" ? (LOCAL_RUTAS[z] || []) : []);
  }
}
async function fetchSecciones(z, rcode){
  try{
    const x = await fetch(buildUrl(state.cfg.gasUrl, { q:"secciones", zona: z, ruta: rcode }));
    const data = await x.json();
    state.secciones = data.secciones || [];
  }catch(e){
    const key = `${z}:${rcode}`;
    state.secciones = (typeof LOCAL_SECCIONES !== "undefined" ? (LOCAL_SECCIONES[key] || []) : []);
  }
}
async function fetchItems(contratoId, search=""){
  const z = zona.value || "";
  try{
    const r = await fetch(buildUrl(state.cfg.gasUrl, { q:"items", contrato: contratoId, zona: z, search }));
    const d = await r.json();
    state.items = d.items || [];
  }catch(e){
    let list = [];
    if (typeof LOCAL_ITEMS !== "undefined") {
      list = (LOCAL_ITEMS[`${contratoId}::${z}`] || []).concat(LOCAL_ITEMS[`${contratoId}::ambas`] || []);
      if (search){
        const s = search.toLowerCase();
        list = list.filter(x =>
          String(x.item_codigo||"").toLowerCase().includes(s) ||
          String(x.item_nombre||"").toLowerCase().includes(s)
        );
      }
    }
    state.items = list;
  }
  itemList.innerHTML = state.items.map(x => `<option value="${(x.item_codigo||"")+" - "+(x.item_nombre||"")}"></option>`).join("");
}

// ---- Flujos de cambio (wrappers) ----
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

// ================== Eventos de selects/inputs ==================
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
const PREFIX_RE = /^(?:\[[^\]]+\]\s+){1,6}—\s*/; // 1..6 bloques
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
  const url = "https://wa.me/?text=" + encodeURIComponent(mensaje.value || "");
  window.open(url, "_blank");
});

// ================== Guardado ==================
$("#btn-guardar")?.addEventListener("click", async ()=>{
  let item_codigo = "", item_nombre = "";
  const raw = (itemInput.value || "").trim();
  const m = raw.match(/^\s*([^-\[]+?)\s*-\s*(.+)\s*$/); // "codigo - nombre"
  if (m) { item_codigo = m[1].trim(); item_nombre = m[2].trim(); }
  else   { item_nombre = raw; }

  const payload = {
    type:"append_log",
    zona_id: zona.value || "",
    contrato_id: contrato.value || "",
    ruta_codigo: ruta.value || "",
    seccion_control: seccion.value || "",
    item_codigo, item_nombre,
    kilometraje: "", // omitido por ahora
    mensaje: mensaje.value || "",
    estado_sync: state.online ? "online" : "offline",
    timestamp: Date.now(),
    msg_id: uuid(),
    usuario_id: state.auth?.user_id || ""
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
    await loadLogs(50); // refresca historial
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
  try{
    await fetch(state.cfg.gasUrl, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(next.item) });
    state.outbox.shift(); saveOutbox();
    if (state.outbox.length) setTimeout(trySync, 200);
  }catch(e){
    next.attempts++; const delay = Math.min(30000, 1000 * Math.pow(2, next.attempts));
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
    await loadLogs(50);
    showApp();
  } else {
    showLogin();
  }
})();
