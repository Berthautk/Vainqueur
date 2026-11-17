# Dépôt audio de Vainqueur

Ce dossier sert de modèle à un **dépôt GitHub séparé**, nommé `vainqueur-audio`, publié gratuitement sur **Cloudflare Pages**.
Il ne contient que les MP3 : l'application reste légère et les audios ont leur propre adresse.

## Mise en place (une seule fois)
1. Sur GitHub : **New repository** → nom `vainqueur-audio` → Public → Create.
2. Y déposer le contenu de ce dossier (`_headers`, `index.html`, dossiers `fiches/` et `nayla/`) : **Add file → Upload files**.
3. Sur Cloudflare : **Workers & Pages → Create → Pages → Connect to Git** → choisir `vainqueur-audio`.
   Build command : vide · Build output directory : `/` → **Save and Deploy**.
4. L'adresse sera `https://vainqueur-audio.pages.dev`.

Le fichier `_headers` autorise l'application à lire **et télécharger** les audios (hors connexion) et active un cache long.
Ne pas le supprimer.

## Ajouter un audio
1. Compresser en **MP3 mono 48 kbit/s** (1 h ≈ 22 Mo ; limite : 25 Mo par fichier, sinon couper en parties) :
   - avec l'outil fourni : `sh outils/compresser-audio.sh enregistrement.m4a f5-matin` ;
   - ou avec **Audacity** (gratuit) : Pistes → Mixer → Stéréo vers mono ; Fichier → Exporter → MP3, débit constant 48 kbit/s.
2. Le déposer dans le bon dossier (`fiches/`, `nayla/`…) avec un nom simple, sans espace ni accent : `f5-matin.mp3`.
3. Dans l'application (`public/content/*.json`), écrire l'adresse complète :
   `"audio": "https://vainqueur-audio.pages.dev/fiches/f5-matin.mp3"`.

**Ne pas utiliser Google Drive** comme source de lecture (page d'avertissement sur les gros fichiers, blocages, liens qui changent).
