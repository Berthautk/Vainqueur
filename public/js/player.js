// Lecteur GLOBAL : un seul lecteur pour toute l'application.
// Une piste joue soit un fichier audio (MP3), soit, sans MP3, son texte lu par la voix du téléphone.
// piste = { id, titre, audio, texte, image, type, lien }
import { store, toast, imgSrc, mmss } from './util.js';

const audio = new Audio();
audio.preload = 'metadata';
const ecouteurs = new Set();
export const etat = { file: [], index: -1, piste: null, aleatoire: false, repeter: false };

export const sur = f => { ecouteurs.add(f); return () => ecouteurs.delete(f); };
const emettre = t => ecouteurs.forEach(f => { try { f(t); } catch (e) { console.error(e); } });

// ---------- Voix du téléphone (synthèse vocale), lue phrase par phrase ----------
const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
const voix = { morceaux: [], i: 0, joue: false, jeton: 0 };
let voixFr = null;
function choisirVoix() {
  if (!synth) return;
  const v = synth.getVoices();
  voixFr = v.find(x => /^fr[-_]FR/i.test(x.lang)) || v.find(x => /^fr/i.test(x.lang)) || null;
}
if (synth) { choisirVoix(); try { synth.addEventListener('voiceschanged', choisirVoix); } catch { synth.onvoiceschanged = choisirVoix; } }

function decouper(texte) {
  const phrases = String(texte).replace(/\*\*/g, '').replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*\s*/g) || [texte];
  const out = []; let c = '';
  for (const p of phrases) { if ((c + p).length > 180 && c) { out.push(c.trim()); c = p; } else c += p; }
  if (c.trim()) out.push(c.trim());
  return out;
}
export const estVoix = p => !!p && !p.audio && !!p.texte;

function parler() {
  if (!synth) { voix.joue = false; emettre('etat'); toast('La lecture vocale n\'est pas disponible sur ce téléphone'); return; }
  const j = ++voix.jeton;
  synth.cancel();
  if (voix.i >= voix.morceaux.length) { voix.joue = false; voix.i = 0; emettre('etat'); suivant(true); return; }
  const u = new SpeechSynthesisUtterance(voix.morceaux[voix.i]);
  u.lang = 'fr-FR'; u.rate = 0.95;
  if (voixFr) u.voice = voixFr;
  u.onend = () => { if (j !== voix.jeton) return; voix.i++; emettre('temps'); parler(); };
  u.onerror = e => {
    if (j !== voix.jeton || e.error === 'interrupted' || e.error === 'canceled') return;
    voix.joue = false; emettre('etat'); toast('La voix du téléphone n\'a pas pu lire ce texte. Vérifie « Synthèse vocale » (voix française) dans les réglages du téléphone.');
  };
  voix.joue = true; synth.speak(u); emettre('etat');
}
function stopVoix() { voix.jeton++; voix.joue = false; if (synth) synth.cancel(); }

// ---------- État ----------
export const lit = () => (estVoix(etat.piste) ? voix.joue : !audio.paused);
export function temps() {
  if (estVoix(etat.piste)) return { t: voix.i, d: voix.morceaux.length, voix: true };
  return { t: audio.currentTime || 0, d: audio.duration || 0 };
}
export function libelleTemps() {
  const x = temps();
  if (x.voix) return x.d ? `Voix · ${Math.min(x.t + 1, x.d)}/${x.d}` : 'Voix';
  return `${mmss(x.t)} / ${x.d ? mmss(x.d) : '–:––'}`;
}

function media() {
  if (!('mediaSession' in navigator) || !etat.piste) return;
  const p = etat.piste;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: p.titre, artist: 'Vainqueur — Les Vainqueurs de Dieu', artwork: p.image ? [{ src: new URL(imgSrc(p.image), document.baseURI).href, sizes: '380x330', type: 'image/webp' }] : [] });
    navigator.mediaSession.setActionHandler('play', () => lire());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', etat.file.length > 1 ? () => precedent() : null);
    navigator.mediaSession.setActionHandler('nexttrack', etat.file.length > 1 ? () => suivant() : null);
  } catch { /* ignoré */ }
}

// ---------- Commandes ----------
// file = la liste dans laquelle « précédent / suivant » se déplacent
export function jouer(piste, file = [piste]) {
  etat.file = file && file.length ? file : [piste];
  etat.index = etat.file.findIndex(p => p.id === piste.id);
  if (etat.index < 0) { etat.file = [piste, ...etat.file]; etat.index = 0; }
  charger(etat.file[etat.index], true);
}
function charger(p, auto) {
  const change = !etat.piste || etat.piste.id !== p.id;
  stopVoix();
  etat.piste = p;
  if (estVoix(p)) {
    audio.pause();
    if (change || !voix.morceaux.length) { voix.morceaux = decouper(p.texte); voix.i = 0; }
  } else {
    const url = new URL(p.audio, document.baseURI).href;
    if (audio.src !== url) audio.src = p.audio;
    else if (change) { try { audio.currentTime = 0; } catch { /* ignoré */ } }
  }
  media();
  emettre('piste');
  if (auto) lire();
}
export function lire() {
  if (!etat.piste) return;
  if (estVoix(etat.piste)) { parler(); return; }
  stopVoix();
  audio.play().catch(() => toast(navigator.onLine ? 'Lecture impossible pour le moment' : 'Pas encore téléchargé : reconnecte-toi, ou télécharge-le pour l\'écouter sans internet', navigator.onLine ? null : { label: 'Mes téléchargements', href: '#/telechargements' }));
}
export function pause() {
  if (estVoix(etat.piste)) { stopVoix(); emettre('etat'); }
  else audio.pause();
}
export const basculer = () => (lit() ? pause() : lire());
export function aller(t) {
  if (estVoix(etat.piste)) {
    voix.i = Math.max(0, Math.min(Math.floor(t), voix.morceaux.length - 1));
    if (voix.joue) parler(); else emettre('temps');
    return;
  }
  if (isFinite(audio.duration)) audio.currentTime = t;
}
function redemarrer() {
  if (estVoix(etat.piste)) { voix.i = 0; parler(); }
  else { audio.currentTime = 0; lire(); }
}
function finir() {
  if (estVoix(etat.piste)) { stopVoix(); voix.i = 0; }
  else { audio.pause(); try { audio.currentTime = 0; } catch { /* ignoré */ } }
  emettre('etat'); emettre('temps');
}
export function suivant(auto = false) {
  const n = etat.file.length;
  if (!n) return;
  if (n === 1) { if (auto && !etat.repeter) finir(); else redemarrer(); return; }
  let i;
  if (etat.aleatoire) { do { i = Math.floor(Math.random() * n); } while (i === etat.index); }
  else i = etat.index + 1;
  if (i >= n) { if (auto && !etat.repeter) { finir(); return; } i = 0; }
  etat.index = i; charger(etat.file[i], true);
}
export function precedent() {
  const n = etat.file.length;
  if (n < 2) { redemarrer(); return; }
  etat.index = (etat.index - 1 + n) % n;
  charger(etat.file[etat.index], true);
}
export const basculerAleatoire = () => { etat.aleatoire = !etat.aleatoire; emettre('mode'); };
export const basculerRepeter = () => { etat.repeter = !etat.repeter; emettre('mode'); };
// Ferme le lecteur (croix du mini-lecteur)
export function arreter() {
  stopVoix(); audio.pause(); audio.removeAttribute('src'); audio.load();
  etat.piste = null; etat.file = []; etat.index = -1;
  store.set('derniere', null);
  emettre('piste');
}

audio.addEventListener('play', () => emettre('etat'));
audio.addEventListener('pause', () => emettre('etat'));
audio.addEventListener('timeupdate', () => {
  emettre('temps');
  const p = etat.piste;
  if (p && p.type === 'adoration' && Math.floor(audio.currentTime) % 5 === 0) store.set('derniere', { id: p.id, t: audio.currentTime });
});
audio.addEventListener('loadedmetadata', () => emettre('temps'));
audio.addEventListener('ended', () => { if (!estVoix(etat.piste)) suivant(true); });
audio.addEventListener('error', () => { if (navigator.onLine && etat.piste && !estVoix(etat.piste) && audio.getAttribute('src')) toast('Audio indisponible pour le moment'); });

// Restaure la dernière adoration écoutée (sans lancer la lecture)
export function restaurer(pistes) {
  const d = store.get('derniere');
  if (!d || etat.piste) return;
  const p = pistes.find(x => x.id === d.id && x.audio);
  if (!p) return;
  etat.file = pistes; etat.index = pistes.indexOf(p); etat.piste = p;
  audio.src = p.audio;
  audio.addEventListener('loadedmetadata', function f() { try { audio.currentTime = d.t || 0; } catch { /* ignoré */ } audio.removeEventListener('loadedmetadata', f); });
  media();
  emettre('piste');
}
