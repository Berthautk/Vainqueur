import { h, img, ico, contenu, ouvrirWhatsApp } from '../util.js';
import * as player from '../player.js';
import { enveloppe, ex, boutonEcoute } from './commun.js';
import { pisteTheme, pistesThemes } from '../pistes.js';

export default async function () {
  const d = await contenu('coeurs_brises');
  let noeud = null;
  noeud = h('div', {},
    h('section', { class: 'hero-cb' }, img('p1_02', '', 'hero-cb-img', false),
      h('div', { class: 'hero-cb-txt' },
        h('span', { class: 'hero-cb-badge' }, '❤️ Écoute · conseil · guérison'),
        h('h1', {}, 'Médecin des', h('br'), h('em', {}, 'cœurs brisés')),
        h('p', {}, d.sous || ''),
        h('button', { class: 'btn btn-vert btn-petit', onclick: () => ouvrirWhatsApp('conseil') }, ico('chat'), 'Demander conseil'))),
    h('p', { class: 'cb-intro' }, 'Choisis ce que tu traverses : lis ou écoute, à ton rythme.'),
    h('div', { class: 'grille2' }, d.themes.map(t =>
      h('article', { class: 'theme-cb' }, img(t.image, '', '', true),
        h('h3', {}, t.titre, ex(t)),
        h('div', { class: 'theme-cb-btns' },
          h('a', { class: 'btn btn-clair', href: `#/coeurs/${t.id}` }, ico('livre'), 'Lire'),
          boutonEcoute(pisteTheme(t), pistesThemes(d), { cls: 'btn btn-vert', off: 'Écouter', on: 'Pause' }))))),
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('conseil') }, ico('chat'), 'Écrire pour demander conseil ›'));
  return enveloppe(noeud);
}
