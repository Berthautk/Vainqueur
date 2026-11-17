import { h, img, ico, contenu, ouvrirLien, ouvrirWhatsApp } from '../util.js';
import { retour, enveloppe, ex } from './commun.js';

export default async function () {
  const d = await contenu('evangelisation');
  const dots = h('div', { class: 'points' });
  const def = h('div', { class: 'defile' }, d.croisades.map(c => h('figure', { class: 'croisade' }, img(c.image, c.titre, '', true), ex(c))));
  d.croisades.forEach((_, i) => dots.append(h('i', { class: i === 0 ? 'actif' : '' })));
  const maj = () => { const w = def.firstChild.getBoundingClientRect().width + 8; const i = Math.round(def.scrollLeft / w); [...dots.children].forEach((p, k) => p.classList.toggle('actif', k === i)); };
  def.addEventListener('scroll', maj, { passive: true });
  const va = s => { const w = def.firstChild.getBoundingClientRect().width + 8; def.scrollBy({ left: s * w, behavior: 'smooth' }); };

  const noeud = h('div', {},
    h('section', { class: 'hero hero-evan' }, img('p1_03', '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/'), h('span', { style: 'font-size:34px' }, '📢'), h('h1', { style: 'font-size:24px' }, 'Évangélisation')),
      h('p', { class: 'cit' }, '“Peu importe ce que tu as fait, ', h('em', {}, 'Jésus t\'aime encore.'), '”'),
      h('p', { class: 'hero-sous' }, d.sous_message),
      h('a', { class: 'btn btn-or', href: '#/salut' }, ico('croix'), 'Je veux connaître Jésus ›')),
    h('div', { class: 'titre-bande' }, ico('groupe'), 'Les grandes croisades'),
    h('div', { class: 'carrousel' }, def,
      h('button', { class: 'nav-carr g', 'aria-label': 'Précédent', onclick: () => va(-1) }, ico('gauche')),
      h('button', { class: 'nav-carr d', 'aria-label': 'Suivant', onclick: () => va(1) }, ico('suivant'))),
    dots,
    h('div', { class: 'titre-bande' }, ico('video'), 'Interviews des hommes de Dieu'),
    h('div', { class: 'interviews' }, d.interviews.map(v => h('a', { class: 'interview', href: v.lien, target: '_blank', rel: 'noopener', 'aria-label': v.titre }, img(v.image, v.titre, '', true), h('span', { class: 'play' }, ico('play')), ex(v)))),
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('inviter') }, ico('calendrier'), 'Inviter l\'homme de Dieu chez moi ›'));
  return enveloppe(noeud);
}
