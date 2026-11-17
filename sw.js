/* Service worker Vainqueur — hors connexion d'abord.
   - Précache : application, polices, logos, contenus JSON, et toutes les images/audios cités dans les JSON.
   - Les audios téléchargés par l'utilisateur vivent dans le cache « vainqueur-audio » (jamais purgé ici).
   Changer VERSION pour forcer la mise à jour de l'application chez tous les utilisateurs. */
const VERSION = 'v1';
const APP = `vainqueur-app-${VERSION}`;
const AUDIO = 'vainqueur-audio';

const STATIQUE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/main.js', 'js/util.js', 'js/player.js', 'js/downloads.js',
  'js/views/commun.js', 'js/views/accueil.js', 'js/views/priere.js', 'js/views/fiche.js', 'js/views/nayla.js', 'js/views/lecteur.js',
  'js/views/coeurs.js', 'js/views/article.js', 'js/views/affaires.js', 'js/views/evangelisation.js', 'js/views/salut.js',
  'js/views/temoignages.js', 'js/views/plus.js', 'js/views/telechargements.js', 'js/views/apropos.js', 'js/views/nouveautes.js',
  'fonts/playfair-display-latin-600-normal.woff2', 'fonts/playfair-display-latin-700-normal.woff2', 'fonts/playfair-display-latin-800-normal.woff2',
  'fonts/playfair-display-latin-600-italic.woff2', 'fonts/playfair-display-latin-700-italic.woff2',
  'fonts/poppins-latin-400-normal.woff2', 'fonts/poppins-latin-500-normal.woff2', 'fonts/poppins-latin-600-normal.woff2', 'fonts/poppins-latin-700-normal.woff2',
  'assets/logo/blason_web.webp', 'assets/logo/banniere_web.webp', 'assets/fonds/fond_splash_web.webp',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'assets/illustrations/personnages/p1_12.webp'
];
const CONTENUS = ['config', 'accueil', 'fiches', 'nayla', 'coeurs_brises', 'affaires', 'evangelisation', 'temoignages', 'nouveautes'];

function imgChemin(id) {
  if (/^i\d/.test(id)) return `assets/illustrations/icones/${id}.webp`;
  if (/^(l7|p7)_/.test(id)) return `assets/illustrations/lieux/${id}.webp`;
  return `assets/illustrations/personnages/${id}.webp`;
}
function extraire(valeur, sortie) {
  if (typeof valeur === 'string') {
    if (/^[pqil]\d_\d\d$/.test(valeur)) sortie.add(imgChemin(valeur));
    else if (/^(audio|assets)\/[\w\-./]+\.(mp3|webp|png|jpg|m4a|ogg)$/i.test(valeur)) sortie.add(valeur);
  } else if (Array.isArray(valeur)) valeur.forEach(v => extraire(v, sortie));
  else if (valeur && typeof valeur === 'object') Object.values(valeur).forEach(v => extraire(v, sortie));
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
    await cache.addAll(essentiels);
    await Promise.all([...urls].filter(u => !essentiels.includes(u)).map(u => cache.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== APP && k !== AUDIO) await caches.delete(k);
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

  // Pages : réseau d'abord (contenu à jour), repli sur le cache. Autres fichiers : cache d'abord, rafraîchi en arrière-plan.
  const reseauD = req.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  e.respondWith((async () => {
    const cache = await caches.open(APP);
    const cle = req.mode === 'navigate' ? 'index.html' : req;
    if (reseauD) {
      try {
        const r = await fetch(req);
        if (r.ok) cache.put(cle, r.clone());
        return r;
      } catch {
        return (await cache.match(cle, { ignoreSearch: true })) || (await cache.match('./')) || Response.error();
      }
    }
    const trouve = await cache.match(req, { ignoreSearch: true });
    if (trouve) return trouve;
    try { const r = await fetch(req); if (r.ok) cache.put(req, r.clone()); return r; } catch { return Response.error(); }
  })());
});
