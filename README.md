# VAINQUEUR — Les Vainqueurs de Dieu (LAJC)

Application web progressive (PWA) : prières guidées, adorations (Nayla), Médecin des cœurs brisés, affaires, évangélisation, témoignages.
HTML/CSS/JavaScript simples, sans compilation, 100 % gratuite, utilisable hors connexion.

## Organisation du dépôt
- `public/` : **l'application publiée** (seul dossier mis en ligne par Cloudflare Pages).
- `public/content/` : contenu modifiable sans code (lire `public/content/LISEZ_MOI.md`).
- `assets/` : fichiers graphiques d'origine (logos et fonds en haute définition), non publiés.
- `references/`, `PROMPT_CLAUDE_CODE.md` : maquettes et cahier des charges, non publiés.
- Maquettes de référence : `references/ecrans/`. Cahier des charges : `PROMPT_CLAUDE_CODE.md`.

## Publier sur GitHub Pages (depuis un téléphone)
1. Sur github.com (mode « Version pour ordinateur » du navigateur), ouvrir le dépôt → **Settings** → **Pages**.
2. « Build and deployment » → Source : **Deploy from a branch**.
3. GitHub Pages ne sait publier que la racine ou `/docs` : préférer Cloudflare Pages (ci-dessous), qui publie `public/`.
4. Attendre 1 à 2 minutes : l'adresse `https://<compte>.github.io/<dépôt>/` s'affiche en haut de la page Pages.
5. Ouvrir l'adresse dans Chrome (Android) → menu ⋮ → **Installer l'application**.

Sur Cloudflare Pages : « Create project » → connecter le dépôt → sans commande de build, dossier de sortie `/`.

## Cloudflare Pages (réglage actuel)
Production branch : `ccr-39553dcc-byjsc2` · Build command : vide · **Build output directory : `public`**.
Chaque push sur la branche met le site à jour automatiquement.

## Tester en local
`cd public && python3 -m http.server 8000` puis ouvrir http://localhost:8000
