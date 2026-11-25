import { h, img, ico, contenu, store, jourTheme, ficheDuJour, prieAujourdhui } from '../util.js';
import { enveloppe, boutonEcoute } from './commun.js';
import { pisteFiche, pistesFiches } from '../pistes.js';

// Comparaison sans accents ni majuscules ; garde la même longueur que le texte d'origine (pour les extraits)
const plat = s => String(s).split('').map(c => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || ' ').join('');
const textes = it => (it || []).map(x => x.texte).join(' • ');

// Texte complet des 66 fiches, chargé une seule fois (puis gardé pour le hors connexion)
let toutLeTexte = null;
async function chargerTexte(d, progres) {
  if (toutLeTexte) return toutLeTexte;
  const res = []; let fait = 0;
  await Promise.all(d.fiches.map(async m => {
    try { const f = await contenu(`prieres/${m.id}`); res.push({ id: m.id, texte: [textes(f.dans_quels_cas), textes(f.enseignement), textes(f.matin), textes(f.soir)].join(' • ') }); }
    catch { /* fiche pas encore enregistrée (hors connexion) */ }
    progres && progres(++fait, d.fiches.length);
  }));
  if (res.length === d.fiches.length) toutLeTexte = res;
  return res;
}

export default async function () {
  const d = await contenu('prieres/index');
  const t = d.theme;
  const jour = jourTheme(t);
  const duJour = ficheDuJour(d);
  const [avant, apres] = t.titre.split(t.mot_or);
  const file = pistesFiches(d);
  const liste = h('div', { class: 'liste liste-prieres' });
  const champ = h('input', { type: 'search', placeholder: 'Rechercher (titre ou texte)…', 'aria-label': 'Rechercher une fiche de prière', autocomplete: 'off' });
  const rechercheZone = h('div', { class: 'recherche recherche-priere' }, ico('loupe'), champ);
  const ouvertes = new Set(store.get('priere-parties', [duJour.partie]));

  function parParties() {
    return d.parties.map(p => {
      const fs = d.fiches.filter(f => f.partie === p.lettre);
      const det = h('details', { class: 'partie', open: ouvertes.has(p.lettre) },
        h('summary', {}, h('span', { class: 'partie-lettre' }, p.lettre), h('span', { class: 'partie-titre' }, p.titre), h('small', {}, `${fs.length} fiche${fs.length > 1 ? 's' : ''}`)),
        ...fs.map(f => ligne(f, file)));
      det.addEventListener('toggle', () => { det.open ? ouvertes.add(p.lettre) : ouvertes.delete(p.lettre); store.set('priere-parties', [...ouvertes]); });
      return det;
    });
  }

  let jeton = 0;
  async function dessiner() {
    const q = plat(champ.value.trim());
    const mon = ++jeton;
    if (!q) { liste.replaceChildren(...parParties()); return; }
    // 1. Titres : tout de suite
    const parTitre = d.fiches.filter(f => plat(f.titre).includes(q));
    const etat = h('p', { class: 'consigne', role: 'status' }, 'Recherche dans le texte des fiches…');
    liste.replaceChildren(etat, ...parTitre.map(f => ligne(f, file)));
    // 2. Texte des fiches (chargé une fois)
    const tout = await chargerTexte(d, (n, tot) => { if (mon === jeton) etat.textContent = `Recherche dans le texte des fiches… ${n}/${tot}`; });
    if (mon !== jeton) return;
    const trouve = new Map();
    for (const x of tout) { const k = plat(x.texte).indexOf(q); if (k >= 0) trouve.set(x.id, extrait(x.texte, k, q.length)); }
    const res = d.fiches.filter(f => parTitre.includes(f) || trouve.has(f.id));
    etat.textContent = res.length ? `${res.length} fiche${res.length > 1 ? 's' : ''} trouvée${res.length > 1 ? 's' : ''}` + (tout.length < d.fiches.length ? ` (texte de ${tout.length} fiches sur ${d.fiches.length} : reconnecte-toi pour chercher partout)` : '') : 'Aucune fiche trouvée. Essaie un autre mot.';
    liste.replaceChildren(etat, ...res.map(f => ligne(f, file, trouve.get(f.id))));
  }
  champ.oninput = dessiner;

  const noeud = h('div', {},
    h('div', { class: 'entete-page' }, ico('mains'), h('h1', {}, 'Prière de délivrance et ', h('em', { class: 'or' }, 'de guérison'))),
    h('p', { class: 'accroche-page' }, d.accroche_page),
    h('section', { class: 'theme' },
      img(t.image, '', '', false),
      h('div', { class: 'theme-txt' },
        h('span', { class: 'etiquette' }, 'Thème de la semaine :'),
        h('h2', {}, avant, h('em', {}, t.mot_or), apres),
        h('span', { class: 'jour-badge' }, `Jour ${jour} sur ${t.total}`),
        h('div', { class: 'progres', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': t.total, 'aria-valuenow': jour, 'aria-label': 'Progression du thème' }, h('i', { style: `width:${(jour / t.total) * 100}%` })),
        h('a', { class: 'btn btn-or btn-petit theme-btn', href: `#/priere/${duJour.id}` }, ico('play'), `Prier le jour ${jour}`))),
    rechercheZone, liste,
    h('p', { class: 'mention' }, `${d.source} · ${d.copyright}`));
  dessiner();
  return enveloppe(noeud);
}

// Extrait autour du mot trouvé, le mot en évidence
function extrait(texte, k, n) {
  const a = Math.max(0, k - 55), b = Math.min(texte.length, k + n + 70);
  return h('span', { class: 'extrait' }, (a > 0 ? '…' : '') + texte.slice(a, k), h('mark', {}, texte.slice(k, k + n)), texte.slice(k + n, b) + (b < texte.length ? '…' : ''));
}

function ligne(f, file, ext) {
  const piste = pisteFiche(f);
  const ecoute = boutonEcoute(piste, file, { cls: 'btn btn-bleu btn-rond btn-ecoute-fiche', aria: `Écouter « ${f.titre} »` });
  const aller = () => { location.hash = `#/priere/${f.id}`; };
  return h('div', { class: 'ligne ligne-fiche', role: 'link', tabindex: 0, onclick: e => { if (!e.target.closest('button')) aller(); }, onkeydown: e => { if (e.key === 'Enter') aller(); } },
    img(f.image, '', 'ligne-img'),
    h('div', { class: 'ligne-txt' },
      h('h3', {}, f.titre),
      ext || null,
      h('div', { class: 'ligne-bas' },
        h('div', { class: 'ligne-meta' }, ico('horloge'), `Fiche ${f.numero} · ≈ ${f.duree} min · ${f.nb_sujets} sujets`),
        ecoute),
      prieAujourdhui(f.id) ? h('span', { class: 'prie-ok' }, ico('coche'), 'Prié aujourd\'hui') : null));
}
