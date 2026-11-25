import { $, $$, h, ico, eq, store, contenu, oublierContenu, imgSrc, toast, getConfig, prenom } from './util.js';
import { pisteAdoration } from './pistes.js';
import { suivre } from './temps.js';
import { majBouton } from './views/commun.js';
import * as surlignage from './surlignage.js';
import * as reglages from './reglages.js';
import { chargerLivres } from './bible-refs.js';
reglages.appliquer();
player.regleVitesse(reglages.vitesse);
player.surMot((lu, k) => surlignage.marquer(lu, k));
import * as player from './player.js';

const routes = [
  [/^$/, () => import('./views/accueil.js'), 'accueil'],
  [/^priere$/, () => import('./views/priere.js'), 'priere'],
  [/^priere\/([\w-]+)$/, () => import('./views/fiche.js'), 'priere'],
  [/^nayla$/, () => import('./views/nayla.js'), 'nayla'],
  [/^nayla\/([\w-]+)$/, () => import('./views/lecteur.js'), 'nayla'],
  [/^coeurs$/, () => import('./views/coeurs.js'), 'coeurs'],
  [/^coeurs\/([\w-]+)$/, () => import('./views/article.js'), 'coeurs'],
  [/^affaires$/, () => import('./views/affaires.js'), 'origine'],
  [/^evangelisation$/, () => import('./views/evangelisation.js'), 'origine'],
  [/^salut$/, () => import('./views/salut.js'), 'origine'],
  [/^temoignages$/, () => import('./views/temoignages.js'), 'origine'],
  [/^plus$/, () => import('./views/plus.js'), 'plus'],
  [/^telechargements$/, () => import('./views/telechargements.js'), 'plus'],
  [/^apropos$/, () => import('./views/apropos.js'), 'plus'],
  [/^nouveautes$/, () => import('./views/nouveautes.js'), 'origine'],
  [/^bible$/, () => import('./views/bible.js'), 'origine'],
  [/^bible\/marques$/, () => import('./views/etudes.js'), 'origine'],
  [/^bible\/etude\/([\w-]+)$/, () => import('./views/etudes.js').then(m => ({ default: m.etudePage })), 'origine'],
  [/^bible\/etude\/([\w-]+)\/intervention$/, () => import('./views/etudes.js').then(m => ({ default: m.interventionPage })), 'origine'],
  [/^bible\/([\w-]+)\/(\d+)\/versets$/, () => import('./views/bible.js').then(m => ({ default: m.versetsPage })), 'origine'],
  [/^bible\/recherche$/, () => import('./views/bible.js').then(m => ({ default: m.recherchePage })), 'origine'],
  [/^bible\/plans$/, () => import('./views/plans.js'), 'origine'],
  [/^bible\/plan$/, () => import('./views/plans.js').then(m => ({ default: m.planPage })), 'origine'],
  [/^bible\/([\w-]+)$/, () => import('./views/bible.js').then(m => ({ default: m.livrePage })), 'origine'],
  [/^bible\/([\w-]+)\/(\d+)$/, () => import('./views/bible.js').then(m => ({ default: m.chapitrePage })), 'origine'],
  [/^reglages$/, () => import('./views/reglages.js'), 'plus'],
  [/^radio$/, () => import('./views/radio.js'), 'origine'],
  [/^sophonie$/, () => import('./views/sophonie.js'), 'plus']
];

// Écran de chargement aux couleurs de Vainqueur (blason qui tourne doucement + barre dorée)
const chargeur = () => h('div', { class: 'chargeur', role: 'status', 'aria-label': 'Chargement' },
  h('div', { class: 'chargeur-rond' }, h('img', { src: 'assets/logo/blason_web.webp', alt: '' })),
  h('div', { class: 'chargeur-barre' }, h('i')), h('small', {}, 'Chargement…'));
let livresPrets = Promise.resolve();
// Rubriques de la barre du bas gardées prêtes (réaffichées instantanément).
// Elles sont refaites après la visite d'une autre page (une fiche lue, un favori…) ou un autre jour.
const GARDEES = new Set(['', 'priere', 'nayla', 'coeurs', 'plus']);
let gardees = {}; let jourGarde = '';
const viderGardees = () => { const vieux = Object.values(gardees); gardees = {}; vieux.forEach(g => { try { g.nettoyer && g.nettoyer(); } catch { /* ignoré */ } }); };
let origine = 'accueil';   // onglet d'où l'on vient (pour les pages « satellites »)
let courant = null;        // vue affichée (pour nettoyer)
let jeton = 0;

async function aller() {
  const brut = (location.hash || '#/').replace(/^#\/?/, '');
  const [cheminBrut, requete = ''] = brut.split('?');
  const chemin = decodeURIComponent(cheminBrut.replace(/\/$/, ''));
  const params = new URLSearchParams(requete);
  const mon = ++jeton;
  suivre(chemin);
  let trouve = null;
  for (const [re, charge, onglet] of routes) { const m = chemin.match(re); if (m) { trouve = { charge, onglet, args: m.slice(1) }; break; } }
  if (!trouve) { location.replace('#/'); return; }

  // Règle de l'onglet actif : les pages satellites n'allument rien (depuis l'accueil) ou « Plus » (depuis Plus)
  let onglet = trouve.onglet;
  if (onglet === 'origine') onglet = origine === 'plus' ? 'plus' : null;
  else origine = onglet;
  $$('.onglets a').forEach(a => { const on = a.dataset.tab === onglet; a.classList.toggle('actif', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });

  const vue = $('#vue');
  if (courant && courant.nettoyer && !courant.garde) courant.nettoyer();
  courant = null;
  const jour = new Date().toDateString();
  if (jour !== jourGarde) { jourGarde = jour; viderGardees(); }
  const garder = GARDEES.has(chemin) && !requete;
  if (!garder) viderGardees();
  if (garder && gardees[chemin]) {
    courant = gardees[chemin];
    document.body.dataset.lecteur = ''; document.body.dataset.ecoute = '';
    vue.replaceChildren(courant.noeud);
    document.querySelectorAll('[data-piste]').forEach(majBouton);
    try { courant.reafficher && courant.reafficher(); } catch { /* ignoré */ }
    majMini();
    window.scrollTo(0, 0);
    return;
  }
  const tempo = setTimeout(() => { if (mon === jeton) vue.replaceChildren(chargeur()); }, 150);
  const enLecteur = /^nayla\/[\w-]+$/.test(chemin);
  document.body.dataset.lecteur = enLecteur ? '1' : '';
  document.body.dataset.ecoute = '';
  majMini();
  try {
    const [mod] = await Promise.all([trouve.charge(), livresPrets]);
    const resultat = await mod.default(...trouve.args, params);
    clearTimeout(tempo);
    if (mon !== jeton) return;
    courant = resultat;
    if (garder) { resultat.garde = true; gardees[chemin] = resultat; }
    vue.replaceChildren(resultat.noeud);
    majMini();
    const t = vue.querySelector('h1');
    document.title = t && chemin ? `${t.textContent.replace('Exemple', '').trim()} — Vainqueur` : 'Vainqueur — Les Vainqueurs de Dieu';
    window.scrollTo(0, 0);
    vue.focus({ preventScroll: true });
  } catch (e) {
    clearTimeout(tempo);
    console.error(e);
    if (mon !== jeton) return;
    vue.replaceChildren(h('div', { class: 'vide' }, h('strong', {}, 'Contenu indisponible'), navigator.onLine ? 'Une erreur est survenue.' : 'Tu es hors connexion et cette page n\'a pas encore été enregistrée.', h('p', {}, h('a', { class: 'btn btn-or', href: '#/' }, 'Retour à l\'accueil'))));
  }
}

// ---- Mini-lecteur ----
function majMini() {
  const m = $('#mini'); const v = $('#vue');
  const p = player.etat.piste;
  const visible = !!p && document.body.dataset.lecteur !== '1' && document.body.dataset.ecoute !== p.id;
  m.hidden = !visible; v.classList.toggle('avec-mini', visible);
  if (!p) { m.dataset.id = ''; return; }
  const plusieurs = player.etat.file.length > 1;
  if (m.dataset.id !== p.id || m.dataset.n !== String(plusieurs)) {
    m.dataset.id = p.id; m.dataset.n = String(plusieurs);
    m.replaceChildren(...[
      h('a', { class: 'mini-lien', href: p.lien || null, 'aria-label': `Ouvrir : ${p.titre}` },
        h('span', { class: 'mini-pochette' }, h('img', { src: imgSrc(p.image), alt: '' }), eq(4)),
        h('span', { class: 'mini-txt' }, h('b', {}, p.titre), h('small', { id: 'mini-t' }, ''))),
      plusieurs ? h('button', { class: 'ic-btn', 'aria-label': 'Précédent', onclick: () => player.precedent() }, ico('prec', 'ic')) : null,
      h('button', { class: 'btn-lire', id: 'mini-pp', onclick: () => player.basculer() }),
      plusieurs ? h('button', { class: 'ic-btn', 'aria-label': 'Suivant', onclick: () => player.suivant() }, ico('suiv', 'ic')) : null,
      h('button', { class: 'mini-fermer', 'aria-label': 'Fermer le lecteur', onclick: () => { player.arreter(); } }, ico('fermer')),
      h('div', { class: 'mini-barre' }, h('i', { id: 'mini-b' }))].filter(Boolean));
  }
  const on = player.lit();
  m.classList.toggle('joue', on);
  const pp = $('#mini-pp');
  pp.replaceChildren(ico(on ? 'pause' : 'play')); pp.setAttribute('aria-label', on ? 'Pause' : 'Lecture');
}
window.addEventListener('vq-mini', () => majMini());
function majMiniTemps() {
  const { t, d } = player.temps();
  const a = $('#mini-t'), b = $('#mini-b');
  if (a) a.textContent = player.libelleTemps();
  if (b) b.style.width = d ? `${Math.min(100, (t / d) * 100)}%` : '0';
}
player.sur(t => { if (t !== 'temps') { majMini(); document.querySelectorAll('[data-piste]').forEach(majBouton); } majMiniTemps(); });

// ---- Cloche / nouveautés ----
async function pastille(annonce = false) {
  try {
    const n = await contenu('nouveautes');
    const vu = store.get('news_vu', '');
    const dernier = n.items.map(i => i.id + i.date).sort().pop() || '';
    const neuf = !!dernier && vu !== dernier;
    $('#pastille').hidden = !neuf;
    // Annonce une seule fois chaque nouveauté
    // (pas par-dessus la question du prénom, posée au premier lancement)
    const prenomAttendu = !prenom() && !store.get('prenom_demande', 0) && !['refus', 'efface'].includes(store.get('prenom_etat', ''));
    if (annonce && neuf && !prenomAttendu && store.get('news_annonce', '') !== dernier) {
      store.set('news_annonce', dernier);
      setTimeout(() => toast('🔔 Un nouveau message est arrivé', { label: 'Voir', href: '#/nouveautes' }), 2200);
    }
  } catch { /* hors connexion sans cache : pas de pastille */ }
}
window.addEventListener('vq-news', pastille);

// ---- Barre du bas : la rubrique s'ouvre dès que le doigt se lève (même si le téléphone n'envoie pas de « clic ») ----
(() => {
  const nav = document.querySelector('.onglets'); let depart = null;
  nav.addEventListener('pointerdown', e => { const a = e.target.closest('a[data-tab]'); depart = a ? { a, x: e.clientX, y: e.clientY } : null; }, { passive: true });
  nav.addEventListener('pointerup', e => {
    if (!depart) return; const { a, x, y } = depart; depart = null;
    if (Math.abs(e.clientX - x) > 12 || Math.abs(e.clientY - y) > 12) return;
    const cible = a.getAttribute('href');
    if (location.hash !== cible && !(cible === '#/' && (location.hash === '' || location.hash === '#/'))) location.hash = cible;
  });
  nav.addEventListener('pointercancel', () => { depart = null; });
})();

// ---- Hors connexion ----
const majReseau = () => { $('#offline').hidden = navigator.onLine; };
addEventListener('online', majReseau); addEventListener('offline', majReseau);

// ---- Démarrage ----
async function demarrer() {
  store.set('ouvertures', store.get('ouvertures', 0) + 1);
  const splash = $('#splash'), app = $('#app');
  const debut = performance.now();
  app.hidden = false;
  majReseau();
  addEventListener('hashchange', aller);
  livresPrets = chargerLivres().catch(() => {});
  const prete = aller();
  // Restaure la dernière écoute
  contenu('nayla').then(c => player.restaurer(c.adorations.filter(a => a.audio).map(pisteAdoration))).catch(() => {});
  pastille(true);
  getConfig().then(c => { if (c.devise) { const k = c.devise.lastIndexOf(' '); $('#devise').replaceChildren(c.devise.slice(0, k + 1), h('b', {}, c.devise.slice(k + 1))); } }).catch(() => {});
  await prete;
  // Le texte et l'image de l'accueil apparaissent ensemble (au plus 2,5 s d'attente)
  const premiereImage = $('#vue img');
  await Promise.race([Promise.all([document.fonts ? document.fonts.ready : 0, premiereImage && premiereImage.decode ? premiereImage.decode().catch(() => {}) : 0]), new Promise(r => setTimeout(r, 2500))]);
  const reste = Math.max(0, (store.get('ouvertures', 1) > 1 ? 700 : 1400) - (performance.now() - debut));
  setTimeout(() => { splash.classList.add('fin'); setTimeout(() => splash.remove(), 450); }, reste);
  // Une seule fois : « Comment t'appelles-tu ? » (si ce n'est pas déjà fait)
  setTimeout(() => import('./views/prenom.js').then(p => p.proposerPrenom()).catch(() => {}), reste + 900);
  if (store.get('maj_faite', 0) && Date.now() - store.get('maj_faite', 0) < 120000) { store.set('maj_faite', 0); setTimeout(() => { if (!document.querySelector('#feuille:not([hidden])')) toast('Vainqueur est à jour ✔'); }, reste + 900); }
  // Ensuite, quand le téléphone est libre : on prépare toutes les rubriques pour qu'elles s'ouvrent tout de suite
  const auRepos = f => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 2500));
  setTimeout(() => auRepos(() => {
    routes.forEach(([, charge]) => charge().catch(() => {}));
    ['fiches', 'nayla', 'coeurs_brises', 'affaires', 'evangelisation', 'temoignages', 'plus', 'radio', 'plans'].forEach(n => contenu(n).catch(() => {}));
  }), 1500);
}

// Le prénom a changé : l'accueil est refait (il garde en mémoire sa version précédente)
window.addEventListener('vq-prenom', () => { viderGardees(); if (/^(#\/?)?$/.test(location.hash)) aller(); });

// Un contenu a changé sur le serveur : on le relira à la prochaine ouverture de la rubrique
navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', ev => {
  if (ev.data && ev.data.type === 'contenu-maj') { const m = ev.data.url.match(/content\/([\w-]+)\.json$/); if (m) { oublierContenu(m[1]); viderGardees(); } }
});

// Installation de l'application (Android / Chrome)
window.vqInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.vqInstall = e; window.dispatchEvent(new Event('vq-installable')); });
addEventListener('appinstalled', () => { window.vqInstall = null; toast('Vainqueur est installée ✔'); window.dispatchEvent(new Event('vq-installable')); });
export { majMini };

// ---- Mises à jour : un message à cliquer quand une nouvelle version est prête ----
let regSW = null, rechargeDemande = false, avaitControleur = false;
function afficherMaj() {
  if ($('#maj')) return;
  const bande = h('div', { id: 'maj', class: 'maj', role: 'alert' },
    h('span', {}, '🔄 Une mise à jour de Vainqueur est arrivée.'),
    h('button', { class: 'btn btn-or btn-petit', onclick: lancerMaj }, 'Mettre à jour'),
    h('button', { class: 'maj-plus-tard', 'aria-label': 'Plus tard', onclick: () => { bande.remove(); document.body.classList.remove('avec-maj'); } }, 'Plus tard'));
  const entete = $('.entete');
  entete.after(bande);
  bande.style.setProperty('--h-entete', entete.offsetHeight + 'px');
  document.body.classList.add('avec-maj');
  document.body.style.setProperty('--h-maj', bande.offsetHeight + 'px');
}
function lancerMaj() {
  store.set('maj_faite', Date.now());
  const b = $('#maj button'); if (b) { b.disabled = true; b.textContent = 'Mise à jour…'; }
  const attente = regSW && regSW.waiting;
  if (attente) { rechargeDemande = true; attente.postMessage({ type: 'SKIP_WAITING' }); setTimeout(() => location.reload(), 2500); }
  else location.reload();
}
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  avaitControleur = !!sw.controller;
  // La nouvelle version répond « oui, je sais afficher la mise à jour » : elle attendra alors le clic
  sw.addEventListener('message', ev => { if (ev.data && ev.data.type === 'MAJ_QUESTION' && ev.source) ev.source.postMessage({ type: 'MAJ_OK' }); });
  sw.addEventListener('controllerchange', () => {
    if (rechargeDemande) { location.reload(); return; }
    if (avaitControleur) afficherMaj();      // la nouvelle version a pris la main toute seule : on propose de recharger
    avaitControleur = true;
  });
  addEventListener('load', () => sw.register('sw.js').then(reg => {
    regSW = reg;
    if (reg.waiting && sw.controller) afficherMaj();
    reg.addEventListener('updatefound', () => {
      const nv = reg.installing;
      nv && nv.addEventListener('statechange', () => { if (nv.state === 'installed' && sw.controller) afficherMaj(); });
    });
    // Vérifie régulièrement, sans qu'il faille fermer l'application : à chaque retour au premier plan, et toutes les 20 minutes
    const verifier = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verifier(); });
    setInterval(verifier, 20 * 60 * 1000);
  }).catch(() => {}));
}
demarrer();
