// Image de partage « Parole du jour » : fond + verset écrit dessus, prête pour WhatsApp, statut, etc.
import { toast } from './util.js';

const L = 1080, H = 1350;
const charger = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });

function lignes(ctx, texte, largeur) {
  const mots = texte.split(/\s+/); const out = []; let l = '';
  for (const m of mots) { const t = l ? l + ' ' + m : m; if (ctx.measureText(t).width > largeur && l) { out.push(l); l = m; } else l = t; }
  if (l) out.push(l);
  return out;
}

export async function imageParole({ texte, ref }) {
  try { await Promise.all(['700 64px "Playfair Display"', 'italic 600 40px "Playfair Display"', '600 40px Poppins'].map(f => document.fonts.load(f))); } catch { /* polices de secours */ }
  const [fond, blason] = await Promise.all([charger('assets/fonds/fond_parole.webp'), charger('assets/logo/blason_web.webp')]);
  const c = document.createElement('canvas'); c.width = L; c.height = H;
  const x = c.getContext('2d');

  // Fond (cadré sur le ciel et la Bible)
  const ech = Math.max(L / fond.width, H / fond.height);
  const fw = fond.width * ech, fh = fond.height * ech;
  x.drawImage(fond, (L - fw) / 2, (H - fh) / 2, fw, fh);
  // Voile bleu nuit pour la lisibilité
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(15,31,92,.88)'); g.addColorStop(.62, 'rgba(15,31,92,.7)'); g.addColorStop(.86, 'rgba(15,31,92,.12)'); g.addColorStop(1, 'rgba(15,31,92,.5)');
  x.fillStyle = g; x.fillRect(0, 0, L, H);

  // En-tête : blason + nom du groupe
  x.drawImage(blason, 70, 60, 120, 120);
  x.fillStyle = '#fff'; x.font = '700 38px Poppins'; x.textBaseline = 'middle';
  x.fillText('LES VAINQUEURS', 210, 100); x.fillText('DE DIEU', 210, 145);
  x.fillStyle = '#F0C54A'; x.font = '800 58px "Playfair Display"'; x.textAlign = 'right';
  x.fillText('Vainqueur', L - 70, 122); x.textAlign = 'left';

  // Étiquette « Parole du jour »
  x.font = '600 36px Poppins';
  const et = 'Parole du jour', ew = x.measureText(et).width + 70, ex = (L - ew) / 2, ey = 260;
  const or = x.createLinearGradient(0, ey, 0, ey + 66); or.addColorStop(0, '#F0C54A'); or.addColorStop(1, '#A87908');
  x.fillStyle = or; x.beginPath(); x.roundRect(ex, ey, ew, 66, 33); x.fill();
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(et, L / 2, ey + 34);

  // Verset (taille adaptée à la longueur)
  let taille = 76, ls;
  do { x.font = `700 ${taille}px "Playfair Display"`; ls = lignes(x, `« ${texte} »`, L - 160); taille -= 4; } while (ls.length * taille * 1.3 > 430 && taille > 40);
  taille += 4;
  const hl = taille * 1.28; let y = 370 + (430 - ls.length * hl) / 2 + hl / 2;
  x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 18; x.fillStyle = '#fff';
  for (const l of ls) { x.fillText(l, L / 2, y); y += hl; }
  x.shadowBlur = 0;
  // Référence
  x.font = 'italic 700 46px "Playfair Display"'; x.fillStyle = '#F0C54A';
  x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 14;
  x.fillText(ref, L / 2, y + 30); x.shadowBlur = 0;
  // Trait doré
  x.strokeStyle = '#D4A017'; x.lineWidth = 4; x.beginPath(); x.moveTo(L / 2 - 120, y + 85); x.lineTo(L / 2 + 120, y + 85); x.stroke();

  // Pied : adresse de l'application
  x.fillStyle = 'rgba(15,31,92,.85)'; x.fillRect(0, H - 96, L, 96);
  x.fillStyle = '#fff'; x.font = '500 32px Poppins';
  x.fillText(`Télécharge l'application Vainqueur · ${location.host}`, L / 2, H - 48);

  return new Promise(ok => c.toBlob(b => ok(b), 'image/jpeg', 0.88));
}

// Partage l'image (WhatsApp, statut…) ; sinon l'enregistre sur le téléphone.
export async function partagerImage(blob, texte, nom = 'parole-du-jour.jpg') {
  const f = new File([blob], nom, { type: 'image/jpeg' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: texte }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Image enregistrée dans tes téléchargements');
}
