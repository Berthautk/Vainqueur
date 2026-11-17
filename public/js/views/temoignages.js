import { h, img, ico, contenu, ouvrirWhatsApp, mmss } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, ex, vide } from './commun.js';

const ICONES = { 'Délivrance': '🔗', 'Guérison': '❤️', 'Famille': '👨‍👩‍👧', 'Affaires': '📈' };
function onde(seed) { const e = h('div', { class: 'onde', 'aria-hidden': 'true' }); for (let i = 0; i < 34; i++) e.append(h('i', { style: `height:${20 + Math.abs(Math.sin((i + seed) * 1.7)) * 80}%` })); return e; }

export default async function () {
  const d = await contenu('temoignages');
  let filtre = 'Tous';
  const liste = h('div', { class: 'liste' });
  const barre = h('div', { class: 'filtres', role: 'group', 'aria-label': 'Catégories' },
    ['Tous', ...d.categories].map(c => h('button', { class: 'filtre' + (c === 'Tous' ? ' actif' : ''), onclick: e => { filtre = c; barre.querySelectorAll('.filtre').forEach(b => b.classList.toggle('actif', b === e.currentTarget)); dessiner(); } }, c)));
  function dessiner() {
    const items = d.items.filter(t => filtre === 'Tous' || t.categorie === filtre);
    liste.replaceChildren(...(items.length ? items.map((t, i) => carte(t, i)) : [vide('Aucun témoignage', 'Il n\'y en a pas encore dans cette catégorie.')]));
  }
  function carte(t, i) {
    const pp = h('button', { class: 'btn-lire', 'aria-label': `Écouter le témoignage de ${t.prenom}` }, ico('play'));
    pp.onclick = () => { const p = { id: 'tem-' + t.id, titre: `Témoignage — ${t.prenom}`, audio: t.audio, image: t.image, type: 'temoignage' }; if (player.etat.piste && player.etat.piste.id === p.id) player.basculer(); else player.jouer(p); };
    return h('article', { class: 'temo' }, img(t.image, '', ''),
      h('div', { class: 'temo-corps' },
        h('div', { class: 'temo-tete' }, h('div', {}, h('h3', {}, t.prenom, ex(t)), h('small', {}, '📍 ' + t.ville)), h('span', { class: `cat cat-${t.categorie}` }, `${ICONES[t.categorie] || ''} ${t.categorie}`)),
        h('p', {}, `« ${t.extrait} »`),
        t.audio ? h('div', { class: 'audio-temo' }, pp, onde(i * 3), h('time', {}, t.duree)) : null));
  }
  const menu = h('div', { class: 'menu-temo', hidden: true },
    [['micro', 'Message vocal', 'temoigner_vocal', '#1BA34A'], ['texte', 'Texte', 'temoigner_texte', '#2D6BE0'], ['photo', 'Photo', 'temoigner_photo', '#7A3CC8']].map(([ic, lab, cle, col]) =>
      h('button', { onclick: () => { menu.hidden = true; ouvrirWhatsApp(cle); } }, h('i', { style: `background:${col}` }, ico(ic, 'p20')), lab)));
  const fab = h('button', { class: 'btn btn-or', style: 'font-size:19px;padding:14px 26px', 'aria-haspopup': 'true', onclick: () => { menu.hidden = !menu.hidden; } }, ico('micro'), 'Témoigner');
  const noeud = h('div', {},
    h('section', { class: 'hero', style: 'min-height:190px' }, img('p3_08', '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/'), h('span', { style: 'font-size:30px' }, '💬'), h('h1', { style: 'font-size:24px' }, 'Témoignages')),
      h('h2', { style: 'margin-top:16px;font-size:28px;font-style:italic' }, 'Ils ont été ', h('span', { class: 'or' }, 'libérés')),
      h('p', { class: 'hero-sous' }, 'Ce que Dieu a fait pour eux, il peut le faire pour toi.')),
    barre, h('p', { style: 'margin:10px 14px 0;font-size:12px;color:var(--gris)' }, d.items.some(t => t.exemple) ? 'Témoignages d\'exemple : ils seront remplacés par de vrais témoignages.' : ''),
    h('div', { style: 'height:10px' }), liste,
    h('div', { class: 'fab-zone' }, fab, menu));
  noeud.querySelectorAll('.menu-temo svg').forEach(s => { s.style.width = '20px'; s.style.height = '20px'; });
  dessiner();
  return enveloppe(noeud);
}
