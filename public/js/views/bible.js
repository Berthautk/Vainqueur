import { h, ico, toast, store, feuille } from '../util.js';
import { listeLivres, livre, livreDeNom, trouverRefs, lienRef } from '../bible-refs.js';
import { chapitre, livreData, livresGardes, toutGarder } from '../bible-data.js';
import { pisteChapitre } from '../pistes.js';
import * as player from '../player.js';
import * as P from '../plans.js';
import { retour, enveloppe, vide, boutonEcoute } from './commun.js';
import { imageParole, partagerImage } from '../partage.js';
import { lienJour } from './plans.js';

const nomChap = (l, c) => `${l.id === 'psaumes' ? 'Psaume' : l.nom} ${c}`;
const enteteBible = (titre, sous, secours = '#/plus', titreClic) => h('section', { class: 'hero hero-bible' },
  h('div', { class: 'hero-ligne' }, retour(secours), ico('livre'),
    titreClic ? h('button', { class: 'titre-choix', onclick: titreClic, 'aria-label': `${titre} — changer de livre` }, h('h1', {}, titre), ico('bas')) : h('h1', {}, titre)),
  sous ? h('p', { class: 'hero-sous' }, sous) : null);

// Chapitre voisin, en passant d'un livre à l'autre (Jean 21 → Actes 1)
function voisin(l, c, sens) {
  const tous = listeLivres(); const k = tous.findIndex(x => x.id === l.id);
  if (sens > 0) return c < l.ch ? { l, c: c + 1 } : k < tous.length - 1 ? { l: tous[k + 1], c: 1 } : null;
  return c > 1 ? { l, c: c - 1 } : k > 0 ? { l: tous[k - 1], c: tous[k - 1].ch } : null;
}

// Sélecteur : livres (Ancien / Nouveau Testament) puis chapitres, dans une même fenêtre
export function choisirPassage(depart, etape = 'chapitres') {
  let l = depart; let t = (depart && depart.t) || 'NT'; let vue = depart ? etape : 'livres';
  const corps = h('div', { class: 'choix-passage' });
  let fermer = null;
  function dessiner() {
    const onglets = h('div', { class: 'bascule bascule-bible' },
      h('button', { class: vue === 'livres' ? 'actif' : '', onclick: () => { vue = 'livres'; dessiner(); } }, 'Livres'),
      h('button', { class: vue === 'chapitres' ? 'actif' : '', disabled: !l, onclick: () => { vue = 'chapitres'; dessiner(); } }, l ? `Chapitres · ${l.nom}` : 'Chapitres'));
    let contenuVue;
    if (vue === 'livres') {
      contenuVue = [h('div', { class: 'chips' }, [['AT', 'Ancien Testament'], ['NT', 'Nouveau Testament']].map(([k, n]) => h('button', { class: 'filtre' + (t === k ? ' actif' : ''), onclick: () => { t = k; dessiner(); } }, n))),
        h('div', { class: 'livres livres-feuille' }, listeLivres().filter(x => x.t === t).map(x => h('button', { class: 'livre' + (l && x.id === l.id ? ' courant' : ''), onclick: () => { l = x; vue = 'chapitres'; dessiner(); } }, x.nom)))];
    } else {
      contenuVue = [h('div', { class: 'chapitres chapitres-feuille' }, Array.from({ length: l.ch }, (_, i) => h('a', { class: 'chap' + (depart && depart.id === l.id && +depart.c === i + 1 ? ' courant' : ''), href: `#/bible/${l.id}/${i + 1}`, onclick: () => fermer && fermer() }, String(i + 1)))),
        h('a', { class: 'lien-partage', href: `#/bible/${l.id}`, onclick: () => fermer && fermer() }, 'Ouvrir la page du livre')];
    }
    corps.replaceChildren(onglets, ...contenuVue);
  }
  dessiner();
  fermer = feuille(h('div', {}, h('h2', {}, 'Aller à…'), corps, h('button', { class: 'btn btn-clair', onclick: () => fermer() }, 'Fermer')));
}

// « Jean 3:16 » → passage ; « Jean 3 » → chapitre ; « Jean » → livre ; sinon recherche dans le texte
function allerA(q) {
  q = q.trim(); if (!q) return;
  const r = trouverRefs(q)[0];
  if (r) { location.hash = lienRef(r); return; }
  const m = q.match(/^(.+?)\s+(\d+)$/);
  const id = livreDeNom(m ? m[1] : q);
  if (id) { location.hash = m ? `#/bible/${id}/${Math.min(+m[2], livre(id).ch)}` : `#/bible/${id}`; return; }
  location.hash = `#/bible/recherche?q=${encodeURIComponent(q)}`;
}
const champRecherche = (valeur = '') => {
  const champ = h('input', { type: 'search', placeholder: 'Passage ou mot (ex. Jean 3:16, berger)', 'aria-label': 'Chercher dans la Bible', enterkeyhint: 'search', value: valeur });
  return h('form', { class: 'recherche', onsubmit: e => { e.preventDefault(); allerA(champ.value); } }, ico('loupe'), champ);
};

export default async function () {
  const tous = listeLivres();
  if (!tous.length) return enveloppe(vide('Bible indisponible', 'Reconnecte-toi une fois pour l\'ouvrir.'));
  let t = store.get('bible-testament', 'NT');
  const grille = h('div', { class: 'livres' });
  const onglets = h('div', { class: 'bascule bascule-bible', role: 'tablist' }, [['AT', 'Ancien Testament'], ['NT', 'Nouveau Testament']].map(([k, l]) =>
    h('button', { role: 'tab', 'data-t': k, onclick: () => { t = k; store.set('bible-testament', k); dessiner(); } }, l)));
  function dessiner() {
    onglets.querySelectorAll('button').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('actif', on); b.setAttribute('aria-selected', String(on)); });
    grille.replaceChildren(...tous.filter(l => l.t === t).map(l => h('a', { class: 'livre', href: `#/bible/${l.id}` }, l.nom)));
  }
  const pos = store.get('bible-pos');
  const reprise = pos && livre(pos.id) ? h('a', { class: 'reprise', href: `#/bible/${pos.id}/${pos.c}` }, ico('livre'), h('span', {}, 'Reprendre la lecture : ', h('b', {}, nomChap(livre(pos.id), pos.c))), ico('suivant')) : null;

  // Plan de lecture
  let cartePlan;
  const a = P.actif();
  const plan = a && (await P.plans()).find(p => p.id === a.id);
  if (plan) {
    const liste = P.journees(plan, a.debut); const i = P.indexDuJour(plan, liste); const j = liste[Math.max(0, i)];
    const lu = i >= 0 && P.estLu(j.cle);
    cartePlan = h('a', { class: 'carte-plan-jour' + (lu ? ' lu' : ''), href: '#/bible/plan' }, ico('calendrier'),
      h('span', {}, h('small', {}, `${plan.titre} · ${i === -1 ? 'terminé' : plan.type === 'mensuel' ? 'lecture du jour' : `jour ${j.n}`}`), h('b', {}, i === -1 ? 'Choisir un nouveau plan' : (lu ? '✔ ' : '') + P.libelle(j.chapitres))), ico('suivant'));
  } else cartePlan = h('a', { class: 'carte-plan-jour nouveau', href: '#/bible/plans' }, ico('calendrier'), h('span', {}, h('b', {}, 'Lire la Bible en un an'), h('small', {}, 'Choisis un plan : dans l\'ordre, Nouveau Testament d\'abord, ou par thème chaque mois.')), ico('suivant'));

  // Hors connexion : toute la Bible est enregistrée dès la première ouverture
  const etatHL = h('div', { class: 'hl-bible' }, h('span', {}, 'Vérification…'));
  async function majHL() {
    const n = await livresGardes();
    if (n >= tous.length) { etatHL.replaceChildren(ico('wifi'), h('span', {}, 'Toute la Bible est disponible sans internet ✔')); etatHL.classList.add('ok'); return; }
    if (!navigator.onLine) { etatHL.replaceChildren(h('span', {}, `${n} livres sur 66 enregistrés. Reconnecte-toi pour enregistrer le reste.`)); return; }
    const barre = h('i');
    etatHL.replaceChildren(h('span', {}, 'Enregistrement de la Bible pour le hors connexion…'), h('div', { class: 'progres' }, barre));
    await toutGarder((f, tot) => { barre.style.width = `${(f / tot) * 100}%`; });
    majHL();
  }
  const noeud = h('div', {}, enteteBible('La Sainte Bible', 'Louis Segond 1910 · Ancien et Nouveau Testament'), champRecherche(), cartePlan, reprise, etatHL, onglets, grille);
  dessiner(); majHL();
  return enveloppe(noeud);
}

export async function livrePage(id) {
  const l = livre(id);
  if (!l) return enveloppe(vide('Livre introuvable', ''));
  const pr = voisin(l, 1, -1), sv = voisin(l, l.ch, 1);
  return enveloppe(h('div', {}, enteteBible(l.nom, `${l.ch} chapitre${l.ch > 1 ? 's' : ''} · ${l.t === 'AT' ? 'Ancien' : 'Nouveau'} Testament`, '#/bible', () => choisirPassage(l, 'livres')),
    h('p', { class: 'consigne' }, 'Choisis un chapitre :'),
    h('div', { class: 'chapitres' }, Array.from({ length: l.ch }, (_, i) => h('a', { class: 'chap', href: `#/bible/${id}/${i + 1}` }, String(i + 1)))),
    h('div', { class: 'bible-nav' },
      pr ? h('a', { class: 'btn btn-clair btn-petit', href: `#/bible/${pr.l.id}` }, ico('gauche'), pr.l.nom) : h('span'),
      sv ? h('a', { class: 'btn btn-clair btn-petit', href: `#/bible/${sv.l.id}` }, sv.l.nom, ico('suivant')) : h('span'))));
}

export async function chapitrePage(id, cs, params) {
  const l = livre(id); const c = +cs;
  if (!l || c < 1 || c > l.ch) return enveloppe(vide('Passage introuvable', ''));
  let versets;
  try { versets = await chapitre(id, c); }
  catch { return enveloppe(vide('Pas encore enregistré', 'Ce livre n\'est pas encore disponible sans internet. Reconnecte-toi une fois et ouvre la Bible.')); }
  store.set('bible-pos', { id, c });
  const [a, b] = String(params?.get?.('v') || '').split('-').map(Number);
  const cible = v => a && v >= a && v <= (b || a);
  const pisteId = `b-${id}-${c}`;
  const file = Array.from({ length: l.ch }, (_, i) => pisteChapitre(l, i + 1, chapitre));
  const ecoute = boutonEcoute(file[c - 1], file, { cls: 'btn btn-or btn-petit', off: 'Écouter', on: 'Pause', aria: `Écouter ${nomChap(l, c)}` });

  const texte = h('div', { class: 'bible-texte lecture-texte' }, versets.map((v, i) => h('p', { class: 'verset' + (cible(i + 1) ? ' cible' : ''), id: `v${i + 1}`, onclick: () => actionsVerset(l, c, i + 1, v) },
    h('sup', {}, String(i + 1)), h('span', { 'data-lu': `${pisteId}:${i + 1}` }, v))));

  // Lecture du plan (?plan=…) : avancer dans les chapitres du jour, puis « J'ai lu »
  const cleplan = params?.get?.('plan');
  let bandePlan = null;
  const suffixe = cleplan ? `?plan=${encodeURIComponent(cleplan)}` : '';
  if (cleplan) {
    const act = P.actif(); const plan = act && (await P.plans()).find(p => p.id === act.id);
    const j = plan && P.journees(plan, act.debut).find(x => x.cle === cleplan);
    const k = j ? j.chapitres.findIndex(x => x.id === id && x.c === c) : -1;
    if (j && k >= 0) {
      const dernier = k === j.chapitres.length - 1;
      const suiv = !dernier && j.chapitres[k + 1];
      const fait = h('button', { class: 'btn btn-vert' }, ico('coche'), 'J\'ai lu ma lecture du jour');
      fait.onclick = () => { P.marquer(cleplan, true); toast('Bravo ! Lecture du jour terminée 🙏'); location.hash = '#/bible/plan'; };
      bandePlan = h('div', { class: 'bande-plan' }, h('small', {}, `Plan · jour ${j.n} — chapitre ${k + 1} sur ${j.chapitres.length}`),
        dernier ? fait : h('a', { class: 'btn btn-or', href: `#/bible/${suiv.id}/${suiv.c}${suffixe}` }, `${nomChap(livre(suiv.id), suiv.c)}`, ico('suivant')));
    }
  }
  const pr = voisin(l, c, -1), sv = voisin(l, c, 1);
  const nav = (x, icone) => x ? h('a', { class: 'btn btn-clair btn-petit', href: `#/bible/${x.l.id}/${x.c}`, 'aria-label': nomChap(x.l, x.c) }, icone === 'g' ? [ico('gauche'), nomChap(x.l, x.c)] : [nomChap(x.l, x.c), ico('suivant')]) : h('span');
  const venuDUnLien = !!((a || cleplan) && history.length > 1);
  const titre = h('div', { class: 'bible-titre' },
    h('button', { class: 'titre-choix', onclick: () => choisirPassage({ ...l, c }, 'livres'), 'aria-label': `${l.nom} — changer de livre` }, l.id === 'psaumes' ? 'Psaume' : l.nom, ico('bas')),
    h('button', { class: 'titre-choix', onclick: () => choisirPassage({ ...l, c }, 'chapitres'), 'aria-label': `Chapitre ${c} — changer de chapitre` }, String(c), ico('bas')));
  const noeud = h('div', {},
    h('div', { class: 'bible-barre' }, venuDUnLien ? h('button', { class: 'revenir', onclick: () => history.back(), 'aria-label': 'Revenir où j\'étais' }, ico('retour'), 'Revenir') : retour(`#/bible/${id}`), titre, ecoute),
    texte, bandePlan,
    h('div', { class: 'bible-nav' }, nav(pr, 'g'), nav(sv, 'd')),
    h('p', { class: 'mention' }, 'Glisse le doigt vers la gauche ou la droite pour changer de chapitre · Louis Segond 1910'));

  // Glisser le doigt : chapitre suivant / précédent
  let x0 = null, y0 = 0;
  texte.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  texte.addEventListener('touchend', e => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 80 && Math.abs(dy) < 50) { const x = dx < 0 ? sv : pr; if (x) location.hash = `#/bible/${x.l.id}/${x.c}`; }
  }, { passive: true });
  // La lecture passe au chapitre suivant : la page suit
  const off = player.sur(t => {
    if (t !== 'piste') return; const p = player.etat.piste;
    if (p && p.type === 'bible' && p.id !== pisteId && p.id.startsWith(`b-${id}-`) && player.lit()) location.replace(p.lien);
  });
  if (a) setTimeout(() => { const el = noeud.querySelector(`#v${a}`); if (el) el.scrollIntoView({ block: 'center' }); }, 60);
  return enveloppe(noeud, off);
}

// Recherche dans tout le texte (sans tenir compte des accents ni des majuscules)
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase();
export async function recherchePage(params) {
  const q = (params?.get?.('q') || '').trim();
  let t = params?.get?.('t') || 'tout';
  const resultats = h('div', { class: 'liste', style: 'margin-top:4px' });
  const info = h('p', { class: 'consigne', role: 'status' });
  const filtres = h('div', { class: 'chips' }, [['tout', 'Toute la Bible'], ['AT', 'Ancien T.'], ['NT', 'Nouveau T.']].map(([k, n]) =>
    h('a', { class: 'filtre' + (t === k ? ' actif' : ''), href: `#/bible/recherche?q=${encodeURIComponent(q)}&t=${k}` }, n)));
  const noeud = h('div', {}, enteteBible('Recherche', 'Dans toute la Bible Louis Segond 1910', '#/bible'), champRecherche(q), filtres, info, resultats);
  const mots = norm(q).split(/\s+/).filter(m => m.length > 1);
  if (!mots.length) { info.textContent = 'Écris un ou plusieurs mots, par exemple « berger », « paix », « Dieu est amour ».'; return enveloppe(noeud); }
  let annule = false;
  (async () => {
    const MAX = 300; let n = 0; const livres = listeLivres().filter(l => t === 'tout' || l.t === t);
    const echapper = s => s.replace(/[&<>]/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]));
    const surligner = v => { // met les mots cherchés en évidence, sans tenir compte des accents
      const nv = norm(v); const marques = new Array(v.length).fill(false);
      for (const m of mots) { let k = nv.indexOf(m); while (k >= 0) { for (let z = k; z < k + m.length; z++) marques[z] = true; k = nv.indexOf(m, k + 1); } }
      let out = '', dans = false;
      for (let z = 0; z < v.length; z++) { if (marques[z] !== dans) { out += marques[z] ? '<mark>' : '</mark>'; dans = marques[z]; } out += echapper(v[z]); }
      return out + (dans ? '</mark>' : '');
    };
    // Chaque mot doit commencer un mot du verset ; la phrase exacte passe en premier
    const res = (x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const debuts = mots.map(m => new RegExp(`(^|[^a-z0-9])${res(m)}`));
    const phrase = new RegExp(`(^|[^a-z0-9])${res(mots.join(' '))}`);
    const exacts = [], autres = [];
    for (let k = 0; k < livres.length; k++) {
      if (annule) return;
      info.textContent = `Recherche… ${livres[k].nom}`;
      let d; try { d = await livreData(livres[k].id); } catch { continue; }
      d.c.forEach((ch, ci) => ch.forEach((v, vi) => {
        const nv = norm(v);
        if (!debuts.every(r => r.test(nv))) return;
        (mots.length > 1 && phrase.test(nv) ? exacts : autres).push({ l: livres[k], ci, vi, v });
      }));
      if (k % 6 === 5) await new Promise(r => setTimeout(r, 0));
    }
    const tous = [...exacts, ...autres]; n = tous.length;
    resultats.replaceChildren(...tous.slice(0, MAX).map(x => h('a', { class: 'resultat' + (exacts.includes(x) ? ' exact' : ''), href: `#/bible/${x.l.id}/${x.ci + 1}?v=${x.vi + 1}` }, h('b', {}, `${nomChap(x.l, x.ci + 1)}:${x.vi + 1}`), h('span', { html: surligner(x.v) }))));
    info.textContent = n === 0 ? `Aucun verset ne contient « ${q} ».` : (n > MAX ? `${n} versets : les ${MAX} premiers sont affichés, précise ta recherche.` : `${n} verset${n > 1 ? 's' : ''} trouvé${n > 1 ? 's' : ''}.`) + (exacts.length && mots.length > 1 ? ` Expression exacte en premier (${exacts.length}).` : '');
  })();
  return enveloppe(noeud, () => { annule = true; });
}

function actionsVerset(l, c, v, texte) {
  const ref = `${nomChap(l, c)}:${v}`;
  const f = feuille(h('div', {}, h('h2', {}, ref), h('blockquote', { class: 'priere-salut' }, texte),
    h('button', { class: 'btn btn-or', onclick: async () => { f(); try { partagerImage(await imageParole({ texte, ref, etiquette: 'La Bible' }), `« ${texte} » — ${ref} (Louis Segond 1910)`, 'verset.jpg'); } catch { toast('Partage impossible'); } } }, ico('partager'), 'Partager en image'),
    h('button', { class: 'btn btn-clair', onclick: async () => { f(); try { await navigator.clipboard.writeText(`« ${texte} » — ${ref}`); toast('Copié'); } catch { toast('Copie impossible'); } } }, 'Copier le verset'),
    h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
}
