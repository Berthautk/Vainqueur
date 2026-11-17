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
- `affaires.json`, `evangelisation.json` (croisades, liens des interviews YouTube, prière du salut), `nouveautes.json` (liste de la cloche).

## Les audios
- **Avec un MP3** : déposer le fichier dans `public/audio/`, puis écrire son chemin : `"audio": "audio/nom.mp3"`. On peut aussi mettre l'adresse complète d'un MP3 hébergé ailleurs.
- **Sans MP3** (fiches, Cœurs brisés, Affaires, témoignages) : le texte est lu par la voix du téléphone. Rien à faire.
- Taille : MP3 mono 64 kbit/s (environ 0,5 Mo par minute). Limite de Cloudflare : 25 Mo par fichier.
- Le bouton « Télécharger » garde l'audio dans l'application pour l'écouter sans internet (liste dans Plus › Mes téléchargements, avec « Enregistrer » pour en garder aussi une copie dans le téléphone).

## Les vidéos (Nayla)
Les vidéos ne se mettent **pas** dans le dépôt : les publier sur **YouTube** (publiques ou « non répertoriées »), puis coller le lien dans l'adoration : `"video": "https://youtu.be/XXXXXXXXXXX"`.
L'adoration affiche alors un badge « Vidéo » et le bouton « Regarder la vidéo », qui la joue dans l'application. Une adoration peut avoir un audio, une vidéo, ou les deux.

## NAYLA
Les deux significations (« Nouvelle Adoration à Yahweh, l'Éternel des Armées » et « Nous Adorons Yeshua, l'Éternel des Armées ») alternent à chaque ouverture de l'application, et changent aussi en douceur sur la page Nayla. Elles se modifient dans `public/js/util.js` (liste `NAYLA`).
