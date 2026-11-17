import { h, img, ico, contenu, store } from '../util.js';
import * as player from '../player.js';
import { enveloppe, ex, vide } from './commun.js';

export default async function () {
  const d = await contenu('nayla');
  const pistes = d.adorations.map(a => ({ id: a.id, titre: a.titre, audio: a.audio, image: a.image, duree: a.duree, type: 'adoration', exemple: a.exemple }));
  const liste = h('div', { class: 'liste' });
  const rech = h('input', { type: 'search', placeholder: 'Rechercher une adoration…', 'aria-label': 'Rechercher une adoration', autocomplete: 'off' });
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function dessiner() {
    const q = norm(rech.value.trim());
    const res = pistes.filter(p => norm(p.titre).includes(q));
    liste.replaceChildren(...(res.length ? res.map(p => ligne(p, pistes)) : [vide('Aucun résultat', 'Essaie un autre mot.')]));
  }
  rech.oninput = dessiner;
  const maj = t => { if (t === 'temps') return; liste.querySelectorAll('.ligne-nayla').forEach(l => { const mien = player.etat.piste && player.etat.piste.id === l.dataset.id; l.classList.toggle('joue', mien); const b = l.querySelector('.btn-lire'); b.replaceChildren(ico(mien && player.lit() ? 'pause' : 'play')); }); };
  const off = player.sur(maj);

  const noeud = h('div', {},
    h('section', { class: 'hero', style: 'min-height:210px' }, img('q1_04', '', 'hero-img', false),
      h('h1', { style: 'max-width:70%;margin-top:6px' }, h('span', { class: 'or' }, '♫ '), 'Nayla — ', h('em', {}, 'Nouvelle Adoration')),
      h('p', { class: 'hero-sous' }, 'Chaque adoration porte une vie, un enseignement.')),
    h('div', { class: 'recherche' }, ico('loupe'), rech),
    liste);
  dessiner(); maj();
  return enveloppe(noeud, off);
}

function ligne(p, pistes) {
  const lire = h('button', { class: 'btn-lire', 'aria-label': `Lire ${p.titre}` }, ico('play'));
  lire.onclick = e => { e.stopPropagation(); if (player.etat.piste && player.etat.piste.id === p.id) player.basculer(); else player.jouer(p, pistes); };
  return h('div', { class: 'ligne ligne-nayla', 'data-id': p.id, role: 'link', tabindex: 0, onclick: () => { location.hash = `#/nayla/${p.id}`; }, onkeydown: e => { if (e.key === 'Enter') location.hash = `#/nayla/${p.id}`; } },
    img(p.image, '', 'ligne-img'),
    h('div', { class: 'ligne-txt' }, h('h3', {}, p.titre, ex(p)), h('div', { class: 'ligne-meta' }, ico('horloge'), p.duree)),
    lire);
}
