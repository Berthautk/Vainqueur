// Outils communs : DOM, stockage sûr, images, contenu, WhatsApp, partage, synthèse vocale.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// **gras** → <strong>
export const gras = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// ---- Stockage local (toujours dans try/catch) ----
const mem = {};
export const store = {
  get(k, def = null) {
    try { const v = localStorage.getItem('vq:' + k); return v == null ? (k in mem ? mem[k] : def) : JSON.parse(v); } catch { return k in mem ? mem[k] : def; }
  },
  set(k, v) {
    mem[k] = v;
    try { localStorage.setItem('vq:' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ }
  }
};

// ---- Images : identifiants courts → chemins ----
export function imgSrc(id) {
  if (!id) return '';
  if (id.includes('/')) return id;
  const base = 'assets/illustrations/';
  if (/^(i)\d/.test(id)) return `${base}icones/${id}.webp`;
  if (/^(l7|p7)_/.test(id)) return `${base}lieux/${id}.webp`;
  return `${base}personnages/${id}.webp`;
}
export const img = (id, alt = '', cls = '', lazy = true) =>
  h('img', { src: imgSrc(id), alt, class: cls, loading: lazy ? 'lazy' : null, decoding: 'async' });

// ---- Contenu JSON (réseau d'abord, repli sur le cache du service worker) ----
const cacheContenu = {};
export async function contenu(nom) {
  if (cacheContenu[nom]) return cacheContenu[nom];
  const r = await fetch(`content/${nom}.json`);
  if (!r.ok) throw new Error('contenu ' + nom);
  return (cacheContenu[nom] = await r.json());
}

// ---- Icônes SVG ----
const P = {
  retour: '<path d="M15 5l-7 7 7 7M8 12h12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  pause: '<rect x="6" y="5" width="4.5" height="14" rx="1" fill="currentColor"/><rect x="13.5" y="5" width="4.5" height="14" rx="1" fill="currentColor"/>',
  prec: '<path d="M6 5v14M19 5v14l-10-7z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  suiv: '<path d="M18 5v14M5 5v14l10-7z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  aleatoire: '<path d="M3 7h3c5 0 5 10 10 10h3M3 17h3c1.7 0 2.8-1 3.8-2.3M13 8.3C13.8 7.5 14.8 7 16 7h3M17 4l3 3-3 3M17 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  repeter: '<path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  casque: '<path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="3" y="14" width="4" height="7" rx="1.5" fill="currentColor"/><rect x="17" y="14" width="4" height="7" rx="1.5" fill="currentColor"/>',
  telecharger: '<path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  partager: '<circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="5.5" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="18.5" r="2.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.3 10.8l7.4-4M8.3 13.2l7.4 4" stroke="currentColor" stroke-width="2"/>',
  coeur: '<path d="M12 20.5S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9C20.5 15 12 20.5 12 20.5z" fill="currentColor"/>',
  coeurV: '<path d="M12 20.5S3.5 15 3.5 8.9A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 1.9C20.5 15 12 20.5 12 20.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  horloge: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  livre: '<path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5zM12 6.5v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  musique: '<path d="M9 18V6l11-2v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.8" fill="currentColor"/><circle cx="17.5" cy="16" r="2.8" fill="currentColor"/>',
  soleil: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lune: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  coche: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
  chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="currentColor"/><circle cx="8" cy="11" r="1.3" fill="#fff"/><circle cx="12" cy="11" r="1.3" fill="#fff"/><circle cx="16" cy="11" r="1.3" fill="#fff"/>',
  mains: '<path d="M12 3c-2.5 3-3.5 6-3.5 9.5V18l3.5 3 3.5-3v-5.5C15.5 9 14.5 6 12 3zM8.5 12.5 4 10.5v5.5l4.5 2M15.5 12.5l4.5-2v5.5l-4.5 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10.5 10.5 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="19.5" r="1.6" fill="currentColor"/>',
  micro: '<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  texte: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.8" fill="currentColor"/><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  suivant: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  gauche: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  loupe: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  groupe: '<circle cx="12" cy="8" r="3" fill="currentColor"/><circle cx="5.5" cy="10" r="2.3" fill="currentColor"/><circle cx="18.5" cy="10" r="2.3" fill="currentColor"/><path d="M6.5 20c0-4 2-6 5.5-6s5.5 2 5.5 6zM1 18c0-3 1.5-4.5 4-4.5M23 18c0-3-1.5-4.5-4-4.5" fill="currentColor"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2" fill="currentColor"/><path d="M17 10l5-3v10l-5-3z" fill="currentColor"/>',
  porte: '<path d="M10 4v16M4 12h16M7 7h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  croix: '<path d="M12 2v20M5 8h14" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/>',
  calendrier: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" stroke="currentColor" stroke-width="2.2"/>'
};
export function ico(nom, cls = '') {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  s.innerHTML = P[nom] || '';
  return s;
}

// ---- Toast ----
let tToast;
export function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.hidden = false;
  clearTimeout(tToast); tToast = setTimeout(() => { t.hidden = true; }, 2600);
}

// ---- Feuille modale ----
export function feuille(contenuNode) {
  const f = $('#feuille');
  f.replaceChildren(h('div', { role: 'dialog', 'aria-modal': 'true' }, contenuNode));
  f.hidden = false;
  const ferme = () => { f.hidden = true; f.replaceChildren(); };
  f.onclick = e => { if (e.target === f) ferme(); };
  return ferme;
}

// ---- WhatsApp / Telegram ----
let config;
export async function getConfig() { return config || (config = await contenu('config')); }
export async function ouvrirWhatsApp(cle, suffixe = '') {
  const c = await getConfig();
  const msg = (c.messages[cle] || '') + suffixe;
  const num = String(c.whatsapp || '').replace(/\D/g, '');
  if (!num) return toast('Contact WhatsApp pas encore configuré — bientôt disponible');
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
}
export const lienPret = url => !!url && !/A_COMPLETER/i.test(url);
export async function ouvrirLien(url) {
  if (!lienPret(url)) return toast('Lien pas encore disponible — bientôt');
  window.open(url, '_blank', 'noopener');
}

// ---- Partage ----
export async function partager(titre, texte) {
  const url = location.origin + location.pathname;
  try {
    if (navigator.share) { await navigator.share({ title: titre, text: texte, url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${texte}\n${url}`); toast('Copié'); }
  catch { toast('Partage indisponible sur cet appareil'); }
}

// ---- Synthèse vocale (repli quand il n'y a pas de MP3) ----
export const tts = {
  dispo: 'speechSynthesis' in window,
  actif: false,
  parler(texte, fin) {
    if (!this.dispo) { toast('La lecture vocale n\'est pas disponible sur cet appareil'); return false; }
    this.stop();
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR'; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
    if (v) u.voice = v;
    u.onend = u.onerror = () => { this.actif = false; fin && fin(); };
    window.dispatchEvent(new Event('vq-tts'));
    this.actif = true; speechSynthesis.speak(u);
    return true;
  },
  stop() { if (this.dispo) speechSynthesis.cancel(); this.actif = false; }
};

export const mmss = s => {
  if (!isFinite(s)) return '0:00';
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const badgeEx = o => (o && o.exemple) ? h('span', { class: 'badge-ex' }, 'Exemple') : null;
export const octets = n => n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' Ko';

// ---- Prière : jour du thème et fiche du jour ----
export const aujourdhui = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function jourTheme(t) {
  if (t && t.debut) {
    const n = Math.floor((new Date(aujourdhui() + 'T00:00:00') - new Date(t.debut + 'T00:00:00')) / 864e5) + 1;
    return Math.min(Math.max(n, 1), t.total || 7);
  }
  return (t && t.jour) || 1;
}
export function ficheDuJour(d) {
  if (d.du_jour && d.du_jour !== 'auto') return d.fiches.find(f => f.id === d.du_jour) || d.fiches[0];
  return d.fiches[(jourTheme(d.theme) - 1) % d.fiches.length];
}
export const prieAujourdhui = id => ['matin', 'soir'].some(p => store.get(`prie:${id}:${p}`, '') === aujourdhui());
