# Crédits 3D et réutilisation

## Modèle de véhicule

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
