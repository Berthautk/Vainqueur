import { riche } from '../bible-refs.js';
import { h, ico, contenu, ouvrirWhatsApp, store } from '../util.js';
import { hero, enveloppe, boutonEcoute } from './commun.js';

export default async function () {
  const d = (await contenu('evangelisation')).salut;
  store.set('salut_vu', true);
  const piste = { id: 'salut', titre: d.titre, audio: '', image: 'p3_01', type: 'salut', lien: '#/salut',
    segments: [{ t: d.intro, lu: 'salut:i' }, { t: d.priere, lu: 'salut:p' }, { t: d.suite, lu: 'salut:s' }] };
  return enveloppe(h('div', {},
    hero({ retour: '#/evangelisation', titre: d.titre, image: 'p3_01' }),
    h('section', { class: 'salut-page lecture-texte' },
      h('div', { style: 'display:flex;justify-content:flex-end;margin-bottom:8px' }, boutonEcoute(piste, null, { cls: 'btn btn-or btn-petit', off: 'Écouter', on: 'Pause' })),
      h('p', { 'data-lu': 'salut:i', html: riche(d.intro) }),
      h('blockquote', { class: 'priere-salut', 'data-lu': 'salut:p' }, d.priere),
      h('p', { 'data-lu': 'salut:s', html: riche(d.suite) })),
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('salut') }, ico('chat'), 'J\'ai prié, écrivez-moi ›')));
}
