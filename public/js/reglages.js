// Réglages de l'utilisateur (gardés sur le téléphone)
import { store } from './util.js';

export const COULEURS = {
  or: { nom: 'Jaune or', fond: '#F7D154', texte: '#1A1A2E' },
  rouge: { nom: 'Rouge', fond: '#E3241B', texte: '#FFFFFF' },
  vert: { nom: 'Vert', fond: '#22A33C', texte: '#FFFFFF' },
  bleu: { nom: 'Bleu', fond: '#1F3FAE', texte: '#FFFFFF' },
  rose: { nom: 'Rose', fond: '#E0559A', texte: '#FFFFFF' },
  aucune: { nom: 'Pas de couleur', fond: 'transparent', texte: 'inherit' }
};
export const VITESSES = { lente: { nom: 'Lente', v: 0.8 }, normale: { nom: 'Normale', v: 0.95 }, rapide: { nom: 'Rapide', v: 1.15 } };
export const TAILLES = { normale: { nom: 'Normal', e: 1 }, grande: { nom: 'Grand', e: 1.15 }, tres: { nom: 'Très grand', e: 1.32 } };
const DEFAUT = { couleur: 'or', vitesse: 'normale', taille: 'normale' };

export const lire = () => ({ ...DEFAUT, ...(store.get('reglages', {}) || {}) });
export function ecrire(k, v) { const r = lire(); r[k] = v; store.set('reglages', r); appliquer(); }
export const vitesse = () => (VITESSES[lire().vitesse] || VITESSES.normale).v;
export function appliquer() {
  const r = lire(); const c = COULEURS[r.couleur] || COULEURS.or; const s = document.documentElement.style;
  s.setProperty('--surligne-fond', c.fond); s.setProperty('--surligne-texte', c.texte);
  s.setProperty('--echelle', (TAILLES[r.taille] || TAILLES.normale).e);
}
