# Crédits 3D et réutilisation

## Modèle du trafic civil

Depuis la mise à jour des véhicules du 23 octobre 2026, cette géométrie et ses roues servent au trafic civil et aux deux douanes banalisées de RECHERCHÉ V3. Le coupé FLD et les deux variantes de DOUANE sont des géométries originales, décrites dans [VEHICLES.md](VEHICLES.md). Le logo tribal FLD vient du fichier de marque déjà publié par le propriétaire ; il n’a pas été redessiné. Les références visuelles consultées ne sont pas des sources de géométrie importée.

**Classic Muscle car — Alexus16**

- Auteur : https://sketchfab.com/Alexus16
- Modèle original : https://sketchfab.com/3d-models/classic-muscle-car-641efc889e5f4543bae51d0922e6f4b3
- Licence : Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/
- Provenance de la version adaptée : https://github.com/pmndrs/racing-game, commit `7816a5d954b75e6ad853ae4e4f0cbbd628072643`.
- Attribution et licence identifiées dans `src/models/vehicle/Chassis.tsx` du dépôt source. Le README du dépôt annonce CC0 pour les assets ; cette mention générale n'est pas utilisée pour remplacer la licence spécifique CC BY 4.0 portée par ce modèle.
- Fichiers source conservés : `assets/source-chassis.glb` et `assets/source-wheel.glb`. Les roues sont reprises de la distribution du même véhicule par pmndrs, et créditées avec l'ensemble dérivé.
- Transformations FLD : conversion hors ligne du GLB Draco, quantification des positions et normales, retrait de l'habitacle détaillé et de la plaque d'origine, dimensions adaptées à la collision existante, nouveaux matériaux, nouvelles livrées, marquages fld® / 89 et DOUANE, aileron, échappements, feux et ombre de contact. Les géométries dérivées du modèle restent sous CC BY 4.0.
- Les modifications ne signifient aucun soutien d'Alexus16 ou des auteurs du jeu source à FLD.

Le jeu ne télécharge ni modèle ni décodeur à l'exécution. Les données décompressées sont embarquées dans `assets/vehicle-data.js` (environ 108 Ko). Le convertisseur `tools/prepare-vehicle.cjs` utilise le décodeur autonome officiel de Three.js r160 uniquement lors de la préparation ; ce décodeur n'est pas chargé par le site.

## Effets réutilisés

**pmndrs/racing-game — MIT, Copyright 2021 pmdrs, contributors**

- https://github.com/pmndrs/racing-game/blob/7816a5d954b75e6ad853ae4e4f0cbbd628072643/src/effects/Skid.tsx
- https://github.com/pmndrs/racing-game/blob/7816a5d954b75e6ad853ae4e4f0cbbd628072643/src/effects/Dust.tsx
- https://github.com/pmndrs/racing-game/blob/7816a5d954b75e6ad853ae4e4f0cbbd628072643/src/effects/Boost.tsx

Adaptation dans `effects.js` : transformation des composants React en pools instanciés Three.js natifs ; suppression des dépendances React/Cannon/Zustand ; émission des marques selon la distance ; vieillissement selon le temps de simulation ; bornes fixes pour marques, fumée et boost ; couleurs FLD ; suspension avec la course ; prise en compte du mouvement réduit. Texte MIT conservé dans `licenses/pmndrs-MIT.txt`.

Les services réseau, comptes, classements, sons, circuits et interfaces du jeu source ne sont pas importés.

## Autres recherches

- Kenney, Starter Kit Racing : https://github.com/KenneyNL/Starter-Kit-Racing. Référence de structure visuelle, roues indépendantes et décor modulaire. Code MIT et assets CC0 annoncés par son README. Aucun fichier de ce projet n'est embarqué dans cette version.
- VDrift et Stunt Rally ont été identifiés comme références de conduite, mais leur code et leurs assets ne sont pas repris dans cette extension statique.

## Créations propres au Swagistan Motor Club

Circuit et secteurs FLD, mise en scène de la rencontre, entrepôts, quais, conduites, silhouettes urbaines, éclairage du tunnel, barrières, poste frontière, station, personnages, textes, marquages et textures procédurales d'asphalte, de métal et de façades. Le rendu utilise une petite carte d'environnement procédurale, sans HDR externe ni moteur de réflexion coûteux.

## Moteur

Three.js 0.160.0, licence MIT conservée dans `vendor/LICENSE-three.txt`.

## Route 02 — Origine non déclarée (22 octobre 2026)

Créations FLD pour cette version : route de 13 km et ses cinq étapes, progression par situations, direction analogique, amortissement du drift, rôles des poursuivants, patrouille haute procédurale, ciel de chiffres instanciés, décor par dix tronçons recyclés et gestion de qualité. Le wordmark fld® existant est conservé ; aucun logo tribal n’a été inventé.

**Musique : ORIGINE NON DÉCLARÉE — composition originale FLD, 108 BPM.** `score.js` contient les événements de composition : introduction, basse séquencée, quatre progressions harmoniques et leur variante finale, inversions, variations d’arpèges et réponses de fin de phrase, batterie et résolution sans percussion après la frontière. `audio.js` synthétise tous les instruments, moteur, vent, roulement, glisse, impacts, sirène, ambiance du tunnel et signaux de secteur. Aucun fichier audio externe ni musique de jeu n’est ajouté. Horloge audio séparée du rendu, rappel de 25 ms et anticipation de 120 ms ; instances bornées à 96 voix transitoires et sept couches continues. Les volumes musique/effets/général sont indépendants. Les fichiers WAV du portail sont conservés byte pour byte et ne sont pas utilisés par la course.

La patrouille haute de `models.js` est une construction procédurale originale. Ses roues sont celles du véhicule dérivé Alexus16 déjà présent et restent créditées en CC BY 4.0. L’intercepteur bas conserve la géométrie Alexus16, modifiée avec livrée bleu nuit/blanc, rampe bleue, protection avant et rétroviseurs. Le crédit du modèle original reste accessible depuis le menu du jeu.

### Références effectivement étudiées, sans nouveaux fichiers incorporés

Aucun code GPL ni contenu tiers de ces références n’est porté ou redistribué dans cette version. Les techniques générales sont réimplémentées pour les modules JavaScript natifs du projet ; les versions ci-dessous identifient les sources étudiées, pas des dépendances d’exécution.

| Source et version | Fichiers consultés / licence | Enseignement retenu |
| --- | --- | --- |
| [pmndrs/racing-game, 7816a5d](https://github.com/pmndrs/racing-game/tree/7816a5d954b75e6ad853ae4e4f0cbbd628072643) | `src/models/vehicle/Chassis.tsx`, `src/effects/Cameras.tsx`, `LICENSE.md`. Code MIT, modèle Alexus16 explicitement CC BY 4.0 dans Chassis malgré la mention générale CC0 du README. | Partager la géométrie déjà incorporée, garder roues et carrosserie séparées et les effets à pools fixes. Les reprises existantes restent détaillées au début de ce document. |
| [Kenney Starter Kit Racing, 2f2e5f2](https://github.com/KenneyNL/Starter-Kit-Racing/tree/2f2e5f2646dda89cb21d4e8539bab60c6e955dc8) | `scripts/vehicle.gd`, `scripts/view.gd`, README, LICENSE. Code MIT ; modèles, sprites et sons CC0 annoncés séparément. LICENSE : copyright 2023 Kenney ; extrait MIT du README : 2026. | Braquage/roulement indépendants, roulis sobre et caméra amortie selon la vitesse. Aucun fichier ni son incorporé. |
| [Kenney Car Kit, page version 3.1](https://kenney.nl/assets/car-kit) | Page officielle : 45 fichiers, CC0. Aucun ZIP incorporé. | Référence de silhouettes légères ; la patrouille FLD est finalement construite dans le code local. |
| [JavaScript Racer, 3e8a060](https://github.com/jakesgordon/javascript-racer/tree/3e8a060b5900755db27f899612a74a77427c853e) | `v4.final.html` (`addRoad`, `resetRoad`), README, LICENSE : code MIT. Musique Lucky Lion Studios autorisée seulement pour son projet ; sprites OutRun empruntés pour l’enseignement. | Alternance de longs arcs, courbes et reliefs avec respiration. Aucun code, sprite ni musique repris. |
| [Trigger Rally, 079ac53](https://github.com/CodeArtemis/TriggerRally/tree/079ac53216b74598b652ce3bf11478beb5c6832b) | `server/public/scripts/client/car.js`, `server/public/scripts/game/vehicle.js`, LICENSE.md. Code GPLv3 ; licence de contenu 2013-04-19.1 distincte, sans autorisation générale de redistribution/modification. | Étude des couches sonores moteur/transmission/vent/glisse. Aucun code ni contenu repris. |
| [VDrift, f835eda](https://github.com/VDrift/vdrift/tree/f835edaef1abe586b8d5bebeaa8c41f85e6dbea4) | `src/camera_chase.cpp`, README : GPLv3 ou ultérieure pour le module. | Cible de caméra stable et réinitialisation à la nouvelle partie. Étude seule. |
| [SuperTuxKart, 2997f19](https://github.com/supertuxkart/stk-code/tree/2997f192e6876047909d909498dbb4810e5dbb8d) | `src/karts/skidding.cpp`, `src/graphics/camera/camera_normal.cpp`, COPYING : GPLv3 ou ultérieure. Données sous licences multiples, contrôlées séparément dans leurs licences. | Entrée/sortie de glisse lisibles et amortissement de caméra. Étude seule. |
| [Stunt Rally 3, fe3ecd7](https://github.com/stuntrally/stuntrally3/tree/fe3ecd73fff671c3d75ecaeadccea5c5e6afe0d8) | `src/road/SplineBase.cpp`, `src/game/FollowCamera.cpp`, Readme, License.txt, `docs/data.md`. Code original GPLv3 ou ultérieure ; médias/dépendances séparés, problèmes de provenance documentés pour certaines anciennes ressources. | Continuité route/relief et environnements différenciés. Aucun média ou code repris. |
| [Speed Dreams](https://www.speed-dreams.net/en/about), page consultée le 22 octobre 2026 | Présentation officielle : simulateur C/C++ GPLv2+. Aucun commit ni asset incorporé. | Référence générale d’architecture ; pas d’importation d’un moteur natif. |

Documentation de mise en œuvre : [MDN Web Audio bonnes pratiques](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices), [séquençage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques), [état interrupted et Safari](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state). Le contexte est créé depuis SON ; une interruption suspend la course et exige une reprise explicite.

## RECHERCHÉ V3 — 22 octobre 2026

Version fondée sur main `edd865e7512b1bdecf1e4e96bd5535c4219bb1bd`, branche `feat/swagistan-pursuit-v3` du présent dépôt. Les modèles NIGHTRUNNER / D-89, leur logo tribal officiel et le garage de cette base sont conservés ; détails dans [VEHICLES.md](VEHICLES.md). Aucun nouveau fichier tiers n’est incorporé par RECHERCHÉ.

- **Affiches et carte de score — créations originales FLD.** Auteur : projet FLD / Swagistan Motor Club. Sources locales : `posters.js`, `results.js` ; https://github.com/y92pctjcjs-sys/IA-fuckladouane/tree/feat/swagistan-pursuit-v3/course. Seize compositions typographiques et pictogrammes dessinés dans un atlas Canvas partagé, sans fonte téléchargée ni imitation du logo tribal. La carte utilise le wordmark fld® et les valeurs réelles du résultat. Aucun graphisme tiers repris ; aucune nouvelle licence tierce à transmettre.
- **Douanes banalisées — dérivés Alexus16, CC BY 4.0.** Même provenance, auteur, commit et licence que le modèle déjà crédité en tête de ce fichier. Modifications V3 : peinture civile partagée avec le trafic, retrait des marquages visibles et de l’aileron, feux bleus dissimulés dans la calandre et à l’arrière, groupes lumineux animés. La patrouille haute procédurale FLD reste présente. La géométrie source et les attributions sont conservées.
- **HORIZON NON DÉCLARÉ — composition et synthèse originales FLD, 108 BPM.** Nouvelle version de `score.js` et `audio.js` : accords de septième, motifs de mélodie originaux en appels/réponses, arpèges stéréo, deux échos filtrés, variantes de tunnel et résolution. Direction dreamwave de route nocturne demandée par l’utilisateur ; aucun enregistrement, sample ou thème de Skydive n’est utilisé. L’ancien moteur en dent de scie est remplacé par triangle/sinus graves filtrés, avec rapports à hystérésis et bus de volume indépendant.

Documentation technique consultée : [panoramique stéréo Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createStereoPanner), [DelayNode](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createDelay), [partage de fichiers et détection de capacité](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare). Aucun extrait de code de ces pages n’est copié dans le projet.


## Atelier 89 — six livrées

Carrosseries et roues originales retravaillées, vernis/nacre/carbone, atlas du tribal exact, aéro angélique, accessoires infernaux, déformations et verre fissuré, livrée cursed, studio de réflexion et LOD local : créations du projet FLD. Aucun modèle, logo, texture, code ou son d’Asphalt n’est distribué. Le logo FLD original reste intact dans `assets/fld-tribal.png` ; les masques pigmentaires et variantes de couleur conservent sa forme.

Études primaires : [Gameloft, création des voitures d’Asphalt 9](https://asphaltlegends.com/news/have-you-ever-wondered-how-the-cars-of-asphalt-9-are-created), [Gameloft, reflets et finitions d’Asphalt Legends Unite](https://asphaltlegends.com/news/asphalt-legends-unite-is-coming), [Hyundai N Vision 74](https://www.hyundai-n.com/en/models/rolling-lab/n-vision-74). Techniques et direction visuelle réinterprétées dans le code local. Les photographies consultées ne sont pas incorporées. Voir [VEHICLES.md](VEHICLES.md) pour les références historiques Douane et Lotus, les six styles et la validation. Les licences et fichiers source du trafic/banalisées demeurent inchangés.
