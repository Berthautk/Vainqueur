import { riche } from '../bible-refs.js';
import { h, img, ico, contenu, ouvrirWhatsApp, gras, toast, feuille } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, ex, vide, boutonEcoute } from './commun.js';
import { pisteTheme, pistesThemes } from '../pistes.js';

function prier(t) {
  if (!t.priere) { location.hash = '#/priere'; return; }
  const f = feuille(h('div', {}, h('h2', {}, 'Prier pour ce sujet'),
    h('p', {}, 'Lis cette prière lentement, à voix haute si tu peux :'),
    h('blockquote', { class: 'priere-salut' }, t.priere),
    h('button', { class: 'btn btn-or', onclick: () => { f(); toast('Amen 🙏 — Dieu t\'entend'); } }, ico('coche'), 'Amen'),
    h('button', { class: 'btn btn-vert', onclick: () => { f(); ouvrirWhatsApp('sujet', t.titre); } }, ico('chat'), 'Demander qu\'on prie avec moi'),
    h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
}

export default async function (id) {
  const d = await contenu('coeurs_brises');
  const t = d.themes.find(x => x.id === id);
  if (!t) return enveloppe(vide('Article introuvable', 'Ce thème n\'existe pas.'));
  const btn = boutonEcoute(pisteTheme(t), pistesThemes(d), { cls: 'btn btn-or', off: 'Écouter l\'article', on: 'Pause' });
  const pid = `cb-${t.id}`;
  const corps = h('div', { class: 'article lecture-texte' }, t.sections.map((s, i) => [
    h('h2', {}, h('span', {}, s.icone || ''), h('span', { 'data-lu': `${pid}:${i}t` }, s.titre)),
    s.texte ? h('p', { 'data-lu': `${pid}:${i}p`, html: riche(s.texte) }) : null,
    s.liste ? h('ul', { class: s.puces ? 'puces' : '' }, s.liste.map((l, k) => h('li', { 'data-lu': `${pid}:${i}l${k}`, html: riche(l) }))) : null]));
  const noeud = h('div', {},
    h('section', { class: 'hero', style: 'min-height:230px' }, img(t.image, '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/coeurs'), h('span', { style: 'font-size:34px' }, '❤️'),
        h('h1', { style: 'font-size:20px;max-width:55%' }, 'Médecin des ', h('em', {}, 'cœurs brisés')))),
    h('div', { class: 'art-titre' }, h('h1', {}, h('span', { 'data-lu': `cb-${t.id}:titre` }, t.titre), ex(t))),
    h('div', { class: 'art-barre' }, h('span', { class: 'art-temps', 'aria-label': `${t.duree} minutes de lecture`, title: 'Temps de lecture' }, ico('horloge', ''), `${t.duree} min`), btn),
    corps,
    h('div', { class: 'art-actions' },
      h('button', { class: 'btn btn-vert', onclick: () => ouvrirWhatsApp('conseil', ` (sujet : ${t.titre})`) }, ico('chat'), 'Demander conseil'),
      h('button', { class: 'btn btn-or', onclick: () => prier(t) }, ico('mains'), 'Prier pour ce sujet')));
  noeud.querySelectorAll('.art-temps svg').forEach(s => { s.style.width = '20px'; s.style.height = '20px'; });
  return enveloppe(noeud);
}
