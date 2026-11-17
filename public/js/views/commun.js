import { h, ico, img, badgeEx } from '../util.js';
import * as player from '../player.js';

// Bouton « Écouter » relié au lecteur global ; se met à jour tout seul (voir main.js)
export function boutonEcoute(piste, file, o = {}) {
  const b = h('button', { class: o.cls || 'btn btn-bleu btn-rond', 'data-piste': piste.id, 'data-icone': o.icone || 'casque', 'data-off': o.off || '', 'data-on': o.on || '', 'aria-label': o.aria || `Écouter ${piste.titre}` },
    h('span', { class: 'ic-etat' }), o.off ? h('span', { class: 'lbl' }) : null);
  b.onclick = e => { e.stopPropagation(); if (player.etat.piste && player.etat.piste.id === piste.id) player.basculer(); else player.jouer(piste, file && file.length ? file : [piste]); };
  majBouton(b);
  return b;
}
export function majBouton(b) {
  const on = !!player.etat.piste && player.etat.piste.id === b.dataset.piste && player.lit();
  b.classList.toggle('joue', on);
  b.querySelector('.ic-etat').replaceChildren(ico(on ? 'pause' : b.dataset.icone));
  const l = b.querySelector('.lbl'); if (l) l.textContent = on ? (b.dataset.on || 'Pause') : b.dataset.off;
}

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
