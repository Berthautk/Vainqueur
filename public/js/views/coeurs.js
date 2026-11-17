import { h, img, ico, contenu, ouvrirWhatsApp, tts } from '../util.js';
import * as player from '../player.js';
import { enveloppe, ex } from './commun.js';
import { ecouterTheme } from './article.js';

export default async function () {
  const d = await contenu('coeurs_brises');
  let noeud = null;
  noeud = h('div', {},
    h('section', { class: 'hero', style: 'min-height:260px' }, img('p1_02', '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, h('span', { style: 'font-size:46px;line-height:1' }, '❤️'),
        h('h1', {}, 'Médecin des ', h('em', {}, 'cœurs brisés'))),
      h('p', { class: 'hero-sous' }, 'Tu n\'es pas seul. Ensemble, guérissons ce qui fait mal.')),
    h('div', { class: 'grille2' }, d.themes.map(t =>
      h('article', { class: 'theme-cb' }, img(t.image, '', '', true),
        h('h3', {}, t.titre, ex(t)),
        h('div', { class: 'theme-cb-btns' },
          h('a', { class: 'btn btn-clair', href: `#/coeurs/${t.id}` }, ico('livre'), 'Lire'),
          boutonEcouter(t))))),
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('conseil') }, ico('chat'), 'Écrire pour demander conseil ›'));
  function boutonEcouter(t) {
    const b = h('button', { class: 'btn btn-vert' }, ico('casque'), h('span', {}, 'Écouter'));
    b.onclick = () => {
      const enCours = b.dataset.on === '1';
      noeud && noeud.querySelectorAll('.theme-cb .btn-vert').forEach(x => { x.dataset.on = ''; x.lastChild.textContent = 'Écouter'; });
      if (enCours && !t.audio) { tts.stop(); return; }
      const ok = ecouterTheme(t, () => { b.dataset.on = ''; b.lastChild.textContent = 'Écouter'; });
      if (ok && !t.audio) { b.dataset.on = '1'; b.lastChild.textContent = 'Arrêter'; }
    };
    return b;
  }
  return enveloppe(noeud, () => tts.stop());
}
