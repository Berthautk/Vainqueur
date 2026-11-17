# PROMPT CLAUDE CODE — APPLICATION « VAINQUEUR » (PHASE 1 : PROTOTYPE)

Copie tout ce qui suit dans Claude Code, après avoir déposé le contenu de ce kit à la racine du dépôt GitHub.

---

## 1. Ta mission

Tu construis le premier prototype fonctionnel de l'application chrétienne **VAINQUEUR**, pour l'évangéliste Docteur Sophonie (ministère « Les Amoureux de Jésus-Christ », LAJC) et son groupe de prière « Les Vainqueurs de Dieu ».

Une ancienne version existe sur le Play Store. Elle a déçu le client : modèle générique, sans identité, avec un texte d'éditeur oublié à l'écran (« Titre de premier niveau »). Ta version doit montrer dès la première seconde **son logo, son accroche et ses rubriques**, au niveau de finition des maquettes fournies.

Travaille **au pixel près** à partir des maquettes du dossier `references/ecrans/`. Regarde chaque image avant de coder l'écran correspondant.

## 2. Le contenu du kit

```
references/ecrans/          12 maquettes à reproduire (01_splash … 12_plus)
references/catalogue/       planches numérotées de toutes les illustrations (pour choisir)
references/idees_phase2/    idées pour plus tard : NE PAS construire maintenant
assets/logo/                blason_vainqueurs_transparent.png (icône, en-tête)
                            logo_vainqueurs_banniere_transparent.png (splash, À propos)
                            logo_vainqueurs_banniere_fond_blanc.png / _fond_noir.png
assets/fonds/               fond_splash_montagne.jpg, fond_chemin_bible.jpg, blason_3d_fond_bleu.jpg
assets/illustrations/       personnages/ (96), icones/ (48), lieux/ (24) — déjà découpées, en .webp
```

Choisis pour chaque carte l'illustration la plus proche de la maquette, en regardant les planches du catalogue. N'en génère pas d'autres. N'utilise jamais une image trouvée sur Internet.

## 3. Choix techniques (obligatoires)

- **Application web progressive (PWA)** en HTML, CSS et JavaScript simples (modules ES), sans framework et sans étape de compilation. Le dépôt doit pouvoir être publié tel quel sur **GitHub Pages** ou **Cloudflare Pages**.
- **100 % gratuit** : aucun service payant, aucun service qui demande une carte bancaire. Pas de Firebase Blaze, pas de serveur, pas de base de données en ligne pour cette phase.
- **Hors connexion d'abord** : un service worker met en cache l'application, les polices, les images et les fichiers de contenu. Après la première ouverture, tout le texte et toutes les images marchent sans réseau.
- **Audio** : lecture en streaming, et bouton « Télécharger » qui garde le MP3 dans le cache (Cache API) pour l'écouter hors connexion. L'écran « Mes téléchargements » liste les fichiers gardés, avec leur taille et un bouton supprimer.
- **Petits téléphones Android** : images en .webp chargées à la demande (`loading="lazy"`), premier chargement léger, animations sobres. Teste à 360 px de large.
- **Polices hébergées dans le dépôt** (pas d'appel à Google Fonts en ligne) : Playfair Display pour les titres, Poppins pour le texte.
- **Pas de compte, pas de connexion utilisateur** dans cette phase. Favoris, progression (« J'ai prié », sujets cochés) et dernière écoute sont gardés dans `localStorage`, toujours dans un `try/catch`.
- **Demandes et contacts sans serveur** : « Demander conseil », « Demander un sujet de prière », « Demander un appel », « Inviter l'homme de Dieu », « Témoigner » et « Faire un don » ouvrent WhatsApp (`https://wa.me/<numéro>?text=<message pré-rempli>`), sauf « Rejoindre le groupe », qui ouvre le lien Telegram. Les numéros et les liens sont lus dans `content/config.json`.
- **« Écouter l'article »** : si un MP3 est fourni dans le contenu, on le lit ; sinon, on utilise la synthèse vocale du téléphone (Web Speech API, voix fr-FR) avec un repli propre si elle n'existe pas.
- **Notifications** : pas de notifications push dans cette phase. La cloche ouvre une liste « Nouveautés » lue dans `content/nouveautes.json`, avec une pastille quand il y a du nouveau depuis la dernière visite.
- **Publication sur le Play Store plus tard** via PWABuilder (Trusted Web Activity) : prépare un `manifest.webmanifest` complet (nom « Vainqueur », couleurs, icônes 192 et 512 px tirées du blason, icône « maskable ») et un dossier `.well-known/` avec un `assetlinks.json` vide à compléter.

## 4. Charte graphique

| Rôle | Couleur |
| --- | --- |
| Bleu royal (principal) | #1F3FAE |
| Bleu nuit (en-têtes, fonds foncés, barre du bas) | #0F1F5C |
| Or victoire (titres forts, boutons principaux, onglet actif) | #D4A017 |
| Vert espérance (« Écouter », hors connexion, validation) | #22A33C |
| Rouge passion (cœurs, rubrique Cœurs brisés) | #E3241B |
| Fond clair / blanc / texte | #F7F8FC / #FFFFFF / #1A1A2E |

Cartes arrondies (rayon 16 à 20 px), ombres douces, dégradés bleu nuit vers bleu royal avec reflets dorés, comme sur les maquettes. Mets toutes les couleurs dans des variables CSS.

## 5. Les écrans à construire (dans cet ordre)

Navigation en bas sur tous les écrans principaux : **Accueil · Prière · Nayla · Cœurs brisés · Plus**. En-tête commun : blason + « Les Vainqueurs de Dieu » + « Vainqueur » en or + cloche.

1. **01_splash** : fond montagne, bannière du logo, « VAINQUEUR » en or, « Un peuple, une foi, une victoire », barre de chargement dorée. Environ 1,5 s, puis Accueil.
2. **02_accueil** : carte « Bonjour, champion ! » + accroche (lue dans le contenu, change chaque jour) ; « Parole du jour » (Écouter, Partager) ; « Prière du jour » (bouton Commencer vers la fiche du jour) ; grille de 6 tuiles vers les rubriques ; badge « Disponible hors connexion ». **Pas de bouton de don sur l'accueil.**
3. **03_priere_liste** : titre, carte « Thème de la semaine » avec progression « Jour X sur 7 », liste des fiches (durée, écouter, télécharger).
4. **04_fiche_priere** : onglets Matin / Soir ; bloc Enseignement (lecteur audio + texte avec « Lire la suite ») ; « Tes 5 sujets de prière » avec cases à cocher ; bouton « J'ai prié » ; lien « Partager mon témoignage ».
5. **05_nayla_liste** : recherche, liste des adorations, mini-lecteur fixe au-dessus de la barre du bas.
6. **06_nayla_lecteur** : pochette, commandes (aléatoire, précédent, lecture, suivant, répéter), Télécharger / Partager / Favori, onglets Paroles / Enseignement. **Un seul lecteur audio global** pour toute l'application : la musique continue quand on change d'écran.
7. **07_coeurs_brises** : « Médecin des cœurs brisés » (toujours ce nom exact), 8 thèmes avec Lire / Écouter, bouton « Écrire pour demander conseil ».
8. **08_coeurs_brises_article** : article avec intertitres, temps de lecture, « Écouter l'article », « Demander conseil », « Prier pour ce sujet ».
9. **09_affaires** : « Hommes et femmes d'affaires », accroche, 6 modules (Enseignement + sujet de prière), « Rejoindre le coaching ».
10. **10_evangelisation** : message « Jésus t'aime encore », bouton « Je veux connaître Jésus » (page simple de prière du salut), carrousel des croisades, interviews vidéo (liens YouTube), « Inviter l'homme de Dieu chez moi ».
11. **11_temoignages** : fil de témoignages (photo, prénom, ville, catégorie, extrait, audio), filtres par catégorie, bouton « Témoigner » (Message vocal / Texte / Photo → WhatsApp).
12. **12_plus** : toutes les cartes de la maquette, y compris « Mes téléchargements hors connexion » et « À propos ».

Ajoute aussi les petits états prévus dans toute bonne application : chargement, liste vide, hors connexion (bandeau discret), confirmation (« Téléchargé », « Copié »).

## 6. Corrections à faire par rapport aux maquettes

- **Onglet actif** : sur les maquettes, l'onglet en or est parfois faux. Règle : Témoignages, Évangélisation, Affaires et les pages ouvertes depuis l'accueil n'allument **aucun onglet** ou celui d'où l'on vient ; Prière, Nayla, Cœurs brisés et Plus allument le leur.
- **À propos** : écrire « LAJC — Les Amoureux de Jésus-Christ » (et non « Les Ambassadeurs »).
- Vérifie l'orthographe de chaque texte ; les maquettes contiennent des fautes (par ex. « matr'monial » → « matrimonial »).
- Le Christ illustré sur l'écran Évangélisation peut être remplacé par une scène de croisade ou de lumière si une illustration du catalogue convient mieux ; demande-moi si tu hésites.

## 7. Le contenu : séparé du code

Tout le texte vient de fichiers JSON dans `content/`, pour que l'équipe puisse ajouter des fiches, des adorations ou des témoignages sans toucher au code :

```
content/config.json        numéros WhatsApp, lien Telegram, réseaux sociaux, moyens de don, texte À propos
content/accueil.json       accroches du jour, paroles du jour
content/fiches.json        thème de la semaine, fiches : titre, durée, image, audio, enseignement matin/soir, 5 sujets matin/soir
content/nayla.json         adorations : titre, durée, pochette, audio, paroles, enseignement
content/coeurs_brises.json thèmes et articles (texte, audio facultatif)
content/affaires.json      modules
content/evangelisation.json croisades (photos), interviews (liens), texte de la prière du salut
content/temoignages.json   témoignages
content/nouveautes.json    nouveautés de la cloche
audio/                     MP3 (ou URL externes dans les JSON)
```

Écris un `content/LISEZ_MOI.md` court qui explique, en français simple, comment ajouter une fiche, une adoration ou un témoignage.

**Contenu d'exemple** : en attendant les vrais textes de l'équipe, remplis chaque fichier avec 3 à 6 éléments d'exemple, tirés des maquettes. Chaque élément d'exemple porte `"exemple": true`, et l'application affiche alors un petit badge « Exemple ». **Les témoignages d'exemple ne doivent jamais être présentés comme réels** : badge « Exemple » obligatoire, et ils seront remplacés par de vrais témoignages avant toute publication. Pour l'audio d'exemple, utilise un petit MP3 de silence ou de tonalité généré localement, pas de fichier téléchargé sur Internet.

## 8. Ce que tu ne fais PAS dans cette phase

Pas de comptes ni de connexion, pas de tableau d'administration, pas de serveur, pas de paiement intégré, pas de notifications push, rien de ce qui est dans `references/idees_phase2/`. Si une fonction semble indispensable mais exige un service payant ou un serveur, **arrête-toi et demande-moi** au lieu de l'ajouter.

## 9. Méthode de travail

1. Commence par la structure, la charte (variables CSS), l'en-tête, la barre du bas, le routeur et le service worker.
2. Construis ensuite les écrans dans l'ordre de la section 5. Après chaque écran, compare-le à sa maquette et corrige les écarts.
3. Fais un commit clair après chaque écran terminé.
4. À la fin, publie sur GitHub Pages (ou donne-moi les étapes exactes, réalisables depuis un téléphone), puis vérifie : l'application s'installe, s'ouvre hors connexion après une première visite, l'audio continue entre les écrans, et tous les boutons WhatsApp et Telegram ouvrent le bon lien.
5. Termine par un rapport court : ce qui marche, ce qui reste à faire, et la liste exacte des contenus et informations que l'équipe doit fournir (numéros, liens, textes, audios, photos, logo définitif).
