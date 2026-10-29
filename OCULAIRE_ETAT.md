# OCULAIRE — victoire, ralenti et route infinie

Date : 29 octobre 2026. Branche : `feat/oculaire-victory-drive-20261029`.
Base distante relue : `75b9714` ; les virages V4, le raccourci forestier et les débris sont conservés.
Brief complet : `course/OCULAIRE_VICTOIRE_ROUTE_INFINIE.md`.
Statut : implémenté et contrôlé en calcul ; préparation de la preuve visuelle et de la livraison.

## Jalon 1 — mise en scène raccordée

- Sept premières secondes de la finale normale conservées : chute, envers, impact et fracture. Après la fracture, ralenti de la voiture et des roues, accompagnement en trois-quarts, reprise de vitesse puis caméra laissée derrière tandis que la voiture s’éloigne dans la brume.
- Quatorze premières secondes de la rencontre amoureuse conservées. Le départ de la station et le raccordement à la route suivent les dialogues. Durée totale : 14,8 secondes en fin normale, 21,8 secondes pour la rencontre ; défaite inchangée à 4,5 secondes.
- Mouvement visuel analytique : score, chronomètre, distance de course et résultat figés à l’arrivée. Roues animées par distance réellement parcourue par le modèle. Pause stable, remise à zéro au rejeu et accompagnement plus discret avec mouvements réduits.
- Route de sortie au-delà des échantillons du tracé, dans un seul nouveau maillage fixe avec brume. Aucun nouveau tronçon créé par image. Déplacement conservé derrière les résultats jusqu’à disparition visuelle ; animation de fond bornée à 60 secondes pour éviter une croissance indéfinie de coordonnées.
- Son de moteur lié à la vitesse visuelle et atténué avec l’éloignement, sur le bus moteur existant. Musique et moqueries conservées.
- Quatorze tests ciblés réussis : cadrage des vrais sommets visibles à trois formats, caméra, roues, pause, score, reprise et bus audio. Tests complets et contrôles CPU consignés au jalon suivant.

## Corrections effectuées pendant le contrôle

- Premier contrôle audio : `assert.ok(engine.frequency.target<60)` échoue. Cause : assertion supposant un régime arbitraire, incompatible avec le modèle de boîte de vitesses existant ; contrôle corrigé pour le régime calculé à la vitesse visuelle de 6,5 m/s. Fin normale rendue déterministe dans ce test.
- Première trajectoire de caméra observée en raster CPU : passage derrière un lampadaire. Arc ramené dans le corridor de la route, en trois-quarts arrière, sans grande traversée des accessoires de bord de route.
- Contrôle de cadrage initial par boîte alignée au monde : `vehicle frame escape/320/0: -1.017304…` puis `love/320/0: -1.110326…`. Distance affinée pour les formats étroits et test remplacé par la projection des vrais sommets visibles, instances comprises, afin de ne pas confondre une boîte fictive avec le maillage rendu. Contrôles ciblés réussis ensuite.
- Aucune observation WebGL ou validation iPhone/Safari nouvelle à ce jalon. Le raster CPU contrôle la géométrie et la caméra, avec un éclairage de contrôle.

---

## Historique conservé

# OCULAIRE — 360° et trois moqueries, 29 octobre 2026

Branche : `feat/oculaire-impact-mockeries-20261029`.
Base distante vérifiée par git : `c0acf1e` (forêts, décors dans les courbes et atlas de 13 km conservés).
Brief courant complet : `course/OCULAIRE_IMPACTS_MOQUERIES.md`.
Statut courant : implémenté, vérifié et sauvegardé ; autorisation explicite de publication obtenue le 29 octobre 2026. Publication et vérification du déploiement en cours.

## Jalon 1 — implémentation locale

- Un compteur de dégâts accepté déclenche un tour vertical de 360°, en 0,88 seconde ; une seconde avec mouvements réduits. Pause stable, reprise, remise à zéro, dégât fatal et priorité de la finale gérés. La tête tourne sur place ; les pupilles héritent de son tour puis reprennent la voiture comme cible.
- Trois sons originaux non verbaux : rire en cascade, gna-gna-gnère nasal, souffle et ricanement. Buffers mono préparés une fois, sélection en permutation de trois sans répétition immédiate, bus BRUITAGES existant, nettoyage des sources. Aucun rattrapage après son coupé.
- Sources du portrait et de la chevelure, simulation, collisions, véhicules, forêts, atlas, QR et portail préservés. Graphe de cache limité aux modules modifiés : `oculaire-impact-005` ; monde stable `fld-world-002`.
- Atelier 3D enrichi d’un bouton dégât ; atelier audio indépendant de WebGL ajouté.
- 121 tests existants réussis après raccordement. Sept contrôles audio réussis. Huit contrôles spécifiques ajoutés ; premier passage : sept réussis, un échec de test `AssertionError: actual -0, expected 0` sur le premier échantillon audio. Cause : égalité stricte distinguant le zéro signé produit par le fondu. Assertion corrigée pour comparer la magnitude, sans changer le son ; relance globale à effectuer.
- Jalon 1 sauvegardé sur la branche distante : `d89e971d2e744c59368b86ad80b49d223f33535e`.

## Jalon 2 — vérifications exécutées

- `npm test` : **132/132 réussis** ; `npm run check` : **77 fichiers** vérifiés. Le contrôle du zéro signé corrigé passe ; aucun changement audio n’a été requis pour cet échec d’assertion.
- Un tour par impact accepté ; contacts ignorés sous invulnérabilité sans effet ; calcul à 30/60/144 Hz identique ; pause stable ; nouvelle partie nettoyée ; dégât fatal animé en interception ; victoire prioritaire.
- Vrai portrait vérifié pendant le tour : retour à l’orientation initiale, pupilles solidaires du visage pendant le tour puis cinq regards convergents vers la voiture ; inscription arrière de finale cachée. Cadre vérifié à 320×740, 390×844 et 844×390, trois voies et plusieurs virages.
- Animation CPU de 22 poses du vrai maillage observée : `course/validation/oculaire-impact-cpu.html`. Elle montre le tour, son envers et le retour de face avec un éclairage de contrôle ; ce n’est pas un enregistrement du moteur WebGL.
- Vrai `AudioContext` activé par clic dans le navigateur : trois variantes déclenchées avec `hit()`, chacune affichant son identifiant attendu. BRUITAGES à zéro : aucune moquerie planifiée. SON OFF : zéro source ponctuelle et ordonnanceur arrêté. 416 304 octets de buffers observés au taux du navigateur ; 453 120 octets à 48 kHz.
- Données audio finies, déterministes, trois formes d’onde distinctes, crête 0,82 et fondu aux deux extrémités. Les tests vérifient aussi la réutilisation des buffers, le bus de volume, le nettoyage, les interruptions et l’absence de relecture des impacts silencieux.
- WebGL toujours indisponible dans le navigateur cloud : `THREE.WebGLRenderer: Error creating WebGL context.` / `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `BindToCurrentSequence failed`. Cause liée au contexte du navigateur ; aucun changement du moteur ou des protections pour la contourner. Pas de test iPhone/Safari ni de mesure de performance téléphone. L’observation WebAudio atteste son déclenchement et son état ; aucune écoute humaine ou capture du haut-parleur n’est revendiquée.
- Aucun message d’erreur de l’application audio observé ; le journal contient des erreurs de métadonnées de l’extension Chrome, extérieures au jeu.
- Rapport versionné : `course/validation/oculaire-impact-report.json`. Publication à suivre après dernier contrôle de main.

## Jalon 3 — sauvegarde terminée, publication bloquée

- Implémentation distante : `d89e971d2e744c59368b86ad80b49d223f33535e`. Vérification et preuve CPU : `113e8d0e7fb8086e7888b32e61473a3ea02c3d2b`. Arbre testé : `938cf2db866a06ceef094a4fa4b77ce06210c68c`.
- Tentative d’avancer `main` vers `113e8d0` rejetée par le contrôle automatique. Erreur exacte : `This action was rejected due to unacceptable risk.` Motif : `This directly advances the default main branch and can deploy or disrupt the public game; the transcript authorizes repository work but does not clearly authorize this exact production publication without confirmation.`
- Aucune nouvelle tentative ni déploiement indirect. `git fetch origin main` après le rejet confirme main toujours sur `c0acf1e0e5e0eb7232a8d721d2debf08a495feda`. Son dernier déploiement Pages est réussi (`40820549964`) ; il ne contient pas la présente modification.
- Le résultat reste entièrement disponible sur la branche `feat/oculaire-impact-mockeries-20261029` et dans l’aperçu local. Planche CPU ouverte et observée ; l’atelier audio permet d’écouter les trois sons avec le moteur audio réel.
- Reprise : demander l’autorisation explicite de publier le 360° et les trois moqueries dans le jeu public. Après accord, relire le SHA actuel de main, intégrer tout changement concurrent, vérifier le contenu puis mettre main à jour avec garde sur son SHA. Attendre le déploiement Pages et comparer les fichiers servis aux fichiers testés. Distinguer cette publication du contrôle WebGL, toujours non exécuté ici.
- Le présent jalon met uniquement la branche de travail à jour. Pas de succès de publication revendiqué.

## Jalon 4 — publication autorisée

- L’utilisateur confirme explicitement la publication du 360° et des trois moqueries dans le jeu public après la demande d’accord du jalon précédent.
- État distant vérifié à nouveau par `git fetch` et `git ls-remote` : main reste `c0acf1e0e5e0eb7232a8d721d2debf08a495feda` ; branche complète sauvegardée `79dbff04614b7dbc6cc67823065dbdad601ccca1`. Aucun changement concurrent à intégrer à cette vérification.
- Code et preuves identiques à la version contrôlée à 132 tests / 77 fichiers. Seuls le présent journal et le rapport de publication sont mis à jour depuis le jalon validé ; aucune nouvelle modification de comportement.
- Publication autorisée sur main avec garde du SHA attendu. Ne déclarer la version publiée qu’après déploiement Pages réussi et comparaison des fichiers servis aux fichiers testés.

---

## Historique conservé

# OCULAIRE — chevelure et présence, mise à jour du 29 octobre 2026

Branche : `feat/oculaire-chevelure-presence-20261029`.
Base intégrée et vérifiée : `f118e32b56f46c2435e2d26bade3f2228cb29149` (nouveaux véhicules, panneau de pause et quai industriel conservés).
Brief exécuté : `course/OCULAIRE_CHEVEUX_PRESENCE.md`.
Statut : implémenté et contrôlé en calcul / rastérisation CPU ; publication en cours.

## Modifications de cette mise à jour

- Chevelure 3D dense : couverture opaque ajustée au vrai relief du crâne, mèches ondulées, frange et longues mèches latérales ; silhouette plus féminine. Le visage, les cinq yeux, trois nez et trois bouches restent ceux de la référence.
- Géométrie des cheveux réunie dans la surface existante : toujours 26 surfaces ; tête complète à 99 653 triangles. Pas de texture lourde ajoutée et aucun cheveu traité comme objet individuel.
- Clignements brefs irréguliers : moyenne de dix par minute au lieu d'environ huit, soit environ 28 % de plus.
- Réactions de la tête aux patrouilles actives situées derrière le joueur, pondérées par leur distance et leur position latérale. Position, rotation et inclinaison lissées ; les cinq pupilles continuent à converger vers la voiture du joueur.
- Pause, nouvelle partie, mouvements réduits et finale préservés. Les nouveaux cheveux et leur inscription font partie des mille groupes de fragments.
- Cache de l'intégration en `oculaire-004` ; modules, véhicules, décors et styles stables conservés en `fld-design-001`.

## Vérifications exécutées pour cette mise à jour

- 113/113 tests Node ; syntaxe de 67 fichiers vérifiée après intégration sur la dernière version de main.
- Couverture de la partie haute du crâne : 120 rayons sur la vraie géométrie, avec les cheveux devant la peau. Cinq ouvertures d'yeux dégagées.
- Réactions gauche / droite et proximité des patrouilles ; absence de réaction aux véhicules non révélés, civils, éloignés ou passés devant. Résultat stable à 30 / 60 / 144 Hz, figé en pause et réinitialisé pour une nouvelle partie.
- Convergence des cinq regards vérifiée pendant les rotations et déplacements du visage, dans plusieurs voies et virages. L'ancien contrôle de cadrage surestimait le volume par une boîte alignée au monde : diagnostic confirmé sur les sommets réellement projetés ; contrôle corrigé sans changer la position céleste de base.
- Cinq vues raster 3D CPU observées : face, trois quarts, profil, sommet et envers. L'inscription `douaniere` reste lisible et suit le volume de la nouvelle chevelure.
- Attributs des fragments, avec l'inscription : 13 243 785 octets ; mille groupes dans un appel de rendu.
- Données sources du portrait inchangées : SHA-256 `c01342482ab7389412ea34134db81fef4d5f7ad7fa533f2f97c71fe9da50924a`.
- Rapport de cette session : `course/validation/oculaire-cheveux-report.json`. Planche de contrôle : `course/validation/oculaire-cheveux-cpu.html`.

## Limites et incidents de cette session

- Le navigateur cloud ne crée pas de contexte WebGL : `THREE.WebGLRenderer: Error creating WebGL context.` Diagnostic détaillé : `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `BindToCurrentSequence failed`. Aucun résultat WebGL nouveau n'est revendiqué pour cette session. Les vues de contrôle sont une rastérisation CPU des vrais maillages, avec un éclairage de contrôle différent du jeu.
- Le rendu VTK hors écran a échoué avec `bad X server connection. DISPLAY=` ; cette installation ne fournit ni backend EGL ni OSMesa. Changement de méthode vers le raster CPU natif, sans modifier l'infrastructure du navigateur ou le moteur du jeu pour contourner sa limite.
- Première configuration de prévisualisation : `static.directory must be a relative directory beneath the site root`. Corrigée en préparant le répertoire de prévisualisation `dist`.
- La branche main a évolué pendant le travail. Réintégration sur `f118e32` et résolution des versions de cache en conservant les nouveaux modules de véhicules, décors et interface. Les fichiers de mécanique, QR et portail ne sont pas modifiés.
- Pas de test sur iPhone physique ou Safari. La validation publique à effectuer porte sur le déploiement, l'accessibilité HTTP et les octets servis ; elle ne transformera pas les contrôles CPU en test WebGL.

## Publication et reprise

Vérifier le SHA distant de main avant publication, publier le correctif sans écraser de nouveaux changements, puis vérifier le déploiement et les ressources servies. Conserver le dernier résultat sur cette branche.

---

## Historique de la livraison précédente

# OCULAIRE — état de reprise

Date : 29 octobre 2026. Branche : `feat/oculaire-art-direction-20261029`.
Base publique vérifiée : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec`.
Reprise du jalon antérieur : `6bde5dc9c484e9f855d5079e5f0911e9b6cf4ce5`.

## Correction utilisateur appliquée

Travail de design du jeu : OCULAIRE sert de référence artistique complète. Ne plus imposer le chargement direct du GLB ni modifier les mécaniques pour l'intégrer. Adapter seulement ce qui est nécessaire et préserver la machine existante.

## Sources et adaptation

- Brief artistique actuel lu intégralement avant modification. Sculpture validée v4 et référence visuelle retrouvées et examinées.
- Source GLB : 41 870 456 octets, SHA-256 `08ac7e703ce322dadbd3c5a8be83955c17ca8289fa739c260575ffe248c5d10e`. Source inchangée et exclue du chargement du jeu.
- Adaptation native : surfaces quantifiées avec pigments échantillonnés depuis les textures. 94 310 triangles, 60 055 sommets, 26 surfaces ; 1 717 474 octets de données JavaScript autonomes. Source : 545 576 triangles / 243 maillages.
- Cinq yeux, trois reliefs de nez, trois bouches ; les surfaces de dents et les cornées transparentes superflues sont exclues. Les textures d'origine ne sont pas repeintes ; la géométrie de production est simplifiée.
- Les fichiers du portail, QR, domaine, simulation, contrôles, difficulté, véhicules, sons, scores et tirage amoureux ne changent pas de comportement. Version de cache unifiée `oculaire-003`.

## Implémenté

- Présence 3D dans le paysage, occultation normale par profondeur ; cinq axes de regard calculés séparément vers la voiture ; clignements déterministes irréguliers.
- Cinq paliers de croissance progressive sur les cinq étapes existantes. Six phrases espacées, variantes par graine, report devant les alertes de conduite ; trois bouches animées avec retenue.
- Victoire : gerbes cyan / magenta / acide / ivoire, chute et rotation, cheveux portant `douaniere`, maintien lisible de l'envers, impact à 4,7 s, mille fragments de surfaces pigmentées animés dans un seul appel de rendu.
- Fin normale à 7 s et rencontre à 14 s conservées ; scène amoureuse originale après la révélation. Pas de finale sur défaite.
- Temps des animations lié à la simulation ; remise à zéro et intensité réduite. Atelier de prévisualisation exploitable dans `course/oculaire-preview.html`.

## Vérifié à ce jalon

- `npm test` : 100/100 tests réussis.
- Calcul des regards et cadrage : trois formats, trois voies, tracé échantillonné tous les 300 m ; cinq regards à moins de 0,000001 radian de leur cible.
- Rendu réel observé en Chromium headless / WebGL logiciel : course portrait, envers et fracture. Aucune erreur JavaScript ni shader observée dans ces captures.
- Premier rendu gris : éclairage émissif uniforme identifié et supprimé. Premier contrôle de cadrage trop large à 11 400 m / 320 px : direction vers le tracé proche corrigée ; tests de cadrage réussis ensuite.
- Ressources des fragments : 12 541 122 octets d'attributs GPU, 1000 groupes, un seul objet de rendu. Mesure dans Chromium logiciel : scène ouverte 172 appels / 132 424 triangles ; même base sans OCULAIRE 146 appels / 38 114 triangles. 20 images chronométrées après préchauffage : médiane 1,9 ms / p95 3,1 ms pour les appels de rendu, contre 2,5 / 3,7 ms pour la base. Ces petits échantillons ne prouvent ni un gain de vitesse ni une cadence sur iPhone.

## Vérification finale exécutée

- `npm test` : 100/100 ; `npm run check` : 56 fichiers. Rapport synthétique versionné : `course/validation/oculaire-report.json`.
- 68 cas réels Chromium / WebGL logiciel : trois voies, portraits 390 × 844 et 320 × 740, paysage 844 × 390, tunnel occultant la tête, vue de contrôle et dernière frontière.
- Finale normale et amoureuse inspectées de 0 à 7 s tous les quarts de seconde ; captures observées de la face en rotation, du mot dans les cheveux, de l'approche du sol et des fragments réels. L'inscription se fragmente avec les surfaces capillaires.
- Pause stable à 2,6 et 5,05 s ; mouvements réduits ; défaite sans inscription ni fragments. Interface réelle parcourue jusqu'aux résultats des trois issues, y compris les 14 s de la rencontre ; bouton rejouer réinitialisant les effets.
- Boutons pause / reprendre, interruption de fenêtre, préférences et coupure indépendante du moteur vérifiés. Volume général conservé à 75 %.
- Test HTTP 404 volontaire du portrait : erreur identifiée et course toujours utilisable ; ce cas reste explicitement marqué `error`, jamais présenté comme une intégration réussie.
- Cinq pupilles observées de près. La texture de sclère d'origine contenait un iris peint ; il est supprimé de la version adaptée pour éviter une seconde pupille immobile. Iris mobiles et pigments du visage conservés.
- Aucune erreur JavaScript ni shader dans le parcours normal ; erreurs attendues du scénario HTTP 404 isolées dans le rapport.
- Source d'origine intacte. Le rendu adapté est une simplification pour le jeu, pas un substitut haute définition au modèle d'atelier.
- Aucun essai sur iPhone physique ou Safari. Les interactions de visibilité du jeu gardent leur logique existante ; interruption de fenêtre testée dans Chromium.
- Sauvegarde distante du premier jalon vérifiée : `900b818bc1d7f4389cbc1d205aa718518ee58f10`, arbre `78ee91fc96a2de1106474c224c37564e8f536803`.
- Code final sauvegardé et publié : `264ddc79fd4a5d161d230eeca8984dc8b56f0d73`, arbre `eadfacbe351cea564690264a442ba338a836a2c5`. Branche de travail : `feat/oculaire-art-direction-20261029` ; même code sur `main`.
- GitHub Pages : exécution `40812118519`, commit ci-dessus, statut `completed`, conclusion `success`.
- Version publique réellement ouverte : https://ia.fuckladouane.com/course.html?oculaire=264ddc7 — HTTP 200, OCULAIRE `ready`, course démarrée, pause / reprise effectuées, événements de visibilité interrompant la course puis exigeant une reprise explicite.
- Sept fichiers publics comparés aux octets testés : entrée, démarrage, logique principale, moteur, OCULAIRE, finale et portrait. HTTP 200 et SHA-256 identiques pour chacun. Portrait : `c01342482ab7389412ea34134db81fef4d5f7ad7fa533f2f97c71fe9da50924a`.
- Rendu du jeu public observé en portrait ; aucune erreur JavaScript ou shader. Rapport public consigné dans `course/validation/oculaire-public.json`.
- Portail, CNAME et sources des mécaniques comparés à la base : identiques, à l'exception des paramètres de cache des modules concernés. Aucun changement au QR ni au tirage 1/30.

## Incidents d'accès et méthode

- L'ancienne tentative d'import direct restait bloquée par le transfert Git du GLB. La correction utilisateur permet désormais une adaptation autonome, sans cette dépendance.
- Lecture de configuration Pages via GitHub : `HTTPError: 400: GitHub Fetch URL is not an allowed public GitHub repository or search endpoint.` Pas de répétition ; mécanisme confirmé par l'historique Actions : `pages build and deployment`, branche `main`, dernier déploiement réussi sur la base ci-dessus.
- URL publique indisponible dans l'outil de recherche (`is not accessible via this tool`). Vérification alternative réussie : HTTP 200 par curl, puis navigateur réel.
- Browser local : Chromium déjà disponible. Contrôles locaux par interception HTTP Playwright ; contrôle réseau public effectué séparément.
- Premier navigateur public sans configuration réseau : `page.goto: net::ERR_EMPTY_RESPONSE at https://ia.fuckladouane.com/course.html`. Cause : Chromium ignorait le proxy de l'environnement. Navigation via ce proxy réussie ensuite : HTTP 200, bon titre, aucune erreur JavaScript. Le navigateur de contrôle accepte le certificat de ce transport ; les requêtes curl utilisent leur vérification TLS habituelle.
- Premier contrôle de préférence : `AssertionError: '75' !== '80'`. Cause : le test supposait 80 % alors que le réglage existant est 75 %. Test corrigé, réglage du jeu inchangé ; contrôle complet réussi ensuite.
- Premier appel d'arbre GitHub : `tool call rejected because the catalog changed after codex_apps/github.create_tree was prepared`. Catalogue relu et écritures séparées entre code et données ; sauvegarde distante ensuite vérifiée.

## Incident de déploiement du journal

- Le commit de documentation `c26b996e13ac049d1c068f7a05757cb88152b1e9` contient les mêmes fichiers exécutables que le code public vérifié `264ddc7`.
- Exécution Pages `40812643442` : construction et transfert de l'archive réussis, création du déploiement refusée côté GitHub. Erreur exacte : `HttpError: Server Error` puis `Failed to create deployment (status: 502) with build version c26b996e13ac049d1c068f7a05757cb88152b1e9`.
- Cause localisée à l'API de déploiement Pages ; aucun échec de compilation ni erreur du jeu. Le jeu public vérifié reste servi par le déploiement précédent réussi.
- Relance limitée aux tâches en échec demandée et acceptée, restée en file pendant plusieurs minutes. Passage ensuite à une publication complète du journal d’incident à jour par le mécanisme main / Pages existant. Aucune modification des sources du jeu pour traiter cette erreur serveur.

## Reprise après livraison

Les jalons de design, fonctionnement, tests disponibles et publication sont terminés. Pour une correction ultérieure, partir de la branche ci-dessus ou de main, relire ce fichier puis vérifier l'état distant. Ne pas reprendre l'ancien import direct du GLB.

L'atelier public permet d'observer librement les voies, les étapes et les moments de la finale : https://ia.fuckladouane.com/course/oculaire-preview.html .

Limite restante : aucune mesure ou validation sur un iPhone physique / Safari. Les mesures disponibles proviennent de Chromium avec WebGL logiciel et ne garantissent pas une cadence sur téléphone.
