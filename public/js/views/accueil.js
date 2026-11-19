import { riche } from '../bible-refs.js';
import { h, img, ico, contenu, partager, toast, store, ficheDuJour, prieAujourdhui } from '../util.js';
import { pisteParole, pisteMessage } from '../pistes.js';
import { boutonEcoute, ouvrirVideo } from './commun.js';
import * as player from '../player.js';
import { imageParole, partagerImage } from '../partage.js';
import { enveloppe, ex } from './commun.js';
import * as Plans from '../plans.js';

const jourDeAnnee = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);

export default async function () {
  const [acc, fiches] = await Promise.all([contenu('accueil'), contenu('fiches')]);
  const j = jourDeAnnee();
  const ac = acc.accroches[j % acc.accroches.length];
  const pa = acc.paroles[j % acc.paroles.length];
  const fiche = ficheDuJour(fiches);
  const fait = prieAujourdhui(fiche.id);
  // Salutation du jour : « Bonjour,|champion ! » (la 2e partie en or) ; « Bonsoir » après 18 h
  let [sal1, sal2] = (acc.salutations || ['Bonjour,|champion !'])[j % (acc.salutations || [1]).length].split('|');
  if (new Date().getHours() >= 18) sal1 = sal1.replace(/^Bonjour/, 'Bonsoir');
  const msgs = acc.messages_du_jour || [];
  const msg = msgs.find(m => m.date === new Date().toISOString().slice(0, 10)) || msgs.filter(m => !m.date)[j % Math.max(1, msgs.filter(m => !m.date).length)];
  const nv = acc.nouveau_venu;
  const nouveau = nv && !store.get('salut_vu', false);
  // Plan de lecture de la Bible en cours : la lecture du jour
  let cartePlan = null;
  try {
    const pa2 = Plans.actif(); const plan = pa2 && (await Plans.plans()).find(p => p.id === pa2.id);
    if (plan) {
      const liste = Plans.journees(plan, pa2.debut); const i = Plans.indexDuJour(plan, liste);
      if (i >= 0) { const jj = liste[i]; const lu = Plans.estLu(jj.cle);
        cartePlan = h('a', { class: 'carte-plan-jour accueil' + (lu ? ' lu' : ''), href: '#/bible/plan' }, ico('calendrier'),
          h('span', {}, h('small', {}, lu ? 'Lecture biblique du jour ✔' : 'Lecture biblique du jour'), h('b', {}, Plans.libelle(jj.chapitres))), ico('suivant')); }
    }
  } catch { /* pas de plan */ }

  const btnEcouter = boutonEcoute(pisteParole(pa), null, { cls: 'btn btn-bleu btn-petit', off: 'Écouter', on: 'Pause' });

  // L'image est préparée à l'avance : le partage part tout de suite au toucher (exigé par Android).
  let image = null;
  let prete = null;
  const preparer = () => (prete = prete || imageParole(pa).then(b => (image = b)).catch(() => null));
  setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(preparer, { timeout: 6000 }) : preparer()), 4000);
  const btnPartager = h('button', { class: 'btn btn-clair btn-petit' }, ico('partager'), 'Partager');
  const texteParole = `« ${pa.texte} » — ${pa.ref}\nParole du jour · Vainqueur, Les Vainqueurs de Dieu\n${location.origin}${location.pathname}`;
  btnPartager.onclick = async () => {
    if (!image) { toast('Préparation de l\'image…'); await preparer(); }
    if (image) partagerImage(image, texteParole); else partager('Parole du jour', texteParole);
  };
  const noeud = h('div', {},
    h('section', { class: 'salut' },
      img(ac.image, '', 'salut-img', false),
      h('div', { class: 'salut-bonjour' }, sal1, sal2 ? h('b', {}, sal2) : null),
      h('h2', {}, ac.titre),
      h('p', {}, ac.sous)),
    nouveau ? h('section', { class: 'priere-jour nouveau-venu' },
      img(nv.image, '', '', false),
      h('div', {},
        h('span', { class: 'etiquette' }, nv.titre),
        h('h2', {}, 'La nouvelle naissance'),
        h('small', {}, nv.texte),
        h('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' },
          h('a', { class: 'btn btn-or', href: nv.lien }, ico('croix'), nv.bouton),
          h('button', { class: 'plus-tard', onclick: e => { store.set('salut_vu', true); e.currentTarget.closest('section').remove(); } }, 'Plus tard')))) : null,
    h('section', { class: 'priere-jour' },
      img(fiche.image, '', '', false),
      h('div', {},
        h('span', { class: 'etiquette rouge' }, ico('mains'), 'Prière du jour'),
        h('h2', {}, fiche.titre),
        h('small', {}, `Enseignement ${fiche.duree} min + 5 sujets de prière`),
        fait ? h('span', { class: 'prie-ok', style: 'margin-bottom:6px' }, ico('coche'), 'Tu as prié aujourd\'hui') : null,
        h('a', { class: 'btn btn-or', href: `#/priere/${fiche.id}` }, ico('play'), fait ? 'Revoir' : 'Commencer'))),
    msg ? h('section', { class: 'message-jour' },
      h('span', { class: 'etiquette' }, ico('chat'), msg.titre || 'Message du jour', ex(msg)),
      h('p', { 'data-lu': `msg-${msg.id}:t`, class: 'lecture-texte' }, msg.texte),
      h('div', { class: 'parole-btns' }, boutonEcoute(pisteMessage(msg), null, { cls: 'btn btn-bleu btn-petit', off: 'Écouter', on: 'Pause' }),
        msg.video ? h('button', { class: 'btn btn-clair btn-petit', onclick: () => ouvrirVideo(msg.video, msg.titre) }, ico('video'), 'Regarder') : null)) : null,
    cartePlan,
    h('section', { class: 'parole' },
      img('p1_12', '', ''),
      h('div', { class: 'parole-txt' },
        h('span', { class: 'etiquette' }, ico('livre'), 'Parole du jour'),
        h('q', { 'data-lu': 'parole:t' }, pa.texte), h('small', { html: riche(pa.ref) })),
      h('div', { class: 'parole-btns' }, btnEcouter,
        btnPartager)),
    installer(),
    h('section', { class: 'tuiles', 'aria-label': 'Rubriques' },
      acc.tuiles.map(t => h('a', { class: 'tuile', href: t.route },
        img(t.image, '', 'fond'),
        h('span', { class: 'tuile-ic' }, img(t.icone, '')),
        h('span', { class: 'tuile-bas' }, t.titre)))),
    h('div', { class: 'hors-ligne' }, h('span', { class: 'pilule-vert' }, ico('wifi'), 'Disponible hors connexion')));
  const majInst = () => { const z = noeud.querySelector('.installer'); if (z) z.hidden = !window.vqInstall; };
  window.addEventListener('vq-installable', majInst);
  return enveloppe(noeud, () => { window.removeEventListener('vq-installable', majInst); });
}

export function installer() {
  return h('section', { class: 'installer', hidden: !window.vqInstall },
    h('img', { src: 'icons/icon-192.png', alt: '' }),
    h('div', {}, h('b', {}, 'Installer Vainqueur'), 'Sur ton écran d\'accueil, même sans internet.'),
    h('button', { class: 'btn btn-or btn-petit', onclick: async () => { const e = window.vqInstall; if (!e) return; e.prompt(); try { await e.userChoice; } catch { /* ignoré */ } window.vqInstall = null; window.dispatchEvent(new Event('vq-installable')); } }, 'Installer'));
}
