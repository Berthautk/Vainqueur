// Met en couleur le mot prononcé par la voix, dans le texte affiché à l'écran.
// Un texte lisible porte data-lu="<clé>" ; le lecteur annonce (clé, numéro du mot).
let actuel = null;
function decouper(el) {
  if (el.dataset.mots) return;
  const marcher = n => {
    for (const enfant of [...n.childNodes]) {
      if (enfant.nodeType === 3) {
        const parts = enfant.textContent.split(/(\s+)/);
        if (parts.length < 2 && !parts[0]) continue;
        const frag = document.createDocumentFragment();
        for (const p of parts) {
          if (!p) continue;
          if (/^\s+$/.test(p)) frag.append(p); else { const s = document.createElement('span'); s.className = 'mot'; s.textContent = p; frag.append(s); }
        }
        enfant.replaceWith(frag);
      } else if (enfant.nodeType === 1 && !enfant.classList.contains('mot')) marcher(enfant);
    }
  };
  marcher(el); el.dataset.mots = '1';
}
export function effacer() { if (actuel) actuel.classList.remove('lu'); actuel = null; document.querySelectorAll('[data-lu].en-lecture').forEach(e => e.classList.remove('en-lecture')); }
export function marquer(cleLu, k) {
  if (!cleLu) { effacer(); return; }
  const el = document.querySelector(`[data-lu="${CSS.escape(cleLu)}"]`);
  if (!el) { effacer(); return; }
  const replie = el.closest('.replie');
  if (replie) { replie.classList.remove('replie'); const b = replie.parentElement && replie.parentElement.querySelector('.lire-suite'); if (b) b.textContent = 'Réduire ‹'; }
  decouper(el);
  const mots = el.querySelectorAll('.mot');
  const m = mots[Math.min(k, mots.length - 1)];
  if (actuel && actuel !== m) actuel.classList.remove('lu');
  document.querySelectorAll('[data-lu].en-lecture').forEach(e => { if (e !== el) e.classList.remove('en-lecture'); });
  el.classList.add('en-lecture');
  if (m) {
    m.classList.add('lu'); actuel = m;
    const r = m.getBoundingClientRect();
    if (r.top < 90 || r.bottom > innerHeight - 170) m.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}
