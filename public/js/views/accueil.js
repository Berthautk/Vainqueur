import { riche, trouverRefs, lienRef } from '../bible-refs.js';
import { carrousel } from '../carrousel.js';
import { bilan, ACTIVITES } from '../temps.js';
import { h, img, imgSrc, ico, contenu, partager, toast, store, ficheDuJour, prieAujourdhui, prenom, jourTheme } from '../util.js';
import { pisteParole, pisteMessage } from '../pistes.js';
import { boutonEcoute, ouvrirVideo } from './commun.js';
import * as player from '../player.js';
import { imageParole, partagerImage } from '../partage.js';
import { enveloppe, ex } from './commun.js';
import * as Plans from '../plans.js';

const jourDeAnnee = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);

export default async function () {
  const [acc, fiches, nayla] = await Promise.all([contenu('accueil'), contenu('fiches'), contenu('nayla').catch(() => ({ adorations: [] }))]);
  const j = jourDeAnnee();
  const ac = acc.accroches[j % acc.accroches.length];
  const pa = acc.paroles[j % acc.paroles.length];
  const fiche = ficheDuJour(fiches);
  const fait = prieAujourdhui(fiche.id);
  // Salutation du jour : « Bonjour,|champion ! » (la 2e partie en or) ; « Bonsoir » après 18 h
  // Salutation du jour ; avec le prénom de la personne si elle l'a donné
  const nom = prenom();
  const liste = nom && (acc.salutations_prenom || []).length ? acc.salutations_prenom : (acc.salutations || ['Bonjour,|champion !']);
  let [sal1, sal2] = liste[j % liste.length].replace(/\{prenom\}/g, nom).split('|');
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
  const btnPartager = h('button', { class: 'btn btn-clair btn-petit' }, ico('partager'), 'Partager');
  const texteParole = `« ${pa.texte} » — ${pa.ref}\nParole du jour · Vainqueur, Les Vainqueurs de Dieu\n${location.origin}${location.pathname}`;
  btnPartager.onclick = async () => {
    if (!image) { toast('Préparation de l\'image…'); await preparer(); }
    if (image) partagerImage(image, texteParole); else partager('Parole du jour', texteParole);
  };
  // Carte « Prière du jour » (refaite quand on revient sur l'accueil : « Tu as prié aujourd'hui »)
  const cartePriere = () => {
    const ok = prieAujourdhui(fiche.id);
    return h('section', { class: 'priere-jour' },
      img(fiche.image, '', '', false),
      h('div', {},
        h('span', { class: 'etiquette rouge' }, ico('mains'), 'Prière du jour'),
        h('h2', {}, fiche.titre),
        h('small', {}, `Enseignement ${fiche.duree} min + 5 sujets de prière`),
        ok ? h('span', { class: 'prie-ok', style: 'margin-bottom:6px' }, ico('coche'), 'Tu as prié aujourd\'hui') : null,
        h('a', { class: 'btn btn-or', href: `#/priere/${fiche.id}` }, ico('play'), ok ? 'Revoir' : 'Commencer')));
  };
  let sectionPriere = cartePriere();

  // ---- Bannière qui défile : ce qui change chaque jour ----
  const court = (t, n) => (t && t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t || '');
  const refParole = trouverRefs(pa.ref)[0];
  const aimer = (nayla.adorations || []).filter(x => x.audio);
  const adoration = aimer.length ? aimer[j % aimer.length] : null;
  const sectionBanniere = h('section', { class: 'carrousel carrousel--accueil', 'aria-roledescription': 'carrousel', 'aria-label': 'À la une aujourd\'hui' },
    h('div', { class: 'carrousel__piste' }), h('div', { class: 'carrousel__points' }));
  const diapos = [{
    lien: refParole ? lienRef(refParole) : '#/bible', image: imgSrc('assets/fonds/fond_parole.webp'), bas: '40%',
    etiquette: 'Parole du jour', titre: '« ' + court(pa.texte, 95) + ' »', texte: pa.ref + ' · toucher pour la lire en grand'
  }, {
    lien: `#/priere/${fiche.id}`, image: imgSrc(fiche.image), etiquette: 'Prière du jour', titre: fiche.titre, texte: `${fiche.duree} min · enseignement puis 5 sujets`
  }];
  if (msg) diapos.push({
    lien: '#/', image: imgSrc('p5_12'), etiquette: msg.titre || 'Message du jour', titre: court(msg.texte, 70), texte: 'Toucher pour l\'écouter',
    surClic: () => { const e = noeud.querySelector('.message-jour'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  if (adoration) diapos.push({
    lien: `#/nayla/${adoration.id}`, image: imgSrc(adoration.image), etiquette: 'Adoration', titre: adoration.titre, texte: 'À écouter · ' + adoration.duree
  });
  const emplacementStats = h('div', { class: 'emplacement-stats' }, blocTemps());
  const noeud = h('div', {},
    h('section', { class: 'salut' },
      img(ac.image, '', 'salut-img', false),
      h('div', { class: 'salut-bonjour' }, sal1, sal2 ? h('b', {}, sal2) : null),
      h('h2', {}, ac.titre),
      h('p', {}, ac.sous)),
    sectionBanniere,
    nouveau ? h('section', { class: 'priere-jour nouveau-venu' },
      img(nv.image, '', '', false),
      h('div', {},
        h('span', { class: 'etiquette' }, nv.titre),
        h('h2', {}, 'La nouvelle naissance'),
        h('small', {}, nv.texte),
        h('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' },
          h('a', { class: 'btn btn-or', href: nv.lien }, ico('croix'), nv.bouton),
          h('button', { class: 'plus-tard', onclick: e => { store.set('salut_vu', true); e.currentTarget.closest('section').remove(); } }, 'Plus tard')))) : null,
    sectionPriere,
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
    h('h2', { class: 'titre-section titre-tuiles' }, 'Explorer'),
    h('section', { class: 'tuiles', 'aria-label': 'Rubriques' },
      acc.tuiles.map(t => h('a', { class: 'tuile', href: t.route },
        h('span', { class: 'tuile-photo' },
          img(t.image, '', '', true),
          t.icone ? h('span', { class: 'tuile-ic' }, img(t.icone, '', '', true)) : null),
        h('b', {}, t.titre),
        h('span', {}, t.route === '#/priere' && fiches.theme ? `Thème de la semaine · jour ${jourTheme(fiches.theme)} sur ${fiches.theme.total}` : (t.sous || ''))))),
    emplacementStats,
    cartePrenom(),
    h('div', { class: 'hors-ligne' }, h('span', { class: 'pilule-vert' }, ico('wifi'), 'Disponible hors connexion')));
  const fermerBanniere = carrousel(sectionBanniere, diapos);
  const majInst = () => { const z = noeud.querySelector('.installer'); if (z) z.hidden = !window.vqInstall; };
  window.addEventListener('vq-installable', majInst);
  const res = enveloppe(noeud, () => { fermerBanniere(); window.removeEventListener('vq-installable', majInst); });
  // Quand on revient sur l'accueil gardé en mémoire : décompte et prière du jour remis à jour
  res.reafficher = () => {
    emplacementStats.replaceChildren(...[blocTemps()].filter(Boolean));
    const neuf = cartePriere(); sectionPriere.replaceWith(neuf); sectionPriere = neuf;
  };
  return res;
}

const duree = m => (m >= 60 ? Math.floor(m / 60) + ' h ' + String(Math.round(m % 60)).padStart(2, '0') : Math.round(m) + ' min');

// « Mes temps avec Dieu » : ce que la personne a le plus vécu ces 7 derniers jours (rien n'est envoyé)
function blocTemps() {
  const b = bilan(7);
  const l = Object.entries(b).map(([k, minutes]) => ({ k, ...ACTIVITES[k], minutes })).filter(x => x.minutes >= 1).sort((a, c) => c.minutes - a.minutes);
  const total = l.reduce((s, x) => s + x.minutes, 0);
  if (!total) return null;                       // rien à montrer la première semaine
  return h('section', { class: 'stats-bloc' },
    h('h2', { class: 'titre-section' }, 'Mes temps avec Dieu'),
    h('p', { class: 'note' }, `Ces 7 derniers jours, ${duree(total)} au total. Ce décompte reste sur ton téléphone. `, h('a', { href: '#/reglages' }, 'Effacer')),
    h('div', { class: 'stats-perso' }, l.slice(0, 4).map(x => h('div', { class: 'stat-perso' },
      h('span', { class: 'stat-perso__nom' }, `${x.icone} ${x.nom}`),
      h('b', {}, duree(x.minutes)),
      h('span', { class: 'stat-perso__part' }, h('i', { style: `width:${Math.max(4, (x.minutes / total) * 100)}%` })),
      h('span', { class: 'stat-perso__pc' }, `${Math.round((x.minutes / total) * 100)} % de ton temps`)))));
}

export function installer() {
  return h('section', { class: 'installer', hidden: !window.vqInstall },
    h('img', { src: 'icons/icon-192.png', alt: '' }),
    h('div', {}, h('b', {}, 'Installer Vainqueur'), 'Sur ton écran d\'accueil, même sans internet.'),
    h('button', { class: 'btn btn-or btn-petit', onclick: async () => { const e = window.vqInstall; if (!e) return; e.prompt(); try { await e.userChoice; } catch { /* ignoré */ } window.vqInstall = null; window.dispatchEvent(new Event('vq-installable')); } }, 'Installer'));
}

// Petite invitation discrète (si la personne n'a pas encore donné son prénom, et ne l'a pas refusé)
function cartePrenom() {
  if (prenom() || store.get('prenom_etat', '') === 'refus' || store.get('prenom_etat', '') === 'efface') return null;
  const carte = h('section', { class: 'carte-prenom' }, h('span', { 'aria-hidden': 'true' }, '👋'),
    h('div', {}, h('b', {}, 'Comment t\'appelles-tu ?'), h('small', {}, 'Pour te saluer par ton prénom.')),
    h('button', { class: 'btn btn-or btn-petit', onclick: async () => { const m = await import('./prenom.js'); m.demanderPrenom(() => { location.hash = '#/'; window.dispatchEvent(new Event('vq-prenom')); }); } }, 'Mon prénom'),
    h('button', { class: 'carte-prenom-x', 'aria-label': 'Ne plus me le proposer', onclick: () => { store.set('prenom_etat', 'refus'); carte.remove(); } }, '✕'));
  return carte;
}
