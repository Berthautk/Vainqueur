import { h, img, ico, contenu, ouvrirLien, ouvrirWhatsApp } from '../util.js';
import { retour, enveloppe, ex, ouvrirVideo } from './commun.js';

// « Peu importe ce que tu as fait, Jésus t'aime encore. » : la fin (à partir de « Jésus ») en or
function citation(t) {
  const k = t.indexOf('Jésus');
  return h('p', { class: 'cit' }, '“', k > 0 ? [t.slice(0, k), h('em', {}, t.slice(k))] : t, '”');
}

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
      citation(d.message),
      h('p', { class: 'hero-sous' }, d.sous_message),
      h('a', { class: 'btn btn-or', href: '#/salut' }, ico('croix'), 'Je veux connaître Jésus ›')),
    h('div', { class: 'titre-bande' }, ico('groupe'), 'Les grandes croisades'),
    h('div', { class: 'carrousel' }, def,
      h('button', { class: 'nav-carr g', 'aria-label': 'Précédent', onclick: () => va(-1) }, ico('gauche')),
      h('button', { class: 'nav-carr d', 'aria-label': 'Suivant', onclick: () => va(1) }, ico('suivant'))),
    dots,
    h('div', { class: 'titre-bande' }, ico('video'), 'Interviews des hommes de Dieu'),
    h('div', { class: 'interviews' }, d.interviews.map(v => h('button', { class: 'interview', 'aria-label': `Regarder : ${v.titre}`, onclick: () => ouvrirVideo(v.video, v.titre) }, img(v.image, v.titre, '', true), h('span', { class: 'play' }, ico('play')), ex(v)))),
    (d.enseignements || []).length ? [h('div', { class: 'titre-bande' }, ico('livre'), 'Enseignements sur l\'évangélisation'),
      h('div', { class: 'interviews' }, d.enseignements.map(v => h('button', { class: 'interview', 'aria-label': `Regarder : ${v.titre}`, onclick: () => ouvrirVideo(v.video, v.titre) }, img(v.image, v.titre, '', true), h('span', { class: 'play' }, ico('play')), h('span', { class: 'interview-titre' }, v.titre.replace(' — exemple', '')), ex(v))))] : null,
    h('button', { class: 'btn btn-vert btn-bloc', onclick: () => ouvrirWhatsApp('inviter') }, ico('calendrier'), 'Inviter l\'homme de Dieu chez moi ›'));
  return enveloppe(noeud);
}
