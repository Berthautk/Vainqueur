import { h, img, getConfig, ouvrirWhatsApp, ico } from '../util.js';
import { paras } from '../pistes.js';
import { hero, enveloppe, ex } from './commun.js';
import { boutonsReseaux } from './plus.js';

export default async function () {
  const c = await getConfig(); const s = c.sophonie || {};
  return enveloppe(h('div', {}, hero({ retour: '#/plus', titre: s.titre || 'Docteur Sophonie' }),
    h('div', { style: 'text-align:center;padding:16px 12px 0' }, s.image ? img(s.image, s.titre, 'portrait', false) : h('img', { src: 'assets/logo/blason_web.webp', alt: '', class: 'portrait' })),
    h('section', { class: 'texte-simple' }, h('h2', {}, s.titre || 'Docteur Sophonie', ex(s)), paras(s.texte).map(p => h('p', {}, p)),
      h('h2', { style: 'margin-top:14px;font-size:18px' }, 'Ses pages'), boutonsReseaux(c.reseaux || {})),
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('inviter') }, ico('calendrier'), 'Inviter l\'homme de Dieu ›')));
}
