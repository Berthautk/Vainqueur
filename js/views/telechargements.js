import { h, ico, toast } from '../util.js';
import * as dl from '../downloads.js';
import * as player from '../player.js';
import { hero, enveloppe, vide } from './commun.js';

export default async function () {
  const liste = h('div', { class: 'liste', style: 'margin-top:12px' });
  async function dessiner() {
    liste.replaceChildren(h('div', { class: 'chargement' }, h('i')));
    const items = await dl.lister();
    if (!items.length) { liste.replaceChildren(vide('Aucun téléchargement', 'Utilise le bouton « Télécharger » dans Prière ou Nayla pour écouter sans connexion.')); return; }
    const total = items.reduce((a, b) => a + b.taille, 0);
    liste.replaceChildren(...items.map(it => h('div', { class: 'dl-ligne' },
      h('button', { class: 'btn-lire', 'aria-label': `Écouter ${it.titre}`, onclick: () => player.jouer({ id: 'dl-' + it.url, titre: it.titre, audio: it.url, image: 'i8_09', type: 'telechargement' }) }, ico('play')),
      h('div', {}, h('b', {}, it.titre), h('small', {}, dl.octets(it.taille))),
      h('button', { class: 'dl-sup', onclick: async () => { await dl.supprimer(it.url); toast('Supprimé'); dessiner(); } }, 'Supprimer'))),
      h('p', { class: 'vide', style: 'padding:8px' }, `Total : ${dl.octets(total)}`));
  }
  const noeud = h('div', {}, hero({ retour: '#/plus', titre: 'Mes téléchargements', sous: 'Disponibles sans internet.' }), liste);
  dessiner();
  return enveloppe(noeud);
}
