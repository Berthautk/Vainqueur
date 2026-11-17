// Plans de lecture de la Bible (content/plans.json) : calcul des lectures du jour et progression.
import { listeLivres, livre } from './bible-refs.js';
import { store, contenu, aujourdhui } from './util.js';

const nomCourt = id => (id === 'psaumes' ? 'Psaume' : livre(id).nom);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const date = s => new Date(s + 'T00:00:00');
const plusJours = (s, n) => { const d = date(s); d.setDate(d.getDate() + n); return iso(d); };
export const ecart = (a, b) => Math.round((date(b) - date(a)) / 864e5);

function chapitresDe(spec) {
  const [id, r] = spec.split(':'); const l = livre(id); if (!l) return [];
  let [a, b] = r ? r.split('-').map(Number) : [1, l.ch];
  return Array.from({ length: b - a + 1 }, (_, k) => ({ id, c: a + k, v: l.v[a + k - 1] }));
}
// Répartit des chapitres sur N jours, à volume de lecture (en versets) à peu près égal
function repartir(chs, jours) {
  const out = []; let i = 0; let reste = chs.reduce((s, x) => s + x.v, 0);
  for (let d = 0; d < jours; d++) {
    const restants = jours - d, cible = reste / restants, jour = []; let s = 0;
    while (i < chs.length && (jour.length === 0 || (s + chs[i].v / 2 <= cible && chs.length - i > restants - 1))) { jour.push(chs[i]); s += chs[i].v; i++; }
    reste -= s; out.push(jour);
  }
  while (i < chs.length) out[out.length - 1].push(chs[i++]);
  return out;
}

export const plans = async () => (await contenu('plans')).plans;
export const actif = () => store.get('plan-actif', null);
export function choisir(id) { store.set('plan-actif', { id, debut: aujourdhui() }); }
export function arreter() { store.set('plan-actif', null); }
const lus = () => store.get('plan-lus', {});
export const estLu = cle => !!lus()[cle];
export function marquer(cle, on = true) { const l = lus(); if (on) l[cle] = 1; else delete l[cle]; store.set('plan-lus', l); }

const memo = {};
// Toutes les journées d'un plan : [{ n, cle, date, chapitres, mois? }]
export function journees(plan, debut) {
  const an = new Date().getFullYear();
  const k = `${plan.id}|${plan.type === 'mensuel' ? an : debut}`;
  if (memo[k]) return memo[k];
  let out = [];
  if (plan.type === 'mensuel') {
    plan.mois.forEach((m, mi) => {
      const nj = new Date(an, mi + 1, 0).getDate();
      repartir(m.livres.flatMap(chapitresDe), nj).forEach((chs, d) => {
        const dt = iso(new Date(an, mi, d + 1));
        out.push({ n: out.length + 1, cle: `${plan.id}:${dt}`, date: dt, chapitres: chs, mois: mi });
      });
    });
  } else {
    const ordre = plan.ordre || ['AT', 'NT'];
    const chs = ordre.flatMap(t => listeLivres().filter(l => l.t === t)).flatMap(l => chapitresDe(l.id));
    out = repartir(chs, 365).map((c, i) => ({ n: i + 1, cle: `${plan.id}:${i + 1}`, date: plusJours(debut, i), chapitres: c }));
  }
  return (memo[k] = out);
}
// Le jour d'aujourd'hui dans le plan (index dans la liste), -1 si fini, ou 0 si pas encore commencé
export function indexDuJour(plan, liste) {
  const i = liste.findIndex(j => j.date === aujourdhui());
  if (i >= 0) return i;
  return aujourdhui() > liste[liste.length - 1].date ? -1 : 0;
}
// « Genèse 1–3 ; Exode 1 »
export function libelle(chs) {
  const g = [];
  for (const x of chs) { const d = g[g.length - 1]; if (d && d.id === x.id && d.b === x.c - 1) d.b = x.c; else g.push({ id: x.id, a: x.c, b: x.c }); }
  return g.map(x => `${nomCourt(x.id)} ${x.a}${x.b > x.a ? '–' + x.b : ''}`).join(' ; ');
}
export function progression(plan, liste, debut) {
  const l = lus(); const fait = liste.filter(j => l[j.cle]).length;
  const auj = aujourdhui();
  const enRetard = liste.filter(j => j.date < auj && j.date >= debut && !l[j.cle]);
  return { fait, total: liste.length, enRetard };
}
