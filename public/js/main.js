import { $, $$, h, ico, eq, store, contenu, imgSrc, toast, getConfig } from './util.js';
import { pisteAdoration } from './pistes.js';
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
  [/^bible\/recherche$/, () => import('./views/bible.js').then(m => ({ default: m.recherchePage })), 'origine'],
  [/^bible\/plans$/, () => import('./views/plans.js'), 'origine'],
  [/^bible\/plan$/, () => import('./views/plans.js').then(m => ({ default: m.planPage })), 'origine'],
  [/^bible\/([\w-]+)$/, () => import('./views/bible.js').then(m => ({ default: m.livrePage })), 'origine'],
  [/^bible\/([\w-]+)\/(\d+)$/, () => import('./views/bible.js').then(m => ({ default: m.chapitrePage })), 'origine'],
  [/^reglages$/, () => import('./views/reglages.js'), 'plus'],
  [/^radio$/, () => import('./views/radio.js'), 'origine'],
  [/^sophonie$/, () => import('./views/sophonie.js'), 'plus']
];

let origine = 'accueil';   // onglet d'où l'on vient (pour les pages « satellites »)
let courant = null;        // vue affichée (pour nettoyer)
let jeton = 0;

async function aller() {
  const brut = (location.hash || '#/').replace(/^#\/?/, '');
  const [cheminBrut, requete = ''] = brut.split('?');
  const chemin = decodeURIComponent(cheminBrut.replace(/\/$/, ''));
  const params = new URLSearchParams(requete);
  const mon = ++jeton;
  let trouve = null;
  for (const [re, charge, onglet] of routes) { const m = chemin.match(re); if (m) { trouve = { charge, onglet, args: m.slice(1) }; break; } }
  if (!trouve) { location.replace('#/'); return; }

  // Règle de l'onglet actif : les pages satellites n'allument rien (depuis l'accueil) ou « Plus » (depuis Plus)
  let onglet = trouve.onglet;
  if (onglet === 'origine') onglet = origine === 'plus' ? 'plus' : null;
  else origine = onglet;
  $$('.onglets a').forEach(a => { const on = a.dataset.tab === onglet; a.classList.toggle('actif', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });

  const vue = $('#vue');
  if (courant && courant.nettoyer) courant.nettoyer();
  courant = null;
  vue.replaceChildren(h('div', { class: 'chargement', role: 'status', 'aria-label': 'Chargement' }, h('i')));
  const enLecteur = /^nayla\/[\w-]+$/.test(chemin);
  document.body.dataset.lecteur = enLecteur ? '1' : '';
  document.body.dataset.ecoute = '';
  majMini();
  try {
    const mod = await trouve.charge();
    const resultat = await mod.default(...trouve.args, params);
    if (mon !== jeton) return;
    courant = resultat;
    vue.replaceChildren(resultat.noeud);
    majMini();
    const t = vue.querySelector('h1');
    document.title = t && chemin ? `${t.textContent.replace('Exemple', '').trim()} — Vainqueur` : 'Vainqueur — Les Vainqueurs de Dieu';
    window.scrollTo(0, 0);
    vue.focus({ preventScroll: true });
  } catch (e) {
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
    if (annonce && neuf && store.get('news_annonce', '') !== dernier) {
      store.set('news_annonce', dernier);
      setTimeout(() => toast('🔔 Un nouveau message est arrivé', { label: 'Voir', href: '#/nouveautes' }), 2200);
    }
  } catch { /* hors connexion sans cache : pas de pastille */ }
}
window.addEventListener('vq-news', pastille);

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
  await chargerLivres().catch(() => {});
  const prete = aller();
  // Restaure la dernière écoute
  contenu('nayla').then(c => player.restaurer(c.adorations.filter(a => a.audio).map(pisteAdoration))).catch(() => {});
  pastille(true);
  getConfig().then(c => { if (c.devise) { const k = c.devise.lastIndexOf(' '); $('#devise').replaceChildren(c.devise.slice(0, k + 1), h('b', {}, c.devise.slice(k + 1))); } }).catch(() => {});
  await prete;
  const reste = Math.max(0, 1500 - (performance.now() - debut));
  setTimeout(() => { splash.classList.add('fin'); setTimeout(() => splash.remove(), 450); }, reste);
}

// Installation de l'application (Android / Chrome)
window.vqInstall = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.vqInstall = e; window.dispatchEvent(new Event('vq-installable')); });
addEventListener('appinstalled', () => { window.vqInstall = null; toast('Vainqueur est installée ✔'); window.dispatchEvent(new Event('vq-installable')); });
export { majMini };

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
demarrer();
