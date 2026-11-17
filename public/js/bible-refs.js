// Références bibliques : détection dans les textes (« Jean 3:16 », « 1 Corinthiens 15:57 », « Psaume 4:9 »)
// et transformation en liens vers la Bible intégrée.
let livres = [];
let RE = null;
const ALIAS = { 'psaume': 'psaumes', 'isaie': 'esaie', 'isaïe': 'esaie', 'cantique': 'cantique', 'actes des apotres': 'actes', 'actes des apôtres': 'actes', 'qohelet': 'ecclesiaste' };
const sansAccent = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const cle = s => sansAccent(s).toLowerCase().replace(/^([123])\s*(?:er|re|e)?\s*/, '$1 ').replace(/\s+/g, ' ').trim();
const table = {};

export async function chargerLivres() {
  if (livres.length) return livres;
  const r = await fetch('bible/livres.json');
  livres = (await r.json()).livres;
  livres.forEach((l, i) => { l.ordre = i; });
  const noms = new Set();
  for (const l of livres) { table[cle(l.nom)] = l.id; noms.add(l.nom.replace(/^[123] /, '')); noms.add(sansAccent(l.nom.replace(/^[123] /, ''))); }
  for (const [a, id] of Object.entries(ALIAS)) { table[cle(a)] = id; noms.add(a); }
  noms.add('Psaume'); noms.add('Isaïe'); noms.add('Actes des apôtres');
  const alt = [...noms].sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('|');
  RE = new RegExp(`(?<![\\p{L}\\d])((?:[123]\\s?(?:er|re|e)?\\s?)?(?:${alt}))\\s+(\\d{1,3})\\s?[:.]\\s?(\\d{1,3})(?:\\s?[-–]\\s?(\\d{1,3}))?(?![\\d\\p{L}])`, 'giu');
  return livres;
}
export const listeLivres = () => livres;
export const livre = id => livres.find(l => l.id === id);
export const livreDeNom = nom => table[cle(nom)] || null;

// Cherche les références dans un texte : [{debut, fin, texte, id, c, v1, v2}]
export function trouverRefs(texte) {
  if (!RE) return [];
  const out = [];
  for (const m of String(texte).matchAll(RE)) {
    const id = livreDeNom(m[1]); const l = id && livre(id);
    const c = +m[2], v1 = +m[3], v2 = m[4] ? +m[4] : null;
    if (!l || c < 1 || c > l.ch) continue;
    out.push({ debut: m.index, fin: m.index + m[0].length, texte: m[0], id, c, v1, v2 });
  }
  return out;
}
export const lienRef = r => `#/bible/${r.id}/${r.c}?v=${r.v1}${r.v2 ? '-' + r.v2 : ''}`;

// Texte → HTML sûr : **gras** + références cliquables
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function riche(texte) {
  const s = String(texte ?? '');
  let html = ''; let i = 0;
  for (const r of trouverRefs(s)) {
    html += esc(s.slice(i, r.debut));
    html += `<a class="ref-bible" href="${lienRef(r)}">${esc(r.texte)}</a>`;
    i = r.fin;
  }
  html += esc(s.slice(i));
  return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
export const sansGras = s => String(s ?? '').replace(/\*\*/g, '');
