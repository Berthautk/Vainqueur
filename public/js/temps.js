// Temps passé par rubrique (« Mes temps avec Dieu »). Tout reste sur ce téléphone : rien n'est envoyé.
import { store } from './util.js';

export const ACTIVITES = {
  priere:    { nom: 'Prière',         icone: '🙏' },
  adoration: { nom: 'Adorations',     icone: '🎧' },
  coeurs:    { nom: 'Cœurs brisés',   icone: '❤️' },
  parole:    { nom: 'La Bible',       icone: '📖' },
  affaires:  { nom: 'Affaires',       icone: '💼' },
  evangile:  { nom: 'Évangélisation', icone: '📣' }
};

// Quelle rubrique correspond à la route en cours ?
const RUBRIQUE = chemin => {
  const a = String(chemin || '').split('/')[0];
  if (a === 'priere') return 'priere';
  if (a === 'nayla') return 'adoration';
  if (a === 'coeurs') return 'coeurs';
  if (a === 'bible') return 'parole';
  if (a === 'affaires') return 'affaires';
  if (a === 'evangelisation' || a === 'salut') return 'evangile';
  return null;
};

const lire = () => store.get('temps', {}) || {};
const jourCle = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function ajouter(activite, secondes) {
  if (!ACTIVITES[activite] || !(secondes > 0)) return;
  const t = lire(), j = jourCle();
  t[j] = t[j] || {};
  t[j][activite] = (t[j][activite] || 0) + Math.round(secondes);
  const limite = jourCle(new Date(Date.now() - 60 * 864e5));       // ménage : on ne garde que 60 jours
  for (const k of Object.keys(t)) if (k < limite) delete t[k];
  store.set('temps', t);
}

let courant = null, depuis = 0;
function cloturer() {
  if (courant && depuis) ajouter(courant, Math.min((Date.now() - depuis) / 1000, 20 * 60));   // 20 min au plus par passage
  depuis = 0;
}

// À appeler à chaque changement de route (js/main.js)
export function suivre(chemin) {
  cloturer();
  courant = RUBRIQUE(chemin);
  depuis = courant ? Date.now() : 0;
}

// On compte aussi quand la personne quitte ou verrouille son téléphone.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') cloturer();
  else if (courant) depuis = Date.now();
});
addEventListener('pagehide', cloturer);

// Bilan sur N jours : { activite: minutes } (le temps en cours est inclus)
export function bilan(jours = 7) {
  cloturer(); if (courant) depuis = Date.now();
  const t = lire(), res = {};
  for (const k of Object.keys(ACTIVITES)) res[k] = 0;
  for (let i = 0; i < jours; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const q = t[jourCle(d)] || {};
    for (const [k, s] of Object.entries(q)) if (res[k] !== undefined) res[k] += s / 60;
  }
  return res;
}
// Nombre de jours (sur N) où la personne a passé au moins une minute dans une rubrique
export function joursActifs(jours = 7) {
  cloturer(); if (courant) depuis = Date.now();
  const t = lire(); let n = 0;
  for (let i = 0; i < jours; i++) { const d = new Date(); d.setDate(d.getDate() - i); const q = t[jourCle(d)] || {}; if (Object.values(q).reduce((a, c) => a + c, 0) >= 60) n++; }
  return n;
}
// Jours d'affilée jusqu'à aujourd'hui (si aujourd'hui est encore vide, on part d'hier : la série n'est pas perdue)
export function serie() {
  cloturer(); if (courant) depuis = Date.now();
  const t = lire(); let n = 0;
  for (let i = 0; i < 61; i++) {
    const d = new Date(); d.setDate(d.getDate() - i); const q = t[jourCle(d)] || {};
    const actif = Object.values(q).reduce((a, c) => a + c, 0) >= 60;
    if (actif) n++; else if (i > 0) break;
  }
  return n;
}
export const effacerTemps = () => store.set('temps', {});
