import { h, getConfig } from '../util.js';
import { hero, enveloppe } from './commun.js';

export default async function () {
  const c = await getConfig();
  return enveloppe(h('div', {},
    hero({ retour: '#/plus', titre: 'À propos' }),
    h('div', { style: 'text-align:center;padding:18px 12px 0;background:var(--nuit)' }, h('img', { src: 'assets/logo/banniere_web.webp', alt: 'Les Vainqueurs de Dieu', style: 'width:80%;margin:0 auto;max-width:340px' })),
    h('section', { class: 'texte-simple', style: 'margin-top:0;border-radius:0 0 18px 18px' },
      h('h2', {}, c.a_propos.titre), h('p', {}, c.a_propos.texte),
      h('p', {}, h('small', {}, `Évangéliste ${c.evangeliste} · ${c.a_propos.version}`)))));
}
