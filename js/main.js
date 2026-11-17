import { $, $$, h, ico, store, contenu, imgSrc, toast } from './util.js';
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
  [/^nouveautes$/, () => import('./views/nouveautes.js'), 'origine']
];

let origine = 'accueil';   // onglet d'où l'on vient (pour les pages « satellites »)
let courant = null;        // vue affichée (pour nettoyer)
let jeton = 0;

async function aller() {
  const chemin = decodeURIComponent((location.hash || '#/').replace(/^#\/?/, '').replace(/\/$/, ''));
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
  majMini();
  try {
    const mod = await trouve.charge();
    const resultat = await mod.default(...trouve.args);
    if (mon !== jeton) return;
    courant = resultat;
    vue.replaceChildren(resultat.noeud);
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
  const visible = p && document.body.dataset.lecteur !== '1';
  m.hidden = !visible; v.classList.toggle('avec-mini', !!visible);
  if (!p) return;
  if (m.dataset.id !== p.id || !m.firstChild) {
    m.dataset.id = p.id;
    m.replaceChildren(
      h('a', { href: `#/nayla/${p.id}`, 'aria-label': 'Ouvrir le lecteur' },
        h('img', { src: imgSrc(p.image), alt: '' }),
        h('div', { class: 'mini-txt' }, h('b', {}, p.titre), h('small', { id: 'mini-t' }, '0:00'))),
      h('button', { class: 'ic-btn', 'aria-label': 'Précédent', onclick: () => player.precedent() }, ico('prec', 'ic')),
      h('button', { class: 'btn-lire', id: 'mini-pp', onclick: () => player.basculer() }),
      h('button', { class: 'ic-btn', 'aria-label': 'Suivant', onclick: () => player.suivant() }, ico('suiv', 'ic')),
      h('div', { class: 'mini-barre' }, h('i', { id: 'mini-b' })));
    if (p.type === 'adoration') m.querySelector('a').href = `#/nayla/${p.id}`; else m.querySelector('a').removeAttribute('href');
  }
  const pp = $('#mini-pp');
  pp.replaceChildren(ico(player.lit() ? 'pause' : 'play')); pp.setAttribute('aria-label', player.lit() ? 'Pause' : 'Lecture');
}
function majMiniTemps() {
  const { t, d } = player.temps();
  const a = $('#mini-t'), b = $('#mini-b');
  if (a) a.textContent = `${fmt(t)} / ${fmt(d)}`;
  if (b) b.style.width = d ? `${(t / d) * 100}%` : '0';
}
const fmt = s => { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
player.sur(t => { if (t === 'temps') majMiniTemps(); else { majMini(); majMiniTemps(); } });

// ---- Cloche / nouveautés ----
async function pastille() {
  try {
    const n = await contenu('nouveautes');
    const vu = store.get('news_vu', '');
    const dernier = n.items.map(i => i.id + i.date).sort().pop() || '';
    $('#pastille').hidden = !dernier || vu === dernier;
  } catch { /* hors connexion sans cache : pas de pastille */ }
}
window.addEventListener('vq-news', pastille);

// ---- Hors connexion ----
const majReseau = () => { $('#offline').hidden = navigator.onLine; };
addEventListener('online', majReseau); addEventListener('offline', majReseau);

// ---- Démarrage ----
async function demarrer() {
  const splash = $('#splash'), app = $('#app');
  const debut = performance.now();
  app.hidden = false;
  majReseau();
  addEventListener('hashchange', aller);
  const prete = aller();
  // Restaure la dernière écoute
  contenu('nayla').then(c => player.restaurer(c.adorations.map(a => ({ id: a.id, titre: a.titre, audio: a.audio, image: a.image, type: 'adoration' })))).catch(() => {});
  pastille();
  await prete;
  const reste = Math.max(0, 1500 - (performance.now() - debut));
  setTimeout(() => { splash.classList.add('fin'); setTimeout(() => splash.remove(), 450); }, reste);
}

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
demarrer();
