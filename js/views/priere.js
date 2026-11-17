import { h, img, ico, contenu } from '../util.js';
import * as dl from '../downloads.js';
import * as player from '../player.js';
import { enveloppe, ex } from './commun.js';

export default async function () {
  const d = await contenu('fiches');
  const t = d.theme;
  const [avant, apres] = t.titre.split(t.mot_or);
  const noeud = h('div', {},
    h('div', { class: 'entete-page' }, ico('mains'), h('h1', {}, 'Prière de délivrance et ', h('em', { class: 'or' }, 'de guérison'))),
    h('p', { class: 'accroche-page' }, d.accroche_page),
    h('section', { class: 'theme' },
      img(t.image, '', '', false),
      h('div', { class: 'theme-txt' },
        h('span', { class: 'etiquette' }, 'Thème de la semaine :'), ex(t),
        h('h2', {}, avant, h('em', {}, t.mot_or), apres),
        h('span', { class: 'jour-badge' }, `Jour ${t.jour} sur ${t.total}`),
        h('div', { class: 'progres', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': t.total, 'aria-valuenow': t.jour }, h('i', { style: `width:${(t.jour / t.total) * 100}%` })))),
    h('div', { class: 'liste' }, d.fiches.map(f => ligne(f))));
  return enveloppe(noeud);
}

function ligne(f) {
  const ecoute = h('button', { class: 'btn btn-bleu btn-rond', 'aria-label': `Écouter ${f.titre}`, onclick: e => { e.stopPropagation(); player.jouer({ id: f.id, titre: f.titre, audio: f.audio, image: f.image, type: 'fiche' }); } }, ico('casque'));
  const down = h('button', { class: 'btn btn-vert btn-rond', 'aria-label': `Télécharger ${f.titre}` }, ico('telecharger'));
  down.onclick = async e => { e.stopPropagation(); if (await dl.telecharger(f.audio, f.titre)) down.classList.add('fait'); };
  dl.estGarde(f.audio).then(ok => { if (ok) down.title = 'Déjà téléchargé'; });
  return h('div', { class: 'ligne', role: 'link', tabindex: 0, onclick: () => { location.hash = `#/priere/${f.id}`; }, onkeydown: e => { if (e.key === 'Enter') location.hash = `#/priere/${f.id}`; } },
    img(f.image, '', 'ligne-img'),
    h('div', { class: 'ligne-txt' }, h('h3', {}, f.titre, ex(f)), h('div', { class: 'ligne-meta' }, ico('horloge'), `${f.duree} min`)),
    h('div', { class: 'ligne-actions' }, ecoute, down));
}
