import { riche } from '../bible-refs.js';
import { h, img, ico, toast, aujourdhui, bravo } from '../util.js';
import { livre } from '../bible-refs.js';
import { chapitre } from '../bible-data.js';
import { pisteChapitre } from '../pistes.js';
import * as P from '../plans.js';
import { retour, enveloppe, vide, boutonEcoute } from './commun.js';

const fmt = s => new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtCourt = s => new Date(s + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const tete = (titre, sous, secours) => h('section', { class: 'hero hero-bible' },
  h('div', { class: 'hero-ligne' }, retour(secours), ico('calendrier'), h('h1', {}, titre)), sous ? h('p', { class: 'hero-sous' }, sous) : null);
export const lienJour = j => `#/bible/${j.chapitres[0].id}/${j.chapitres[0].c}?plan=${encodeURIComponent(j.cle)}`;

// Choisir un plan
export default async function () {
  const liste = await P.plans(); const a = P.actif();
  return enveloppe(h('div', {}, tete('Plans de lecture', 'Toute la Bible en un an, à ton rythme : environ 15 minutes par jour.', '#/bible'),
    h('div', { class: 'liste', style: 'margin-top:12px' }, liste.map(p => {
      const enCours = a && a.id === p.id;
      return h('article', { class: 'carte-plan' + (enCours ? ' en-cours' : '') }, img(p.image, '', 'carte-plan-img'),
        h('div', { class: 'carte-plan-txt' }, h('h3', {}, p.titre), h('p', {}, p.sous),
          p.type === 'mensuel' ? h('ul', { class: 'mois-apercu' }, p.mois.map(m => h('li', {}, h('b', {}, m.mois), ' · ', m.titre))) : null,
          enCours ? h('a', { class: 'btn btn-vert btn-petit', href: '#/bible/plan' }, ico('coche'), 'Mon plan en cours')
            : h('button', { class: 'btn btn-or btn-petit', onclick: () => { if (a && !confirm('Remplacer ton plan actuel ? Ta progression reste gardée.')) return; P.choisir(p.id); toast('Plan choisi : bonne lecture !'); location.hash = '#/bible/plan'; } }, ico('play'), a ? 'Choisir ce plan' : 'Commencer')));
    }))));
}

// Mon plan : lecture du jour, retard, calendrier
export async function planPage() {
  const a = P.actif();
  if (!a) { location.replace('#/bible/plans'); return enveloppe(h('div')); }
  const plan = (await P.plans()).find(p => p.id === a.id);
  if (!plan) { P.arreter(); location.replace('#/bible/plans'); return enveloppe(h('div')); }
  const liste = P.journees(plan, a.debut);
  const i = P.indexDuJour(plan, liste);
  const zone = h('div');
  const carteJour = (j, titre) => {
    const file = j.chapitres.map(x => pisteChapitre(livre(x.id), x.c, chapitre));
    const lu = P.estLu(j.cle);
    const btnLu = h('button', { class: 'btn ' + (lu ? 'btn-vert' : 'btn-clair') + ' btn-petit', 'aria-pressed': String(lu), onclick: () => { P.marquer(j.cle, !P.estLu(j.cle)); dessiner(); if (!lu) toast(bravo() + ' Lecture enregistrée 🙏'); } }, ico('coche'), lu ? 'Lu' : 'J\'ai lu');
    const m = plan.type === 'mensuel' ? plan.mois[j.mois] : null;
    return h('section', { class: 'jour-plan' + (lu ? ' lu' : '') },
      h('div', { class: 'jour-plan-tete' }, h('span', { class: 'etiquette' }, titre), h('small', {}, plan.type === 'mensuel' ? `${fmt(j.date)} · thème du mois` : `Jour ${j.n} sur ${liste.length} · ${fmt(j.date)}`)),
      m ? h('div', { class: 'theme-mois' }, h('b', {}, `${m.mois} : ${m.titre}`), h('p', {}, m.texte), h('blockquote', { html: `« ${m.verset.texte} » — ${riche(m.verset.ref)}` })) : null,
      h('a', { class: 'lecture-jour', href: lienJour(j) }, ico('livre'), h('span', {}, P.libelle(j.chapitres))),
      h('div', { class: 'parole-btns' }, h('a', { class: 'btn btn-or btn-petit', href: lienJour(j) }, ico('livre'), 'Lire'),
        boutonEcoute(file[0], file, { cls: 'btn btn-bleu btn-petit', off: 'Écouter', on: 'Pause' }), btnLu));
  };
  function dessiner() {
    const pr = P.progression(plan, liste, a.debut);
    const blocs = [];
    blocs.push(h('div', { class: 'progres-plan' }, h('div', {}, h('b', {}, `${pr.fait} jour${pr.fait > 1 ? 's' : ''} lu${pr.fait > 1 ? 's' : ''}`), ` sur ${pr.total}`),
      h('div', { class: 'progres' }, h('i', { style: `width:${(pr.fait / pr.total) * 100}%` }))));
    if (i === -1) blocs.push(vide('Plan terminé 🎉', 'Tu as parcouru toute la période de ce plan. Choisis un nouveau plan pour continuer.'));
    else blocs.push(carteJour(liste[i], 'Aujourd\'hui'));
    if (pr.enRetard.length) blocs.push(h('details', { class: 'retard' }, h('summary', {}, `${pr.enRetard.length} lecture${pr.enRetard.length > 1 ? 's' : ''} à rattraper`),
      ...pr.enRetard.slice(-14).reverse().map(j => ligneJour(j))));
    // Calendrier par mois
    const mois = new Map();
    for (const j of liste) { const k = j.date.slice(0, 7); if (!mois.has(k)) mois.set(k, []); mois.get(k).push(j); }
    const moisCourant = (liste[Math.max(0, i)] || liste[0]).date.slice(0, 7);
    blocs.push(h('h2', { class: 'groupe' }, 'Tout le plan'));
    for (const [k, js] of mois) {
      const nom = new Date(k + '-01T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const faits = js.filter(j => P.estLu(j.cle)).length;
      const th = plan.type === 'mensuel' ? plan.mois[js[0].mois].titre : null;
      blocs.push(h('details', { class: 'mois-plan', open: k === moisCourant }, h('summary', {}, h('span', {}, nom, th ? h('small', {}, th) : null), h('em', {}, `${faits}/${js.length}`)), ...js.map(j => ligneJour(j))));
    }
    blocs.push(h('div', { style: 'display:flex;gap:8px;justify-content:center;margin:16px' },
      h('a', { class: 'btn btn-clair btn-petit', href: '#/bible/plans' }, 'Changer de plan'),
      h('button', { class: 'btn btn-clair btn-petit', onclick: () => { if (confirm('Arrêter ce plan de lecture ?')) { P.arreter(); location.hash = '#/bible'; } } }, 'Arrêter le plan')));
    zone.replaceChildren(...blocs);
  }
  function ligneJour(j) {
    const lu = P.estLu(j.cle);
    const c = h('button', { class: 'case' + (lu ? ' coche' : ''), role: 'checkbox', 'aria-checked': String(lu), 'aria-label': `Jour ${j.n} lu`, onclick: e => { e.stopPropagation(); P.marquer(j.cle, !lu); dessiner(); } }, ico('coche'));
    return h('div', { class: 'ligne-jour' + (j.date === aujourdhui() ? ' auj' : '') }, c,
      h('a', { href: lienJour(j) }, h('small', {}, plan.type === 'mensuel' ? fmtCourt(j.date) : `Jour ${j.n} · ${fmtCourt(j.date)}`), h('span', {}, P.libelle(j.chapitres))));
  }
  dessiner();
  return enveloppe(h('div', {}, tete(plan.titre, plan.sous, '#/bible'), zone));
}
