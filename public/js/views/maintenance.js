import { h, ico } from '../util.js';
import { enveloppe } from './commun.js';

// Rubrique Prière fermée pendant sa préparation : aucun texte du recueil n'est chargé ici.
export default async function () {
  return enveloppe(h('div', {},
    h('div', { class: 'entete-page' }, ico('mains'), h('h1', {}, 'Prière de délivrance et ', h('em', { class: 'or' }, 'de guérison'))),
    h('section', { class: 'maintenance' },
      h('div', { class: 'maintenance-ic' }, ico('horloge')),
      h('h2', {}, 'Rubrique en préparation'),
      h('p', {}, 'Cette rubrique est en cours de développement et n\'est pas encore ouverte.'),
      h('p', {}, 'Elle sera disponible très bientôt. Merci pour ta patience !'),
      h('blockquote', {}, '« Priez sans cesse. »', h('cite', {}, '1 Thessaloniciens 5:17')),
      h('p', { class: 'maintenance-attente' }, 'En attendant :'),
      h('div', { class: 'maintenance-liens' },
        h('a', { class: 'btn btn-bleu btn-bloc', href: '#/bible' }, ico('livre'), 'Lire la Bible'),
        h('a', { class: 'btn btn-or btn-bloc', href: '#/coeurs' }, ico('coeur'), 'Consulter le Médecin des cœurs'),
        h('a', { class: 'btn btn-bleu btn-bloc', href: '#/nayla' }, ico('play'), 'Écouter une adoration')))));
}
