import { h, ico, img, badgeEx } from '../util.js';

export function retour(secours = '#/') {
  return h('button', { class: 'retour', 'aria-label': 'Retour', onclick: () => { if (history.length > 1) history.back(); else location.hash = secours; } }, ico('retour'));
}
// Bandeau de page : { retour, icone(svg nom), titre, or, sous, image, cls }
export function hero(o) {
  const t = h('h1', {}, o.titre, o.or ? [' ', h('em', {}, o.or)] : null);
  return h('section', { class: 'hero ' + (o.cls || '') },
    o.image ? img(o.image, '', 'hero-img', false) : null,
    h('div', { class: 'hero-ligne' }, o.retour === false ? null : retour(o.retour), o.icone ? ico(o.icone) : null, t),
    o.sous ? h('p', { class: 'hero-sous' }, o.sous) : null);
}
export function vide(titre, texte) { return h('div', { class: 'vide' }, h('strong', {}, titre), texte); }
export const ex = badgeEx;
export function enveloppe(noeud, nettoyer) { return { noeud, nettoyer }; }
