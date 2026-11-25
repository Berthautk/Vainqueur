# Comment modifier le contenu de Vainqueur

Tout le texte de l'application se trouve dans les fichiers de ce dossier. **Pas besoin de toucher au code.**
Chaque fichier est une liste d'éléments entre `{ }`, séparés par une virgule. Attention aux guillemets `"` et aux virgules : une virgule oubliée ou en trop empêche la page de s'afficher.

Après chaque modification d'un fichier de contenu : chaque téléphone récupère la nouvelle version en arrière-plan à l'ouverture suivante, puis l'affiche à l'ouverture d'après. L'application s'ouvre ainsi tout de suite, sans attendre le réseau.
Pour une modification du **code** (fichiers `.js`, `.css`, `index.html`), il faut changer `VERSION` en haut de `sw.js` (`v19` → `v20`), sinon les téléphones gardent l'ancienne version.
Quand une nouvelle version du code est publiée, les personnes qui ont l'application ouverte voient un message jaune **« Une mise à jour de Vainqueur est arrivée — Mettre à jour »** (l'application vérifie toute seule, à chaque retour au premier plan et toutes les 20 minutes). Un clic recharge l'application avec la nouvelle version.

## La bannière de l'accueil, les tuiles et « Mes temps avec Dieu »
- **Bannière qui défile** (sous la salutation) : jusqu'à 5 cartes qui changent chaque jour, calculées à partir du contenu existant : « Nouveau ici ? » (`accueil.json` › `nouveau_venu`, avec un ✕ « plus tard »), la **prière du jour** (`prieres/index.json`), la **parole du jour** (`accueil.json` › `paroles` : s'ouvre dans une fenêtre avec écoute, partage en image et accès à la Bible), le **message du jour** (`messages_du_jour` : texte, écoute, vidéo) et une **adoration** (`nayla.json`). Elle avance toute seule toutes les 6 secondes, toujours vers la droite, et s'arrête 15 secondes quand on la touche. Rien à régler : elle suit le contenu.
- **Tuiles « Explorer »** : chaque tuile a une photo, un titre et une courte explication (`accueil.json` › `tuiles` › `sous`). La tuile « Prière » affiche toute seule « Thème de la semaine · jour X sur 7 ».
- **Mes temps avec Dieu** : sous la bannière, toujours visible : le temps passé ces 7 derniers jours dans la prière, la Bible, les adorations, etc. « Tout voir » ouvre le détail (7 ou 30 jours, jours avec Dieu, jours d'affilée). Le décompte reste **sur le téléphone**, n'est envoyé à personne, et s'efface dans la page de détail ou dans Plus › Réglages.

## Le prénom de l'utilisateur
Au premier lancement, l'application demande « Comment t'appelles-tu ? ». Le prénom reste **sur le téléphone** de la personne (Plus › Réglages permet de le changer ou de l'effacer). L'accueil la salue alors par son prénom, avec les phrases de `accueil.json` › `salutations_prenom` (`{prenom}` est remplacé ; sans prénom, ce sont les `salutations` habituelles). Dans les demandes par WhatsApp, l'application ajoute « Bonjour, c'est Samuel. » (la personne peut choisir de rester anonyme dans les Réglages).

## Les images
Dans les fichiers, une image s'écrit avec son code de la planche du catalogue, par exemple `"p2_02"` ou `"q1_08"`. Les planches sont dans `references/catalogue/`.

## Les fiches de prière — dossier `prieres/`
> **Rubrique EN MAINTENANCE** (fermée en attendant le paiement) : l'onglet Prière affiche « Rubrique en préparation » et **aucune fiche n'est publiée** — elles sont gardées dans `sources/recueil/app/prieres/`, hors du site. Pour rouvrir : `PUBLIER = True` dans `outils/importer_recueil.py` puis relancer l'import ; `PRIERE_OUVERTE = true` dans `js/ouverture.js` ; remettre `'prieres/index'` dans `CONTENUS` de `sw.js` et changer `VERSION`.

Les 66 fiches viennent du **Recueil de prière du Dr Sophonie** (`sources/recueil/prieres.json`, non publié). **Le texte des prières ne se modifie pas à la main** : on corrige le recueil, puis on relance `python3 -I outils/importer_recueil.py`, qui refait :
- `prieres/index.json` : la liste légère (titre, partie, image, nombre de sujets, durées calculées sur 130 mots par minute) et le **thème de la semaine** ;
- `prieres/fiche-01.json` … `fiche-66.json` : le texte complet de chaque fiche, copié sans changement (chargé seulement à l'ouverture, puis gardé pour le hors connexion).

**Thème de la semaine** (dans `outils/importer_recueil.py`, variable `THEME`) : actuellement la série « Bombarder comme Élie le Thischbite » (fiches 44 à 50), jour 1 = `"debut"` (`2026-11-23`), recommencée chaque semaine (`"repeter"`). Le « Jour X sur 7 » et la « Prière du jour » de l'accueil avancent tout seuls.
Pour imposer une fiche précise sur l'accueil, ajouter `"du_jour": "fiche-12"` dans `prieres/index.json`.
**Audio enregistré** : dans `prieres/index.json`, ajouter à la fiche `"audios": { "matin": "…", "soir": "…" }` (sinon la voix du téléphone lit la fiche). Ces ajouts sont gardés quand on relance l'import.
**Images** : choisies parmi les illustrations existantes (variable `IMAGES` du même outil).
**Vérification biblique** : `python3 -I outils/verifier_bible_recueil.py` refait `sources/recueil/VERIFICATION_BIBLE.md` (rien n'est corrigé automatiquement).

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

## Plans de lecture de la Bible — `plans.json`
Trois plans d'un an : « Toute la Bible en un an » (Genèse → Apocalypse), « Nouveau Testament d'abord », et « Un thème par mois » (12 thèmes au rythme de l'année).
Pour un plan par thème, chaque mois indique son titre, son texte, son verset clé et ses livres (`"psaumes:1-72"` pour une partie d'un livre). L'application répartit les chapitres sur les jours du mois, à temps de lecture égal.

## Références bibliques
Écrire les références normalement, avec deux-points : « Jean 3:16 », « Psaume 4:9 », « 1 Corinthiens 15:57 », « Lamentations 3:22-23 ».
Elles deviennent automatiquement des liens vers la Bible intégrée (Louis Segond 1910). Pour une citation, recopier le texte exact de la LSG 1910.

## NAYLA
Les significations alternent à chaque ouverture de l'application, et changent aussi en douceur sur la page Nayla. Elles se modifient dans `nayla.json` (`significations`) : `[N]` = initiale en or, `|` = retour à la ligne.
