// « Mes versets » : surlignages, notes, études — et le mode intervention pour prêcher ou animer.
import { h, ico, toast, store, demander, partager } from '../util.js';
import * as M from '../marques.js';
import { livre } from '../bible-refs.js';
import { retour, enveloppe, vide, boutonEcoute } from './commun.js';

const tete = (titre, sous, secours, extra) => h('section', { class: 'hero hero-bible' },
  h('div', { class: 'hero-ligne' }, retour(secours), ico('marque'), h('h1', {}, titre), extra || null), sous ? h('p', { class: 'hero-sous' }, sous) : null);
const lien = cles => { const x = M.lireCle(cles[0]); return `#/bible/${x.id}/${x.c}?v=${x.v}`; };
const date = t => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// Regroupe des versets voisins (même chapitre, même couleur) en passages
function passages(m) {
  const cles = M.trier(Object.keys(m)); const out = [];
  for (const k of cles) {
    const x = M.lireCle(k), d = out[out.length - 1];
    const p = d && M.lireCle(d.cles[d.cles.length - 1]);
    if (d && p.id === x.id && p.c === x.c && p.v === x.v - 1 && d.couleur === m[k].couleur && !!d.souligne === !!m[k].souligne) d.cles.push(k);
    else out.push({ cles: [k], couleur: m[k].couleur, souligne: m[k].souligne });
  }
  return out;
}
async function carteTexte(cles, extra, couleur) {
  const t = await M.textes(cles);
  return h('article', { class: 'carte-verset', style: couleur ? `--mc:${M.COULEURS_BIBLE[couleur]}` : null },
    h('a', { class: 'cv-ref', href: lien(cles) }, M.refDe(cles), ico('suivant')),
    h('p', { class: 'cv-texte' }, t.map(x => [cles.length > 1 ? h('sup', {}, String(x.v)) : null, x.t + ' '])), extra || null);
}

export default async function (params) {
  let onglet = params?.get?.('onglet') || 'surlignes';
  let filtre = 'tous';
  const zone = h('div', { class: 'liste', style: 'margin-top:8px' });
  const onglets = h('div', { class: 'bascule bascule-bible etapes' }, [['surlignes', 'Surlignés'], ['notes', 'Notes'], ['etudes', 'Études']].map(([k, n]) =>
    h('button', { 'data-o': k, onclick: () => { onglet = k; dessiner(); } }, n)));
  async function dessiner() {
    onglets.querySelectorAll('button').forEach(b => b.classList.toggle('actif', b.dataset.o === onglet));
    if (onglet === 'surlignes') {
      const m = M.marques();
      const tous = passages(m).filter(p => filtre === 'tous' || (filtre === 'souligne' ? p.souligne : p.couleur === filtre));
      const chips = h('div', { class: 'chips' }, h('button', { class: 'filtre' + (filtre === 'tous' ? ' actif' : ''), onclick: () => { filtre = 'tous'; dessiner(); } }, 'Tous'),
        Object.entries(M.COULEURS_BIBLE).map(([k, c]) => h('button', { class: 'filtre pastille-filtre' + (filtre === k ? ' actif' : ''), style: `--mc:${c}`, 'aria-label': `Couleur ${k}`, onclick: () => { filtre = k; dessiner(); } }, h('i'))),
        h('button', { class: 'filtre' + (filtre === 'souligne' ? ' actif' : ''), onclick: () => { filtre = 'souligne'; dessiner(); } }, h('u', {}, 'Soulignés')));
      zone.replaceChildren(chips, ...(tous.length ? await Promise.all(tous.map(p => carteTexte(p.cles, null, p.couleur))) : [vide('Aucun verset surligné', 'Dans la Bible, touche un ou plusieurs versets, puis choisis une couleur.')]));
    } else if (onglet === 'notes') {
      const n = M.notes();
      zone.replaceChildren(...(n.length ? await Promise.all(n.map(x => carteTexte(x.cles, h('div', { class: 'cv-note' }, h('p', {}, x.texte), h('small', {}, date(x.date)),
        h('div', { class: 'cv-btns' }, h('button', { class: 'btn btn-clair btn-petit', onclick: async () => { const t = await demander('Modifier la note', x.texte, { long: true }); if (t !== null) { M.modifierNote(x.id, t); dessiner(); } } }, 'Modifier'),
          h('button', { class: 'btn btn-clair btn-petit', onclick: () => { M.modifierNote(x.id, ''); toast('Note supprimée'); dessiner(); } }, 'Supprimer')))))) : [vide('Aucune note', 'Touche des versets dans la Bible, puis « Note ».')]));
    } else {
      const e = M.etudes();
      zone.replaceChildren(h('button', { class: 'btn btn-or btn-bloc', style: 'margin:0', onclick: async () => { const t = await demander('Nouvelle étude', '', { placeholder: 'Ex. Prédication de dimanche', bouton: 'Créer' }); if (t !== null) { const x = M.creerEtude(t); location.hash = `#/bible/etude/${x.id}`; } } }, ico('ajout'), 'Nouvelle étude'),
        h('p', { class: 'aide', style: 'margin:4px 4px 0' }, 'Une étude rassemble les passages d\'un enseignement ou d\'une intervention, dans l\'ordre où tu vas les lire, avec tes notes.'),
        ...(e.length ? e.map(x => h('a', { class: 'carte-etude', href: `#/bible/etude/${x.id}` }, ico('dossier'), h('span', {}, h('b', {}, x.titre), h('small', {}, `${x.items.length} passage${x.items.length > 1 ? 's' : ''} · ${date(x.date)}`)), ico('suivant'))) : [vide('Aucune étude', 'Crée une étude, puis ajoute-y des versets depuis la Bible.')]));
    }
  }
  // Sauvegarde : pour ne rien perdre en changeant de téléphone
  const fichier = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async () => {
    try { M.importer(await fichier.files[0].text()); toast('Sauvegarde restaurée ✔'); dessiner(); } catch { toast('Ce fichier n\'est pas une sauvegarde Vainqueur'); } fichier.value = ''; } });
  const sauvegarde = h('section', { class: 'reglage' }, h('h2', {}, 'Sauvegarder mes versets'),
    h('p', { class: 'aide' }, 'Tes surlignages, notes et études sont gardés sur ce téléphone. Fais une sauvegarde pour les retrouver sur un autre téléphone.'),
    h('div', { class: 'choix' },
      h('button', { class: 'option', onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([M.exporter()], { type: 'application/json' })), download: `vainqueur-mes-versets-${new Date().toISOString().slice(0, 10)}.json` }); document.body.append(a); a.click(); a.remove(); toast('Sauvegarde enregistrée dans tes téléchargements'); } }, ico('telecharger'), 'Sauvegarder'),
      h('button', { class: 'option', onclick: () => fichier.click() }, ico('dossier'), 'Restaurer')), fichier);
  dessiner();
  return enveloppe(h('div', {}, tete('Mes versets', 'Surlignages, notes et études', '#/bible'), h('div', { style: 'padding:12px 12px 0' }, onglets), zone, sauvegarde));
}

// Une étude : passages dans l'ordre, notes, écoute, partage, mode intervention
export async function etudePage(id) {
  const e0 = M.etude(id);
  if (!e0) return enveloppe(vide('Étude introuvable', ''));
  const zone = h('div');
  async function dessiner() {
    const e = M.etude(id);
    const titre = h('h1', {}, e.titre);
    const segs = [{ t: e.titre + '.' }]; const blocs = [];
    for (const [k, it] of e.items.entries()) {
      const t = await M.textes(it.cles);
      segs.push({ t: M.refDe(it.cles) + '.' }, ...t.map(x => ({ t: x.t, lu: `et-${id}:${k}:${x.v}` })));
      if (it.note) segs.push({ t: it.note, lu: `et-${id}:${k}:note` });
      const btn = (icone, txt, f, dis) => h('button', { class: 'ic-mini', 'aria-label': txt, disabled: dis, onclick: f }, ico(icone));
      blocs.push(h('article', { class: 'carte-verset passage-etude' },
        h('div', { class: 'pe-tete' }, h('span', { class: 'pe-num' }, String(k + 1)), h('a', { class: 'cv-ref', href: lien(it.cles) }, M.refDe(it.cles)),
          btn('haut', 'Monter', () => { M.majEtude(id, x => { [x.items[k - 1], x.items[k]] = [x.items[k], x.items[k - 1]]; }); dessiner(); }, k === 0),
          btn('bas', 'Descendre', () => { M.majEtude(id, x => { [x.items[k + 1], x.items[k]] = [x.items[k], x.items[k + 1]]; }); dessiner(); }, k === e.items.length - 1),
          btn('fermer', 'Retirer', () => { M.majEtude(id, x => x.items.splice(k, 1)); toast('Passage retiré'); dessiner(); })),
        h('p', { class: 'cv-texte lecture-texte' }, t.map(x => [it.cles.length > 1 ? h('sup', {}, String(x.v)) : null, h('span', { 'data-lu': `et-${id}:${k}:${x.v}` }, x.t), ' '])),
        it.note ? h('p', { class: 'pe-note', 'data-lu': `et-${id}:${k}:note` }, it.note) : null,
        h('button', { class: 'lien-partage', style: 'margin:6px 0 0', onclick: async () => { const t2 = await demander('Note pour ce passage', it.note || '', { long: true, placeholder: 'Ce que tu veux dire sur ce passage…' }); if (t2 !== null) { M.majEtude(id, x => { x.items[k].note = t2; }); dessiner(); } } }, ico('texte'), it.note ? 'Modifier la note' : 'Ajouter une note')));
    }
    const piste = { id: `etude-${id}`, titre: e.titre, audio: '', image: 'p1_12', type: 'etude', lien: `#/bible/etude/${id}`, segments: segs };
    zone.replaceChildren(
      tete(e.titre, `${e.items.length} passage${e.items.length > 1 ? 's' : ''} · étude`, '#/bible/marques?onglet=etudes',
        h('button', { class: 'ic-btn', 'aria-label': 'Renommer', onclick: async () => { const t = await demander('Renommer l\'étude', e.titre); if (t) { M.majEtude(id, x => { x.titre = t; }); dessiner(); } } }, ico('texte'))),
      e.items.length ? h('div', { class: 'etude-actions' },
        h('a', { class: 'btn btn-or', href: `#/bible/etude/${id}/intervention` }, ico('ecran'), 'Mode intervention'),
        boutonEcoute(piste, null, { cls: 'btn btn-bleu', off: 'Écouter', on: 'Pause' }),
        h('button', { class: 'btn btn-clair', onclick: async () => {
          const parts = []; for (const it of M.etude(id).items) parts.push(`📖 ${M.refDe(it.cles)}\n${await M.texteAPartager(it.cles, false)}${it.note ? `\n✍️ ${it.note}` : ''}`);
          partager(e.titre, `${e.titre}\n\n${parts.join('\n\n')}\n\n(Louis Segond 1910 — application Vainqueur)`);
        } }, ico('partager'), 'Partager')) : null,
      h('div', { class: 'liste', style: 'margin-top:10px' }, blocs.length ? blocs : [vide('Étude vide', 'Ouvre un chapitre de la Bible, touche les versets que tu veux, puis « Étude ».')]),
      h('a', { class: 'btn btn-clair btn-bloc', href: '#/bible' }, ico('livre'), 'Ajouter des versets depuis la Bible'),
      h('button', { class: 'lien-partage', style: 'color:var(--rouge)', onclick: () => { if (confirm(`Supprimer l'étude « ${e.titre} » ?`)) { M.supprimerEtude(id); location.hash = '#/bible/marques?onglet=etudes'; } } }, 'Supprimer l\'étude'));
  }
  store.set('etude-courante', id);
  await dessiner();
  return enveloppe(zone);
}

// Mode intervention : un passage à la fois, en grand, l'écran reste allumé
export async function interventionPage(id) {
  const e = M.etude(id);
  if (!e || !e.items.length) return enveloppe(vide('Étude vide', 'Ajoute d\'abord des passages.'));
  let k = 0; let taille = store.get('taille-intervention', 26);
  const zone = h('div', { class: 'iv-zone' });
  const compteur = h('span'); const prec = h('button', { class: 'btn btn-clair', onclick: () => aller(-1) }, ico('gauche'), 'Précédent'); const suiv = h('button', { class: 'btn btn-or', onclick: () => aller(1) }, 'Suivant', ico('suivant'));
  async function dessiner() {
    const it = e.items[k]; const t = await M.textes(it.cles);
    compteur.textContent = `${k + 1} / ${e.items.length}`;
    prec.disabled = k === 0; suiv.disabled = k === e.items.length - 1;
    zone.replaceChildren(...[h('h2', { class: 'iv-ref' }, M.refDe(it.cles)),
      h('div', { class: 'iv-texte', style: `font-size:${taille}px` }, t.map(x => h('p', {}, it.cles.length > 1 ? h('sup', {}, String(x.v)) : null, x.t))),
      it.note ? h('p', { class: 'iv-note' }, '✍️ ', it.note) : null].filter(Boolean));
    zone.scrollTop = 0;
  }
  const aller = d => { const n = k + d; if (n < 0 || n >= e.items.length) return; k = n; dessiner(); };
  const zoom = d => { taille = Math.max(18, Math.min(44, taille + d)); store.set('taille-intervention', taille); dessiner(); };
  const noeud = h('div', { class: 'intervention' },
    h('div', { class: 'iv-barre' }, h('button', { class: 'ic-btn', 'aria-label': 'Quitter le mode intervention', onclick: () => history.back() }, ico('fermer')),
      h('b', {}, e.titre), compteur, h('button', { class: 'iv-a', 'aria-label': 'Texte plus petit', onclick: () => zoom(-2) }, 'A−'), h('button', { class: 'iv-a', 'aria-label': 'Texte plus grand', onclick: () => zoom(2) }, 'A+')),
    zone, h('div', { class: 'iv-nav' }, prec, suiv));
  // Glisser, flèches du clavier ; l'écran reste allumé pendant l'intervention
  let x0 = null;
  zone.addEventListener('touchstart', ev => { x0 = ev.touches[0].clientX; }, { passive: true });
  zone.addEventListener('touchend', ev => { if (x0 === null) return; const dx = ev.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 70) aller(dx < 0 ? 1 : -1); }, { passive: true });
  const clavier = ev => { if (ev.key === 'ArrowRight') aller(1); if (ev.key === 'ArrowLeft') aller(-1); };
  addEventListener('keydown', clavier);
  let verrou = null;
  const reveil = async () => { try { if ('wakeLock' in navigator && document.visibilityState === 'visible') verrou = await navigator.wakeLock.request('screen'); } catch { /* non disponible */ } };
  reveil(); document.addEventListener('visibilitychange', reveil);
  document.body.classList.add('mode-intervention');
  await dessiner();
  return enveloppe(noeud, () => { removeEventListener('keydown', clavier); document.removeEventListener('visibilitychange', reveil); try { verrou && verrou.release(); } catch { /* ignoré */ } document.body.classList.remove('mode-intervention'); });
}
