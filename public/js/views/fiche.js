import { h, img, ico, contenu, store, partager, toast, mmss, ouvrirWhatsApp, aujourdhui } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, ex, vide } from './commun.js';

export default async function (id) {
  const d = await contenu('fiches');
  const f = d.fiches.find(x => x.id === id);
  if (!f) return enveloppe(vide('Fiche introuvable', 'Cette prière n\'existe pas.'));
  const jour = aujourdhui();
  let periode = new Date().getHours() >= 17 ? 'soir' : 'matin';

  const zone = h('div'); const nettoyeurs = [];
  const bascule = h('div', { class: 'bascule', role: 'tablist' },
    ['matin', 'soir'].map(p => h('button', { role: 'tab', 'data-p': p, onclick: () => { periode = p; dessiner(); } }, ico(p === 'matin' ? 'soleil' : 'lune'), p === 'matin' ? 'Matin' : 'Soir')));

  function dessiner() {
    nettoyeurs.splice(0).forEach(n => n());
    bascule.querySelectorAll('button').forEach(b => { const on = b.dataset.p === periode; b.classList.toggle('actif', on); b.setAttribute('aria-selected', on); });
    const bloc = f[periode];
    const cle = `sujets:${f.id}:${periode}`;
    const coches = store.get(cle, []);
    const prieDeja = store.get(`prie:${f.id}:${periode}`, '') === jour;

    // --- Lecteur de l'enseignement (lecteur audio global) ---
    const piste = { id: f.id, titre: `Enseignement – ${f.titre}`, audio: f.audio, image: f.image, type: 'fiche' };
    const pp = h('button', { class: 'btn-lire', 'aria-label': 'Lecture' });
    const curs = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Position' });
    const tps = h('span', {}, '0:00 / 0:00');
    const maj = () => {
      const mien = player.etat.piste && player.etat.piste.id === f.id;
      pp.replaceChildren(ico(mien && player.lit() ? 'pause' : 'play'));
      const { t, d: du } = mien ? player.temps() : { t: 0, d: 0 };
      curs.value = du ? (t / du) * 1000 : 0; curs.style.setProperty('--p', `${du ? (t / du) * 100 : 0}%`);
      tps.textContent = `${mmss(t)} / ${du ? mmss(du) : `${f.duree}:00`}`;
    };
    pp.onclick = () => { if (player.etat.piste && player.etat.piste.id === f.id) player.basculer(); else player.jouer(piste); };
    curs.oninput = () => { const { d: du } = player.temps(); if (player.etat.piste && player.etat.piste.id === f.id) player.aller((curs.value / 1000) * du); };
    nettoyeurs.push(player.sur(maj)); maj();

    const paras = bloc.enseignement.split('\n\n');
    const long = paras.join('').length > 220;
    const texte = h('div', { class: 'texte-enseignement' + (long ? ' replie' : '') }, paras.map(p => h('p', {}, p)));
    const suite = long ? h('button', { class: 'lire-suite' }, 'Lire la suite ›') : null;
    if (suite) suite.onclick = () => { const r = texte.classList.toggle('replie'); suite.textContent = r ? 'Lire la suite ›' : 'Réduire ‹'; };

    const liste = h('ul', { class: 'sujets' }, bloc.sujets.map((s, i) => {
      const c = h('span', { class: 'case' + (coches.includes(i) ? ' coche' : ''), role: 'checkbox', tabindex: 0, 'aria-checked': coches.includes(i), 'aria-label': `Sujet ${i + 1}` }, ico('coche'));
      const bascule = () => { const a = store.get(cle, []); const n = a.includes(i) ? a.filter(x => x !== i) : [...a, i]; store.set(cle, n); const on = n.includes(i); c.classList.toggle('coche', on); c.setAttribute('aria-checked', on); };
      c.onclick = bascule; c.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); bascule(); } };
      return h('li', {}, h('span', { class: 'num' }, i + 1), h('label', { onclick: bascule }, s), c);
    }));

    const merci = h('p', { class: 'merci', hidden: !prieDeja }, 'Bravo ! Tu as prié aujourd\'hui. 🙏');
    const btnPrie = h('button', { class: 'btn btn-or btn-bloc' }, ico('coche'), 'J\'ai prié');
    btnPrie.onclick = () => { store.set(`prie:${f.id}:${periode}`, jour); merci.hidden = false; toast('Enregistré — que Dieu te garde !'); };

    zone.replaceChildren(
      h('section', { class: 'bloc' }, h('div', { class: 'bloc-titre' }, ico('livre'), 'Enseignement'),
        h('div', { class: 'bloc-corps' },
          h('div', { class: 'lecteur-mini' }, img('p1_12', '', ''),
            h('div', { class: 'piste' }, h('b', {}, piste.titre), pp, h('div', { class: 'curseur' }, curs, tps))),
          texte, suite)),
      h('section', { class: 'bloc' }, h('div', { class: 'bloc-titre' }, ico('mains'), 'Tes 5 sujets de prière'), liste),
      btnPrie, merci,
      h('a', { class: 'lien-partage', href: '#', onclick: e => { e.preventDefault(); ouvrirWhatsApp('temoigner_texte', `« ${f.titre} » — `); } }, ico('partager'), 'Partager mon témoignage'));
  }

  const noeud = h('div', {},
    h('section', { class: 'hero hero-fiche' }, img(f.bandeau || f.image, '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/priere'), h('h1', {}, f.titre, ex(f)))),
    bascule, zone);
  dessiner();
  document.body.dataset.ecoute = f.id;
  return enveloppe(noeud, () => { nettoyeurs.splice(0).forEach(n => n()); document.body.dataset.ecoute = ''; });
}
