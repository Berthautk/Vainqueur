import { riche } from '../bible-refs.js';
import { h, img, contenu, ouvrirWhatsApp, ico } from '../util.js';
import { pisteEmission, paras } from '../pistes.js';
import { hero, enveloppe, ex, vide, boutonEcoute } from './commun.js';

export default async function () {
  const d = await contenu('radio');
  const file = d.emissions.map(pisteEmission);
  const fmt = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return enveloppe(h('div', {}, hero({ retour: '#/plus', titre: d.titre, sous: d.sous, image: 'q2_11' }),
    h('div', { class: 'liste', style: 'margin-top:12px' }, d.emissions.length ? d.emissions.map((e, k) => h('article', { class: 'emission' },
      h('div', { class: 'emission-tete' }, img(e.image, '', 'ligne-img'), h('div', {}, h('small', {}, fmt(e.date)), h('h3', {}, e.titre, ex(e)),
        boutonEcoute(file[k], file, { cls: 'btn btn-or btn-petit', off: e.audio ? 'Écouter l\'émission' : 'Écouter le résumé', on: 'Pause' }))),
      h('div', { class: 'lecture-texte' }, paras(e.texte).map((p, i) => h('p', { 'data-lu': `radio-${e.id}:${i}`, html: riche(p) }))),
      h('button', { class: 'lien-partage', onclick: () => ouvrirWhatsApp('radio', e.titre) }, ico('chat'), 'Réagir à cette émission'))) : [vide('Aucune émission', 'Reviens bientôt.')])));
}
