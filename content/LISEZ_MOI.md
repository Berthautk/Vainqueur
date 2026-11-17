# Comment modifier le contenu de Vainqueur

Tout le texte de l'application se trouve dans les fichiers de ce dossier. **Pas besoin de toucher au code.**
Chaque fichier est une liste d'éléments entre `{ }`, séparés par une virgule. Attention aux guillemets `"` et aux virgules : une virgule oubliée ou en trop empêche la page de s'afficher.

Après chaque modification : sur le site, l'application se met à jour à la prochaine ouverture (avec connexion). Pour forcer la mise à jour chez tout le monde, changer `VERSION` en haut du fichier `sw.js` (`v1` → `v2`).

## Les images
Dans les fichiers, une image s'écrit avec son code de la planche du catalogue, par exemple `"p2_02"` ou `"q1_08"`. Les planches sont dans `references/catalogue/`.

## Ajouter une fiche de prière — `fiches.json`
Copier une fiche complète (de `{ "id": ...` jusqu'à son `}`), la coller à la suite, et changer :
`id` (unique, ex. `"f5"`), `titre`, `duree` (en minutes), `image`, `audio` (chemin du MP3, ex. `"audio/ma-fiche.mp3"`), puis le texte `matin` et `soir` (un enseignement et exactement 5 `sujets`).
Pour choisir la fiche « Prière du jour » de l'accueil : changer `"du_jour"`. Le thème de la semaine et le « Jour X sur 7 » se changent dans `"theme"`.

## Ajouter une adoration — `nayla.json`
Copier une adoration et changer `id` (unique), `titre`, `duree` (ex. `"6:24"`), `image` (pochette), `audio`, `paroles` (utiliser `\n` pour passer à la ligne et `\n\n` pour une ligne vide) et `enseignement`.

## Ajouter un témoignage — `temoignages.json`
Copier un élément de `items` et changer `prenom`, `ville`, `categorie` (Délivrance, Guérison, Famille ou Affaires), `image`, `extrait`, `audio` et `duree`. **Supprimer la ligne `"exemple": true`** pour un vrai témoignage : le badge « Exemple » disparaît.
Avant publication, remplacer ou supprimer tous les témoignages d'exemple.

## Les autres fichiers
- `config.json` : numéro WhatsApp (chiffres seulement, avec l'indicatif du pays, ex. `237600000000`), lien Telegram, réseaux sociaux, moyens de don, texte « À propos », messages pré-remplis de WhatsApp.
- `accueil.json` : accroches et paroles du jour (une nouvelle chaque jour), tuiles de l'accueil.
- `coeurs_brises.json` : thèmes et articles ; ajouter `"audio": "audio/xxx.mp3"` pour un article lu par une voix enregistrée (sinon la voix du téléphone lit l'article).
- `affaires.json`, `evangelisation.json` (croisades, liens des interviews YouTube, prière du salut), `nouveautes.json` (liste de la cloche).

## Les audios
Déposer les MP3 dans le dossier `audio/`, puis écrire leur chemin dans le fichier (`"audio": "audio/nom.mp3"`). On peut aussi donner l'adresse complète d'un MP3 hébergé ailleurs. Retirer `"exemple": true` pour enlever le badge « Exemple ».
Conseil : MP3 mono, 64 kbit/s, pour des fichiers légers.
