import { h, img, ico, contenu, ouvrirWhatsApp, tts, gras, toast, feuille } from '../util.js';
import * as player from '../player.js';
import { retour, enveloppe, ex, vide } from './commun.js';

export function texteTheme(t) {
  return [t.titre, ...t.sections.map(s => [s.titre, s.texte || '', ...(s.liste || [])].join('. ').replace(/\*\*/g, ''))].join('. ');
}
// MP3 si fourni, sinon synthèse vocale du téléphone
export function ecouterTheme(t, fin) {
  if (t.audio) { player.jouer({ id: 'cb-' + t.id, titre: t.titre, audio: t.audio, image: t.image, type: 'article' }); return true; }
  if (tts.actif) { tts.stop(); fin && fin(); return false; }
  return tts.parler(texteTheme(t), fin);
}

function prier(t) {
  if (!t.priere) { location.hash = '#/priere'; return; }
  const f = feuille(h('div', {}, h('h2', {}, 'Prier pour ce sujet'),
    h('p', {}, 'Lis cette prière lentement, à voix haute si tu peux :'),
    h('blockquote', { class: 'priere-salut' }, t.priere),
    h('button', { class: 'btn btn-or', onclick: () => { f(); toast('Amen 🙏 — Dieu t\'entend'); } }, ico('coche'), 'Amen'),
    h('button', { class: 'btn btn-vert', onclick: () => { f(); ouvrirWhatsApp('sujet', t.titre); } }, ico('chat'), 'Demander qu\'on prie avec moi'),
    h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
}

export default async function (id) {
  const d = await contenu('coeurs_brises');
  const t = d.themes.find(x => x.id === id);
  if (!t) return enveloppe(vide('Article introuvable', 'Ce thème n\'existe pas.'));
  const btn = h('button', { class: 'btn btn-or' }, ico('casque'), h('span', {}, 'Écouter l\'article'));
  const label = btn.children[1];
  btn.onclick = () => {
    const ok = ecouterTheme(t, () => { label.textContent = 'Écouter l\'article'; });
    label.textContent = ok && !t.audio ? 'Arrêter la lecture' : 'Écouter l\'article';
  };
  const corps = h('div', { class: 'article' }, t.sections.map(s => [
    h('h2', {}, h('span', {}, s.icone || ''), s.titre),
    s.texte ? h('p', {}, s.texte) : null,
    s.liste ? h('ul', { class: s.puces ? 'puces' : '', html: s.liste.map(l => `<li>${gras(l)}</li>`).join('') }) : null]));
  const noeud = h('div', {},
    h('section', { class: 'hero', style: 'min-height:230px' }, img(t.image, '', 'hero-img', false),
      h('div', { class: 'hero-ligne' }, retour('#/coeurs'), h('span', { style: 'font-size:34px' }, '❤️'),
        h('h1', { style: 'font-size:20px;max-width:55%' }, 'Médecin des ', h('em', {}, 'cœurs brisés')))),
    h('div', { class: 'art-titre' }, h('h1', {}, t.titre, ex(t))),
    h('div', { class: 'art-barre' }, h('span', { class: 'art-temps', 'aria-label': `${t.duree} minutes de lecture`, title: 'Temps de lecture' }, ico('horloge', ''), `${t.duree} min`), btn),
    corps,
    h('div', { class: 'art-actions' },
      h('button', { class: 'btn btn-vert', onclick: () => ouvrirWhatsApp('conseil', ` (sujet : ${t.titre})`) }, ico('chat'), 'Demander conseil'),
      h('button', { class: 'btn btn-or', onclick: () => prier(t) }, ico('mains'), 'Prier pour ce sujet')));
  noeud.querySelectorAll('.art-temps svg').forEach(s => { s.style.width = '20px'; s.style.height = '20px'; });
  return enveloppe(noeud, () => tts.stop());
}
