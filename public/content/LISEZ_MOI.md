# Comment modifier le contenu de Vainqueur

Tout le texte de l'application se trouve dans les fichiers de ce dossier. **Pas besoin de toucher au code.**
Chaque fichier est une liste d'éléments entre `{ }`, séparés par une virgule. Attention aux guillemets `"` et aux virgules : une virgule oubliée ou en trop empêche la page de s'afficher.

Après chaque modification : sur le site, l'application se met à jour à la prochaine ouverture (avec connexion). Pour forcer la mise à jour chez tout le monde, changer `VERSION` en haut du fichier `sw.js` (`v1` → `v2`).

## Les images
Dans les fichiers, une image s'écrit avec son code de la planche du catalogue, par exemple `"p2_02"` ou `"q1_08"`. Les planches sont dans `references/catalogue/`.

## Ajouter une fiche de prière — `fiches.json`
Copier une fiche complète (de `{ "id": ...` jusqu'à son `}`), la coller à la suite, et changer :
`id` (unique, ex. `"f5"`), `titre`, `duree` (en minutes), `image`, `audio` (chemin du MP3, ex. `"audio/ma-fiche.mp3"`), puis le texte `matin` et `soir` (un enseignement et exactement 5 `sujets`).
**Thème de la semaine** (dans `"theme"`) : écrire la date du jour 1 dans `"debut"` (ex. `"2026-11-15"`). Le « Jour X sur 7 » avance alors tout seul chaque jour, et la « Prière du jour » de l'accueil change avec lui (jour 1 = 1re fiche, jour 2 = 2e fiche…).
Pour imposer une fiche précise sur l'accueil, remplacer `"du_jour": "auto"` par son `id` (ex. `"f2"`).

## Ajouter une adoration — `nayla.json`
Copier une adoration et changer `id` (unique), `titre`, `duree` (ex. `"6:24"`), `image` (pochette), `audio`, `paroles` (utiliser `\n` pour passer à la ligne et `\n\n` pour une ligne vide) et `enseignement`.

## Ajouter un témoignage — `temoignages.json`
Copier un élément de `items` et changer `prenom`, `ville`, `categorie` (Délivrance, Guérison, Famille ou Affaires), `image`, `extrait`, `audio` et `duree`. **Supprimer la ligne `"exemple": true`** pour un vrai témoignage : le badge « Exemple » disparaît.
Avant publication, remplacer ou supprimer tous les témoignages d'exemple.

## Les autres fichiers
- `config.json` : numéro WhatsApp (chiffres seulement, avec l'indicatif du pays, ex. `2376XXXXXXXX` ; tant qu'il est vide, les boutons affichent « bientôt disponible »), lien Telegram, réseaux sociaux, moyens de don, texte « À propos », messages pré-remplis de WhatsApp.
- `accueil.json` : accroches et paroles du jour (une nouvelle chaque jour), tuiles de l'accueil.
- `coeurs_brises.json` : thèmes et articles ; `"priere"` = la courte prière affichée par le bouton « Prier pour ce sujet » ; ajouter `"audio": "audio/xxx.mp3"` pour un article lu par une voix enregistrée (sinon la voix du téléphone lit l'article).
- `affaires.json`, `evangelisation.json` (message, croisades, interviews, enseignements, prière du salut), `nouveautes.json` (liste de la cloche : chaque nouvel élément affiche « Un nouveau message est arrivé »).
- `plus.json` : les cartes de la page Plus (titre, texte, image, action). `radio.json` : émissions de radio. `accueil.json` : salutations, accroches, paroles, **messages du jour** (texte, audio ou vidéo), carte « Nouveau ici ? ».
- `config.json` : aussi la **devise** sous « Vainqueur », le **rythme du groupe Telegram**, le lien du **coaching** (`coaching_lien`) et la page **Docteur Sophonie** (`sophonie`).
- Prière : chaque fiche a un `"theme"` ; les fiches du thème de la semaine (`theme.id`) passent en premier, et la recherche aide à retrouver les autres.

## Les audios
- **Où les mettre** : dans le dépôt séparé **vainqueur-audio**, publié sur Cloudflare Pages (modèle et marche à suivre : `outils/vainqueur-audio/LISEZ_MOI.md`). Ne pas utiliser Google Drive comme source de lecture.
- **Format** : MP3 **mono 48 kbit/s** (1 h ≈ 22 Mo). Limite : **25 Mo par fichier** ; au-delà, couper en parties. Outil fourni : `sh outils/compresser-audio.sh enregistrement.m4a f5-matin` (ou Audacity : Stéréo vers mono, export MP3 48 kbit/s).
- **Dans le contenu** : l'adresse complète, par exemple `"audio": "https://vainqueur-audio.pages.dev/fiches/f5-matin.mp3"`.
  Fiche de prière : un audio pour le matin et un pour le soir → `"audios": { "matin": "…", "soir": "…" }`.
- **Sans audio** (fiches, Cœurs brisés, Affaires, Radio, témoignages, Bible) : le texte est lu par la voix du téléphone, avec le mot prononcé en couleur.
- Le bouton « Télécharger » garde l'audio dans l'application pour l'écouter sans internet (Plus › Mes téléchargements, avec « Enregistrer » pour une copie dans le téléphone).

## Les vidéos
Toujours sur **YouTube** (publiques ou « non répertoriées »). Dans le contenu, une vidéo = son **identifiant YouTube** (les 11 caractères après `v=` ou `youtu.be/`), par exemple `"video": "dQw4w9WgXcQ"`.
Elles se regardent dans l'application, avec le lecteur officiel de YouTube (connexion nécessaire).
- Nayla : `"video"` dans une adoration. · Évangélisation : `interviews` et `enseignements`. · Accueil : `messages_du_jour`.

## Références bibliques
Écrire les références normalement, avec deux-points : « Jean 3:16 », « Psaume 4:9 », « 1 Corinthiens 15:57 », « Lamentations 3:22-23 ».
Elles deviennent automatiquement des liens vers la Bible intégrée (Louis Segond 1910). Pour une citation, recopier le texte exact de la LSG 1910.

## NAYLA
Les significations alternent à chaque ouverture de l'application, et changent aussi en douceur sur la page Nayla. Elles se modifient dans `nayla.json` (`significations`) : `[N]` = initiale en or, `|` = retour à la ligne.
