// Bannières qui défilent toutes seules, en boucle sans fin (reprise du brief « Ajouts »).
// Après la dernière, la première revient par la droite : jamais de rembobinage.
// Un double de la dernière est placé avant la première, et un double de la première après la dernière ;
// quand le défilement s'arrête sur un double, on saute sans animation sur l'original.
//
// diapos : [{ lien, image, etiquette, titre, texte, bas?, surClic? }]
//   surClic : fonction appelée au toucher (à la place du lien), ex. pour faire défiler jusqu'à un bloc de la page.
// Renvoie une fonction à appeler quand on quitte l'écran (arrête le minuteur).
export function carrousel(racine, diapos, delai = 6000) {
  const piste = racine.querySelector('.carrousel__piste');
  const zonePoints = racine.querySelector('.carrousel__points');
  const n = diapos.length;
  if (!n) { racine.hidden = true; return () => {}; }
  const boucle = n > 1, depart = boucle ? 1 : 0;
  const ordre = boucle ? [n - 1, ...diapos.map((_, k) => k), 0] : [0];

  // Construction : chaque case contient un lien .diapo (les doubles sont cachés aux lecteurs d'écran)
  piste.replaceChildren(...ordre.map((k, rang) => {
    const d = diapos[k];
    const caisse = document.createElement('div');
    caisse.className = 'carrousel__case';
    caisse.setAttribute('role', 'group');
    caisse.setAttribute('aria-roledescription', 'diapositive');
    caisse.setAttribute('aria-label', (k + 1) + ' sur ' + n);
    if (boucle && (rang === 0 || rang === ordre.length - 1)) caisse.setAttribute('aria-hidden', 'true');
    const a = document.createElement('a');
    a.className = 'diapo';
    a.href = d.lien || '#/';
    if (d.surClic) a.addEventListener('click', e => { e.preventDefault(); d.surClic(); });
    const img = document.createElement('img');
    img.src = d.image; img.alt = ''; img.decoding = 'async';
    if (rang !== depart) img.loading = 'lazy';
    if (d.bas) img.style.objectPosition = 'center ' + d.bas;
    const txt = document.createElement('span');
    txt.className = 'diapo__texte';
    if (d.etiquette) { const e = document.createElement('span'); e.className = 'diapo__etiquette'; e.textContent = d.etiquette; txt.append(e); }
    const t = document.createElement('b'); t.textContent = d.titre; txt.append(t);
    if (d.texte) { const s = document.createElement('span'); s.textContent = d.texte; txt.append(s); }
    a.append(img, txt);
    caisse.append(a);
    // Petits boutons facultatifs posés sur la bannière (ex. « ✕ Plus tard »), hors du lien, sur les vraies cartes seulement
    if (d.actions && d.actions.length && (!boucle || (rang >= 1 && rang <= n))) {
      const zone = document.createElement('div'); zone.className = 'diapo__actions';
      for (const ac of d.actions) { const bt = document.createElement('button'); bt.type = 'button'; bt.textContent = ac.label; bt.setAttribute('aria-label', ac.aria || ac.label); bt.addEventListener('click', ac.onClick); zone.append(bt); }
      caisse.append(zone);
    }
    return caisse;
  }));

  const pas = () => Math.max(1, piste.clientWidth);
  const place = () => Math.round(piste.scrollLeft / pas());
  const marquer = i => points.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));

  // Pause de 15 s dès qu'on touche.
  let repos = 0;
  const attendre = () => { repos = Date.now() + 15000; };

  // Points
  const points = diapos.map((_, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Aller à la bannière ' + (k + 1));
    b.addEventListener('click', () => { attendre(); piste.scrollTo({ left: (k + depart) * pas(), behavior: 'smooth' }); });
    return b;
  });
  if (boucle) zonePoints.replaceChildren(...points); else zonePoints.hidden = true;

  // Position de départ : la vraie première, pas son double.
  const poser = () => { piste.scrollLeft = depart * pas(); };
  requestAnimationFrame(poser);
  addEventListener('resize', poser);

  // Si on se retrouve sur un double (ex. l'écran vient d'être remis en place), on saute sur l'original, sans animation.
  const normaliser = () => {
    if (!boucle || !piste.clientWidth) return;
    const p = place();
    if (p === 0) piste.scrollTo({ left: n * pas(), behavior: 'auto' });
    else if (p === n + 1) piste.scrollTo({ left: pas(), behavior: 'auto' });
    marquer(boucle ? ((place() - 1) % n + n) % n : 0);
  };

  // Suivi du défilement + saut invisible sur les doubles.
  let attente = false, arret = null;
  const surDefilement = () => {
    if (!attente) {
      attente = true;
      requestAnimationFrame(() => { attente = false; marquer(boucle ? ((place() - 1) % n + n) % n : 0); });
    }
    if (!boucle) return;
    clearTimeout(arret);
    arret = setTimeout(normaliser, 170);   // on attend que tout soit arrêté avant de sauter
  };
  piste.addEventListener('scroll', surDefilement, { passive: true });
  marquer(0);

  piste.addEventListener('pointerdown', attendre);
  piste.addEventListener('touchstart', attendre, { passive: true });
  piste.addEventListener('wheel', attendre, { passive: true });

  // Ne tourne que si la bannière est à l'écran.
  let visible = true;
  let oeil = null;
  if (typeof IntersectionObserver !== 'undefined') {
    oeil = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { if (!piste.scrollLeft) poser(); normaliser(); } }, { threshold: 0.3 });
    oeil.observe(piste);
  }

  // Défilement automatique, toujours vers la droite.
  let minuteur = null;
  let moinsDAnimations = false;
  try { moinsDAnimations = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* sans matchMedia */ }
  if (boucle && !moinsDAnimations) {
    minuteur = setInterval(() => {
      if (document.hidden || !visible || Date.now() < repos) return;
      piste.scrollTo({ left: (place() + 1) * pas(), behavior: 'smooth' });
    }, delai);
  }

  return () => {
    clearInterval(minuteur); clearTimeout(arret);
    removeEventListener('resize', poser);
    piste.removeEventListener('scroll', surDefilement);
    if (oeil) oeil.disconnect();
  };
}
