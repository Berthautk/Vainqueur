import { h, ico, toast } from '../util.js';
import * as R from '../reglages.js';
import * as player from '../player.js';
import { hero, enveloppe, boutonEcoute } from './commun.js';

export default async function () {
  const zone = h('div');
  const exemple = { id: 'essai-voix', titre: 'Essai de la voix', audio: '', image: 'p1_12', type: 'essai', lien: '#/reglages',
    segments: [{ t: 'L’Éternel est mon berger : je ne manquerai de rien. Il me fait reposer dans de verts pâturages.', lu: 'essai-voix:t' }] };
  function choix(titre, aide, cle, table, rendu) {
    const r = R.lire();
    return h('section', { class: 'reglage' }, h('h2', {}, titre), aide ? h('p', { class: 'aide' }, aide) : null,
      h('div', { class: 'choix', role: 'radiogroup', 'aria-label': titre }, Object.entries(table).map(([k, v]) =>
        h('button', { class: 'option' + (r[cle] === k ? ' actif' : ''), role: 'radio', 'aria-checked': String(r[cle] === k),
          onclick: () => { R.ecrire(cle, k); dessiner(); toast('Réglage enregistré'); } }, rendu ? rendu(k, v) : v.nom))));
  }
  function dessiner() {
    zone.replaceChildren(
      choix('Couleur du mot lu', 'Pendant la lecture à voix haute, le mot prononcé prend cette couleur.', 'couleur', R.COULEURS,
        (k, v) => [h('i', { class: 'pastille-couleur', style: `background:${k === 'aucune' ? 'repeating-linear-gradient(45deg,#ddd 0 4px,#fff 4px 8px)' : v.fond}` }), v.nom]),
      choix('Vitesse de la voix', null, 'vitesse', R.VITESSES),
      choix('Taille du texte', 'Pour les enseignements, les articles et la Bible.', 'taille', R.TAILLES),
      h('section', { class: 'reglage' }, h('h2', {}, 'Essayer'),
        h('p', { class: 'essai lecture-texte', 'data-lu': 'essai-voix:t' }, exemple.segments[0].t),
        boutonEcoute(exemple, null, { cls: 'btn btn-or', off: 'Écouter l’essai', on: 'Pause' })),
      h('p', { class: 'aide', style: 'margin:0 16px 20px' }, 'La voix est celle du téléphone. Si rien ne se lit, installe une voix française dans les réglages du téléphone (« Synthèse vocale »).'));
  }
  dessiner();
  return enveloppe(h('div', {}, hero({ retour: '#/plus', titre: 'Réglages', sous: 'Lecture à voix haute et confort de lecture.' }), zone));
}
