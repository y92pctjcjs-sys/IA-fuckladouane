# FLD / SWAGISTAN MOTOR CLUB — état design

## État courant — route V4 et passage secret, 29 octobre 2026

Branche : `feat/swagistan-route-secret-20261029`. Premier jalon sauvegardé : `949b9f653a00fe256d378cf594ca9dbf0c8dcc32`. Base distante et publique vérifiée avant modification : `c0acf1e0e5e0eb7232a8d721d2debf08a495feda`. Aucun changement local préexistant, aucun AGENTS.md. Publication explicitement demandée par l’utilisateur. Brief écrit puis appliqué : `course/ROUTE_V4_PROMPT_MAITRE.md`. Cette demande autorise à changer le tracé, contrairement à la limite du brief initial ; les 13 km principaux, les cinq étapes et les dix barrages restent en place dans la progression.

### Audit et direction

- Base : 121/121 tests ; 44 fichiers publics HTTP 200 et identiques au commit avant travail (`route-public-base.json`). GitHub Pages main / racine, domaine et QR conservés.
- Références officielles : notes Touge Masters Asphalt et aide Quick Race / chemins secrets (liens dans le brief). Principes retenus : changements de direction réels, courbes longues entre les lignes de vitesse, choix de route à apprendre. Créations FLD uniquement, aucune ressource Asphalt importée.
- **Conçu et implémenté** : angles de route composés à la main, raccords quintiques continus, intégration par longueur. Amplitude des caps supérieure à 4,3 radians ; rayon minimal de la route principale d’environ 133 m. Étendue latérale de plus de 3 km, retours et contre-courbes. Distance entre parties non voisines supérieure à 400 m aux échantillons contrôlés ; aucun croisement accidentel.

### Passage LISIÈRE 89 et dangers

- **Implémenté** : vraie chaussée forestière de 686,94 m entre les progressions 3 120 et 4 400 m, évitant 593,06 m de détour. Entrée par le côté gauche, marque FLD discrète, sol et lisière construits ; aucun saut de position. L’avancement canonique s’adapte à la longueur physique, les roues / effets utilisent la vraie vitesse. Raccords de position, direction et pente ; sol découpé et hauteurs accordées aux jonctions. Garde-corps principal ouvert uniquement aux deux raccords.
- La caméra, l’éclairage du joueur, les traces de drift, la nitro, la carte et le point de visée céleste suivent cette route. Le visage, les pigments, la chevelure, les clignements, la finale et les cinq regards d’OCULAIRE restent ceux de main, y compris leur comportement pendant la réaction 360° nouvellement publiée par l’autre branche. Seul son ancrage de parcours s’adapte à la branche et les patrouilles éloignées physiquement sont écartées de son attention.
- Les poursuivants restent sur la route principale. Collisions vérifiées dans le monde pendant le passage : aucun contact ou passage au ras gagné à travers la forêt. Les civils / poursuivants s’écartent progressivement de la voie de réinsertion ; aucun déplacement instantané d’une voiture proche. Le passage ne peut être pris en pause et ne termine pas la partie.
- Cinq amas fixes de pneus / colis : 1,06 ; 2,72 ; 4,90 ; 8,48 ; 11,14 km. Deux voies libres à chaque amas, plus de 392 m de séparation avec un barrage ; signal selon la même anticipation de plus de trois secondes. Gabarit réel ±1,05 m / ±1,15 m, peinture et petites languettes réfléchissantes ; impact de 6 points de résistance avec délai de contact existant. Les débris décoratifs ne deviennent pas des collisions cachées.
- Les accessoires longs du tunnel sont répartis dans des repères locaux suivant le tracé, au lieu de traverser les virages en ligne droite. Aires techniques reculées / abaissées, forêt écartée du passage. La toiture conserve exactement 5,2–7,4 km.

### Carte, records et invariants

- Atlas redessiné autour de la nouvelle géométrie, plan à proportions exactes, tracé entier visible en portrait, cinq filtres, zoom et défilement. Le passage ne se dessine qu’après découverte ; celle-ci est mémorisée avec les données V4 et suivie sur les nouvelles parties. Le marqueur suit le joueur sur la branche.
- Classement séparé `swagistan-13k-v4-forest-cut`, clé `fld.course.v4`, schéma 4 ; clés V1 / V2 / V3 jamais écrasées. Le souvenir amoureux suit la migration, sans reprendre les anciens temps / scores. Résultat et preuve indiquent la découverte. Commandes, préférences, skins et audio séparé conservés.
- Cache de tout le graphe : `fld-route-003`. Comparaison de 21 sources protégées à la base intégrée `bb38fe39d1bb449704509cd6e64762cfdd89efe2` : identiques hors paramètres de cache (`route-preserved.json`), dont portail, domaine, commandes, audio, tirage 1/30, données du portrait, cheveux, finale et journal OCULAIRE.

### Vérifications exécutées

- **Testé** : 143/143 tests après raccord OCULAIRE, syntaxe de 82 fichiers JavaScript vérifiée. Les onze nouveaux tests couvrent continuité et séparation des courbes, gain physique du passage, entrée et raccord sans téléportation, déterminisme à 30 / 60 / 144 Hz, pause, collision indépendante des deux routes, débris et gabarits, réinsertion, migration V3 / V4, révélation de carte, caméra réelle et cinq regards.
- Contrôle géométrique de la vraie scène : **15 729 sondes**, tous les 8 m, route principale entre −8 et +8 m et passage entre −3,7 et +3,7 m ; intervalle vertical 0,12–2,87 m au-dessus de la route. Aucun décor solide rencontré. Les halos transparents de sol sont exclus car ce ne sont pas des obstacles. Ce relevé échantillonné ne garantit pas tous les points continus ni le cadrage WebGL (`route-clearance.json`).
- **Simulé** : 24 parcours complets avec vrais civils et poursuivants, douze graines, avec / sans passage. Route principale : 10 arrivées et deux défaites (`VÉHICULE HORS SERVICE`, graines 7 et 9). Passage : 12 découvertes et 12 arrivées, temps d’environ 246–249 s contre 258–260 s pour les arrivées principales. Aucun choc de débris pour ce contrôleur. Base antérieure : 7 arrivées sur 12 pour la même famille de contrôleur. Les ajustements du contrôleur aux nouveaux dangers empêchent d’en déduire un taux de victoire humain ou un équilibrage parfait. Rapports `route-drives.json`, `route-baseline-drives.json` ; les défaites sont conservées et ne sont pas masquées en succès.
- **Observé en CPU uniquement** : vingt projections des maillages via la vraie caméra de poursuite en 390×844 et 844×390 : courbe forestière, trois moments du passage, débris, portails, contrôle et finale de route. Route et joueur visibles, ciel occulté dans OMERTA ; ombrage simplifié et échantillonnage de textures, sans les shaders / reflets WebGL. Reproduction : `tools/render-world-cpu.mjs`, relevé `route-camera-cpu.json`.
- **Observé dans Chrome cloud** : atlas en cadres CSS 390×844, 320×568 et 844×390. Aucune largeur de page excédentaire (373/373, 303/303, 827/827), boutons au moins 44 px, filtre forêt et parcours entier, zoom 150 %, dévoilement en mode découvert. Dialogue du vrai composant ouvert, Échap depuis son iframe puis retour du focus au bouton carte. La simulation de pause et l’audio sont couverts séparément par les tests ; cette fixture ne constitue pas une partie jouée.

### Budget mesuré et limites

Node v24.22.1 Linux, CPU seulement, OCULAIRE `ready`, DPR simulé 3, six combinaisons de profil / cadre. Adaptatif et détaillé : ratio cible 1,25, maillages visibles maximum 353 (base 353), triangles avant frustum maximum 236 221 (base 226 291). Économie : ratio 0,72, maillages maximum 324 (base 329), triangles maximum 213 877 (base 213 961). Géométries maximum 282 contre 265 ; deux traversées à 261 / 261 et huit retours au départ stables à 251, ou 252 en économie. Géométries partagées après retrait : 160 / 161. Passage mesuré, arbres instanciés et LOD économique ; aucune lumière dynamique ajoutée. Rapports `route-cpu.json` et `route-baseline-cpu.json`. Les temps CPU varient avec la charge de l’hôte et ne démontrent pas un gain de fluidité.

Le contexte WebGL du navigateur cloud est désactivé, comme au jalon précédent (`GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `Error creating WebGL context.`). Aucune observation WebGL de la V4, mesure de FPS / régularité GPU ou partie sur iPhone physique n’est revendiquée. 60 / 30 images par seconde restent des objectifs. L’autorisation utilisateur de publier est explicite ; ces limites sont maintenues dans la livraison.

### Incidents corrigés et état de publication

- Premier audit de couloir : les plans transparents des halos au sol étaient comptés comme solides ; classés explicitement hors obstacles, puis contrôle des solides exécuté.
- Audit ensuite réellement bloquant : le grand ruban de terrain principal recouvrait le passage. Maillage subdivisé et découpé ; un point sur le bord de la jonction avait encore un dénivelé avec l’asphalte principal. Hauteurs accordées au sol voisin et contrôle élargi jusqu’aux bords, terminé sans rencontre.
- Premier test de scène du passage : `TypeError: Cannot read properties of undefined (reading 'active')`, dû à une fixture qui supprimait les trois emplacements de poursuivants requis par le moteur. Fixture corrigée avec les emplacements réels.
- Test de caméra ensuite trop excentré à l’entrée (x projeté −0,641 en portrait) : repère de branche corrigé pour les points de caméra avant / après la jonction. Le contrôle vérifie le cadrage dans les virages avec une tolérance adaptée au déport de regard, et les cinq pupilles convergent.
- Sélecteur de revue `getByLabel('FORMAT', exact:true)` sans correspondance, lié au libellé avec espace ; sélection de l’élément `#format` réellement présent, puis contrôles mobiles terminés. Aucun changement du moteur pour contourner WebGL.
- Main a évolué pendant les contrôles : `bb38fe39d1bb449704509cd6e64762cfdd89efe2`, réaction 360° et trois moqueries, avec autorisation explicite indiquée dans OCULAIRE_ETAT.md. Brief entrant lu intégralement. Huit conflits d’imports / paramètres de cache résolus en gardant les ajouts de route et les corps entrants de réaction / audio. Le journal OCULAIRE, la logique des deux nouveaux modules, la synthèse audio et les tests entrants sont conservés ; 143 tests réussis après raccord. Ce n’est pas une reconstruction de la tête.
- **Publié** : jalon `949b9f653a00fe256d378cf594ca9dbf0c8dcc32`, raccord OCULAIRE `2d85fbdbe50b50d6f340c8aeb996528c6b97dc02`, arbre testé `4967979b7ccfb96cf8a582f4386c07811b09806a`. PR #8 fusionnée ; main `920d58a1c4b3d18347b9e05f9253e5840e72dc12`, même arbre, SHA distant vérifié. Pages `40824483377` terminé avec succès.
- **Contrôlé publiquement** : 48 ressources HTTP 200 et SHA-256 identiques au commit publié, dont modules du tracé / passage / débris, carte, audio / moqueries, OCULAIRE et portrait (`route-public.json`). Atlas `https://ia.fuckladouane.com/course/map.html?v=fld-route-003` ouvert, filtre forêt puis parcours entier exécutés, géométrie V4 observée, passage absent avant découverte. Aucune erreur du site sur la carte ; erreurs de métadonnées d’extension Chrome extérieures à l’application. Capture publique créée : `fld-route-v4-public-1793252455169.jpg`.
- **Accès au jeu contrôlé** : `https://ia.fuckladouane.com/course.html?v=fld-route-003` ouvert, accueil PARCOURS 04 et ressources V4 chargés. Le navigateur cloud refuse toujours le contexte WebGL : `FLD course boot: Error: Error creating WebGL context.`, `renderer.js?v=fld-route-003:111:83`, `main.js?v=fld-route-003:18:16`, après `GL_VENDOR = Disabled` / `GL_RENDERER = Disabled`. Le panneau d’échec est visible. Cela ne prouve pas une panne sur téléphone ; cela interdit de revendiquer ici une partie 3D ou une cadence GPU.
- **Documentation finale** : crédits actualisés pour la route V4 et le parc réellement implémenté B01 / C01 ; cette correction de texte ne change aucun module de jeu.
- **Suite des contrôles sur appareil** : conduite humaine dans les grands virages, perception des pneus / colis à vitesse normale, entrée et sortie du passage, reflets, fluidité et interruptions Safari. Le code, les tests, les preuves CPU / interface et les résultats de publication sont sauvegardés. Les entrées ci-dessous sont l’historique des versions antérieures.


## État courant — forêt et atlas, 29 octobre 2026

Branche : `feat/swagistan-world-20261029`. Premier jalon sauvegardé : `2cf0297b2bdf9f8368782ef62c034b68e8b3d494`. Base OCULAIRE intégrée : `0d69230fc42385fe8d55aa890e528788e20de384`. L’utilisateur a explicitement demandé de publier puis de poursuivre les décors, la forêt, les virages et la cartographie. Les mentions de non-publication ci-dessous sont l’historique du premier jalon.

- **Publié et contrôlé** : prototype B01 / C01, pause et quai, PR #6 fusionnée, commit main `f118e32b56f46c2435e2d26bade3f2228cb29149`, Pages `40816573727` réussi. 35 ressources servies identiques par SHA-256 : `course/validation/design-public-release-001.json`.
- **Conçu et implémenté, publication suivante en préparation** : forêt de chênes / bouleaux / pins à deux niveaux de détail, clairières et talus ; glissières continues suivant les courbes réelles et chevrons orientés ; neuf repères bâtis, chacun lié à un lieu de l’atlas, dans les cinq étapes. Aucun changement du tracé, de la simulation ou des collisions. Toit du tunnel limité exactement à 5,2–7,4 km, y compris le dernier tronçon de 80 m. Échelle de l’asphalte corrigée à trois mètres dans les deux axes ; moins de lampadaires sur la route ouverte, sans nouvelles lumières dynamiques.
- **Implémenté** : carte réelle des 13 km, cinq filtres d’étape, zoom, relief, dix contrôles et ouvertures tirées des données de jeu. Accès depuis l’accueil et la barre de course. Fenêtre native qui suspend simulation et audio ; fermer la carte exige ensuite la reprise explicite existante. Échap dans l’iframe ferme le parent par un message dont origine et source sont vérifiées.
- **Fichiers principaux** : `world-landscape.js`, `world-landmarks.js`, `route-atlas.js`, `map.html/css/js`, `atlas-dialog.js`, `atlas-shell.css`, `renderer.js`, `main.js`, `course.html`, `tests/world.test.js`, outils de mesure / audit et atelier de contrôle. Cache cohérent de tout le graphe : `fld-world-002` ; aucune nouvelle version des données du portrait ou de Three.js.
- **Testé** : 121/121 tests après raccord à OCULAIRE ; syntaxe de 74 fichiers JavaScript vérifiée. Tests de positions / gabarits, continuité des glissières, orientation des chevrons, occultation exacte aux deux portails, données réelles de carte et contrat de fermeture. Chrome cloud : carte et panneau observés dans des cadres CSS 390×844, 320×568 et 844×390 ; cibles d’au moins 44 px, absence de débordement horizontal, zoom et filtres, fermeture par bouton et Échap, retour du focus. Cela ne constitue pas une partie 3D.
- **Mesuré sans GPU** : `world-baseline-cpu.json` et `world-cpu.json`, Node v24.22.1 Linux, OCULAIRE prêt, DPR simulé 3, portraits / paysages, trois profils. Base / version : maillages visibles maximum 351 / 353 adaptatif et détaillé, 321 / 329 économique ; triangles maximum avant frustum 210 863 / 226 291 ; géométries maximum 228 / 265. Deux traversées identiques (244 / 244 géométries dans la nouvelle version) et huit retours réels au départ stables (234, 235 économique). Géométries partagées après retrait des tronçons : 152, 153 économique. Ce sont des budgets structurels, pas des appels GPU ni des FPS ; les 60 / 30 images par seconde restent à mesurer sur appareil.
- **Observé en projection CPU uniquement** : douze vues des vrais maillages via la vraie caméra de poursuite (forêt 2,8 km, relais 3,7 km, entrée / sortie tunnel, contrôle et portes du Swagistan), en 390×844 et 844×390. Route dégagée, masses de feuillage en dehors du couloir, repères de bord et continuité des rails visibles ; tête occultée par le toit dans le tunnel et retrouvée à la sortie. Outil reproductible : `tools/render-world-cpu.mjs`, relevé `world-camera-cpu.json`. L’éclairage de contrôle et les textures échantillonnées ne reproduisent pas les reflets / shaders du jeu ; aucun rendu WebGL n’est revendiqué.
- **OCULAIRE conservé** : chevelure dense, clignements et réactions arrière de main intégrés sans changement de logique ; appels de caméra d’inspection conservés. Comparaison de quinze sources protégées à main : identiques hors paramètres de cache, portrait et journal OCULAIRE strictement identiques. Rapport `world-preserved.json`.
- **Limite conservée** : contexte WebGL refusé dans le navigateur cloud (`GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `Error creating WebGL context.`). Pas d’observation de cette forêt depuis un rendu WebGL ni de FPS ou de validation iPhone. L’utilisateur a demandé la publication en connaissance du blocage décrit au jalon précédent ; cette version reste présentée avec cette limite.
- **Incidents corrigés** : Échap reçu dans l’iframe ne fermait pas le dialogue parent ; ajout du message vérifié puis fermeture et focus réellement observés. Deux états intermédiaires de cache incohérent ont fait échouer le test de version ; unification du graphe puis suite complète réussie. Sept conflits d’imports / cache au raccord de main résolus en gardant les ajouts du monde et la logique OCULAIRE entrante. Dans l’outil CPU uniquement : `TypeError: base.getComponent is not a function`, car Three.Color fournit r/g/b ; accès corrigé, douze captures produites ensuite.
- **Publié** : raccord sauvegardé `c7291f3120c8b177ea2b10dedf4b31485a0abde0`, arbre `e1a088cafd8da5b86e44b28a140e9447b2cfb82f`, PR #7 fusionnée. Commit main `c1c4aa4f16913f2454f60d3d996a6b3bd5fa9538`, même arbre ; SHA distant vérifié. Pages `40820279669` : terminé, succès.
- **Contrôle public exécuté** : `https://ia.fuckladouane.com/course.html?v=fld-world-002` et `https://ia.fuckladouane.com/course/map.html?v=fld-world-002` ouverts. 44 ressources HTTP 200 et SHA-256 identiques au commit publié, y compris carte / CSS / JS, modules du monde, OCULAIRE et portrait : `world-public.json`. Carte publique observée, filtre forêt puis parcours entier exécutés, neuf lieux et dix ouvertures affichés. Aucun message d’erreur provenant du site sur la carte (seules erreurs d’extension Chrome). Capture de preuve créée dans cette session.
- **Limite publique confirmée** : le jeu atteint son panneau d’erreur dans ce navigateur dont le contexte WebGL est désactivé. Erreur exacte : `FLD course boot: Error: Error creating WebGL context.`, `renderer.js?v=fld-world-002:110:83`, après `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `BindToCurrentSequence failed`. Le succès HTTP / Pages ne remplace pas un rendu 3D. Aucun test de conduite ou de fluidité sur téléphone n’est déclaré.
- **Prochaine action de design** : observer une partie WebGL sur téléphone pour juger reflets, distance des arbres, chevauchements visuels et régularité des images. Le parc automobile reste au jalon prototype (B01 et C01), les autres carrosseries et le redesign complet de tous les panneaux restent des jalons distincts.

Date : 29 octobre 2026. Branche : `feat/swagistan-design-prototype-20261029`.
Base initiale : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec`. Base actuelle intégrée : `764dcc90c33fcc5577fff29ea2499aaab6f064d9` (main a évolué pendant la mission). Aucun changement local préexistant, aucun AGENTS.md dans le dépôt.

Sauvegardes distantes : audit `9510abca036631aa3a2dcb6333f8db97ee385363` ; premier prototype `c8bb47d55495ce12f947eda7c8288cab4b8d8a32`. Raccord sauvegardé et vérifié : `90d270f57621f450e8a0e7bad5106fc5b968eb1d`, arbre `db3ea581ef4ba34b7ec5f6179674b5691c9bdcce`, avec les deux historiques conservés.

Revue en brouillon créée et relue : https://github.com/y92pctjcjs-sys/IA-fuckladouane/pull/6 . Aucun merge ni déploiement du prototype. Les tests et mesures ci-dessous portent sur ce commit de code ; cette dernière mise à jour ne change que le journal.

## Jalon 1 — audit

- Dépôt cloné avec historique et branches ; publication existante : GitHub Pages, main / racine (README). Ne pas migrer l’hébergement ni toucher CNAME.
- HTML public récupéré par HTTP 200, identique octet pour octet à la base : SHA-256 `cf86af46f43698d76bca6b5f639c4148c182c154249032fdf484b8880180ac2b`. Les 29 ressources du graphe chargé, CSS et logo ont été comparées par SHA-256 : toutes identiques. Rapport `course/validation/design-public-base.json` ; transfert HTTP seul, pas temps de chargement complet du jeu.
- Three.js local, simulation fixe 120 Hz distincte du rendu, 13 000 m / cinq étapes, dix tronçons recyclés, sept civils et trois poursuivants (une patrouille + deux banalisées), six livrées équipables. Géométrie civile actuelle partagée : voiture muscle, trois peintures.
- Gabarits de collision inchangés : trafic ±0,95 m / ±2,05 m ; poursuivant ±0,98 m / ±2,12 m. Les nouveaux modèles doivent remplir ce gabarit suffisamment pour ne pas tromper le joueur ; aucune variation de taille par transformation globale.
- `npm test` : 92/92 ; `npm run check` : 51 fichiers. Mesures de référence : `course/validation/design-baseline-cpu.json`. Construction scène CPU 1 075 ms ; deux traversées CPU 2 546 ms ; maximum 346 maillages visibles, 170 géométries vivantes, dix tronçons. Ces nombres dépendent de l’hôte et ne sont pas des appels GPU ni une mesure de fluidité.

## OCULAIRE — état actuel protégé

- À l’audit initial, OCULAIRE était absent de main. Pendant cette mission, main a reçu son intégration et son journal de publication ; cette évolution a été détectée avant la livraison.
- Nouvelle base `764dcc9`, code OCULAIRE publié indiqué par son journal : `264ddc7`. Branche artistique actuelle : `2b6202a63c7ac20d4bac6356773ff7ffe3e65db1`. Ancienne branche d’import `6bde5dc9c484e9f855d5079e5f0911e9b6cf4ce5` préservée.
- `OCULAIRE_ETAT.md` actuel lu intégralement puis conservé sans modification. Visage, pigments, cinq regards, occultation, paroles et finale restent ceux de main. L’import, l’animation, l’appel de caméra, la remise à zéro et la libération OCULAIRE sont conservés dans renderer.js.
- Les surfaces du portrait, les modules `oculaire.js` / `oculaire-finale.js`, le journal et les autres sources protégées sont identiques octet pour octet à cette nouvelle base ; détails dans `course/validation/design-review.json`.
- 32 ressources publiques comparées au nouveau commit de base, HTTP 200 et SHA-256 identiques : `course/validation/design-oculaire-public-base.json`. Ce contrôle porte sur les octets servis ; le rendu WebGL de cette mission reste non observé.
- Aucun nouveau visage, aucune reconstruction, aucune écriture sur les branches OCULAIRE ou sur main.

## Références examinées

- Site officiel Asphalt Legends : https://asphaltlegends.com/fr ; page d’accueil et bloc COURSE D’ARCADE réellement observés dans le navigateur.
- Gameloft : https://www.gameloft.com/newsroom/asphalt-legends-touge-masters-summer-season-update-52.
- Lecture retenue pour FLD : grand volume de carrosserie devant un horizon moins contrasté ; reflet large qui explique le galbe ; vitrage sombre continu mais piliers distincts ; optiques découpées ; panneau opaque, typographie condensée, une action dominante et peu de diagonales. Ce sont des choix de design issus de l’observation, pas une copie des ressources.

## Erreurs et limites constatées avant modification

- Recherche web sur la page du jeu : `URL https://ia.fuckladouane.com/course.html is not accessible via this tool.` Lecture HTTP et navigateur utilisés pour les contrôles adaptés.
- Navigateur cloud, Chrome, fenêtre 1365 × 936 environ : `THREE.WebGLRenderer: A WebGL context could not be created. Reason: Could not create a WebGL context ... GL_VENDOR = Disabled, GL_RENDERER = Disabled ... ErrorMessage = BindToCurrentSequence failed:` puis `Error creating WebGL context.` Le panneau MOTEUR INDISPONIBLE est visible sur la version publique de base. C’est une limite de cet environnement ; aucune preuve que le jeu échoue sur l’appareil du joueur.
- Pas de rendu de course, de FPS GPU, de régularité des images, de mémoire GPU ou de temps au premier rendu disponibles. Aucun essai sur iPhone physique. Les trois profils restent à mesurer ; aucun budget GPU définitif fixé.
- Chargement de la version réunie dans le navigateur de revue : même refus de contexte WebGL à `renderer.js?v=oculaire-003:110`, remonté jusqu’à `main.js:15`. Le panneau d’échec du jeu est correctement visible ; aucun résultat de course n’est déduit de ce chargement.
- Ne pas utiliser les anciens fichiers de validation ou une projection CPU comme preuve d’un rendu WebGL actuel.

## Jalon 2 — prototype implémenté, validation en course en attente

1. `course/road-vehicles.js` : B01 graphite, hayon court ; C01 ivoire, pavillon haut et bombé, vitrage avancé, nez plus arrondi et empattement plus court. Matériaux peinture / vitrage / plastique distincts, roues partagées, deux niveaux de détail. Version civile B01 et banalisée : même coque et même peinture ; modules bleus de calandre / pare-brise / lunette éteints chez le civil. Freins pilotés par la décélération propre à chaque voiture ; remise à zéro au redémarrage.
2. `models.js` / `renderer.js` : remplacement des seuls civils d’indices 0 et 1 et de la banalisée d’indice 1. Les cinq autres emplacements civils, la seconde banalisée, la patrouille et le joueur conservent leurs modèles. Sept civils et trois poursuivants, règles d’apparition et comportements inchangés. Pas de nouvelle allocation de géométrie pendant l’animation des voitures.
3. `course/design-system.css` et `course.html` : panneau de pause anthracite opaque, filet acide, informations cyan, action de reprise dominante ; composition paysage sur deux colonnes. Les identifiants `resume`, `pauseHelp`, `pauseSettings` et leurs événements de production restent inchangés. Les autres panneaux ne sont pas encore redessinés.
4. `course/design-scenery.js` : un quai, deux portes de chargement, bureau décalé, auvents, ventilation et clôtures à une seule extrémité du premier tronçon industriel. Solide le plus proche à 16,5 m du centre de route ; aucun obstacle décoratif ajouté aux règles. Un seul cube partagé et sept matières au maximum, regroupement par l’instanciation existante ; aucun point lumineux dynamique supplémentaire.
5. Revue locale : `course/design-review.html` ouvre le jeu réel, le composant de pause isolé et les projections de géométrie CPU. `design-panel.html` reprend le vrai HTML depuis `course.html` ; sa reprise factice est explicitement étiquetée aperçu et n’écrit ni scores ni préférences. Aucun mode de contournement WebGL n’a été ajouté au jeu.

## Vérifications exécutées sur le prototype

- Premier prototype avant raccord OCULAIRE : `npm test` 98/98. Après raccord à la nouvelle base : `npm test` **106/106** (100 de la base + six contrôles de contrat du prototype), `npm run check` **63 fichiers JavaScript**. Les scripts de revue inline sont chargés dans le navigateur, séparément du contrôle Node. Après raccord OCULAIRE, aide ouverte en paysage puis fermée avec Échap : focus revenu à `pauseHelp`. Panneau entièrement compris entre y=74 et y=325,5 dans le cadre interne 842 × 388 (cadre externe 844 × 390 avec bordure).
- Gabarits avec modules bleus et freins allumés : largeur ≤1,90 m, longueur ≤4,10 m. Les petits volumes périphériques sont inclus, ombre exclue. Coques fermées vérifiées par rayons aux deux extrémités ; sommets et normales finis ; absence de rampe de toit.
- Roues : rotation, direction, freinage par décélération propre, gel en pause et remise à zéro contrôlés. Coque / peinture civile et banalisée identiques ; signaux cachés au départ. Niveaux de détail restaurables et mis en cache.
- Géométrie par modèle : 5 512 triangles proches ; 4 224 éloignés pour B01, 4 296 pour C01. Douze maillages visibles par voiture normale hors ombre, quinze avec signaux et freins allumés. Ce décompte CPU n’est pas une mesure des appels GPU réels.
- Projection CPU des maillages réellement inspectée : `course/design-volumes.html` (projection reproductible avec `tools/inspect-design.mjs`). Le pavillon / vitrage de C01 a été différencié davantage après cette inspection. Ce fichier ne restitue pas les reflets, les shaders, le vitrage transparent ni la lecture à vitesse normale.
- Chrome cloud, cadres CSS : 390 × 844, 320 × 568 et 844 × 390. Panneau réellement observé, réglages ouverts puis fermés, focus rendu au bouton de réglages. En 320 px : reprise 241 × 64,8 px, commandes et réglages 116,5 × 48 px, retour 241 × 48 px. Défilement vertical disponible en petit portrait ; actions toutes visibles en paysage après correction de la grille. Encoches réelles, clavier virtuel et préférence système de mouvement réduit non essayés sur téléphone physique.
- La simulation, ses tests de pause / reprise, les entrées multitactiles, l’audio séparé, les records, les barrages et le tirage amoureux sont couverts par la suite existante. Cela ne remplace pas une partie manuelle dans le navigateur.

## Mesures initiales sans OCULAIRE — historique

Rapports : `course/validation/design-prototype-cpu.json` et `design-review.json`. Linux x86_64 / Node (version exacte dans le rapport), récepteur de scène CPU, cadre 390 × 844 et DPR simulé 3, résolution cible du profil automatique plafonnée à ×1,25 ; aucun contexte GPU.

| Compteur CPU | Base | Prototype |
| --- | ---: | ---: |
| Maximum de maillages visibles | 346 | 325 |
| Géométries vivantes maximales | 170 | 200 |
| Géométries partagées après retrait des tronçons | 96 | 126 |
| Tronçons résidents maximaux | 10 | 10 |

Dernier relevé prototype : construction 421 ms, deux traversées 1 150 ms. Les exécutions ponctuelles n’ont pas une charge CPU contrôlée ; les temps ne démontrent aucun gain de fluidité par rapport à la base. La baisse du nombre de maillages s’accompagne de 30 géométries partagées supplémentaires. Il reste à mesurer les octets réellement résidents GPU et les textures avant de fixer le budget final.

Dans la comparaison initiale avant raccord OCULAIRE, les six parcours à cadences 30/60/144 Hz et les douze rencontres à graines fixées donnent les mêmes résultats simulés que cette base initiale. Le contrôle initial portait sur vingt fichiers protégés. Le rapport final compare de nouveau les sources protégées, cette fois à main `764dcc9`, et inclut les sources OCULAIRE ; toutes sont identiques octet pour octet.

| Profil | Navigateur disponible | Fluidité / régularité / mémoire GPU | Appareil physique |
| --- | --- | --- | --- |
| Adaptatif | Chrome cloud, contexte WebGL refusé | Non mesurées | Non testé |
| Économique | Même environnement | Non mesurées | Non testé |
| Détaillé | Même environnement | Non mesurées | Non testé |

60 et 30 images/s restent des objectifs. Aucun budget de rendu définitif ni temps au premier rendu n’est annoncé.

## Mesures actuelles avec OCULAIRE chargé

`measure-design-scene.mjs` attend explicitement le statut `ready` du portrait. Les anciens relevés du récepteur de scène synchrone n’attendaient pas cet import asynchrone ; ils restent archivés comme référence du premier prototype.

Comparaison de la nouvelle base isolée dans un checkout sans modifications avec le prototype réuni : Linux x86_64, Node v24.22.1, CPU uniquement, cadres 390 × 844 et 844 × 390, DPR simulé 3, intensité décorative réduite. Rapports `design-oculaire-baseline-cpu.json` et `design-oculaire-prototype-cpu.json`.

| Mesure structurelle | Base avec OCULAIRE | Prototype avec OCULAIRE |
| --- | ---: | ---: |
| Maillages visibles maximum, adaptatif / détaillé | 372 | 351 |
| Maillages visibles maximum, économique | 342 | 321 |
| Géométries vivantes maximum | 198 | 228 |
| Géométries en fin de parcours, deux traversées | 168 / 168 | 198 / 198 |
| Nouvelles géométries après huit remises à zéro | 0 | 0 |

Le portrait atteint `ready` dans les six cas de chaque version. Le nombre de géométries est stable entre les deux traversées et les huit remises à zéro. Ces opérations ne valident ni shaders, ni mémoire GPU, ni pause / reprise manuelle. La baisse des maillages et les trente géométries partagées supplémentaires restent un budget CPU provisoire, sans conversion en FPS.

## Sauvegardes et incidents traités

- Réunion avec main : trois conflits de contenu dans `course.html`, `models.js` et `renderer.js`. Les imports utilisent la version actuelle `oculaire-003` ; les appels OCULAIRE sont conservés et la remise à zéro du prototype est ajoutée à côté de celle du portrait. Tests relancés après résolution.
- Premier contrôle après ce raccord : `AssertionError [ERR_ASSERTION]: design-projection.js` dans la règle interdisant les URL réseau des modules de jeu. Cause : la déclaration XML du namespace SVG, sans requête réseau. L’aperçu HTML utilise désormais son namespace SVG implicite ; l’export SVG autonome ajoute la déclaration dans l’outil Node. La protection n’est pas affaiblie ; 106/106 ensuite.
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

Raccord sauvegardé sur la branche dédiée avec rapports finaux pour une revue en brouillon. Reprendre au jalon 3 dans un navigateur fournissant un contexte WebGL : observer les deux silhouettes et le quai depuis la caméra de course, les modules bleus en approche / révélation, les freins, virages et barrages dans les deux orientations ; mesurer les trois profils et plusieurs redémarrages. Ensuite seulement décliner B02–B05, les civils C02–C08 et le reste des panneaux / décors. Avant une publication future : changer la version de cache de manière cohérente et vérifier le graphe associé. Aucune modification de main, aucun déploiement de ce prototype.


## Publication demandée après la revue

Le 29 octobre 2026, l’utilisateur demande explicitement de mettre ce prototype en ligne puis de poursuivre les décors, la forêt, la lecture des virages et la cartographie complète. Cette instruction remplace la mise en attente de publication du jalon précédent. La limite WebGL du navigateur de contrôle reste déclarée : aucune cadence mobile ni validation visuelle en course supplémentaire n’est annoncée. Cache des modules unifié : `fld-design-001`.

Prochain jalon autorisé : publication par la PR 6 / Pages, contrôle des octets publics, puis extension du monde sur une nouvelle branche et seconde publication.
