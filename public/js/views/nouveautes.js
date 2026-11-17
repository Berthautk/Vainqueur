import { h, contenu, store } from '../util.js';
import { hero, enveloppe, ex, vide } from './commun.js';

export default async function () {
  const d = await contenu('nouveautes');
  const vu = store.get('news_vu', '');
  const items = [...d.items].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const dernier = items.map(i => i.id + i.date).sort().pop() || '';
  const fmt = s => new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const noeud = h('div', {}, hero({ retour: '#/', titre: 'Nouveautés', sous: 'Ce qui vient d\'être ajouté.' }),
    h('div', { class: 'liste', style: 'margin-top:12px' }, items.length ? items.map(i => h('a', { class: 'news' + (!vu || (i.id + i.date) > vu ? ' neuf' : ''), href: i.lien || '#/' }, h('time', {}, fmt(i.date)), h('b', {}, i.titre, ex(i)), h('span', {}, i.texte))) : [vide('Rien de nouveau', 'Reviens bientôt.')]));
  store.set('news_vu', dernier); window.dispatchEvent(new Event('vq-news'));
  return enveloppe(noeud);
}
