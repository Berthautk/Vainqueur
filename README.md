# VAINQUEUR — Les Vainqueurs de Dieu (LAJC)

Application web progressive (PWA) : prières guidées, adorations (Nayla), Médecin des cœurs brisés, affaires, évangélisation, témoignages.
HTML/CSS/JavaScript simples, sans compilation, 100 % gratuite, utilisable hors connexion.

- Contenu modifiable sans code : dossier `content/` (lire `content/LISEZ_MOI.md`).
- Maquettes de référence : `references/ecrans/`. Cahier des charges : `PROMPT_CLAUDE_CODE.md`.

## Publier sur GitHub Pages (depuis un téléphone)
1. Sur github.com (mode « Version pour ordinateur » du navigateur), ouvrir le dépôt → **Settings** → **Pages**.
2. « Build and deployment » → Source : **Deploy from a branch**.
3. Branche : **main** (fusionner d'abord la branche de travail dans `main`), dossier **/ (root)** → **Save**.
4. Attendre 1 à 2 minutes : l'adresse `https://<compte>.github.io/<dépôt>/` s'affiche en haut de la page Pages.
5. Ouvrir l'adresse dans Chrome (Android) → menu ⋮ → **Installer l'application**.

Sur Cloudflare Pages : « Create project » → connecter le dépôt → sans commande de build, dossier de sortie `/`.

## Tester en local
`python3 -m http.server 8000` puis ouvrir http://localhost:8000
