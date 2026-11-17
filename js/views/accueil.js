import { h, img, ico, contenu, tts, partager, toast, store, ficheDuJour, prieAujourdhui } from '../util.js';
import * as player from '../player.js';
import { enveloppe } from './commun.js';

const jourDeAnnee = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);

export default async function () {
  const [acc, fiches] = await Promise.all([contenu('accueil'), contenu('fiches')]);
  const j = jourDeAnnee();
  const ac = acc.accroches[j % acc.accroches.length];
  const pa = acc.paroles[j % acc.paroles.length];
  const fiche = ficheDuJour(fiches);
  const fait = prieAujourdhui(fiche.id);

  const btnEcouter = h('button', { class: 'btn btn-bleu btn-petit' }, ico('casque'), 'Écouter');
  btnEcouter.onclick = () => {
    if (tts.actif) { tts.stop(); btnEcouter.lastChild.textContent = 'Écouter'; return; }
    if (tts.parler(`${pa.texte}. ${pa.ref.replace(/(\d+):(\d+)/, '$1, verset $2')}`, () => { btnEcouter.lastChild.textContent = 'Écouter'; })) btnEcouter.lastChild.textContent = 'Arrêter';
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
        fait ? h('span', { class: 'prie-ok', style: 'margin-bottom:6px' }, ico('coche'), 'Tu as prié aujourd\'hui') : null,
        h('a', { class: 'btn btn-or', href: `#/priere/${fiche.id}` }, ico('play'), fait ? 'Revoir' : 'Commencer'))),
    installer(),
    h('section', { class: 'tuiles', 'aria-label': 'Rubriques' },
      acc.tuiles.map(t => h('a', { class: 'tuile', href: t.route },
        img(t.image, '', 'fond'),
        h('span', { class: 'tuile-ic' }, img(t.icone, '')),
        h('span', { class: 'tuile-bas' }, t.titre)))),
    h('div', { class: 'hors-ligne' }, h('span', { class: 'pilule-vert' }, ico('wifi'), 'Disponible hors connexion')));
  const majInst = () => { const z = noeud.querySelector('.installer'); if (z) z.hidden = !window.vqInstall; };
  window.addEventListener('vq-installable', majInst);
  return enveloppe(noeud, () => { tts.stop(); window.removeEventListener('vq-installable', majInst); });
}

export function installer() {
  return h('section', { class: 'installer', hidden: !window.vqInstall },
    h('img', { src: 'icons/icon-192.png', alt: '' }),
    h('div', {}, h('b', {}, 'Installer Vainqueur'), 'Sur ton écran d\'accueil, même sans internet.'),
    h('button', { class: 'btn btn-or btn-petit', onclick: async () => { const e = window.vqInstall; if (!e) return; e.prompt(); try { await e.userChoice; } catch { /* ignoré */ } window.vqInstall = null; window.dispatchEvent(new Event('vq-installable')); } }, 'Installer'));
}
