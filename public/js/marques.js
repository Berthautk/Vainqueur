// Marques personnelles dans la Bible, gardées sur le téléphone :
// surlignages et soulignements par verset, notes sur un passage, études (préparation d'une intervention).
import { store } from './util.js';
import { livre } from './bible-refs.js';
import { chapitre } from './bible-data.js';

export const COULEURS_BIBLE = { jaune: '#FFEC8F', vert: '#C9F0D1', bleu: '#CFE0FF', rose: '#FFD0E2', orange: '#FFD9B0' };
export const cle = (id, c, v) => `${id}.${c}.${v}`;
export const lireCle = k => { const [id, c, v] = k.split('.'); return { id, c: +c, v: +v }; };
const ordreLivre = id => { const l = livre(id); return l ? l.ordre ?? 0 : 0; };

// ---- surlignage / soulignement ----
export const marques = () => store.get('bible-marques', {});
export function marquer(cles, champ, valeur) {
  const m = marques();
  for (const k of cles) {
    const x = { ...(m[k] || {}) };
    if (valeur === null || valeur === false) delete x[champ]; else x[champ] = valeur;
    if (Object.keys(x).length) { x.date = Date.now(); m[k] = x; } else delete m[k];
    if (m[k] && !m[k].couleur && !m[k].souligne) delete m[k];
  }
  store.set('bible-marques', m);
}

// ---- notes sur un passage ----
export const notes = () => store.get('bible-notes', []);
export function ajouterNote(cles, texte) { const n = notes(); n.unshift({ id: 'n' + Date.now().toString(36), cles, texte, date: Date.now() }); store.set('bible-notes', n); }
export function modifierNote(id, texte) { const n = notes(); const x = n.find(y => y.id === id); if (x) { x.texte = texte; x.date = Date.now(); } store.set('bible-notes', n.filter(y => y.texte.trim())); }
export const notesDe = k => notes().filter(n => n.cles.includes(k));

// ---- études : une suite de passages, avec une note pour chacun ----
export const etudes = () => store.get('bible-etudes', []);
const garder = e => store.set('bible-etudes', e);
export function creerEtude(titre) { const e = etudes(); const x = { id: 'e' + Date.now().toString(36), titre: titre || 'Nouvelle étude', items: [], date: Date.now() }; e.unshift(x); garder(e); store.set('etude-courante', x.id); return x; }
export const etude = id => etudes().find(x => x.id === id);
export function majEtude(id, f) { const e = etudes(); const x = e.find(y => y.id === id); if (x) { f(x); x.date = Date.now(); } garder(e); return x; }
export function supprimerEtude(id) { garder(etudes().filter(x => x.id !== id)); }
export function ajouterAEtude(id, cles) { store.set('etude-courante', id); return majEtude(id, x => x.items.push({ cles, note: '' })); }
export const dansUneEtude = k => etudes().some(e => e.items.some(i => i.cles.includes(k)));

// ---- références et textes ----
const nomCh = (id, c) => `${id === 'psaumes' ? 'Psaume' : livre(id).nom} ${c}`;
// « Jean 3:16-18 ; 4:2 »
export function refDe(cles) {
  const vs = cles.map(lireCle).filter(x => livre(x.id));
  const groupes = [];
  for (const x of vs) {
    const g = groupes[groupes.length - 1];
    if (g && g.id === x.id && g.c === x.c && g.b === x.v - 1) g.b = x.v; else groupes.push({ id: x.id, c: x.c, a: x.v, b: x.v });
  }
  let precedent = null;
  return groupes.map(g => {
    const ref = `${g.a}${g.b > g.a ? '-' + g.b : ''}`;
    const s = precedent && precedent.id === g.id && precedent.c === g.c ? ref : precedent && precedent.id === g.id ? `${g.c}:${ref}` : `${nomCh(g.id, g.c)}:${ref}`;
    precedent = g; return s;
  }).join(' ; ');
}
export function trier(cles) { return [...new Set(cles)].sort((a, b) => { const x = lireCle(a), y = lireCle(b); return (ordreLivre(x.id) - ordreLivre(y.id)) || (x.c - y.c) || (x.v - y.v); }); }
export async function textes(cles) {
  const out = [];
  for (const k of cles) { const x = lireCle(k); try { out.push({ k, ...x, t: (await chapitre(x.id, x.c))[x.v - 1] || '' }); } catch { out.push({ k, ...x, t: '' }); } }
  return out;
}
export async function texteAPartager(cles, avecRef = true) {
  const t = await textes(cles);
  return `${t.map(x => (cles.length > 1 ? `${x.v} ` : '') + x.t).join(' ')}${avecRef ? `\n— ${refDe(cles)} (Louis Segond 1910)` : ''}`;
}

// ---- sauvegarde dans un fichier (changement de téléphone) ----
export const exporter = () => JSON.stringify({ app: 'Vainqueur', type: 'bible', version: 1, date: new Date().toISOString(), marques: marques(), notes: notes(), etudes: etudes() }, null, 1);
export function importer(txt) {
  const d = JSON.parse(txt);
  if (d.app !== 'Vainqueur' || d.type !== 'bible') throw new Error('fichier');
  store.set('bible-marques', { ...marques(), ...(d.marques || {}) });
  const ids = new Set(notes().map(n => n.id)); store.set('bible-notes', [...notes(), ...(d.notes || []).filter(n => !ids.has(n.id))]);
  const eids = new Set(etudes().map(e => e.id)); store.set('bible-etudes', [...etudes(), ...(d.etudes || []).filter(e => !eids.has(e.id))]);
}
