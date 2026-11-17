// Téléchargements audio hors connexion (Cache API). Le cache « vainqueur-audio » n'est jamais purgé par les mises à jour.
import { toast, octets } from './util.js';
const NOM = 'vainqueur-audio';
const meta = () => { try { return JSON.parse(localStorage.getItem('vq:dlmeta') || '{}'); } catch { return {}; } };
const setMeta = m => { try { localStorage.setItem('vq:dlmeta', JSON.stringify(m)); } catch { /* ignoré */ } };
const abs = u => new URL(u, document.baseURI).href;

export const dispo = () => 'caches' in window;
export async function estGarde(url) {
  if (!dispo()) return false;
  try { return !!(await (await caches.open(NOM)).match(abs(url))); } catch { return false; }
}
export async function telecharger(url, titre) {
  if (!dispo()) return toast('Téléchargement non disponible sur cet appareil');
  if (!navigator.onLine) return toast('Connexion nécessaire pour télécharger');
  try {
    toast('Téléchargement…');
    const r = await fetch(url);
    if (!r.ok) throw new Error('http ' + r.status);
    const blob = await r.blob();
    const c = await caches.open(NOM);
    await c.put(abs(url), new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/mpeg', 'Content-Length': blob.size } }));
    const m = meta(); m[abs(url)] = { titre, taille: blob.size, date: Date.now() }; setMeta(m);
    toast('Téléchargé ✔');
    return true;
  } catch { toast('Échec du téléchargement'); return false; }
}
export async function supprimer(url) {
  try { await (await caches.open(NOM)).delete(abs(url)); const m = meta(); delete m[abs(url)]; setMeta(m); } catch { /* ignoré */ }
}
export async function lister() {
  if (!dispo()) return [];
  try {
    const c = await caches.open(NOM); const m = meta(); const out = [];
    for (const req of await c.keys()) {
      let taille = m[req.url]?.taille;
      if (!taille) { const b = await (await c.match(req)).blob(); taille = b.size; }
      out.push({ url: req.url, titre: m[req.url]?.titre || decodeURIComponent(req.url.split('/').pop()), taille });
    }
    return out;
  } catch { return []; }
}
export { octets };
