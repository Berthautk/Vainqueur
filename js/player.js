// Lecteur audio GLOBAL : un seul <audio> pour toute l'application.
import { store, toast, imgSrc, tts } from './util.js';

const audio = new Audio();
audio.preload = 'metadata';
const ecouteurs = new Set();
export const etat = { file: [], index: -1, piste: null, aleatoire: false, repeter: false };

export const sur = f => { ecouteurs.add(f); return () => ecouteurs.delete(f); };
const emettre = t => ecouteurs.forEach(f => f(t));

export const lit = () => !audio.paused;
export const temps = () => ({ t: audio.currentTime || 0, d: audio.duration || 0 });

function media() {
  if (!('mediaSession' in navigator) || !etat.piste) return;
  const p = etat.piste;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({ title: p.titre, artist: 'Vainqueur — Les Vainqueurs de Dieu', artwork: p.image ? [{ src: new URL(imgSrc(p.image), document.baseURI).href, sizes: '380x330', type: 'image/webp' }] : [] });
    navigator.mediaSession.setActionHandler('play', () => lire());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => precedent());
    navigator.mediaSession.setActionHandler('nexttrack', () => suivant());
  } catch { /* ignoré */ }
}

// piste = { id, titre, audio, image, duree, type }
export function jouer(piste, file = [piste]) {
  etat.file = file; etat.index = Math.max(0, file.findIndex(p => p.id === piste.id));
  charger(piste, true);
}
function charger(piste, auto) {
  etat.piste = piste;
  const meme = audio.src && audio.src === new URL(piste.audio, document.baseURI).href;
  if (!meme) audio.src = piste.audio;
  media();
  emettre('piste');
  if (auto) lire();
}
export function lire() {
  if (!etat.piste) return;
  tts.stop();
  audio.play().catch(() => toast('Lecture impossible (hors connexion ?)'));
}
export const pause = () => audio.pause();
export const basculer = () => (audio.paused ? lire() : pause());
export const aller = t => { if (isFinite(audio.duration)) audio.currentTime = t; };
export function suivant(auto = false) {
  if (!etat.file.length) return;
  if (auto && etat.repeter && etat.file.length === 1) { audio.currentTime = 0; return lire(); }
  let i = etat.aleatoire && etat.file.length > 1
    ? (() => { let n; do { n = Math.floor(Math.random() * etat.file.length); } while (n === etat.index); return n; })()
    : etat.index + 1;
  if (i >= etat.file.length) { if (etat.repeter || !auto) i = 0; else { audio.currentTime = 0; pause(); return; } }
  etat.index = i; charger(etat.file[i], true);
}
export function precedent() {
  if (audio.currentTime > 3 || etat.index <= 0) { audio.currentTime = 0; return; }
  etat.index--; charger(etat.file[etat.index], true);
}
export const basculerAleatoire = () => { etat.aleatoire = !etat.aleatoire; emettre('mode'); };
export const basculerRepeter = () => { etat.repeter = !etat.repeter; emettre('mode'); };
export function arreter() { audio.pause(); audio.removeAttribute('src'); etat.piste = null; emettre('piste'); }

audio.addEventListener('play', () => emettre('etat'));
window.addEventListener('vq-tts', () => audio.pause());
audio.addEventListener('pause', () => emettre('etat'));
audio.addEventListener('timeupdate', () => {
  emettre('temps');
  if (etat.piste && Math.floor(audio.currentTime) % 5 === 0) store.set('derniere', { id: etat.piste.id, t: audio.currentTime });
});
audio.addEventListener('loadedmetadata', () => emettre('temps'));
audio.addEventListener('ended', () => suivant(true));
audio.addEventListener('error', () => { if (audio.src) toast('Audio indisponible — télécharge-le pour l\'écouter hors connexion'); });

// Restaure la dernière écoute (sans lancer la lecture)
export function restaurer(pistes) {
  const d = store.get('derniere');
  if (!d || etat.piste) return;
  const p = pistes.find(x => x.id === d.id);
  if (!p) return;
  etat.file = pistes; etat.index = pistes.indexOf(p); etat.piste = p;
  audio.src = p.audio;
  audio.addEventListener('loadedmetadata', function f() { try { audio.currentTime = d.t || 0; } catch { /* ignoré */ } audio.removeEventListener('loadedmetadata', f); });
  emettre('piste');
}
