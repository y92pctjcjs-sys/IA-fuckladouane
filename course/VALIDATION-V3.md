# Validation — RECHERCHÉ V3

> Rapport historique. La mise à jour suivante des six livrées et son raccord avec RECHERCHÉ V3 sont vérifiés dans [VEHICLES.md](VEHICLES.md).

Demande du 22 octobre 2026 : enrichir les décors, corriger gauche/droite, rendre la douane plus présente, intégrer des banalisées, rendre la victoire exigeante et mémorable, remplacer le moteur et pouvoir le couper seul, ouvrir la bande-son vers une synthwave plus aérienne.

Base publique initiale : `d9e3962d29759e47538e587519f486f2c9dc0262`. Pendant le travail, main a reçu la mise à jour indépendante des véhicules originaux et du garage, `edd865e7512b1bdecf1e4e96bd5535c4219bb1bd`. Cette mise à jour est intégrée et conservée, avec ses tests et le logo intact. La sauvegarde publique immédiatement avant RECHERCHÉ est désormais `backup/pre-pursuit-v3-with-vehicles` → `edd865e7512b1bdecf1e4e96bd5535c4219bb1bd`. La sauvegarde initiale `backup/pre-pursuit-v3-2026-10-22` reste également disponible. Travail : `feat/swagistan-pursuit-v3`. La demande précédente d’appliquer les modifications au site existant reste applicable ; publication via main / GitHub Pages, sans autre hébergement.

## Protections

- Les 68 tests et 34 contrôles de syntaxe de la V2 passent avant modification.
- Aucun diff dans `index.html`, les modules/CSS du portail, `course-entry.css`, CNAME, `.nojekyll`, WAV, tests du portail et `course/tests/protection.test.js`. Aucune empreinte de protection modifiée.
- `ending.js` reste byte pour byte identique : rejet du biais, un seul tirage de 1/30 par victoire, aucun tirage en défaite. Le seed des rencontres routières ne commande pas ce tirage.
- Route toujours à 13 000 m, cinq étapes ; ciel numérique et fin Swagistan conservés. Moteur 3D, bande-son et atlas restent hors chargement initial du portail.
- Anciennes clés `fld.course.v1` et `fld.course.v2` sans écriture ; souvenir amoureux hérité, nouveaux records séparés dans `fld.course.v3`. Aucun changement des clés du portail.

## Vérifications automatiques

**85 tests réussis, 46 fichiers de syntaxe contrôlés, diff sans erreur.** Les quatre tests des nouveaux modèles originaux sont conservés. Le contrôle de syntaxe parcourt désormais récursivement les sous-modules de course, y compris les aides de test. Les nouveaux contrôles couvrent :

- Projection avec la vraie caméra Three.js : droite et gauche déplacent du bon côté de l’image. Les indications de barrage suivent la même convention.
- Approche précoce, révélation d’un véhicule déjà visible sans déplacement instantané ni double pas de simulation, hausse de jauge, phase de 2,4 s avant l’attaque, pause des révélations et trois unités maximum.
- Accélération bornée, récupération et retours de banalisées uniquement hors limites de visibilité (arrière > 100 m, avant > 300 m).
- Attente des civils aux barrages et franchissement par l’ouverture après le joueur ; corridor libre et anticipation d’au moins trois secondes conservés.
- Peinture/géométrie communes avec les civils, feux dissimulés éteints avant révélation, empreintes des véhicules compatibles avec la collision.
- Modèles originaux NIGHTRUNNER / D-89 préservés, étriers fixes, fermetures des carrosseries, atlas et flashes séparés ; hash exact du PNG tribal officiel ajouté au contrôle de conservation des ressources.
- Atlas unique 1024 × 1536 pour seize dessins ; emplacements dans les cinq lieux, UV bornées et face imprimée orientée vers le conducteur.
- Moteur filtré sans dent de scie, hystérésis des rapports ; bus moteur réellement distinct du bus d’effets. Muter l’un ne change pas le gain de l’autre. Silence initial, un ordonnanceur, reprise et interruptions conservés.
- Mélodie, panoramiques et variations au-delà de la courte boucle ; carte de score avec valeurs exactes et rang adapté ; aucun rang de victoire en défaite.
- Formats corrompus/refusés, migration du souvenir et maintien intégral des formats précédents ; préférences moteur conservées.
- Graphe de modules et entrée HTML avec une version de cache commune `pursuit3`. Le cache public observé avant publication est `max-age=600`.

## Mesures CPU et logique réellement obtenues

Reproduction : `node course/tools/measure.mjs`. Résultats bruts : [pursuit-v3-cpu.json](validation/pursuit-v3-cpu.json). Contrôleurs définis dans `tools/driver.mjs`, exécutés à chaque pas fixe ; aucun pilote humain simulé dans les affirmations ci-dessous.

| Séquence de référence | 30 Hz | 60 Hz | 144 Hz | Résistance / score |
| --- | --- | --- | --- | --- |
| Évite le trafic, sans nitro | 274,8833 s | 274,8833 s | 274,8833 s | 4 % / 27 467 |
| Surveille la poursuite, nitro et frein | 258,8250 s | 258,8250 s | 258,8250 s | 10 % / 29 748 |

Les six traversées passent les cinq étapes et gagnent, sans drift et avec une seule action droite à la fois. Sur six seeds explicités dans le JSON, le premier contrôleur gagne une fois et le second trois fois. Cela montre une difficulté sensible aux choix de conduite ; ce ne sont **pas des taux de victoire humains**. La première pression > 10 % apparaît à 4,2417 secondes. Selon la séquence, cinq à treize révélations de banalisées sont observées ; le même pool de trois douaniers est utilisé.

| Construction de scène CPU | Mesure sur cet hôte |
| --- | --- |
| Construction initiale, modèles originaux intégrés | 140 ms |
| Deux balayages du parcours, construction comprise | 559 ms |
| Tronçons conservés | 10 maximum |
| Maillages visibles observés | 347 maximum |
| Géométries observées simultanément | 169 maximum |
| Géométries partagées après libération du décor | 95 |

Ces mesures utilisent un récepteur de scène sans pilote graphique. Maillages visibles ≠ draw calls GPU ; aucun FPS mobile n’en est déduit. L’atlas représente 6 Mio de pixels RGBA avant mipmaps. Les objectifs de 60 / 30 FPS restent à mesurer sur appareil.

## Contrôles navigateur

Le navigateur disponible dans cette session a WebGL désactivé (`GL_VENDOR / GL_RENDERER = Disabled`). Les vérifications WebGL logiciel de la mise à jour indépendante des véhicules sont archivées dans `VEHICLES.md` ; elles ne sont pas présentées comme une validation 3D de l’intégration RECHERCHÉ. Une copie locale isolée affiche explicitement **DIAGNOSTIC INTERFACE SANS WEBGL — AUCUNE VALIDATION 3D**. Elle utilise les vrais modules de logique, entrées, audio, stockage, résultat et CSS ; seul le rendu y est remplacé. Les boutons d’essai des résultats existent exclusivement dans cette copie ignorée par Git et exclue du déploiement.

Contrôles obtenus sur cette copie :

- 320 px portrait : largeur du document 320, pas de débordement horizontal. Boutons direction 56 × 68, frein 60 × 56, drift 60 × 72, nitro 72 × 72 ; bord droit maximal 310 px.
- 390 × 844 et 844 × 390 : menu, réglages et résultat lisibles sans débordement horizontal. Défilement automatique initial vers « rejouer » repéré puis corrigé : le résultat s’ouvre par son titre et son score, focus sans déplacement.
- Interrupteur moteur désactivé, musique à 100 %, bruitages à 70 % : valeurs retrouvées après rechargement. Audio toujours non initialisé avant SON, moteur effectif à zéro.
- SON et lancement actionnés avec Web Audio réel ; décompte, poursuite affichée, révélation, rétro, pause et reprise explicite. Aucun message d’erreur provenant de l’audio du jeu pendant ces manipulations ; les erreurs d’extension du navigateur sont distinctes.
- Résultat normal présenté par le bouton de diagnostic : rang, score et statistiques ; carte PNG créée et chargée réellement en 1080 × 1440 ; aperçu et lien d’enregistrement disponibles. Ce résultat présenté sert au contrôle d’interface et n’est pas une course manuelle gagnée.
- Les seize affiches ont été dessinées et inspectées visuellement avec le vrai Canvas 2D, ainsi que la carte de score. Cela ne valide pas leur lisibilité dans une scène 3D à grande vitesse.

## À mesurer sur Safari iPhone

Course manuelle entière, niveau de difficulté, facilité d’usage du rétro, deux pouces, comportement après appel ou arrière-plan, stabilité de la direction, placements et lisibilité des affiches, moteur sur haut-parleurs/écouteurs, mixage musical, export effectif dans Photos/Fichiers et partage natif. Vérifier les barres Safari et zones système dans les deux orientations. Aucun appareil iPhone pilotable n’est disponible dans cet environnement.

## Livraison et retour arrière

La PR de livraison conserve le diff, le SHA du merge et le résultat du workflow Pages. Après succès Pages, contrôler les fichiers réellement servis à `/course.html` et tous les modules versionnés, séparément du statut de déploiement. Les dossiers de diagnostic et prévisualisation ne sont pas livrés.

Pour retrouver l’état public immédiatement précédent, avec les voitures originales et le garage : revert du merge de `feat/swagistan-pursuit-v3` sur main, puis publication Pages existante. La référence de comparaison est `backup/pre-pursuit-v3-with-vehicles` → `edd865e7512b1bdecf1e4e96bd5535c4219bb1bd`. La sauvegarde plus ancienne `backup/pre-pursuit-v3-2026-10-22` → `d9e3962d29759e47538e587519f486f2c9dc0262` n’est pas utilisée pour écraser la mise à jour des voitures. Aucun reset forcé, aucun changement de domaine, aucun effacement des données.
