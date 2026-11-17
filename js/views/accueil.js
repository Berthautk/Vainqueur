import { h, img, ico, contenu, tts, partager, toast, store } from '../util.js';
import * as player from '../player.js';
import { enveloppe } from './commun.js';

const jourDeAnnee = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);

export default async function () {
  const [acc, fiches] = await Promise.all([contenu('accueil'), contenu('fiches')]);
  const j = jourDeAnnee();
  const ac = acc.accroches[j % acc.accroches.length];
  const pa = acc.paroles[j % acc.paroles.length];
  const fiche = fiches.fiches.find(f => f.id === fiches.du_jour) || fiches.fiches[0];

  const btnEcouter = h('button', { class: 'btn btn-bleu btn-petit' }, ico('casque'), 'Écouter');
  btnEcouter.onclick = () => {
    if (tts.actif) { tts.stop(); btnEcouter.lastChild.textContent = 'Écouter'; return; }
    if (tts.parler(`${pa.texte}. ${pa.ref}`, () => { btnEcouter.lastChild.textContent = 'Écouter'; })) btnEcouter.lastChild.textContent = 'Arrêter';
  };

  const noeud = h('div', {},
    h('section', { class: 'salut' },
      img(ac.image, '', 'salut-img', false),
      h('div', { class: 'salut-bonjour' }, 'Bonjour,', h('b', {}, 'champion !')),
      h('h2', {}, ac.titre),
      h('p', {}, ac.sous)),
    h('section', { class: 'parole' },
      img('p1_12', '', ''),
      h('div', { class: 'parole-txt' },
        h('span', { class: 'etiquette' }, ico('livre'), 'Parole du jour'),
        h('q', {}, pa.texte), h('small', {}, pa.ref)),
      h('div', { class: 'parole-btns' }, btnEcouter,
        h('button', { class: 'btn btn-clair btn-petit', onclick: () => partager('Parole du jour', `« ${pa.texte} » — ${pa.ref}`) }, ico('partager'), 'Partager'))),
    h('section', { class: 'priere-jour' },
      img(fiche.image, '', '', false),
      h('div', {},
        h('span', { class: 'etiquette rouge' }, ico('mains'), 'Prière du jour'),
        h('h2', {}, fiche.titre),
        h('small', {}, `Enseignement ${fiche.duree} min + 5 sujets de prière`),
        h('a', { class: 'btn btn-or', href: `#/priere/${fiche.id}` }, ico('play'), 'Commencer'))),
    h('section', { class: 'tuiles', 'aria-label': 'Rubriques' },
      acc.tuiles.map(t => h('a', { class: 'tuile', href: t.route },
        img(t.image, '', 'fond'),
        h('span', { class: 'tuile-ic' }, img(t.icone, '')),
        h('span', { class: 'tuile-bas' }, t.titre)))),
    h('div', { class: 'hors-ligne' }, h('span', { class: 'pilule-vert' }, ico('wifi'), 'Disponible hors connexion')));
  return enveloppe(noeud, () => tts.stop());
}
