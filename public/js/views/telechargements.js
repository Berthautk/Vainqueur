import { h, ico, toast } from '../util.js';
import * as dl from '../downloads.js';
import * as player from '../player.js';
import { hero, enveloppe, vide, boutonEcoute } from './commun.js';

export default async function () {
  const liste = h('div', { class: 'liste', style: 'margin-top:12px' });
  async function dessiner() {
    liste.replaceChildren(h('div', { class: 'chargement' }, h('i')));
    const items = await dl.lister();
    if (!items.length) { liste.replaceChildren(vide('Aucun téléchargement', 'Touche « Télécharger » sur une adoration de Nayla ou un enseignement pour l\'écouter ici sans internet.')); return; }
    const total = items.reduce((a, b) => a + b.taille, 0);
    const file = items.map(it => ({ id: 'dl-' + it.url, titre: it.titre, audio: it.url, image: 'i8_09', type: 'telechargement', lien: '#/telechargements' }));
    liste.replaceChildren(...items.map((it, k) => h('div', { class: 'dl-ligne' },
      boutonEcoute(file[k], file, { cls: 'btn-lire', icone: 'play', aria: `Écouter ${it.titre}` }),
      h('div', {}, h('b', {}, it.titre), h('small', {}, dl.octets(it.taille))),
      h('div', { class: 'dl-actions' },
        h('button', { class: 'dl-tel', onclick: () => dl.enregistrerSurTelephone(it.url, it.titre), 'aria-label': `Enregistrer ${it.titre} dans le téléphone` }, ico('telephone'), 'Enregistrer'),
        h('button', { class: 'dl-sup', onclick: async () => { if (player.etat.piste && player.etat.piste.audio === it.url) player.arreter(); await dl.supprimer(it.url); toast('Supprimé'); dessiner(); } }, 'Supprimer')))),
      h('p', { class: 'vide', style: 'padding:8px' }, `Total : ${dl.octets(total)}`));
  }
  const noeud = h('div', {}, hero({ retour: '#/plus', titre: 'Mes téléchargements', sous: 'Disponibles sans internet.' }),
    h('div', { class: 'info-dl' }, h('b', {}, 'Où vont mes téléchargements ?'),
      'Ils sont gardés dans l\'application : tu les écoutes ici, même sans internet. Pour en avoir aussi une copie dans ton téléphone, touche « Enregistrer ».'),
    liste);
  dessiner();
  return enveloppe(noeud);
}
