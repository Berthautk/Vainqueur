// Texte de la Bible (LSG 1910), un fichier par livre, gardé pour le hors connexion.
import { listeLivres } from './bible-refs.js';
const CACHE = 'vainqueur-bible-lsg';
const memo = {};
const url = id => new URL(`bible/lsg/${id}.json`, document.baseURI).href;
export async function livreData(id) {
  if (!memo[id]) memo[id] = fetch(url(id)).then(r => { if (!r.ok) throw new Error('bible ' + id); return r.json(); });
  try { return await memo[id]; } catch (e) { delete memo[id]; throw e; }
}
export const chapitre = async (id, c) => (await livreData(id)).c[c - 1] || [];

export async function livresGardes() {
  if (!('caches' in window)) return 0;
  try { const c = await caches.open(CACHE); const n = await Promise.all(listeLivres().map(l => c.match(url(l.id)))); return n.filter(Boolean).length; } catch { return 0; }
}
// Enregistre toute la Bible pour la lire sans internet (environ 1,3 Mo)
let enCours = null;
export function toutGarder(progres) {
  if (enCours) return enCours;
  enCours = (async () => {
    const c = await caches.open(CACHE); const tous = listeLivres(); let fait = 0;
    for (const l of tous) {
      if (!(await c.match(url(l.id)))) { try { const r = await fetch(url(l.id)); if (r.ok) await c.put(url(l.id), r.clone()); } catch { /* on continue */ } }
      fait++; progres && progres(fait, tous.length);
    }
    return fait;
  })();
  enCours.finally(() => { enCours = null; });
  return enCours;
}
