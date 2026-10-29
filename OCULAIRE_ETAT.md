# OCULAIRE — état de reprise

Date : 29 octobre 2026. Branche : `feat/oculaire-art-direction-20261029`.
Base publique vérifiée : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec`.
Reprise du jalon antérieur : `6bde5dc9c484e9f855d5079e5f0911e9b6cf4ce5`.

## Correction utilisateur appliquée

Travail de design du jeu : OCULAIRE sert de référence artistique complète. Ne plus imposer le chargement direct du GLB ni modifier les mécaniques pour l'intégrer. Adapter seulement ce qui est nécessaire et préserver la machine existante.

## Sources et adaptation

- Brief artistique actuel lu intégralement avant modification. Sculpture validée v4 et référence visuelle retrouvées et examinées.
- Source GLB : 41 870 456 octets, SHA-256 `08ac7e703ce322dadbd3c5a8be83955c17ca8289fa739c260575ffe248c5d10e`. Source inchangée et exclue du chargement du jeu.
- Adaptation native : surfaces quantifiées avec pigments échantillonnés depuis les textures. 92 862 triangles, 58 534 sommets, 26 surfaces ; 1 681 519 octets de données JavaScript autonomes. Source : 545 576 triangles / 243 maillages.
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
- Ressources des fragments : 11 979 198 octets d'attributs GPU, 1000 groupes, un seul objet de rendu. Mesure de performance complète encore à exécuter.

## Reste à vérifier avant publication

- Occultation réelle en tunnel, autres formats, cinq pupilles de près, clignements, toute la finale et impact au sol.
- Pause / reprise / nouvelle partie depuis les moments clés, réglages, perte de visibilité et deux issues victorieuses dans le navigateur réel.
- Syntaxe complète, contrôles du portail, budget de rendu comparé à la base et mesure dans l'environnement disponible.
- Aucun test sur iPhone physique. Aucun déploiement de cette branche à ce stade.

## Incidents d'accès et méthode

- L'ancienne tentative d'import direct restait bloquée par le transfert Git du GLB. La correction utilisateur permet désormais une adaptation autonome, sans cette dépendance.
- Lecture de configuration Pages via GitHub : `HTTPError: 400: GitHub Fetch URL is not an allowed public GitHub repository or search endpoint.` Pas de répétition ; mécanisme confirmé par l'historique Actions : `pages build and deployment`, branche `main`, dernier déploiement réussi sur la base ci-dessus.
- URL publique indisponible dans l'outil de recherche (`is not accessible via this tool`). Le contrôle du site publié devra utiliser une requête HTTP ou un navigateur réel.
- Browser local : Chromium déjà disponible. Fichiers servis pour les contrôles par interception HTTP Playwright ; ces contrôles ne prouvent pas encore la desserte publique.

## Prochaine action

Finir la vérification visuelle et fonctionnelle détaillée, corriger les écarts, sauvegarder le jalon final ; publier via le mécanisme Pages existant uniquement après ces contrôles puis vérifier séparément le commit et l'URL publique.
