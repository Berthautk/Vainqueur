import { h, ico, toast, store, feuille } from '../util.js';
import { listeLivres, livre, livreDeNom, trouverRefs, lienRef } from '../bible-refs.js';
import { chapitre, livreData, livresGardes, toutGarder } from '../bible-data.js';
import { pisteChapitre } from '../pistes.js';
import * as player from '../player.js';
import { retour, enveloppe, vide, boutonEcoute } from './commun.js';
import { imageParole, partagerImage } from '../partage.js';

const enteteBible = (titre, sous, secours = '#/plus') => h('section', { class: 'hero hero-bible' },
  h('div', { class: 'hero-ligne' }, retour(secours), ico('livre'), h('h1', {}, titre)),
  sous ? h('p', { class: 'hero-sous' }, sous) : null);

// Aller directement à « Jean 3:16 », « Jean 3 » ou « Jean »
function allerA(q) {
  const r = trouverRefs(q)[0];
  if (r) { location.hash = lienRef(r); return true; }
  const m = q.trim().match(/^(.+?)\s+(\d+)$/);
  const id = livreDeNom(m ? m[1] : q.trim());
  if (id) { location.hash = m ? `#/bible/${id}/${Math.min(+m[2], livre(id).ch)}` : `#/bible/${id}`; return true; }
  return false;
}

export default async function () {
  const tous = listeLivres();
  if (!tous.length) return enveloppe(vide('Bible indisponible', 'Reconnecte-toi une fois pour l\'ouvrir.'));
  let t = store.get('bible-testament', 'NT');
  const grille = h('div', { class: 'livres' });
  const onglets = h('div', { class: 'bascule bascule-bible', role: 'tablist' }, [['AT', 'Ancien Testament'], ['NT', 'Nouveau Testament']].map(([k, l]) =>
    h('button', { role: 'tab', 'data-t': k, onclick: () => { t = k; store.set('bible-testament', k); dessiner(); } }, l)));
  function dessiner() {
    onglets.querySelectorAll('button').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('actif', on); b.setAttribute('aria-selected', String(on)); });
    grille.replaceChildren(...tous.filter(l => l.t === t).map(l => h('a', { class: 'livre', href: `#/bible/${l.id}` }, l.nom)));
  }
  const champ = h('input', { type: 'search', placeholder: 'Aller à… (ex. Jean 3:16)', 'aria-label': 'Aller à un passage', enterkeyhint: 'go' });
  const form = h('form', { class: 'recherche', onsubmit: e => { e.preventDefault(); if (!allerA(champ.value)) toast('Passage introuvable — essaie « Jean 3:16 »'); } }, ico('loupe'), champ);
  const pos = store.get('bible-pos');
  const reprise = pos && livre(pos.id) ? h('a', { class: 'reprise', href: `#/bible/${pos.id}/${pos.c}` }, ico('livre'), h('span', {}, 'Reprendre la lecture : ', h('b', {}, `${livre(pos.id).nom} ${pos.c}`)), ico('suivant')) : null;

  // Hors connexion : toute la Bible est enregistrée dès la première ouverture
  const etatHL = h('div', { class: 'hl-bible' }, h('span', {}, 'Vérification…'));
  async function majHL() {
    const n = await livresGardes();
    if (n >= tous.length) { etatHL.replaceChildren(ico('wifi'), h('span', {}, 'Toute la Bible est disponible sans internet ✔')); etatHL.classList.add('ok'); return; }
    if (!navigator.onLine) { etatHL.replaceChildren(h('span', {}, `${n} livres sur 66 enregistrés. Reconnecte-toi pour enregistrer le reste.`)); return; }
    const barre = h('i');
    etatHL.replaceChildren(h('span', {}, 'Enregistrement de la Bible pour le hors connexion…'), h('div', { class: 'progres' }, barre));
    await toutGarder((f, tot) => { barre.style.width = `${(f / tot) * 100}%`; });
    majHL();
  }
  const noeud = h('div', {}, enteteBible('La Sainte Bible', 'Louis Segond 1910 · Ancien et Nouveau Testament'), form, reprise, etatHL, onglets, grille);
  dessiner(); majHL();
  return enveloppe(noeud);
}

export async function livrePage(id) {
  const l = livre(id);
  if (!l) return enveloppe(vide('Livre introuvable', ''));
  return enveloppe(h('div', {}, enteteBible(l.nom, `${l.ch} chapitre${l.ch > 1 ? 's' : ''} · ${l.t === 'AT' ? 'Ancien' : 'Nouveau'} Testament`, '#/bible'),
    h('p', { class: 'consigne' }, 'Choisis un chapitre :'),
    h('div', { class: 'chapitres' }, Array.from({ length: l.ch }, (_, i) => h('a', { class: 'chap', href: `#/bible/${id}/${i + 1}` }, String(i + 1))))));
}

export async function chapitrePage(id, cs, params) {
  const l = livre(id); const c = +cs;
  if (!l || c < 1 || c > l.ch) return enveloppe(vide('Passage introuvable', ''));
  let versets;
  try { versets = await chapitre(id, c); }
  catch { return enveloppe(vide('Pas encore enregistré', 'Ce livre n\'est pas encore disponible sans internet. Reconnecte-toi une fois et ouvre la Bible.')); }
  store.set('bible-pos', { id, c });
  // Versets ciblés (?v=16 ou ?v=22-23)
  const [a, b] = String(params?.get?.('v') || '').split('-').map(Number);
  const cible = v => a && v >= a && v <= (b || a);
  const pisteId = `b-${id}-${c}`;
  const file = Array.from({ length: l.ch }, (_, i) => pisteChapitre(l, i + 1, chapitre));
  const ecoute = boutonEcoute(file[c - 1], file, { cls: 'btn btn-or btn-petit', off: 'Écouter', on: 'Pause', aria: `Écouter ${l.nom} ${c}` });

  const texte = h('div', { class: 'bible-texte lecture-texte' }, versets.map((v, i) => h('p', { class: 'verset' + (cible(i + 1) ? ' cible' : ''), id: `v${i + 1}`, onclick: () => actionsVerset(l, c, i + 1, v) },
    h('sup', {}, String(i + 1)), h('span', { 'data-lu': `${pisteId}:${i + 1}` }, v))));
  const nav = (n, txt, icone) => n >= 1 && n <= l.ch ? h('a', { class: 'btn btn-clair btn-petit', href: `#/bible/${id}/${n}`, 'aria-label': `${l.nom} ${n}` }, icone === 'g' ? [ico('gauche'), txt] : [txt, ico('suivant')]) : h('span');
  const venuDUnLien = !!(a && history.length > 1);
  const nomCh = `${l.id === 'psaumes' ? 'Psaume' : l.nom} ${c}`;
  const noeud = h('div', {},
    h('div', { class: 'bible-barre' }, venuDUnLien ? h('button', { class: 'revenir', onclick: () => history.back(), 'aria-label': 'Revenir où j\'étais' }, ico('retour'), 'Revenir') : retour(`#/bible/${id}`),
      h('a', { class: 'bible-titre', href: `#/bible/${id}` }, nomCh), ecoute),
    texte,
    h('div', { class: 'bible-nav' }, nav(c - 1, `Chap. ${c - 1}`, 'g'), nav(c + 1, `Chap. ${c + 1}`, 'd')),
    h('p', { class: 'mention' }, 'Louis Segond 1910 — domaine public'));
  // La lecture passe au chapitre suivant : la page suit
  const off = player.sur(t => {
    if (t !== 'piste') return; const p = player.etat.piste;
    if (p && p.type === 'bible' && p.id !== pisteId && p.id.startsWith(`b-${id}-`) && player.lit()) location.replace(p.lien);
  });
  if (a) setTimeout(() => { const el = noeud.querySelector(`#v${a}`); if (el) el.scrollIntoView({ block: 'center' }); }, 60);
  return enveloppe(noeud, off);
}

function actionsVerset(l, c, v, texte) {
  const ref = `${l.nom} ${c}:${v}`;
  const f = feuille(h('div', {}, h('h2', {}, ref), h('blockquote', { class: 'priere-salut' }, texte),
    h('button', { class: 'btn btn-or', onclick: async () => { f(); try { partagerImage(await imageParole({ texte, ref, etiquette: 'La Bible' }), `« ${texte} » — ${ref} (Louis Segond 1910)`, 'verset.jpg'); } catch { toast('Partage impossible'); } } }, ico('partager'), 'Partager en image'),
    h('button', { class: 'btn btn-clair', onclick: async () => { f(); try { await navigator.clipboard.writeText(`« ${texte} » — ${ref}`); toast('Copié'); } catch { toast('Copie impossible'); } } }, 'Copier le verset'),
    h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
}
