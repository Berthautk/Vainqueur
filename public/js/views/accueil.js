import { riche, trouverRefs, lienRef } from '../bible-refs.js';
import { carrousel } from '../carrousel.js';
import { bilan, ACTIVITES } from '../temps.js';
import { h, img, imgSrc, ico, contenu, partager, toast, store, feuille, ficheDuJour, prieAujourdhui, prenom, jourTheme } from '../util.js';
import { pisteParole, pisteMessage } from '../pistes.js';
import { boutonEcoute, ouvrirVideo } from './commun.js';
import { imageParole, partagerImage } from '../partage.js';
import { enveloppe, ex } from './commun.js';
import * as Plans from '../plans.js';

const jourDeAnnee = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
const court = (t, n) => (t && t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t || '');

export default async function () {
  const [acc, fiches, nayla] = await Promise.all([contenu('accueil'), contenu('prieres/index'), contenu('nayla').catch(() => ({ adorations: [] }))]);
  const j = jourDeAnnee();
  const ac = acc.accroches[j % acc.accroches.length];
  const pa = acc.paroles[j % acc.paroles.length];
  const fiche = ficheDuJour(fiches);
  // Salutation du jour ; avec le prénom de la personne si elle l'a donné (« Bonsoir » après 18 h)
  const nom = prenom();
  const liste = nom && (acc.salutations_prenom || []).length ? acc.salutations_prenom : (acc.salutations || ['Bonjour,|champion !']);
  let [sal1, sal2] = liste[j % liste.length].replace(/\{prenom\}/g, nom).split('|');
  if (new Date().getHours() >= 18) sal1 = sal1.replace(/^Bonjour/, 'Bonsoir');
  const msgs = acc.messages_du_jour || [];
  const msg = msgs.find(m => m.date === new Date().toISOString().slice(0, 10)) || msgs.filter(m => !m.date)[j % Math.max(1, msgs.filter(m => !m.date).length)];
  const nv = acc.nouveau_venu;
  let nouveau = nv && !store.get('salut_vu', false);
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

  // ---- Parole du jour : fenêtre avec écoute (mot en couleur), partage en image et accès à la Bible ----
  const refParole = trouverRefs(pa.ref)[0];
  const lienBible = refParole ? lienRef(refParole) : '#/bible';
  // L'image est préparée à l'ouverture : le partage part tout de suite au toucher (exigé par Android).
  let image = null, prete = null;
  const preparer = () => (prete = prete || imageParole(pa).then(b => (image = b)).catch(() => null));
  const texteParole = `« ${pa.texte} » — ${pa.ref}\nParole du jour · Vainqueur, Les Vainqueurs de Dieu\n${location.origin}${location.pathname}`;
  function ouvrirParole() {
    preparer();
    const f = feuille(h('div', { class: 'feuille-parole', onclick: e => { if (e.target.closest('a')) f(); } },
      h('span', { class: 'etiquette' }, ico('livre'), 'Parole du jour'),
      h('q', { class: 'lecture-texte', 'data-lu': 'parole:t' }, pa.texte),
      h('p', { class: 'parole-ref', html: riche(pa.ref) }),
      h('div', { class: 'parole-btns' },
        boutonEcoute(pisteParole(pa), null, { cls: 'btn btn-bleu', off: 'Écouter', on: 'Pause' }),
        h('button', { class: 'btn btn-clair', onclick: async () => {
          if (!image) { toast('Préparation de l\'image…'); await preparer(); }
          if (image) partagerImage(image, texteParole); else partager('Parole du jour', texteParole);
        } }, ico('partager'), 'Partager')),
      h('a', { class: 'btn btn-or', href: lienBible }, ico('livre'), 'Ouvrir dans la Bible'),
      h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
  }
  // ---- Message du jour : texte, écoute et vidéo ----
  function ouvrirMessage() {
    const f = feuille(h('div', { class: 'feuille-parole' },
      h('span', { class: 'etiquette' }, ico('chat'), msg.titre || 'Message du jour', ex(msg)),
      h('p', { class: 'lecture-texte message-texte', 'data-lu': `msg-${msg.id}:t` }, msg.texte),
      h('div', { class: 'parole-btns' }, boutonEcoute(pisteMessage(msg), null, { cls: 'btn btn-bleu', off: 'Écouter', on: 'Pause' }),
        msg.video ? h('button', { class: 'btn btn-clair', onclick: () => { f(); ouvrirVideo(msg.video, msg.titre); } }, ico('video'), 'Regarder') : null),
      h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
  }

  // ---- Bannière qui défile : tout ce qui change chaque jour ----
  const aimer = (nayla.adorations || []).filter(x => x.audio);
  const adoration = aimer.length ? aimer[j % aimer.length] : null;
  const sectionBanniere = h('section', { class: 'carrousel carrousel--accueil', 'aria-roledescription': 'carrousel', 'aria-label': 'À la une aujourd\'hui' });
  const construireDiapos = () => {
    const ok = prieAujourdhui(fiche.id);
    const d = [];
    if (nouveau) d.push({
      lien: nv.lien, image: imgSrc(nv.image), etiquette: nv.titre, titre: 'La nouvelle naissance', texte: court(nv.texte, 90),
      actions: [{ aria: 'Plus tard', label: '✕', onClick: () => { store.set('salut_vu', true); nouveau = false; monterBanniere(); } }]
    });
    d.push({
      lien: `#/priere/${fiche.id}`, image: imgSrc(fiche.image), etiquette: 'Prière du jour', titre: fiche.titre,
      texte: ok ? 'Tu as prié aujourd\'hui ✔ · toucher pour revoir' : (() => { const soir = new Date().getHours() >= 17; return `≈ ${soir ? fiche.duree_soir : fiche.duree_matin} min · enseignement puis ${soir ? fiche.sujets_soir : fiche.sujets_matin} sujets`; })()
    });
    d.push({ lien: lienBible, surClic: ouvrirParole, image: imgSrc('assets/fonds/fond_parole.webp'), bas: '40%',
      etiquette: 'Parole du jour', titre: '« ' + court(pa.texte, 95) + ' »', texte: pa.ref + ' · toucher pour écouter et partager' });
    if (msg) d.push({ lien: '#/', surClic: ouvrirMessage, image: imgSrc('p5_12'), etiquette: msg.titre || 'Message du jour', titre: court(msg.texte, 70), texte: 'Toucher pour lire et écouter' });
    if (adoration) d.push({ lien: `#/nayla/${adoration.id}`, image: imgSrc(adoration.image), etiquette: 'Adoration', titre: adoration.titre, texte: 'À écouter · ' + adoration.duree });
    return d;
  };
  let fermerBanniere = () => {};
  const monterBanniere = () => {
    fermerBanniere();
    sectionBanniere.replaceChildren(h('div', { class: 'carrousel__piste' }), h('div', { class: 'carrousel__points' }));
    sectionBanniere.hidden = false;
    fermerBanniere = carrousel(sectionBanniere, construireDiapos());
  };

  // Les statistiques prennent la place des anciens blocs, juste sous la bannière
  const emplacementStats = h('div', { class: 'emplacement-stats' }, blocTemps());
  const noeud = h('div', {},
    h('section', { class: 'salut' },
      img(ac.image, '', 'salut-img', false),
      h('div', { class: 'salut-bonjour' }, sal1, sal2 ? h('b', {}, sal2) : null),
      h('h2', {}, ac.titre),
      h('p', {}, ac.sous)),
    sectionBanniere,
    emplacementStats,
    cartePlan,
    installer(),
    h('h2', { class: 'titre-section titre-tuiles' }, 'Explorer'),
    h('section', { class: 'tuiles', 'aria-label': 'Rubriques' },
      acc.tuiles.map(t => h('a', { class: 'tuile', href: t.route },
        h('span', { class: 'tuile-photo' },
          img(t.image, '', '', true),
          t.icone ? h('span', { class: 'tuile-ic' }, img(t.icone, '', '', true)) : null),
        h('b', {}, t.titre),
        h('span', {}, t.route === '#/priere' && fiches.theme ? `Thème de la semaine · jour ${jourTheme(fiches.theme)} sur ${fiches.theme.total}` : (t.sous || ''))))),
    cartePrenom(),
    h('div', { class: 'hors-ligne' }, h('span', { class: 'pilule-vert' }, ico('wifi'), 'Disponible hors connexion')));
  monterBanniere();
  const majInst = () => { const z = noeud.querySelector('.installer'); if (z) z.hidden = !window.vqInstall; };
  window.addEventListener('vq-installable', majInst);
  const res = enveloppe(noeud, () => { fermerBanniere(); window.removeEventListener('vq-installable', majInst); });
  // Quand on revient sur l'accueil gardé en mémoire : décompte et bannière (« Tu as prié aujourd'hui ») remis à jour
  res.reafficher = () => {
    emplacementStats.replaceChildren(...[blocTemps()].filter(Boolean));
    monterBanniere();
  };
  return res;
}

const duree = m => (m >= 60 ? Math.floor(m / 60) + ' h ' + String(Math.round(m % 60)).padStart(2, '0') : m > 0 && m < 1 ? '< 1 min' : Math.round(m) + ' min');
const PAR_DEFAUT = ['priere', 'parole', 'adoration', 'coeurs'];

// « Mes temps avec Dieu » : ce que la personne a le plus vécu ces 7 derniers jours (rien n'est envoyé).
// Toujours affiché : sans activité, quatre cases à zéro et une invitation.
function blocTemps() {
  const b = bilan(7);
  const tous = Object.keys(ACTIVITES).map(k => ({ k, ...ACTIVITES[k], minutes: b[k] }));
  const total = tous.reduce((s, x) => s + x.minutes, 0);
  const choisis = tous.filter(x => x.minutes >= 1).sort((a, c) => c.minutes - a.minutes);
  for (const k of PAR_DEFAUT) if (choisis.length < 4 && !choisis.some(x => x.k === k)) choisis.push(tous.find(x => x.k === k));
  const note = total >= 1
    ? `Ces 7 derniers jours, ${duree(total)} au total. Ce décompte reste sur ton téléphone.`
    : 'Ton temps avec Dieu apparaîtra ici dès que tu auras prié, lu la Bible ou écouté une adoration. Ce décompte reste sur ton téléphone.';
  return h('section', { class: 'stats-bloc' },
    h('div', { class: 'titre-ligne' }, h('h2', { class: 'titre-section' }, 'Mes temps avec Dieu'), h('a', { class: 'voir-tout', href: '#/temps' }, 'Tout voir')),
    h('p', { class: 'note' }, note),
    h('div', { class: 'stats-perso' }, choisis.slice(0, 4).map(x => {
      const pc = total >= 1 ? Math.round((x.minutes / total) * 100) : 0;
      return h('div', { class: 'stat-perso' },
        h('span', { class: 'stat-perso__nom' }, `${x.icone} ${x.nom}`),
        h('b', {}, duree(x.minutes)),
        h('span', { class: 'stat-perso__part' }, h('i', { style: `width:${x.minutes >= 1 ? Math.max(4, pc) : 0}%` })),
        h('span', { class: 'stat-perso__pc' }, total >= 1 ? `${pc} % de ton temps` : 'Pas encore'));
    })));
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
