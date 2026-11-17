import { h, img, ico, contenu, store, partager, mmss, toast } from '../util.js';
import * as player from '../player.js';
import * as dl from '../downloads.js';
import { retour, enveloppe, ex, vide } from './commun.js';

export default async function (id) {
  const d = await contenu('nayla');
  const pistes = d.adorations.map(a => ({ id: a.id, titre: a.titre, audio: a.audio, image: a.image, duree: a.duree, type: 'adoration' }));
  const a = d.adorations.find(x => x.id === id);
  if (!a) return enveloppe(vide('Adoration introuvable', 'Cette adoration n\'existe pas.'));
  const piste = pistes.find(p => p.id === id);
  // Ne relance pas si c'est déjà la piste en cours (la musique continue)
  if (!player.etat.piste || player.etat.piste.id !== id) player.jouer(piste, pistes);
  else if (player.etat.file.length < 2) player.etat.file = pistes, player.etat.index = pistes.indexOf(piste);

  const titre = h('h1', {}, a.titre);
  const pochette = h('div', { class: 'lect-pochette' }, img(a.image, a.titre, '', false));
  const curs = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Position dans l\'adoration' });
  const t0 = h('span', {}, '0:00'), t1 = h('span', {}, a.duree);
  const pp = h('button', { class: 'grand', 'aria-label': 'Lecture / pause' });
  const alea = h('button', { 'aria-label': 'Lecture aléatoire' }, ico('aleatoire'));
  const rep = h('button', { 'aria-label': 'Répéter' }, ico('repeter'));
  const fav = h('button', { class: 'btn btn-clair' });
  const down = h('button', { class: 'btn btn-clair' }, h('span', { style: 'color:var(--vert);display:flex' }, ico('telecharger')), 'Télécharger');

  const favs = () => store.get('favoris', []);
  const majFav = () => { const on = favs().includes(id); fav.replaceChildren(h('span', { style: `color:${on ? 'var(--rouge)' : 'var(--gris)'};display:flex` }, ico(on ? 'coeur' : 'coeurV')), 'Favori'); fav.setAttribute('aria-pressed', on); };
  fav.onclick = () => { const f = favs(); const n = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; store.set('favoris', n); majFav(); toast(n.includes(id) ? 'Ajouté aux favoris' : 'Retiré des favoris'); };
  majFav();
  dl.estGarde(a.audio).then(ok => { if (ok) down.lastChild.textContent = 'Téléchargé ✔'; });
  down.onclick = async () => { if (await dl.telecharger(a.audio, a.titre)) down.lastChild.textContent = 'Téléchargé ✔'; };

  const maj = () => {
    const p = player.etat.piste; if (!p) return;
    titre.textContent = p.titre;
    const cur = d.adorations.find(x => x.id === p.id); if (cur && cur.id !== id) { location.replace(`#/nayla/${cur.id}`); return; }
    pp.replaceChildren(ico(player.lit() ? 'pause' : 'play'));
    alea.classList.toggle('on', player.etat.aleatoire); rep.classList.toggle('on', player.etat.repeter);
    alea.setAttribute('aria-pressed', player.etat.aleatoire); rep.setAttribute('aria-pressed', player.etat.repeter);
    const { t, d: du } = player.temps();
    t0.textContent = mmss(t); if (du) t1.textContent = mmss(du);
    curs.value = du ? (t / du) * 1000 : 0; curs.style.setProperty('--p', `${du ? (t / du) * 100 : 0}%`);
  };
  pp.onclick = () => player.basculer();
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

  const noeud = h('div', {},
    h('section', { class: 'lect' },
      h('div', { class: 'hero-ligne' }, retour('#/nayla'), ex(a)),
      pochette, titre, h('div', { class: 'lect-sous' }, 'Nayla — Nouvelle Adoration'),
      h('div', { class: 'lect-temps' }, t0, curs, t1),
      h('div', { class: 'lect-cmds' }, alea, h('button', { 'aria-label': 'Précédent', onclick: () => player.precedent() }, ico('prec')), pp, h('button', { 'aria-label': 'Suivant', onclick: () => player.suivant() }, ico('suiv')), rep),
      h('div', { class: 'lect-actions' }, down, h('button', { class: 'btn btn-clair', onclick: () => partager(a.titre, `Écoute « ${a.titre} » — Nayla, Nouvelle Adoration (Vainqueur)`) }, h('span', { style: 'color:var(--bleu);display:flex' }, ico('partager')), 'Partager'), fav)),
    h('div', { class: 'onglets-bas' }, bt), contenuOnglet);
  dessinerOnglet(); maj();
  return enveloppe(noeud, off);
}
