import { h, ico, toast, store, prenom, definirPrenom, effacerPrenom, presenterActif } from '../util.js';
import { effacerTemps, bilan } from '../temps.js';
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
  // Mon prénom : changer, effacer, et choisir de se présenter dans les demandes WhatsApp
  function sectionPrenom() {
    const champ = h('input', { class: 'saisie', type: 'text', value: prenom(), placeholder: 'Ton prénom', maxlength: 24, autocomplete: 'given-name', autocapitalize: 'words', 'aria-label': 'Ton prénom' });
    const enregistrer = () => {
      if (!champ.value.trim()) { effacerPrenom(); toast('Prénom effacé'); }
      else { const p = definirPrenom(champ.value); if (!p) return toast('Écris au moins deux lettres'); toast(`Enregistré : ${p}`); }
      window.dispatchEvent(new Event('vq-prenom')); dessiner();
    };
    const pres = presenterActif();
    return h('section', { class: 'reglage' }, h('h2', {}, 'Mon prénom'),
      h('p', { class: 'aide' }, prenom() ? `L'accueil te salue par ton prénom : ${prenom()}.` : 'Donne ton prénom pour que l\'accueil te salue personnellement.'),
      champ,
      h('div', { class: 'choix' },
        h('button', { class: 'option actif', onclick: enregistrer }, ico('coche'), 'Enregistrer'),
        prenom() ? h('button', { class: 'option', onclick: () => { champ.value = ''; enregistrer(); } }, 'Effacer') : null),
      h('div', { class: 'choix', role: 'radiogroup', 'aria-label': 'Me présenter dans mes messages WhatsApp', style: 'margin-top:14px' },
        h('p', { class: 'aide', style: 'flex-basis:100%;margin:0' }, 'Dans mes demandes par WhatsApp (conseil, prière, appel…) :'),
        h('button', { class: 'option' + (pres ? ' actif' : ''), role: 'radio', 'aria-checked': String(pres), onclick: () => { store.set('presenter', true); dessiner(); } }, 'Me présenter'),
        h('button', { class: 'option' + (!pres ? ' actif' : ''), role: 'radio', 'aria-checked': String(!pres), onclick: () => { store.set('presenter', false); dessiner(); } }, 'Rester anonyme')),
      h('p', { class: 'aide' }, 'Ton prénom n\'est jamais envoyé automatiquement : il n\'apparaît que dans le message WhatsApp que tu choisis d\'envoyer.'));
  }
  function dessiner() {
    const nb = Object.values(bilan(60)).reduce((a, c) => a + c, 0);
    const sectionTemps = h('section', { class: 'reglage' }, h('h2', {}, 'Mes temps avec Dieu'),
      h('p', { class: 'aide' }, 'L\'accueil montre ce que tu as le plus vécu ces 7 derniers jours. Ce décompte reste sur ton téléphone : il n\'est envoyé à personne.'),
      h('div', { class: 'choix' }, h('button', { class: 'option', disabled: !nb, onclick: () => { effacerTemps(); window.dispatchEvent(new Event('vq-prenom')); toast('Décompte effacé'); dessiner(); } }, nb ? 'Effacer le décompte' : 'Rien à effacer')));
    zone.replaceChildren(sectionPrenom(), 
      choix('Couleur du mot lu', 'Pendant la lecture à voix haute, le mot prononcé prend cette couleur.', 'couleur', R.COULEURS,
        (k, v) => [h('i', { class: 'pastille-couleur', style: `background:${k === 'aucune' ? 'repeating-linear-gradient(45deg,#ddd 0 4px,#fff 4px 8px)' : v.fond}` }), v.nom]),
      choix('Vitesse de la voix', null, 'vitesse', R.VITESSES),
      choix('Taille du texte', 'Pour les enseignements, les articles et la Bible.', 'taille', R.TAILLES),
      h('section', { class: 'reglage' }, h('h2', {}, 'Essayer'),
        h('p', { class: 'essai lecture-texte', 'data-lu': 'essai-voix:t' }, exemple.segments[0].t),
        boutonEcoute(exemple, null, { cls: 'btn btn-or', off: 'Écouter l’essai', on: 'Pause' })),
      sectionTemps,
      h('p', { class: 'aide', style: 'margin:0 16px 20px' }, 'La voix est celle du téléphone. Si rien ne se lit, installe une voix française dans les réglages du téléphone (« Synthèse vocale »).'));
  }
  dessiner();
  return enveloppe(h('div', {}, hero({ retour: '#/plus', titre: 'Réglages', sous: 'Lecture à voix haute et confort de lecture.' }), zone));
}
