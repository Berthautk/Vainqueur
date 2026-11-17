// Transforme le contenu de chaque rubrique en « pistes » pour le lecteur global.
// Sans MP3, la piste lit son texte avec la voix du téléphone.
const periodeDuMoment = () => (new Date().getHours() >= 17 ? 'soir' : 'matin');
const NOMBRES = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept'];

export function pisteFiche(f, periode = periodeDuMoment()) {
  const b = f[periode] || f.matin;
  const sujets = b.sujets.map((s, i) => `${NOMBRES[i] || i + 1}. ${s}`).join(' ');
  return {
    id: `f-${f.id}-${periode}`, titre: f.titre, audio: f.audio || '', image: f.image, type: 'fiche', lien: `#/priere/${f.id}`,
    texte: `${f.titre}. Enseignement du ${periode}. ${b.enseignement} Tes cinq sujets de prière. ${sujets} Amen.`
  };
}
export const pistesFiches = (d, periode) => d.fiches.map(f => pisteFiche(f, periode));

export const pisteAdoration = a => ({ id: a.id, titre: a.titre, audio: a.audio || '', image: a.image, type: 'adoration', lien: `#/nayla/${a.id}`, duree: a.duree, video: a.video || '' });
export const pistesAdorations = d => d.adorations.filter(a => a.audio).map(pisteAdoration);

export function texteTheme(t) {
  return [t.titre, ...t.sections.map(s => [s.titre, s.texte || '', ...(s.liste || [])].join('. '))].join('. ').replace(/\*\*/g, '');
}
export const pisteTheme = t => ({ id: `cb-${t.id}`, titre: t.titre, audio: t.audio || '', texte: texteTheme(t), image: t.image, type: 'article', lien: `#/coeurs/${t.id}` });
export const pistesThemes = d => d.themes.map(pisteTheme);

export const pisteModule = m => ({ id: `aff-${m.id}`, titre: m.titre, audio: m.audio || '', image: m.image, type: 'enseignement', lien: '#/affaires',
  texte: `${m.titre}. ${m.enseignement} Sujet de prière : ${m.sujet}` });

export const pisteTemoignage = t => ({ id: `tem-${t.id}`, titre: `Témoignage — ${t.prenom}`, audio: t.audio || '', image: t.image, type: 'temoignage', lien: '#/temoignages',
  texte: `Témoignage de ${t.prenom}, ${t.ville}. ${t.extrait.replace(/…$/, '.')}` });

export const pisteParole = pa => ({ id: 'parole-du-jour', titre: 'Parole du jour', audio: '', image: 'p1_12', type: 'parole', lien: '#/',
  texte: `Parole du jour. ${pa.texte} ${pa.ref.replace(/(\d+):(\d+)/, '$1, verset $2')}.` });
