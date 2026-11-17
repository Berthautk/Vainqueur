import { h, img, ico, getConfig, ouvrirWhatsApp, ouvrirLien, feuille } from '../util.js';
import { hero, enveloppe } from './commun.js';

export default async function () {
  const c = await getConfig();
  const r = c.reseaux || {};
  const lien = (href, bg, txt, nom) => h('button', { style: `background:${bg}`, 'aria-label': nom, onclick: e => { e.stopPropagation(); ouvrirLien(href); } }, txt);
  const item = (image, titre, sous, action, extra) => {
    const l = h('div', { class: 'ligne ligne-plus', role: 'button', tabindex: 0 },
      img(image, '', 'ligne-img'),
      h('div', { class: 'ligne-txt' }, h('h3', {}, titre), sous ? h('p', {}, sous) : null, extra),
      h('span', { class: 'fleche' }, ico('suivant')));
    l.onclick = action; l.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); } };
    return l;
  };
  const don = () => {
    const f = feuille(h('div', {}, h('h2', {}, 'Soutenir l\'œuvre'), h('p', {}, c.dons.texte),
      h('ul', {}, c.dons.moyens.map(m => h('li', {}, m))),
      h('button', { class: 'btn btn-vert', onclick: () => { f(); ouvrirWhatsApp('don'); } }, ico('chat'), 'Écrire sur WhatsApp'),
      h('button', { class: 'btn btn-clair', onclick: () => f() }, 'Fermer')));
  };
  const noeud = h('div', {},
    hero({ retour: '#/', titre: 'Plus', image: 'p1_04', cls: '' }),
    h('div', { class: 'liste', style: 'margin-top:12px' },
      item('i8_06', 'Rejoindre le groupe de prière (Telegram)', 'Unis pour prier, s\'encourager et grandir.', () => ouvrirLien(c.telegram)),
      item('p4_02', 'Demander un sujet de prière', 'Confie-nous ton besoin, nous prierons pour toi.', () => ouvrirWhatsApp('sujet')),
      item('q1_11', 'Demander un appel personnel', 'Échange confidentiel et accompagnement spirituel.', () => ouvrirWhatsApp('appel')),
      item('p2_08', 'Consultation et accompagnement', 'Psychologue, médecin : écoute, conseil et suivi.', () => ouvrirWhatsApp('consultation')),
      item('q1_08', 'Inviter l\'homme de Dieu', 'Pour une réunion, une croisade ou un séminaire.', () => ouvrirWhatsApp('inviter')),
      item('p3_06', 'Soutenir l\'œuvre (faire un don)', 'Participe à l\'avancement de cette mission.', don),
      ...(window.vqInstall ? [item('icons/icon-192.png', 'Installer l\'application', 'Sur ton écran d\'accueil, même sans internet.', async () => { const e = window.vqInstall; e.prompt(); try { await e.userChoice; } catch { /* ignoré */ } window.vqInstall = null; })] : []),
      item('i8_08', 'Acheter les livres', 'Découvrez nos livres de vie, de foi et de croissance.', () => (c.livres_lien ? ouvrirLien(c.livres_lien) : ouvrirWhatsApp('livres'))),
      item('i8_12', 'Suivre sur les réseaux', '', () => {}, h('div', { class: 'reseaux' },
        lien(r.youtube, '#E62117', '▶', 'YouTube'), lien(r.tiktok, '#111', '♪', 'TikTok'), lien(r.facebook, '#1877F2', 'f', 'Facebook'),
        lien(r.instagram, 'linear-gradient(45deg,#F9A03F,#DD2A7B,#8134AF)', '◎', 'Instagram'), lien(r.whatsapp, '#25D366', '✆', 'WhatsApp'))),
      item('i8_09', 'Mes téléchargements hors connexion', 'Retrouvez vos audios et documents sans internet.', () => { location.hash = '#/telechargements'; }),
      item('assets/logo/blason_web.webp', 'À propos', 'LAJC — Les Amoureux de Jésus-Christ', () => { location.hash = '#/apropos'; })));
  return enveloppe(noeud);
}
