# Véhicules FLD / DOUANE — 23 octobre 2026

Le même jeu publié à `/course.html` utilise désormais deux familles de véhicules 3D originaux. Le [garage](garage.html), accessible depuis son menu, montre les mêmes géométries que la course : rotation au doigt, pincement/roulette pour zoomer, vues avant/arrière/profil, atelier/nuit et rotation automatique facultative. Les flèches et les touches +/− fonctionnent lorsque le canvas a le focus. Le mouvement réduit désactive la rotation initiale et fige les flashes.

## Direction et références

- **fld® / 89 NIGHTRUNNER** : coupé à silhouette en coin, peinture prune, extensions d’ailes, jantes à sept branches, persiennes arrière, aileron avec dérives, double sortie, diffuseur, plaque `FLD-089-SW`, motifs magenta/violet/acide et capot portant le véritable tribal FLD. Le modèle n’est pas une reproduction d’un véhicule constructeur.
- **DOUANE / D-89 INTERCEPTION** : livrée claire et bleu marine, filet rouge, marquages DOUANE, balisage arrière rouge/jaune, rampe et feux de pénétration bleus, antenne, jantes à cinq branches et plaque fictive `D-089-FR`. Deux profils partagent cette identité : break haut pour les variantes paires, intercepteur bas pour les variantes impaires.

Références visuelles consultées, sans importation de leur géométrie ou de leurs photographies :

1. [Lotus — histoire de l’Esprit](https://www.lotuscars.com/fr-FR/lotus-story/road-cars/esprit), constructeur : carrosserie anguleuse de Giugiaro, proportions basses et silhouette des années 1970–1980.
2. [Association pour l’Histoire de l’Administration des Douanes — signalisation 1980–2000](https://histoire-de-la-douane.org/la-signalisation-des-vehicules-douaniers-de-1980-a-2000/) : rampes à éclats bleus, inscriptions, sérigraphie et R21 Nevada. Il s’agit d’une inspiration historique, pas d’une reproduction exacte d’une flotte actuelle.
3. [BRL — balisage Douane](https://brldistribution.fr/kit-balisage-vehicules-prioritaires-police/), documentation du fournisseur : hiérarchie des marquages avant/arrière/latéraux et bandes de balisage.

Le logo provient du fichier `ED0A159A-B37D-4D7B-AB20-DBEF662A4FE0.png` présent dans l’en-tête du site de marque. Copie locale intacte : `assets/fld-tribal.png`, 1598 × 608, identique au fichier publié par la marque. Aucune nouvelle interprétation du tribal. La projection UV compense les dimensions du capot pour conserver son rapport largeur/hauteur.

## Construction et intégration

`vehicle-designs.js` construit les carrosseries à sections variables, avec arches de roues ouvertes, fermeture des extrémités suivant les reliefs du capot/coffre, vitrages distincts et châssis. Les matériaux statiques sont fusionnés ; les couleurs des lampes sont regroupées en couleurs de sommets. Les géométries sont partagées entre instances. Les moyeux braquent, les pneus/jantes tournent, les étriers de frein restent fixes. Les flashes demeurent des maillages indépendants. Aucun modèle, décodeur ou moteur supplémentaire ne se télécharge depuis un service tiers.

`vehicle-livery.js` produit deux atlas locaux 1024 × 1024. Les deux portes gardent un texte lisible sans inversion. Le vrai fichier tribal complète l’atlas après chargement local ; un wordmark reste présent si le PNG n’est pas disponible.

`models.js` conserve l’interface `createVehicle(kind, variant)` et les animations existantes. Les véhicules civils utilisent toujours le modèle Alexus16 / CC BY 4.0, ses fichiers source et son attribution. Les nouveaux véhicules FLD/DOUANE, y compris leurs roues, ne dérivent pas de cette géométrie. Le rendu évite de regrouper une seconde fois leurs parties animées.

La physique, l’audio, les contrôles, les records et la fin rare ne sont pas changés par cette mise à jour. Seul un lien de garage est ajouté au menu de `course.html`. `index.html`, le domaine du QR brodé, `CNAME`, les modules et sons du portail restent identiques.

## Validation

Base inspectée : `main` au commit `d9e3962d29759e47538e587519f486f2c9dc0262`. Sauvegarde : `backup/pre-vehicle-designs-2026-10-23`. Branche de travail : `feat/fld-custom-vehicles`.

- `npm test` : **72 tests réussis**, dont les tests de conservation du portail, du domaine et des assets audio. Les nouveaux contrôles couvrent les fermetures de carrosserie par rayons, les étriers fixes, les flashes indépendants et les atlas partagés.
- `npm run check` : **38 fichiers de syntaxe vérifiés**. `git diff --check` sans erreur.
- Les nouvelles voitures restent dans les gabarits existants : largeur mesurée ~2,098 m ; longueurs ~4,155 m pour FLD et ~4,194 m pour DOUANE. Les dimensions du garage sont arrondies. Pas d’élargissement des collisions.
- FLD : environ 11 306 triangles ; break DOUANE : 9 798 ; variante basse : 9 734. Les ombres planes sont exclues de ces comptes.
- Deux balayages CPU du parcours : **332 maillages visibles maximum**, dix tronçons de décor maximum. Ce comptage n’est pas une mesure de FPS sur téléphone. Résultat brut : `validation/vehicles-cpu.json`.

Les vérifications navigateur utilisent Chromium 153 avec WebGL logiciel : modèles, logo et textures réellement affichés ; changement de véhicule et d’éclairage, vues, déplacement de caméra ; contrôles accessibles sans débordement horizontal à 1440 × 1000, 390 × 844, 844 × 390 et 320 × 700 ; lancement et pause d’une course utilisant le modèle FLD ; aucun asset 3D chargé par le portail QR. Résultat brut : `validation/vehicles-browser.json`.

Ces essais ne constituent pas une mesure du GPU, de la chauffe ou de Safari sur un iPhone physique. Le comportement de conduite reste celui de la version publique de départ ; cette mise à jour porte sur les véhicules et leur présentation.

## Retour arrière

Revert du commit d’intégration de cette mise à jour, puis publication par GitHub Pages existant. La sauvegarde conserve l’état antérieur ; ne pas modifier le domaine, réécrire l’historique ou effacer les records.
