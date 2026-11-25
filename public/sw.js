/* Service worker Vainqueur — hors connexion d'abord.
   - Précache : application, polices, logos, contenus JSON, et toutes les images/audios cités dans les JSON.
   - Les audios téléchargés par l'utilisateur vivent dans le cache « vainqueur-audio » (jamais purgé ici).
   Changer VERSION pour forcer la mise à jour de l'application chez tous les utilisateurs. */
const VERSION = 'v16';
const APP = `vainqueur-app-${VERSION}`;
const AUDIO = 'vainqueur-audio';
const BIBLE = 'vainqueur-bible-lsg'; // texte de la Bible : gardé d'une version à l'autre

const STATIQUE = [
  './', 'manifest.webmanifest', 'css/app.css',
  'js/main.js', 'js/util.js', 'js/player.js', 'js/downloads.js', 'js/partage.js', 'js/pistes.js', 'js/bible-refs.js', 'js/bible-data.js', 'js/plans.js', 'js/marques.js', 'js/carrousel.js', 'js/temps.js', 'js/reglages.js', 'js/surlignage.js',
  'js/views/commun.js', 'js/views/accueil.js', 'js/views/priere.js', 'js/views/fiche.js', 'js/views/nayla.js', 'js/views/lecteur.js',
  'js/views/coeurs.js', 'js/views/article.js', 'js/views/affaires.js', 'js/views/evangelisation.js', 'js/views/salut.js',
  'js/views/temoignages.js', 'js/views/plus.js', 'js/views/telechargements.js', 'js/views/apropos.js', 'js/views/nouveautes.js', 'js/views/bible.js', 'js/views/plans.js', 'js/views/etudes.js', 'js/views/prenom.js', 'js/views/reglages.js', 'js/views/radio.js', 'js/views/sophonie.js', 'bible/livres.json',
  'fonts/playfair-display-latin-600-normal.woff2', 'fonts/playfair-display-latin-700-normal.woff2', 'fonts/playfair-display-latin-800-normal.woff2',
  'fonts/playfair-display-latin-600-italic.woff2', 'fonts/playfair-display-latin-700-italic.woff2',
  'fonts/poppins-latin-400-normal.woff2', 'fonts/poppins-latin-500-normal.woff2', 'fonts/poppins-latin-600-normal.woff2', 'fonts/poppins-latin-700-normal.woff2',
  'assets/logo/blason_web.webp', 'assets/logo/banniere_web.webp', 'assets/fonds/fond_splash_web.webp', 'assets/fonds/fond_parole.webp',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'assets/illustrations/personnages/p1_12.webp'
];
const CONTENUS = ['config', 'accueil', 'fiches', 'nayla', 'coeurs_brises', 'affaires', 'evangelisation', 'temoignages', 'nouveautes', 'radio', 'plus', 'plans'];

function imgChemin(id) {
  if (/^i\d/.test(id)) return `assets/illustrations/icones/${id}.webp`;
  if (/^(l7|p7)_/.test(id)) return `assets/illustrations/lieux/${id}.webp`;
  return `assets/illustrations/personnages/${id}.webp`;
}
function extraire(valeur, sortie) {
  if (typeof valeur === 'string') {
    if (/^[pqil]\d_\d\d$/.test(valeur)) sortie.add(imgChemin(valeur));
    else if (/^assets\/[\w\-./]+\.(webp|png|jpg)$/i.test(valeur)) sortie.add(valeur); // les audios ne sont gardés que sur « Télécharger »
  } else if (Array.isArray(valeur)) valeur.forEach(v => extraire(v, sortie));
  else if (valeur && typeof valeur === 'object') Object.values(valeur).forEach(v => extraire(v, sortie));
}

// Cloudflare Pages redirige /index.html vers / : une réponse « redirigée » ne peut pas servir une page,
// on en garde donc toujours une copie propre.
async function propre(r) {
  if (!r || !r.redirected) return r;
  return new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers });
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(APP);
    const urls = new Set(STATIQUE);
    for (const nom of CONTENUS) {
      try {
        const r = await fetch(`content/${nom}.json`, { cache: 'reload' });
        if (!r.ok) continue;
        await cache.put(`content/${nom}.json`, r.clone());
        extraire(await r.json(), urls);
      } catch { /* on continue */ }
    }
    // Images citées directement dans le code des écrans (ex. 'p1_12') : on les repère dans les fichiers JS
    for (const f of STATIQUE.filter(u => u.startsWith('js/views/'))) {
      try { const t = await (await cache.match(f) || await fetch(f)).text(); for (const m of t.matchAll(/['"]([pqil]\d_\d\d)['"]/g)) urls.add(imgChemin(m[1])); } catch { /* ignoré */ }
    }
    // Les fichiers essentiels sont obligatoires ; les images/audios sont enregistrés au mieux
    const essentiels = STATIQUE.filter(u => !u.startsWith('assets/'));
    await Promise.all(essentiels.map(async u => {
      const r = await fetch(u, { cache: 'reload' });
      if (!r.ok) throw new Error('précache ' + u);
      await cache.put(u, await propre(r));
    }));
    await Promise.all([...urls].filter(u => !essentiels.includes(u)).map(u => cache.add(u).catch(() => {})));
    // Mise à jour : si tous les écrans ouverts savent proposer « Mettre à jour » (message à cliquer), la nouvelle
    // version attend ce clic, pour ne jamais mélanger ancien et nouveau code. Sinon (anciennes versions de
    // l'application, ou personne), elle s'active tout de suite.
    if (!(await tousSavent())) self.skipWaiting();
  })());
});

// Demande à chaque écran ouvert s'il sait afficher la bannière de mise à jour (réponse « MAJ_OK »)
async function tousSavent() {
  try {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (!cs.length) return false;
    const ok = new Set();
    const ecoute = ev => { if (ev.data && ev.data.type === 'MAJ_OK' && ev.source) ok.add(ev.source.id); };
    self.addEventListener('message', ecoute);
    cs.forEach(c => c.postMessage({ type: 'MAJ_QUESTION' }));
    await new Promise(r => setTimeout(r, 900));
    self.removeEventListener('message', ecoute);
    return cs.every(c => ok.has(c.id));
  } catch { return false; }
}
// L'utilisateur a touché « Mettre à jour »
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== APP && k !== AUDIO && k !== BIBLE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Réponse « 206 » pour les requêtes Range (nécessaire à la lecture audio depuis le cache)
async function repondreRange(req, rep) {
  const buf = await rep.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  const debut = m && m[1] ? parseInt(m[1], 10) : 0;
  const fin = m && m[2] ? Math.min(parseInt(m[2], 10), buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(debut, fin + 1), {
    status: 206,
    headers: { 'Content-Type': rep.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${debut}-${fin}/${buf.byteLength}`, 'Content-Length': fin - debut + 1, 'Accept-Ranges': 'bytes' }
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // YouTube, WhatsApp, etc. : réseau direct

  // Bible : d'abord la copie gardée, sinon internet (et on la garde)
  if (url.pathname.includes('/bible/lsg/')) {
    e.respondWith((async () => {
      const c = await caches.open(BIBLE);
      const t = await c.match(url.href);
      if (t) return t;
      try { const r = await fetch(req); if (r.ok) c.put(url.href, await propre(r.clone())); return r; } catch { return Response.error(); }
    })());
    return;
  }
  const estAudio = req.destination === 'audio' || req.destination === 'video' || /\.(mp3|m4a|ogg)$/i.test(url.pathname);
  if (estAudio) {
    e.respondWith((async () => {
      const cle = new Request(url.href);
      let rep = await (await caches.open(AUDIO)).match(cle) || await (await caches.open(APP)).match(cle);
      if (!rep) { try { return await fetch(req); } catch { return Response.error(); } }
      return req.headers.has('range') ? repondreRange(req, rep) : rep;
    })());
    return;
  }

  // Rapidité : tout ce qui est déjà sur le téléphone est servi tout de suite, sans attendre le réseau.
  //  - code et mise en page (.html, .js, .css), polices, images : depuis le cache ; une nouvelle version
  //    arrive avec un nouveau service worker (changer VERSION en haut de ce fichier) ;
  //  - contenus (.json) : depuis le cache tout de suite, puis mis à jour en arrière-plan pour la prochaine fois.
  const estContenu = url.pathname.endsWith('.json');
  let ancien = null;
  const cle = req.mode === 'navigate' ? './' : req;
  const rafraichir = async () => {
    const cache = await caches.open(APP);
    const r = await fetch(req.mode === 'navigate' ? req : new Request(req.url, { cache: estContenu ? 'no-cache' : 'default', credentials: 'same-origin' }));
    if (r.ok) {
      const copie = await propre(r.clone());
      if (ancien && (await ancien.text()) !== (await copie.clone().text())) (await self.clients.matchAll()).forEach(c => c.postMessage({ type: 'contenu-maj', url: url.pathname }));
      await cache.put(cle, copie);
    }
    return r;
  };
  const reponse = (async () => {
    const trouve = await (await caches.open(APP)).match(cle, { ignoreSearch: true });
    if (trouve) { if (estContenu) ancien = trouve.clone(); return trouve; }
    try { return await rafraichir(); }
    catch { return (req.mode === 'navigate' && await (await caches.open(APP)).match('./')) || Response.error(); }
  })();
  e.respondWith(reponse);
  // Contenus : mis à jour en arrière-plan, pour la prochaine ouverture
  if (estContenu) e.waitUntil(reponse.then(() => (ancien ? rafraichir() : null)).catch(() => {}));
});
