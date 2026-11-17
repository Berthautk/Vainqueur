import { riche } from '../bible-refs.js';
import { h, img, ico, contenu, ouvrirWhatsApp, ouvrirLien, getConfig, lienPret } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, ex, boutonEcoute } from './commun.js';
import { pisteModule } from '../pistes.js';

export default async function () {
  const d = await contenu('affaires');
  const accroche = d.accroche;
  const m = accroche.match(/^(.*faire de )(50 francs 100 francs)(, tu ne sauras jamais faire )(d'un million deux millions)(\.)$/);
  const cit = m ? h('p', { class: 'cit' }, '“', m[1], h('span', { class: 'or' }, m[2]), m[3], h('span', { class: 'or' }, m[4]), m[5], '”') : h('p', { class: 'cit' }, `“${accroche}”`);
  const liste = h('div', { class: 'liste' });
  const ouvert = new Set();
  const noeud = h('div', {},
    h('section', { class: 'hero hero-affaires' }, img('p5_05', '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/'), h('h1', { style: 'font-size:22px;max-width:60%' }, 'Hommes et ', h('em', {}, 'femmes d\'affaires'))), cit),
    liste,
    h('button', { class: 'btn btn-vert btn-bloc', onclick: async () => { const c = await getConfig(); if (lienPret(c.coaching_lien)) ouvrirLien(c.coaching_lien); else ouvrirWhatsApp('coaching'); } }, ico('groupe'), 'Rejoindre le coaching ›'));
  d.modules.forEach(mo => {
    const detail = h('div', { class: 'detail lecture-texte', hidden: true },
      h('p', { 'data-lu': `aff-${mo.id}:e`, html: riche(mo.enseignement) }),
      h('p', {}, h('strong', {}, 'Sujet de prière : '), h('span', { 'data-lu': `aff-${mo.id}:s`, html: riche(mo.sujet) })),
      boutonEcoute(pisteModule(mo), d.modules.map(pisteModule), { cls: 'btn btn-bleu btn-petit', off: 'Écouter l\'enseignement', on: 'Pause' }));
    const l = h('div', { class: 'ligne ligne-aff', role: 'button', tabindex: 0, 'aria-expanded': 'false' },
      img(mo.image, '', 'ligne-img'),
      h('div', { class: 'ligne-txt' }, h('h3', {}, img(mo.icone, '', ''), h('span', {}, mo.titre, ex(mo))), h('div', { class: 'ligne-meta' }, ico('livre'), 'Enseignement + sujet de prière')),
      h('span', { class: 'fleche' }, ico('suivant')));
    const bas = () => { detail.hidden = !detail.hidden; l.setAttribute('aria-expanded', String(!detail.hidden)); l.querySelector('.fleche').style.transform = detail.hidden ? '' : 'rotate(90deg)'; };
    l.onclick = bas; l.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bas(); } };
    liste.append(l, detail);
  });
  return enveloppe(noeud);
}
