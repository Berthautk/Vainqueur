import { h, ico, contenu, ouvrirWhatsApp } from '../util.js';
import { hero, enveloppe } from './commun.js';

export default async function () {
  const d = (await contenu('evangelisation')).salut;
  return enveloppe(h('div', {},
    hero({ retour: '#/evangelisation', titre: d.titre, image: 'p3_01', cls: '' }),
    h('section', { class: 'salut-page' },
      h('p', {}, d.intro),
      h('blockquote', { class: 'priere-salut' }, d.priere),
      h('p', {}, d.suite)),
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('salut') }, ico('chat'), 'J\'ai prié, écrivez-moi ›')));
}
