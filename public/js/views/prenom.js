// Demander son prénom à l'utilisateur (une seule fois) et le garder sur son téléphone.
import { h, ico, feuille, store, definirPrenom, nettoyerPrenom, prenom } from '../util.js';

// apres() : appelé quand un prénom vient d'être enregistré
export function demanderPrenom(apres) {
  store.set('prenom_demande', Date.now());
  const champ = h('input', {
    class: 'saisie saisie-prenom', type: 'text', placeholder: 'Ton prénom', value: prenom(), maxlength: 24, required: true,
    autocomplete: 'given-name', autocapitalize: 'words', enterkeyhint: 'done', spellcheck: 'false', 'aria-label': 'Ton prénom'
  });
  const erreur = h('p', { class: 'saisie-erreur', role: 'alert', hidden: true }, 'Écris au moins deux lettres.');
  const apercu = h('p', { class: 'saisie-apercu', 'aria-live': 'polite' });
  const maj = () => { const p = nettoyerPrenom(champ.value); apercu.textContent = p.length > 1 ? `Bonjour, ${p} !` : ''; erreur.hidden = true; };
  champ.addEventListener('input', maj);
  let ferme;
  const valider = e => {
    e.preventDefault();
    const p = definirPrenom(champ.value);
    if (!p) { erreur.hidden = false; champ.focus(); return; }
    ferme(); apres && apres(p);
  };
  ferme = feuille(h('form', { class: 'prenom-form', onsubmit: valider },
    h('img', { class: 'prenom-blason', src: 'assets/logo/blason_web.webp', alt: '', width: 64, height: 64 }),
    h('h2', {}, 'Bienvenue sur Vainqueur !'),
    h('p', { class: 'prenom-q' }, 'Comment t\'appelles-tu ?'),
    champ, erreur, apercu,
    h('p', { class: 'aide' }, 'Ton prénom reste sur ton téléphone. Il sert à te saluer et, si tu écris au ministère par WhatsApp, à te présenter. Tu peux le changer ou l\'effacer dans Plus › Réglages.'),
    h('button', { class: 'btn btn-or', type: 'submit' }, ico('coche'), 'Continuer'),
    h('button', { class: 'btn btn-clair', type: 'button', onclick: () => ferme() }, 'Plus tard')));
  setTimeout(() => champ.focus(), 350);
  maj();
}

// Au premier lancement (ou après une mise à jour), on propose une fois de donner son prénom
export function proposerPrenom() {
  if (prenom()) return;
  if (store.get('prenom_demande', 0)) return;                          // déjà proposé : la petite carte de l'accueil prend le relais
  if (['refus', 'efface'].includes(store.get('prenom_etat', ''))) return;
  const h0 = location.hash.replace(/^#\/?/, '');
  if (h0 !== '' || document.querySelector('#feuille:not([hidden])') || document.body.classList.contains('mode-intervention')) return;
  demanderPrenom(() => { window.dispatchEvent(new Event('vq-prenom')); });
}
