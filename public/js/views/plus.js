import { h, img, ico, contenu, getConfig, ouvrirWhatsApp, ouvrirLien, lienPret, feuille, toast } from '../util.js';
import { hero, enveloppe } from './commun.js';

// Réseaux sociaux (boutons ronds), réutilisés par la page Docteur Sophonie
export function boutonsReseaux(r) {
  const b = (url, bg, txt, nom) => h('button', { style: `background:${bg}`, 'aria-label': nom, onclick: e => { e.stopPropagation(); ouvrirLien(url); } }, txt);
  return h('div', { class: 'reseaux' },
    b(r.youtube, '#E62117', '▶', 'YouTube'), b(r.tiktok, '#111', '♪', 'TikTok'), b(r.facebook, '#1877F2', 'f', 'Facebook'),
    b(r.instagram, 'linear-gradient(45deg,#F9A03F,#DD2A7B,#8134AF)', '◎', 'Instagram'), b(r.whatsapp, '#25D366', '✆', 'WhatsApp'), b(r.telegram, '#229ED9', '➤', 'Telegram'));
}

export default async function () {
  const [c, p] = await Promise.all([getConfig(), contenu('plus')]);
  const don = () => {
    const f = feuille(h('div', {}, h('h2', {}, 'Soutenir l\'œuvre'), h('p', {}, c.dons.texte),
      h('ul', {}, c.dons.moyens.map(m => h('li', {}, m))),
      h('button', { class: 'btn btn-vert', onclick: () => { f(); ouvrirWhatsApp('don'); } }, ico('chat'), 'Écrire sur WhatsApp'),
      h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
  };
  const actions = {
    route: x => { location.hash = x.valeur; },
    whatsapp: x => ouvrirWhatsApp(x.valeur),
    lien: x => ouvrirLien(x.valeur),
    telegram: () => ouvrirLien(c.telegram),
    don,
    livres: () => (lienPret(c.livres_lien) ? ouvrirLien(c.livres_lien) : ouvrirWhatsApp('livres')),
    reseaux: () => {}
  };
  const item = x => {
    const extra = x.action === 'reseaux' ? boutonsReseaux(c.reseaux || {}) : x.rythme && c.telegram_rythme ? h('p', { class: 'rythme' }, '🕘 ', c.telegram_rythme) : null;
    const l = h('div', { class: 'ligne ligne-plus', role: 'button', tabindex: 0 },
      img(x.image, '', 'ligne-img'),
      h('div', { class: 'ligne-txt' }, h('h3', {}, x.titre), x.sous ? h('p', {}, x.sous) : null, extra),
      h('span', { class: 'fleche' }, ico('suivant')));
    const go = () => (actions[x.action] || (() => toast('Bientôt disponible')))(x);
    l.onclick = go; l.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    return l;
  };
  const installer = window.vqInstall ? [{ titre: 'Installer l\'application', sous: 'Sur ton écran d\'accueil, même sans internet.', image: 'icons/icon-192.png', action: 'installer' }] : [];
  actions.installer = async () => { const e = window.vqInstall; if (!e) return; e.prompt(); try { await e.userChoice; } catch { /* ignoré */ } window.vqInstall = null; };
  const groupe = (titre, liste) => [h('h2', { class: 'groupe' }, titre), h('div', { class: 'liste' }, liste.map(item))];
  return enveloppe(h('div', {}, hero({ retour: '#/', titre: 'Plus', image: 'p1_04' }),
    groupe('Rubriques', p.rubriques), groupe('Contacts et services', p.services), groupe('Mon application', [...installer, ...p.autres])));
}
