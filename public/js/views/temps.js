// « Mes temps avec Dieu » en détail : toutes les rubriques, sur 7 ou 30 jours. Tout reste sur le téléphone.
import { h, ico, toast, store } from '../util.js';
import { bilan, ACTIVITES, joursActifs, serie, effacerTemps } from '../temps.js';
import { hero, enveloppe } from './commun.js';

const duree = m => (m >= 60 ? Math.floor(m / 60) + ' h ' + String(Math.round(m % 60)).padStart(2, '0') : m > 0 && m < 1 ? '< 1 min' : Math.round(m) + ' min');

export default async function () {
  let jours = store.get('temps-periode', 7) === 30 ? 30 : 7;
  const zone = h('div');
  function dessiner() {
    const b = bilan(jours);
    const l = Object.keys(ACTIVITES).map(k => ({ k, ...ACTIVITES[k], minutes: b[k] })).sort((a, c) => c.minutes - a.minutes);
    const total = l.reduce((s, x) => s + x.minutes, 0);
    const actifs = joursActifs(jours), s = serie();
    const choix = h('div', { class: 'chips', role: 'group', 'aria-label': 'Période' }, [7, 30].map(n => h('button', {
      class: 'filtre' + (jours === n ? ' actif' : ''), 'aria-pressed': String(jours === n),
      onclick: () => { jours = n; store.set('temps-periode', n); dessiner(); } }, `${n} derniers jours`)));
    zone.replaceChildren(
      h('div', { style: 'padding:12px 12px 0' }, choix),
      h('section', { class: 'temps-resume' },
        h('div', {}, h('small', {}, 'Temps total'), h('b', {}, total >= 1 ? duree(total) : '0 min')),
        h('div', {}, h('small', {}, 'Jours avec Dieu'), h('b', {}, `${actifs} sur ${jours}`)),
        h('div', {}, h('small', {}, 'Jours d\'affilée'), h('b', {}, s ? `${s} 🔥` : '0'))),
      h('h2', { class: 'titre-section' }, 'Où tu passes ton temps'),
      h('div', { class: 'liste' }, l.map(x => h('div', { class: 'temps-ligne' },
        h('span', { class: 'temps-nom' }, `${x.icone} ${x.nom}`),
        h('b', {}, duree(x.minutes)),
        h('span', { class: 'stat-perso__part' }, h('i', { style: `width:${x.minutes >= 1 && total ? Math.max(4, (x.minutes / total) * 100) : 0}%` })),
        h('span', { class: 'stat-perso__pc' }, total >= 1 ? `${Math.round((x.minutes / total) * 100)} %` : '—')))),
      total < 1 ? h('p', { class: 'aide', style: 'margin:12px 16px' }, 'Rien pour l\'instant : prie, lis la Bible ou écoute une adoration, et ton temps apparaîtra ici.') : null,
      h('section', { class: 'reglage' }, h('h2', {}, 'Ta vie privée'),
        h('p', { class: 'aide' }, 'Ce décompte reste sur ton téléphone. Il n\'est envoyé à personne. On ne garde que les 60 derniers jours.'),
        h('div', { class: 'choix' }, h('button', { class: 'option', disabled: !total, onclick: () => { effacerTemps(); toast('Décompte effacé'); dessiner(); } }, total ? 'Effacer le décompte' : 'Rien à effacer'))));
  }
  dessiner();
  return enveloppe(h('div', {}, hero({ retour: '#/', titre: 'Mes temps avec Dieu', sous: 'Ton chemin avec Dieu, jour après jour.' }), zone));
}
