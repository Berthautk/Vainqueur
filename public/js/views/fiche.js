import { riche } from '../bible-refs.js';
import { h, img, ico, contenu, store, partager, toast, mmss, ouvrirWhatsApp, aujourdhui, bravo, prenom } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, ex, vide } from './commun.js';
import { pisteFiche, pistesFiches } from '../pistes.js';

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
    const piste = pisteFiche(f, periode); const file = pistesFiches(d, periode);
    document.body.dataset.ecoute = piste.id; window.dispatchEvent(new Event('vq-mini'));
    const pp = h('button', { class: 'btn-lire', 'aria-label': 'Lecture' });
    const curs = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Position' });
    const tps = h('span', {}, '0:00 / 0:00');
    const maj = () => {
      const p = player.etat.piste;
      // « Suivant » dans le lecteur : on suit la fiche qui joue
      if (p && p.type === 'fiche' && p.id !== piste.id && p.id.endsWith('-' + periode) && d.fiches.some(x => p.id === `f-${x.id}-${periode}`)) { location.replace(p.lien); return; }
      const mien = p && p.id === piste.id;
      pp.replaceChildren(ico(mien && player.lit() ? 'pause' : 'play'));
      const { t, d: du } = mien ? player.temps() : { t: 0, d: 0 };
      curs.value = du ? (t / du) * 1000 : 0; curs.style.setProperty('--p', `${du ? (t / du) * 100 : 0}%`);
      tps.textContent = mien ? player.libelleTemps() : (f.audio ? `0:00 / ${f.duree}:00` : 'Lu par la voix du téléphone');
    };
    pp.onclick = () => { if (player.etat.piste && player.etat.piste.id === piste.id) player.basculer(); else player.jouer(piste, file); };
    curs.oninput = () => { const { d: du } = player.temps(); if (player.etat.piste && player.etat.piste.id === piste.id) player.aller((curs.value / 1000) * du); };
    const prec = h('button', { class: 'ic-mini', 'aria-label': 'Fiche précédente', onclick: () => { if (player.etat.piste && player.etat.piste.id === piste.id) player.precedent(); else player.jouer(file[(file.findIndex(x => x.id === piste.id) - 1 + file.length) % file.length], file); } }, ico('prec'));
    const suiv = h('button', { class: 'ic-mini', 'aria-label': 'Fiche suivante', onclick: () => { if (player.etat.piste && player.etat.piste.id === piste.id) player.suivant(); else player.jouer(file[(file.findIndex(x => x.id === piste.id) + 1) % file.length], file); } }, ico('suiv'));
    nettoyeurs.push(player.sur(maj)); maj();

    const paras = bloc.enseignement.split('\n\n');
    const long = paras.join('').length > 220;
    const texte = h('div', { class: 'texte-enseignement lecture-texte' + (long ? ' replie' : '') }, paras.map((p, i) => h('p', { 'data-lu': `${piste.id}:e${i}`, html: riche(p) })));
    const suite = long ? h('button', { class: 'lire-suite' }, 'Lire la suite ›') : null;
    if (suite) suite.onclick = () => { const r = texte.classList.toggle('replie'); suite.textContent = r ? 'Lire la suite ›' : 'Réduire ‹'; };

    const liste = h('ul', { class: 'sujets lecture-texte' }, bloc.sujets.map((s, i) => {
      const c = h('span', { class: 'case' + (coches.includes(i) ? ' coche' : ''), role: 'checkbox', tabindex: 0, 'aria-checked': coches.includes(i), 'aria-label': `Sujet ${i + 1}` }, ico('coche'));
      const bascule = () => { const a = store.get(cle, []); const n = a.includes(i) ? a.filter(x => x !== i) : [...a, i]; store.set(cle, n); const on = n.includes(i); c.classList.toggle('coche', on); c.setAttribute('aria-checked', on); };
      c.onclick = bascule; c.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); bascule(); } };
      return h('li', {}, h('span', { class: 'num' }, i + 1), h('label', { onclick: e => { if (!e.target.closest('a')) bascule(); }, 'data-lu': `${piste.id}:s${i}`, html: riche(s) }), c);
    }));

    const merci = h('p', { class: 'merci', hidden: !prieDeja }, `${bravo()} Tu as prié aujourd'hui. 🙏`);
    const btnPrie = h('button', { class: 'btn btn-or btn-bloc' }, ico('coche'), 'J\'ai prié');
    btnPrie.onclick = () => { store.set(`prie:${f.id}:${periode}`, jour); merci.hidden = false; toast(`Enregistré — que Dieu te garde${prenom() ? ', ' + prenom() : ''} !`); };

    zone.replaceChildren(
      h('section', { class: 'bloc' }, h('div', { class: 'bloc-titre' }, ico('livre'), 'Enseignement'),
        h('div', { class: 'bloc-corps' },
          h('div', { class: 'lecteur-mini' }, img('p1_12', '', ''),
            h('div', { class: 'piste' }, h('b', {}, `Enseignement du ${periode} – ${f.titre}`), h('div', { class: 'piste-cmds' }, prec, pp, suiv), h('div', { class: 'curseur' }, curs, tps))),
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
    return enveloppe(noeud, () => { nettoyeurs.splice(0).forEach(n => n()); document.body.dataset.ecoute = ''; });
}
