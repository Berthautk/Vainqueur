import { h, img, ico, eq, contenu, store, toast, naylaIndex, naylaSens, NAYLA } from '../util.js';
import * as player from '../player.js';
import { pisteAdoration, pistesAdorations } from '../pistes.js';
import { enveloppe, ex, vide } from './commun.js';

// En-tête NAYLA : la signification alterne d'une ouverture à l'autre, et change aussi en douceur sur la page
export function enteteNayla() {
  let i = naylaIndex();
  const zone = h('div', { class: 'nayla-zone' }, naylaSens(i));
  const points = h('div', { class: 'nayla-points', 'aria-hidden': 'true' }, NAYLA.map((_, k) => h('i', { class: k === i ? 'actif' : '' })));
  const changer = () => {
    i = (i + 1) % NAYLA.length;
    const ancien = zone.firstChild; ancien.classList.add('sort');
    setTimeout(() => { zone.replaceChildren(naylaSens(i, 'nayla-sens entre')); [...points.children].forEach((p, k) => p.classList.toggle('actif', k === i)); }, 450);
  };
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minuteur = calme ? null : setInterval(changer, 9000);
  const noeud = h('section', { class: 'hero hero-nayla' }, img('q1_04', '', 'hero-img', false),
    h('h1', { class: 'nayla-titre' }, h('span', { class: 'nayla-note', 'aria-hidden': 'true' }, '♫'), 'NAYLA'),
    zone, points);
  return { noeud, stop: () => clearInterval(minuteur) };
}

export default async function () {
  const d = await contenu('nayla');
  const file = pistesAdorations(d);
  const liste = h('div', { class: 'liste' });
  const rech = h('input', { type: 'search', placeholder: 'Rechercher une adoration…', 'aria-label': 'Rechercher une adoration', autocomplete: 'off' });
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let favSeul = false;
  const chips = h('div', { class: 'chips' }, ['Toutes', 'Mes favoris'].map((l, i) => h('button', {
    class: 'filtre' + (i === 0 ? ' actif' : ''), 'aria-pressed': String(i === 0),
    onclick: e => { favSeul = i === 1; chips.querySelectorAll('.filtre').forEach(b => { const on = b === e.currentTarget; b.classList.toggle('actif', on); b.setAttribute('aria-pressed', String(on)); }); dessiner(); }
  }, i === 1 ? [h('span', { class: 'coeur-liste' }, ico('coeur')), l] : l)));

  function dessiner() {
    const q = norm(rech.value.trim());
    const favs = store.get('favoris', []);
    const res = d.adorations.filter(a => norm(a.titre).includes(q) && (!favSeul || favs.includes(a.id)));
    const msg = favSeul && !q
      ? vide('Pas encore de favoris', 'Touche le cœur ♡ à côté d\'une adoration pour la retrouver ici.')
      : vide('Aucun résultat', 'Essaie un autre mot.');
    liste.replaceChildren(...(res.length ? res.map(a => ligne(a)) : [msg]));
    maj();
  }
  function ligne(a) {
    const p = pisteAdoration(a);
    const favs = store.get('favoris', []);
    const fav = h('button', { class: 'btn-fav', 'aria-pressed': String(favs.includes(a.id)), 'aria-label': `Ajouter « ${a.titre} » aux favoris` }, ico(favs.includes(a.id) ? 'coeur' : 'coeurV'));
    fav.onclick = e => {
      e.stopPropagation();
      const f = store.get('favoris', []); const on = !f.includes(a.id);
      store.set('favoris', on ? [...f, a.id] : f.filter(x => x !== a.id));
      toast(on ? 'Ajouté à « Mes favoris » ♥' : 'Retiré des favoris');
      if (favSeul) dessiner(); else { fav.replaceChildren(ico(on ? 'coeur' : 'coeurV')); fav.setAttribute('aria-pressed', String(on)); }
    };
    const lire = h('button', { class: 'btn-lire', 'aria-label': a.video && !a.audio ? `Regarder ${a.titre}` : `Lire ${a.titre}` }, ico('play'));
    lire.onclick = e => {
      e.stopPropagation();
      if (!a.audio) { location.hash = `#/nayla/${a.id}`; return; }
      if (player.etat.piste && player.etat.piste.id === a.id) player.basculer(); else player.jouer(p, file);
    };
    const ouvrir = () => { location.hash = `#/nayla/${a.id}`; };
    return h('div', { class: 'ligne ligne-nayla', 'data-id': a.id, role: 'link', tabindex: 0, onclick: ouvrir, onkeydown: e => { if (e.key === 'Enter') ouvrir(); } },
      h('span', { class: 'vignette' }, img(a.image, '', 'ligne-img'), eq(5, 'eq eq-vignette')),
      h('div', { class: 'ligne-txt' }, h('h3', {}, a.titre, ex(a)),
        h('div', { class: 'ligne-meta' }, a.video ? [h('span', { class: 'badge-video' }, ico('video'), 'Vidéo')] : null, a.audio ? [ico('horloge'), a.duree] : null)),
      h('div', { class: 'nayla-btns' }, fav, lire));
  }
  function maj(t) {
    if (t === 'temps') return;
    const cur = player.etat.piste && player.etat.piste.id; const on = player.lit();
    liste.querySelectorAll('.ligne-nayla').forEach(l => {
      const mien = cur === l.dataset.id;
      l.classList.toggle('courant', mien); l.classList.toggle('joue', mien && on);
      const b = l.querySelector('.btn-lire'); b.replaceChildren(ico(mien && on ? 'pause' : 'play'));
    });
  }
  rech.oninput = dessiner;
  const off = player.sur(maj);
  const tete = enteteNayla();
  const noeud = h('div', {}, tete.noeud, h('div', { class: 'recherche' }, ico('loupe'), rech), chips, liste);
  dessiner();
  return enveloppe(noeud, () => { off(); tete.stop(); });
}
