import { h, img, ico, contenu, store, partager, mmss, toast, naylaIndex, naylaSens } from '../util.js';
import * as player from '../player.js';
import * as dl from '../downloads.js';
import { pisteAdoration, pistesAdorations } from '../pistes.js';
import { retour, enveloppe, ex, vide } from './commun.js';

const idYoutube = u => (String(u || '').match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|live\/)([\w-]{11})/) || [])[1];

export default async function (id) {
  const d = await contenu('nayla');
  const a = d.adorations.find(x => x.id === id);
  if (!a) return enveloppe(vide('Adoration introuvable', 'Cette adoration n\'existe pas.'));
  const file = pistesAdorations(d);
  const piste = pisteAdoration(a);
  const vid = idYoutube(a.video);
  // Ne relance pas si c'est déjà la piste en cours : la musique continue
  if (a.audio && (!player.etat.piste || player.etat.piste.id !== id)) player.jouer(piste, file);

  const pochette = h('div', { class: 'lect-pochette' }, img(a.image, a.titre, '', false),
    h('span', { class: 'eq-grand', 'aria-hidden': 'true' }, Array.from({ length: 22 }, (_, i) => h('i', { style: `--d:${(-((i * 37) % 13) / 10).toFixed(1)}s;--v:${(0.6 + ((i * 53) % 9) / 10).toFixed(1)}s` }))));

  // Vidéo YouTube (si l'adoration en a une) : jouée dans l'application
  function montrerVideo() {
    if (!navigator.onLine) { toast('Connexion nécessaire pour regarder la vidéo'); return; }
    player.pause();
    pochette.classList.add('video');
    pochette.replaceChildren(h('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
      title: a.titre, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, loading: 'lazy'
    }));
  }
  if (vid) pochette.append(h('button', { class: 'btn-video', onclick: montrerVideo }, ico('play'), 'Regarder la vidéo'));

  const titre = h('h1', {}, a.titre);
  const curs = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Position dans l\'adoration' });
  const t0 = h('span', {}, '0:00'), t1 = h('span', {}, a.duree || '');
  const pp = h('button', { class: 'grand', 'aria-label': 'Lecture / pause' });
  const alea = h('button', { 'aria-label': 'Lecture aléatoire' }, ico('aleatoire'));
  const rep = h('button', { 'aria-label': 'Répéter' }, ico('repeter'));
  const fav = h('button', { class: 'btn btn-clair' });
  const down = h('button', { class: 'btn btn-clair' });

  const favs = () => store.get('favoris', []);
  const majFav = () => { const on = favs().includes(id); fav.replaceChildren(h('span', { style: `color:${on ? 'var(--rouge)' : 'var(--gris)'};display:flex` }, ico(on ? 'coeur' : 'coeurV')), on ? 'Favori ✓' : 'Favori'); fav.setAttribute('aria-pressed', String(on)); };
  fav.onclick = () => { const f = favs(); const n = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; store.set('favoris', n); majFav(); toast(n.includes(id) ? 'Ajouté à « Mes favoris » ♥' : 'Retiré des favoris'); };
  majFav();
  const majDl = ok => { down.classList.toggle('fait', ok); down.replaceChildren(h('span', { style: 'color:var(--vert);display:flex' }, ico(ok ? 'coche' : 'telecharger')), ok ? 'Téléchargé' : 'Télécharger'); };
  majDl(false);
  if (a.audio) dl.estGarde(a.audio).then(majDl);
  down.onclick = async () => { if (down.classList.contains('fait')) { location.hash = '#/telechargements'; return; } if (await dl.telecharger(a.audio, a.titre)) majDl(true); };

  const maj = () => {
    const p = player.etat.piste;
    if (p && p.type === 'adoration' && p.id !== id && d.adorations.some(x => x.id === p.id)) { location.replace(`#/nayla/${p.id}`); return; }
    const mien = p && p.id === id; const on = mien && player.lit();
    pp.replaceChildren(ico(on ? 'pause' : 'play'));
    pochette.classList.toggle('joue', on);
    alea.classList.toggle('on', player.etat.aleatoire); rep.classList.toggle('on', player.etat.repeter);
    alea.setAttribute('aria-pressed', String(player.etat.aleatoire)); rep.setAttribute('aria-pressed', String(player.etat.repeter));
    const { t, d: du } = mien ? player.temps() : { t: 0, d: 0 };
    t0.textContent = mmss(t); if (du) t1.textContent = mmss(du);
    curs.value = du ? (t / du) * 1000 : 0; curs.style.setProperty('--p', `${du ? (t / du) * 100 : 0}%`);
  };
  pp.onclick = () => { if (player.etat.piste && player.etat.piste.id === id) player.basculer(); else player.jouer(piste, file); };
  alea.onclick = () => player.basculerAleatoire(); rep.onclick = () => player.basculerRepeter();
  curs.oninput = () => player.aller((curs.value / 1000) * (player.temps().d || 0));
  const off = player.sur(maj);

  // Onglets Paroles / Enseignement
  let onglet = 'paroles';
  const contenuOnglet = h('div');
  const bt = ['paroles', 'enseignement'].map(k => h('button', { onclick: () => { onglet = k; dessinerOnglet(); } }, ico(k === 'paroles' ? 'musique' : 'livre'), k === 'paroles' ? 'Paroles' : 'Enseignement'));
  function dessinerOnglet() {
    bt.forEach((b, i) => b.classList.toggle('actif', (i === 0) === (onglet === 'paroles')));
    const txt = onglet === 'paroles' ? a.paroles : a.enseignement;
    contenuOnglet.replaceChildren(h('div', { class: 'paroles' }, txt ? txt.split('\n\n').map(p => h('p', {}, p)) : h('p', {}, 'Bientôt disponible.')));
  }

  const commandes = a.audio ? [
    h('div', { class: 'lect-temps' }, t0, curs, t1),
    h('div', { class: 'lect-cmds' }, alea, h('button', { 'aria-label': 'Précédent', onclick: () => player.precedent() }, ico('prec')), pp, h('button', { 'aria-label': 'Suivant', onclick: () => player.suivant() }, ico('suiv')), rep)
  ] : [];
  const noeud = h('div', {},
    h('section', { class: 'lect' },
      h('div', { class: 'hero-ligne' }, retour('#/nayla'), ex(a)),
      pochette, titre, naylaSens(naylaIndex(), 'lect-sous'),
      commandes,
      h('div', { class: 'lect-actions' }, a.audio ? down : null,
        h('button', { class: 'btn btn-clair', onclick: () => partager(a.titre, `Écoute « ${a.titre} » — Nayla, sur l'application Vainqueur`) }, h('span', { style: 'color:var(--bleu);display:flex' }, ico('partager')), 'Partager'), fav)),
    h('div', { class: 'onglets-bas' }, bt), contenuOnglet);
  dessinerOnglet(); maj();
  return enveloppe(noeud, off);
}
