// Transforme le contenu de chaque rubrique en « pistes » pour le lecteur global.
// Sans MP3, la piste lit ses segments avec la voix du téléphone ; « lu » relie chaque segment
// au texte affiché (attribut data-lu) pour colorer le mot prononcé.
import { sansGras } from './bible-refs.js';
const periodeDuMoment = () => (new Date().getHours() >= 17 ? 'soir' : 'matin');
const NOMBRES = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix'];
export const paras = t => String(t || '').split('\n\n').filter(Boolean);

export function pisteFiche(f, periode = periodeDuMoment()) {
  const b = f[periode] || f.matin; const id = `f-${f.id}-${periode}`;
  return {
    id, titre: f.titre, audio: (f.audios && f.audios[periode]) || f.audio || '', image: f.image, type: 'fiche', lien: `#/priere/${f.id}`,
    segments: [
      { t: `${f.titre}. Enseignement du ${periode}.` },
      ...paras(b.enseignement).map((p, i) => ({ t: p, lu: `${id}:e${i}` })),
      { t: 'Tes cinq sujets de prière.' },
      ...b.sujets.flatMap((s, i) => [{ t: `${NOMBRES[i] || i + 1}.` }, { t: s, lu: `${id}:s${i}` }]),
      { t: 'Amen.' }
    ]
  };
}
export const pistesFiches = (d, periode) => d.fiches.map(f => pisteFiche(f, periode));

export const pisteAdoration = a => ({ id: a.id, titre: a.titre, audio: a.audio || '', image: a.image, type: 'adoration', lien: `#/nayla/${a.id}`, duree: a.duree, video: a.video || '' });
export const pistesAdorations = d => d.adorations.filter(a => a.audio).map(pisteAdoration);

export function pisteTheme(t) {
  const id = `cb-${t.id}`;
  return {
    id, titre: t.titre, audio: t.audio || '', image: t.image, type: 'article', lien: `#/coeurs/${t.id}`,
    segments: [{ t: t.titre + '.', lu: `${id}:titre` }, ...t.sections.flatMap((s, i) => [
      { t: s.titre + '.', lu: `${id}:${i}t` },
      ...(s.texte ? [{ t: s.texte, lu: `${id}:${i}p` }] : []),
      ...(s.liste || []).map((l, k) => ({ t: sansGras(l), lu: `${id}:${i}l${k}` }))
    ])]
  };
}
export const pistesThemes = d => d.themes.map(pisteTheme);

export const pisteModule = m => ({ id: `aff-${m.id}`, titre: m.titre, audio: m.audio || '', image: m.image, type: 'enseignement', lien: '#/affaires',
  segments: [{ t: m.titre + '.' }, { t: m.enseignement, lu: `aff-${m.id}:e` }, { t: 'Sujet de prière.' }, { t: m.sujet, lu: `aff-${m.id}:s` }] });

export const pisteTemoignage = t => ({ id: `tem-${t.id}`, titre: `Témoignage — ${t.prenom}`, audio: t.audio || '', image: t.image, type: 'temoignage', lien: '#/temoignages',
  segments: [{ t: `Témoignage de ${t.prenom}, ${t.ville}.` }, { t: t.extrait, lu: `tem-${t.id}:x` }] });

export const pisteParole = pa => ({ id: 'parole-du-jour', titre: 'Parole du jour', audio: '', image: 'p1_12', type: 'parole', lien: '#/',
  segments: [{ t: 'Parole du jour.' }, { t: pa.texte, lu: 'parole:t' }, { t: pa.ref + '.' }] });

export const pisteMessage = m => ({ id: `msg-${m.id}`, titre: m.titre, audio: m.audio || '', image: m.image || 'p1_12', type: 'message', lien: '#/',
  segments: [{ t: m.titre + '.' }, { t: m.texte, lu: `msg-${m.id}:t` }] });

export const pisteEmission = e => ({ id: `radio-${e.id}`, titre: e.titre, audio: e.audio || '', image: e.image, type: 'radio', lien: '#/radio',
  segments: [{ t: `${e.titre}.` }, ...paras(e.texte).map((p, i) => ({ t: p, lu: `radio-${e.id}:${i}` }))] });

// Bible : un chapitre = une piste ; le texte est chargé au moment de la lecture
export function pisteChapitre(livre, c, charger) {
  const id = `b-${livre.id}-${c}`;
  return {
    id, titre: `${livre.id === 'psaumes' ? 'Psaume' : livre.nom} ${c}`, audio: '', image: 'p1_12', type: 'bible', lien: `#/bible/${livre.id}/${c}`,
    segments: async () => { const vs = await charger(livre.id, c); return [{ t: livre.id === 'psaumes' ? `Psaume ${c}.` : `${livre.nom}, chapitre ${c}.` }, ...vs.map((v, i) => ({ t: v, lu: `${id}:${i + 1}` }))]; }
  };
}
