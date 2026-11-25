import { riche } from '../bible-refs.js';
import { h, img, ico, contenu, store, toast, ouvrirWhatsApp, aujourdhui, bravo, prenom } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, vide } from './commun.js';
import { pisteFiche, pistesFiches } from '../pistes.js';

// Une fiche du recueil : texte affiché exactement comme dans prieres.json (numéros d'origine compris).
const SEUIL_COMPTEUR = 10;   // compteur « 12 / 48 » à partir de 10 sujets dans la séance

// Rend une suite d'éléments (paragraphe, puce, sous_titre, sujet) ; les puces voisines forment une liste
function rendre(items, cle) {
  const out = []; let ul = null;
  items.forEach((it, i) => {
    const lu = cle(i);
    if (it.type === 'puce') {
      if (!ul) { ul = h('ul', { class: 'puces-fiche' }); out.push(ul); }
      ul.append(h('li', { 'data-lu': lu, html: riche(it.texte) }));
      return;
    }
    ul = null;
    if (it.type === 'sous_titre') out.push(h('h3', { class: 'sous-titre-fiche', 'data-lu': lu, html: riche(it.texte) }));
    else if (it.type === 'sujet') out.push(h('p', { class: 'sujet-ens' }, it.numero != null ? h('b', {}, `${it.numero}. `) : null, h('span', { 'data-lu': lu, html: riche(it.texte) })));
    else out.push(h('p', { 'data-lu': lu, html: riche(it.texte) }));
  });
  return out;
}

export default async function (id) {
  const d = await contenu('prieres/index');
  const meta = d.fiches.find(x => x.id === id);
  if (!meta) return enveloppe(vide('Fiche introuvable', 'Cette prière n\'existe pas.'));
  let f;
  try { f = await contenu(`prieres/${id}`); }
  catch { return enveloppe(h('div', {}, h('section', { class: 'hero hero-fiche' }, h('div', { class: 'hero-ligne' }, retour('#/priere'), h('h1', {}, meta.titre))),
    vide('Pas encore enregistrée', navigator.onLine ? 'Cette fiche n\'a pas pu être chargée. Réessaie dans un instant.' : 'Cette fiche n\'a jamais été ouverte avec internet. Reconnecte-toi une fois pour l\'enregistrer sur ton téléphone.'))); }
  const jour = aujourdhui();
  let periode = new Date().getHours() >= 17 ? 'soir' : 'matin';

  const zone = h('div'); const nettoyeurs = [];
  const bascule = h('div', { class: 'bascule', role: 'tablist' },
    ['matin', 'soir'].map(p => h('button', { role: 'tab', 'data-p': p, onclick: () => { periode = p; dessiner(); } }, ico(p === 'matin' ? 'soleil' : 'lune'), p === 'matin' ? 'Matin' : 'Soir')));

  function dessiner() {
    nettoyeurs.splice(0).forEach(n => n());
    bascule.querySelectorAll('button').forEach(b => { const on = b.dataset.p === periode; b.classList.toggle('actif', on); b.setAttribute('aria-selected', on); });
    const sess = f[periode] || [];
    const nSujets = sess.filter(x => x.type === 'sujet').length;
    // Cases cochées : gardées pour la journée (elles repartent à zéro le lendemain)
    const cle = `sujets:${f.id}:${periode}`;
    const lireCoches = () => { const v = store.get(cle, null); return v && v.j === jour ? v.c : []; };
    const ecrireCoches = c => store.set(cle, { j: jour, c });
    const prieDeja = store.get(`prie:${f.id}:${periode}`, '') === jour;

    // --- Lecteur (voix du téléphone, mot lu en couleur) ---
    const piste = pisteFiche(meta, periode); const file = pistesFiches(d, periode);
    document.body.dataset.ecoute = piste.id; window.dispatchEvent(new Event('vq-mini'));
    const pp = h('button', { class: 'btn-lire', 'aria-label': 'Lecture' });
    const curs = h('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Position' });
    const tps = h('span', {}, 'Lu par la voix du téléphone');
    const maj = () => {
      const p = player.etat.piste;
      // « Suivant » dans le lecteur : on suit la fiche qui joue
      if (p && p.type === 'fiche' && p.id !== piste.id && p.id.endsWith('-' + periode) && d.fiches.some(x => p.id === `f-${x.id}-${periode}`)) { location.replace(p.lien); return; }
      const mien = p && p.id === piste.id;
      pp.replaceChildren(ico(mien && player.lit() ? 'pause' : 'play'));
      const { t, d: du } = mien ? player.temps() : { t: 0, d: 0 };
      curs.value = du ? (t / du) * 1000 : 0; curs.style.setProperty('--p', `${du ? (t / du) * 100 : 0}%`);
      tps.textContent = mien ? player.libelleTemps() : 'Lu par la voix du téléphone';
    };
    pp.onclick = () => { if (player.etat.piste && player.etat.piste.id === piste.id) player.basculer(); else player.jouer(piste, file); };
    curs.oninput = () => { const { d: du } = player.temps(); if (player.etat.piste && player.etat.piste.id === piste.id) player.aller((curs.value / 1000) * du); };
    const prec = h('button', { class: 'ic-mini', 'aria-label': 'Fiche précédente', onclick: () => { if (player.etat.piste && player.etat.piste.id === piste.id) player.precedent(); else player.jouer(file[(file.findIndex(x => x.id === piste.id) - 1 + file.length) % file.length], file); } }, ico('prec'));
    const suiv = h('button', { class: 'ic-mini', 'aria-label': 'Fiche suivante', onclick: () => { if (player.etat.piste && player.etat.piste.id === piste.id) player.suivant(); else player.jouer(file[(file.findIndex(x => x.id === piste.id) + 1) % file.length], file); } }, ico('suiv'));
    nettoyeurs.push(player.sur(maj)); maj();

    // --- Enseignement ---
    const longueur = f.enseignement.reduce((s, x) => s + x.texte.length, 0);
    const long = longueur > 320;
    const texte = h('div', { class: 'texte-enseignement lecture-texte' + (long ? ' replie' : '') }, rendre(f.enseignement, i => `${piste.id}:e${i}`));
    const suite = long ? h('button', { class: 'lire-suite' }, 'Lire la suite ›') : null;
    if (suite) suite.onclick = () => { const r = texte.classList.toggle('replie'); suite.textContent = r ? 'Lire la suite ›' : 'Réduire ‹'; };

    // --- Dans quels cas prier cette fiche (seulement si le recueil le donne : fiches 1 à 4) ---
    const cas = (f.dans_quels_cas || []).length
      ? h('section', { class: 'bloc bloc-cas' }, h('div', { class: 'bloc-titre' }, ico('chat'), 'Dans quels cas prier cette fiche'),
        h('div', { class: 'bloc-corps lecture-texte texte-cas' }, rendre(f.dans_quels_cas, i => `cas-${f.id}:${i}`)))
      : null;

    // --- Séance : sujets (cases à cocher) et textes intercalés ---
    const compteur = h('span', { class: 'compteur-sujets', 'aria-live': 'polite' });
    const barre = h('i');
    const majCompteur = () => {
      const n = lireCoches().length;
      compteur.textContent = `${n} / ${nSujets}`;
      barre.style.width = `${nSujets ? (n / nSujets) * 100 : 0}%`;
    };
    const coches = lireCoches();
    const liste = h('ul', { class: 'sujets lecture-texte' }, sess.map((it, i) => {
      const lu = `${piste.id}:s${i}`;
      if (it.type === 'sous_titre') return h('li', { class: 'sujets-sous-titre' }, h('span', { 'data-lu': lu, html: riche(it.texte) }));
      if (it.type !== 'sujet') return h('li', { class: 'sujets-texte' + (it.type === 'puce' ? ' puce' : '') }, h('span', { 'data-lu': lu, html: riche(it.texte) }));
      const on = coches.includes(i);
      const c = h('span', { class: 'case' + (on ? ' coche' : ''), role: 'checkbox', tabindex: 0, 'aria-checked': String(on), 'aria-label': `Sujet ${it.numero}` }, ico('coche'));
      const basculer = () => { const a = lireCoches(); const n = a.includes(i) ? a.filter(x => x !== i) : [...a, i]; ecrireCoches(n); const ok = n.includes(i); c.classList.toggle('coche', ok); c.setAttribute('aria-checked', String(ok)); majCompteur(); };
      c.onclick = basculer; c.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); basculer(); } };
      return h('li', {}, h('span', { class: 'num' }, String(it.numero)), h('label', { onclick: e => { if (!e.target.closest('a')) basculer(); }, 'data-lu': lu, html: riche(it.texte) }), c);
    }));
    majCompteur();
    const avecCompteur = nSujets >= SEUIL_COMPTEUR;

    const merci = h('p', { class: 'merci', hidden: !prieDeja }, `${bravo()} Tu as prié aujourd'hui. 🙏`);
    const btnPrie = h('button', { class: 'btn btn-or btn-bloc' }, ico('coche'), 'J\'ai prié');
    btnPrie.onclick = () => { store.set(`prie:${f.id}:${periode}`, jour); merci.hidden = false; toast(`Enregistré — que Dieu te garde${prenom() ? ', ' + prenom() : ''} !`); };

    zone.replaceChildren(...[
      cas,
      h('section', { class: 'bloc' }, h('div', { class: 'bloc-titre' }, ico('livre'), 'Enseignement'),
        h('div', { class: 'bloc-corps' },
          h('div', { class: 'lecteur-mini' }, img('p1_12', '', ''),
            h('div', { class: 'piste' }, h('b', {}, `Enseignement et séance du ${periode}`), h('div', { class: 'piste-cmds' }, prec, pp, suiv), h('div', { class: 'curseur' }, curs, tps))),
          texte, suite)),
      h('section', { class: 'bloc' },
        h('div', { class: 'bloc-titre' }, ico('mains'), nSujets > 1 ? `Tes ${nSujets} sujets de prière` : 'Ton sujet de prière'),
        avecCompteur ? h('div', { class: 'progression-sujets' }, h('span', {}, `Séance du ${periode}`), compteur, h('div', { class: 'progres' }, barre)) : null,
        liste),
      btnPrie, merci,
      h('a', { class: 'lien-partage', href: '#', onclick: e => { e.preventDefault(); ouvrirWhatsApp('temoigner_texte', `« ${f.titre} » — `); } }, ico('partager'), 'Partager mon témoignage'),
      h('p', { class: 'mention' }, `Fiche ${f.numero} · ${d.copyright}`)].filter(Boolean));
  }

  const noeud = h('div', {},
    h('section', { class: 'hero hero-fiche' }, img(f.image || meta.image, '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/priere'), h('h1', {}, f.titre)),
      h('p', { class: 'hero-sous' }, `Fiche ${f.numero} · ${(d.parties.find(p => p.lettre === f.partie) || {}).titre || ''}`)),
    bascule, zone);
  dessiner();
  return enveloppe(noeud, () => { nettoyeurs.splice(0).forEach(n => n()); document.body.dataset.ecoute = ''; });
}
