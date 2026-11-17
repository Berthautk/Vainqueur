import { h, img, ico, contenu, jourTheme, prieAujourdhui } from '../util.js';
import * as dl from '../downloads.js';
import * as player from '../player.js';
import { enveloppe, ex, boutonEcoute } from './commun.js';
import { pisteFiche, pistesFiches } from '../pistes.js';

export default async function () {
  const d = await contenu('fiches');
  const t = d.theme;
  const jour = jourTheme(t);
  const [avant, apres] = t.titre.split(t.mot_or);
  // Prête pour des centaines de fiches : recherche + fiches du thème de la semaine en premier
  const file = pistesFiches(d);
  const liste = h('div', { class: 'liste' });
  const champ = h('input', { type: 'search', placeholder: 'Rechercher une fiche de prière…', 'aria-label': 'Rechercher une fiche de prière', autocomplete: 'off' });
  const rechercheZone = h('div', { class: 'recherche recherche-priere' }, ico('loupe'), champ);
  const norm = x => String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function dessiner() {
    const q = norm(champ.value.trim());
    const res = d.fiches.filter(f => !q || norm(f.titre + ' ' + f.matin.enseignement + ' ' + f.soir.enseignement).includes(q));
    const duTheme = res.filter(f => f.theme === t.id), autres = res.filter(f => f.theme !== t.id);
    const blocs = [];
    if (duTheme.length) blocs.push(h('h2', { class: 'groupe' }, 'Fiches du thème de la semaine'), ...duTheme.map(f => ligne(f, file)));
    if (autres.length) blocs.push(h('h2', { class: 'groupe' }, 'Toutes les autres fiches'), ...autres.map(f => ligne(f, file)));
    liste.replaceChildren(...(blocs.length ? blocs : [h('div', { class: 'vide' }, h('strong', {}, 'Aucune fiche trouvée'), 'Essaie un autre mot.')]));
  }
  champ.oninput = dessiner;
  const noeud = h('div', {},
    h('div', { class: 'entete-page' }, ico('mains'), h('h1', {}, 'Prière de délivrance et ', h('em', { class: 'or' }, 'de guérison'))),
    h('p', { class: 'accroche-page' }, d.accroche_page),
    h('section', { class: 'theme' },
      img(t.image, '', '', false),
      h('div', { class: 'theme-txt' },
        h('span', { class: 'etiquette' }, 'Thème de la semaine :'), ex(t),
        h('h2', {}, avant, h('em', {}, t.mot_or), apres),
        h('span', { class: 'jour-badge' }, `Jour ${jour} sur ${t.total}`),
        h('div', { class: 'progres', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': t.total, 'aria-valuenow': jour, 'aria-label': 'Progression du thème' }, h('i', { style: `width:${(jour / t.total) * 100}%` })))),
    rechercheZone, liste);
  dessiner();
  return enveloppe(noeud);
}

function ligne(f, file) {
  const piste = pisteFiche(f);
  const ecoute = boutonEcoute(piste, file, { aria: `Écouter « ${f.titre} »` });
  let down = null;
  if (piste.audio) {
    down = h('button', { class: 'btn btn-vert btn-rond', 'aria-label': `Télécharger ${f.titre}` }, ico('telecharger'));
    const marque = () => { down.classList.add('fait'); down.replaceChildren(ico('coche')); down.setAttribute('aria-label', `${f.titre} : téléchargé (voir Mes téléchargements)`); };
    down.onclick = async e => { e.stopPropagation(); if (down.classList.contains('fait')) { location.hash = '#/telechargements'; return; } if (await dl.telecharger(piste.audio, f.titre)) marque(); };
    dl.estGarde(piste.audio).then(ok => { if (ok) marque(); });
  }
  return h('div', { class: 'ligne', role: 'link', tabindex: 0, onclick: () => { location.hash = `#/priere/${f.id}`; }, onkeydown: e => { if (e.key === 'Enter') location.hash = `#/priere/${f.id}`; } },
    img(f.image, '', 'ligne-img'),
    h('div', { class: 'ligne-txt' }, h('h3', {}, f.titre, ex(f)), h('div', { class: 'ligne-meta' }, ico('horloge'), `${f.duree} min`), prieAujourdhui(f.id) ? h('span', { class: 'prie-ok' }, ico('coche'), 'Prié aujourd\'hui') : null),
    h('div', { class: 'ligne-actions' }, ecoute, down));
}
