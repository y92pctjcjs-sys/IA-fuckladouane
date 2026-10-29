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
- Publication complète finalement réussie : commit `764dcc90c33fcc5577fff29ea2499aaab6f064d9`, exécution Pages `40813552314`, statut `completed`, conclusion `success`. `main` vérifié sur ce commit.
- Après ce déploiement, le journal, le rapport public et l’atelier ont été téléchargés depuis le domaine et comparés : octets identiques aux fichiers validés, sans erreur HTTP.
- L’ancienne relance isolée `40812643442` était encore en file lors du dernier contrôle ; la publication complète réussie la remplace pour la livraison. Les outils disponibles ne proposent pas son annulation.
- Le présent compte rendu final est conservé sur la branche de travail ; les fichiers exécutables sont identiques à ceux de main publié.

## Reprise après livraison

Les jalons de design, fonctionnement, tests disponibles et publication sont terminés. Pour une correction ultérieure, partir de la branche ci-dessus ou de main, relire ce fichier puis vérifier l'état distant. Ne pas reprendre l'ancien import direct du GLB.

L'atelier public permet d'observer librement les voies, les étapes et les moments de la finale : https://ia.fuckladouane.com/course/oculaire-preview.html .

Limite restante : aucune mesure ou validation sur un iPhone physique / Safari. Les mesures disponibles proviennent de Chromium avec WebGL logiciel et ne garantissent pas une cadence sur téléphone.
