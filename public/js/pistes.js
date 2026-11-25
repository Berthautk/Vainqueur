// Transforme le contenu de chaque rubrique en « pistes » pour le lecteur global.
// Sans MP3, la piste lit ses segments avec la voix du téléphone ; « lu » relie chaque segment
// au texte affiché (attribut data-lu) pour colorer le mot prononcé.
import { sansGras } from './bible-refs.js';
import { contenu } from './util.js';
const periodeDuMoment = () => (new Date().getHours() >= 17 ? 'soir' : 'matin');
export const paras = t => String(t || '').split('\n\n').filter(Boolean);

// Fiche du recueil : le texte complet n'est chargé qu'au moment de l'écoute.
// « lu » : e<i> = élément i de l'enseignement, s<i> = élément i de la séance (matin ou soir).
export function pisteFiche(m, periode = periodeDuMoment()) {
  const id = `f-${m.id}-${periode}`;
  return {
    id, titre: m.titre, audio: '', image: m.image, type: 'fiche', lien: `#/priere/${m.id}`,
    segments: async () => segmentsFiche(await contenu(`prieres/${m.id}`), periode, id)
  };
}
export function segmentsFiche(f, periode, id) {
  const sess = f[periode] || [];
  const n = sess.filter(x => x.type === 'sujet').length;
  const dire = (it, cle) => (it.type === 'sujet' && it.numero != null ? [{ t: `${it.numero}.` }, { t: it.texte, lu: cle }] : [{ t: it.texte, lu: cle }]);
  return [
    { t: `${f.titre}. Séance du ${periode}.` },
    { t: 'Enseignement.' },
    ...f.enseignement.flatMap((it, i) => dire(it, `${id}:e${i}`)),
    { t: n > 1 ? `Tes ${n} sujets de prière.` : 'Ton sujet de prière.' },
    ...sess.flatMap((it, i) => dire(it, `${id}:s${i}`)),
    { t: 'Amen.' }
  ];
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
