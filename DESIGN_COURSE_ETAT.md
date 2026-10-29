# FLD / SWAGISTAN MOTOR CLUB — état design

Date : 29 octobre 2026. Branche : `feat/swagistan-design-prototype-20261029`.
Base : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec` (main). Aucun changement local préexistant, aucun AGENTS.md dans le dépôt.

## Jalon 1 — audit

- Dépôt cloné avec historique et branches ; publication existante : GitHub Pages, main / racine (README). Ne pas migrer l’hébergement ni toucher CNAME.
- HTML public récupéré par HTTP 200, identique octet pour octet à la base : SHA-256 `cf86af46f43698d76bca6b5f639c4148c182c154249032fdf484b8880180ac2b`. Les 29 ressources du graphe chargé, CSS et logo ont été comparées par SHA-256 : toutes identiques. Rapport `course/validation/design-public-base.json` ; transfert HTTP seul, pas temps de chargement complet du jeu.
- Three.js local, simulation fixe 120 Hz distincte du rendu, 13 000 m / cinq étapes, dix tronçons recyclés, sept civils et trois poursuivants (une patrouille + deux banalisées), six livrées équipables. Géométrie civile actuelle partagée : voiture muscle, trois peintures.
- Gabarits de collision inchangés : trafic ±0,95 m / ±2,05 m ; poursuivant ±0,98 m / ±2,12 m. Les nouveaux modèles doivent remplir ce gabarit suffisamment pour ne pas tromper le joueur ; aucune variation de taille par transformation globale.
- `npm test` : 92/92 ; `npm run check` : 51 fichiers. Mesures de référence : `course/validation/design-baseline-cpu.json`. Construction scène CPU 1 075 ms ; deux traversées CPU 2 546 ms ; maximum 346 maillages visibles, 170 géométries vivantes, dix tronçons. Ces nombres dépendent de l’hôte et ne sont pas des appels GPU ni une mesure de fluidité.

## OCULAIRE — état protégé

- Absent de main et de sa page publique ; aucune reconstruction, aucun import dans cette mission.
- Branche `feat/oculaire-integration-20261029` : `6bde5dc9c484e9f855d5079e5f0911e9b6cf4ce5`.
- Branche `feat/oculaire-art-direction-20261029` : `900b818bc1d7f4389cbc1d205aa718518ee58f10` ; son `OCULAIRE_ETAT.md` a été lu. Adaptation v4, regards, paroles et finale déclarés implémentés ; contrôles restants et absence de publication explicitement consignés. Ce compte rendu n’est pas une revalidation.
- Les deux branches et leurs ressources restent intactes. Ne pas les fusionner implicitement avec cette refonte.

## Références examinées

- Site officiel Asphalt Legends : https://asphaltlegends.com/fr ; page d’accueil et bloc COURSE D’ARCADE réellement observés dans le navigateur.
- Gameloft : https://www.gameloft.com/newsroom/asphalt-legends-touge-masters-summer-season-update-52.
- Lecture retenue pour FLD : grand volume de carrosserie devant un horizon moins contrasté ; reflet large qui explique le galbe ; vitrage sombre continu mais piliers distincts ; optiques découpées ; panneau opaque, typographie condensée, une action dominante et peu de diagonales. Ce sont des choix de design issus de l’observation, pas une copie des ressources.

## Erreurs et limites constatées avant modification

- Recherche web sur la page du jeu : `URL https://ia.fuckladouane.com/course.html is not accessible via this tool.` Lecture HTTP et navigateur utilisés pour les contrôles adaptés.
- Navigateur cloud, Chrome, fenêtre 1365 × 936 environ : `THREE.WebGLRenderer: A WebGL context could not be created. Reason: Could not create a WebGL context ... GL_VENDOR = Disabled, GL_RENDERER = Disabled ... ErrorMessage = BindToCurrentSequence failed:` puis `Error creating WebGL context.` Le panneau MOTEUR INDISPONIBLE est visible sur la version publique de base. C’est une limite de cet environnement ; aucune preuve que le jeu échoue sur l’appareil du joueur.
- Pas de rendu de course, de FPS GPU, de régularité des images, de mémoire GPU ou de temps au premier rendu disponibles. Aucun essai sur iPhone physique. Les trois profils restent à mesurer ; aucun budget GPU définitif fixé.
- Ne pas utiliser les anciens fichiers de validation ou une projection CPU comme preuve d’un rendu WebGL actuel.

## Jalon 2 — prototype implémenté, validation en course en attente

1. `course/road-vehicles.js` : B01 graphite, hayon court ; C01 ivoire, pavillon haut et bombé, vitrage avancé, nez plus arrondi et empattement plus court. Matériaux peinture / vitrage / plastique distincts, roues partagées, deux niveaux de détail. Version civile B01 et banalisée : même coque et même peinture ; modules bleus de calandre / pare-brise / lunette éteints chez le civil. Freins pilotés par la décélération propre à chaque voiture ; remise à zéro au redémarrage.
2. `models.js` / `renderer.js` : remplacement des seuls civils d’indices 0 et 1 et de la banalisée d’indice 1. Les cinq autres emplacements civils, la seconde banalisée, la patrouille et le joueur conservent leurs modèles. Sept civils et trois poursuivants, règles d’apparition et comportements inchangés. Pas de nouvelle allocation de géométrie pendant l’animation des voitures.
3. `course/design-system.css` et `course.html` : panneau de pause anthracite opaque, filet acide, informations cyan, action de reprise dominante ; composition paysage sur deux colonnes. Les identifiants `resume`, `pauseHelp`, `pauseSettings` et leurs événements de production restent inchangés. Les autres panneaux ne sont pas encore redessinés.
4. `course/design-scenery.js` : un quai, deux portes de chargement, bureau décalé, auvents, ventilation et clôtures à une seule extrémité du premier tronçon industriel. Solide le plus proche à 16,5 m du centre de route ; aucun obstacle décoratif ajouté aux règles. Un seul cube partagé et sept matières au maximum, regroupement par l’instanciation existante ; aucun point lumineux dynamique supplémentaire.
5. Revue locale : `course/design-review.html` ouvre le jeu réel, le composant de pause isolé et les projections de géométrie CPU. `design-panel.html` reprend le vrai HTML depuis `course.html` ; sa reprise factice est explicitement étiquetée aperçu et n’écrit ni scores ni préférences. Aucun mode de contournement WebGL n’a été ajouté au jeu.

## Vérifications exécutées sur le prototype

- `npm test` : 98/98 (92 existants + six contrôles de contrat du prototype) ; `npm run check` : 57 fichiers JavaScript. Les scripts de revue inline sont chargés dans le navigateur, séparément du contrôle Node.
- Gabarits avec modules bleus et freins allumés : largeur ≤1,90 m, longueur ≤4,10 m. Les petits volumes périphériques sont inclus, ombre exclue. Coques fermées vérifiées par rayons aux deux extrémités ; sommets et normales finis ; absence de rampe de toit.
- Roues : rotation, direction, freinage par décélération propre, gel en pause et remise à zéro contrôlés. Coque / peinture civile et banalisée identiques ; signaux cachés au départ. Niveaux de détail restaurables et mis en cache.
- Géométrie par modèle : 5 512 triangles proches ; 4 224 éloignés pour B01, 4 296 pour C01. Douze maillages visibles par voiture normale hors ombre, quinze avec signaux et freins allumés. Ce décompte CPU n’est pas une mesure des appels GPU réels.
- Projection CPU des maillages réellement inspectée : `course/design-volumes.html` (projection reproductible avec `tools/inspect-design.mjs`). Le pavillon / vitrage de C01 a été différencié davantage après cette inspection. Ce fichier ne restitue pas les reflets, les shaders, le vitrage transparent ni la lecture à vitesse normale.
- Chrome cloud, cadres CSS : 390 × 844, 320 × 568 et 844 × 390. Panneau réellement observé, réglages ouverts puis fermés, focus rendu au bouton de réglages. En 320 px : reprise 241 × 64,8 px, commandes et réglages 116,5 × 48 px, retour 241 × 48 px. Défilement vertical disponible en petit portrait ; actions toutes visibles en paysage après correction de la grille. Encoches réelles, clavier virtuel et préférence système de mouvement réduit non essayés sur téléphone physique.
- La simulation, ses tests de pause / reprise, les entrées multitactiles, l’audio séparé, les records, les barrages et le tirage amoureux sont couverts par la suite existante. Cela ne remplace pas une partie manuelle dans le navigateur.

## Mesures et budget provisoire

Rapports : `course/validation/design-prototype-cpu.json` et `design-review.json`. Linux x86_64 / Node (version exacte dans le rapport), récepteur de scène CPU, cadre 390 × 844 et DPR simulé 3, résolution cible du profil automatique plafonnée à ×1,25 ; aucun contexte GPU.

| Compteur CPU | Base | Prototype |
| --- | ---: | ---: |
| Maximum de maillages visibles | 346 | 325 |
| Géométries vivantes maximales | 170 | 200 |
| Géométries partagées après retrait des tronçons | 96 | 126 |
| Tronçons résidents maximaux | 10 | 10 |

Dernier relevé prototype : construction 421 ms, deux traversées 1 150 ms. Les exécutions ponctuelles n’ont pas une charge CPU contrôlée ; les temps ne démontrent aucun gain de fluidité par rapport à la base. La baisse du nombre de maillages s’accompagne de 30 géométries partagées supplémentaires. Il reste à mesurer les octets réellement résidents GPU et les textures avant de fixer le budget final.

Les six parcours à cadences 30/60/144 Hz et les douze rencontres à graines fixées donnent les mêmes résultats simulés que la base. Vingt fichiers protégés (portail, CNAME, logique, audio, données, voiture principale, patrouille, skins, ciel Matrix et vrai logo) sont identiques octet pour octet ; liste exacte dans le rapport.

| Profil | Navigateur disponible | Fluidité / régularité / mémoire GPU | Appareil physique |
| --- | --- | --- | --- |
| Adaptatif | Chrome cloud, contexte WebGL refusé | Non mesurées | Non testé |
| Économique | Même environnement | Non mesurées | Non testé |
| Détaillé | Même environnement | Non mesurées | Non testé |

60 et 30 images/s restent des objectifs. Aucun budget de rendu définitif ni temps au premier rendu n’est annoncé.

## Sauvegardes et incidents traités

- Audit sauvegardé à distance : `9510abca036631aa3a2dcb6333f8db97ee385363` sur la branche dédiée. L’envoi Git direct avait échoué : `fatal: could not read Username for 'https://github.com': No such device or address`. Cause : absence de credential CLI pour l’écriture ; l’API de la connexion GitHub a permis une création atomique d’arbre, commit et branche. Pas de nouvelle tentative identique.
- Prévisualisation : `static.directory must be a relative directory beneath the site root` pour `.`. Correction : copie locale dans `dist`, configuration ignorée dans Git. Prévisualisation gérée démarrée ensuite sur l’URL retournée, sans nouvel hébergement public ni projet Sites.
- Premier contrôle de géométrie : `body end cap must face the real approaching camera` sur C01, rayon à 0,78 m au-dessus du bord du capot incliné. Diagnostic par rayons à plusieurs hauteurs : coque fermée ; test corrigé pour viser 0,65 m au niveau du pare-chocs. Le test reste exigeant aux deux extrémités.
- Premier contrôle du quai : assertion de recul à 16,4 m échouée. La lèvre métallique dépassait le socle de 0,30 m vers la route ; alignement corrigé, recul minimal 16,5 m puis test réussi.
- Conversion de la projection : `ModuleNotFoundError: No module named 'cairosvg'` avec Python système puis runtime. Conversion réalisée avec Sharp déjà installé ; aucune installation de navigateur ou substitution de WebGL.
- Script de comparaison ponctuel : `SyntaxError: closing parenthesis ']' does not match opening parenthesis '('`. Parenthésage corrigé ; comparaison terminée.
- Sélection du format de revue : `Playwright selector deadline exceeded` / `no_matches` sur le libellé exact. Sélecteur de l’identifiant `#format`, déjà connu du source et de l’arbre accessible, utilisé avec succès. Le lien de retour du composant isolé a également été corrigé pour rester relatif à la racine du jeu.

## Condition de passage au jalon 3

Observer le prototype dans le vrai rendu du jeu à vitesse normale, en virage, portrait et paysage. Tant que WebGL est indisponible, sauvegarder une branche examinable ; ne pas multiplier les onze variantes restantes ni publier une version dont ce contrôle indispensable manque.

## Prochaine action

Terminer la sauvegarde du prototype et du rapport de comparaison, puis ouvrir une revue en brouillon. Reprendre au jalon 3 dans un navigateur fournissant un contexte WebGL : observer les deux silhouettes et le quai depuis la caméra de course, les modules bleus en approche / révélation, les freins, virages et barrages dans les deux orientations ; mesurer les trois profils et plusieurs redémarrages. Ensuite seulement décliner B02–B05, les civils C02–C08 et le reste des panneaux / décors. Avant une publication future : changer la version de cache de manière cohérente et vérifier le graphe associé. Aucune modification de main, aucun déploiement de ce prototype.
