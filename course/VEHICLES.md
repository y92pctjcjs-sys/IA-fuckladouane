# Atelier 89 — six livrées 3D

Cette version prolonge RECHERCHÉ V3 (`main` : `d7279acf9c9008719c11e0d58fda1bc966a3e828`). Le [garage](garage.html) et la course utilisent les mêmes géométries. Branche : `feat/vehicle-master-skins`. Les rapports de l’ancienne version restent archivés dans `validation/vehicles-*.json` ; les mesures présentes sont `validation/master-skins-*.json`.

## Modèles et styles

Les carrosseries FLD et DOUANE sont originales. Le coupé garde une silhouette rétro large et basse ; la DOUANE conserve son profil haut, sa livrée identifiable et ses feux bleus. Les versions de silhouette haute/basse restent disponibles dans la fabrique de modèles, tandis que la poursuite V3 utilise une patrouille marquée haute et deux berlines banalisées.

| Véhicule | Livrée | Détails réels du modèle et de la matière |
| --- | --- | --- |
| FLD | NIGHTRUNNER / Origine | Prune métallisé, accents acide/magenta, carbone tissé, jantes forgées, persiennes et aileron |
| FLD | SÉRAPHIN / Angélique | Nacre froide, or champagne, plumes métalliques de l’aéro, auréole arrière et jantes claires |
| FLD | MALÉDICTION / Cursed | Ultraviolet, cyan et acide saturés, iridescence, dédoublement chromatique imprimé du tribal et pointes d’ailes |
| DOUANE | INTERCEPTION / Brigade | Blanc/bleu marine/filet rouge, marquages DOUANE, rampe bleue, balisage et prises d’air creusées |
| DOUANE | INFERNAL / Démoniaque | Noir calciné, rouge et ambre, cornes profilées, grille à crocs, DOUANE et feux bleus conservés |
| DOUANE | ÉPAVE / Tout cassé | Tôle déformée à l’avant droit et à la porte, capot froissé, peinture rayée, verre fissuré, rétroviseur manquant et optique brisée |

Les skins sont cosmétiques. L’épave ne perd pas de résistance au départ et les accessoires ne changent pas les collisions, la vitesse ou le comportement de poursuite. Le mode cursed utilise un graphisme imprimé, sans flash de plein écran.

## Références étudiées

- [Gameloft — création des voitures d’Asphalt 9](https://asphaltlegends.com/news/have-you-ever-wondered-how-the-cars-of-asphalt-9-are-created) : étude du travail des volumes, de l’adaptation au temps réel, des LOD, des matières et des variantes de carrosserie. Ici, les formes sont construites localement, sans CAD constructeur ni modèle Asphalt importé.
- [Gameloft — évolution graphique d’Asphalt Legends Unite](https://asphaltlegends.com/news/asphalt-legends-unite-is-coming) : finitions de peinture, reflets et effets des optiques. Le garage FLD emploie un éclairage studio et une carte de réflexion précalculée localement ; la course conserve son environnement plus léger.
- [Hyundai N — N Vision 74](https://www.hyundai-n.com/en/models/rolling-lab/n-vision-74) et [Lotus — Esprit](https://www.lotuscars.com/fr-FR/lotus-story/road-cars/esprit) : proportions rétro sportives, ailes larges et silhouette en coin. Aucun logo constructeur, photo ni fichier de géométrie incorporé.
- [Association pour l’Histoire de l’Administration des Douanes — signalisation 1980–2000](https://histoire-de-la-douane.org/la-signalisation-des-vehicules-douaniers-de-1980-a-2000/) et [BRL — balisage](https://brldistribution.fr/kit-balisage-vehicules-prioritaires-police/) : hiérarchie des marquages, bleu de signalisation, filet et bandes. La D-89 est un véhicule fictif.

## Logo et fabrication

`assets/fld-tribal.png` est toujours la copie intacte du fichier de marque `ED0A159A-B37D-4D7B-AB20-DBEF662A4FE0.png`, 1598 × 608. Son empreinte Git reste `7aaaa2f837fb7197399135e79a41cd443efa0eed`. Le masque pigmentaire reprend les pixels et espaces négatifs du vrai dessin, puis adapte sa couleur à la livrée. Le dessin et le ® ne sont pas reconstruits au texte.

`vehicle-livery.js` fournit un atlas 1024 × 1024 par skin effectivement demandé. Capot, portes, toit, arrière, bande de pare-brise, plaque et centre des roues ont leurs zones UV. Les deux portes gardent un texte lisible ; les rapports physiques de projection sont compensés. Les grands motifs font partie de la surface de carrosserie. Ils ne sont plus des rectangles flottants au-dessus de la peinture.

`vehicle-designs.js` utilise des sections interpolées, des ailes bombées, des arches ouvertes, des extrémités fermées et des ouvertures de calandre. Pavillon et vitrages ont leur courbure ; joints, montants, essuie-glaces, rétroviseurs, logements de projecteurs, diffuseur, sorties d’échappement et aileron restent distincts visuellement. `vehicle-mesh.js` fusionne les parties fixes par matière et regroupe les lampes fixes par couleurs de sommets. Les quatre roues braquent et roulent ; les étriers restent fixes et les flashes bleus restent commutables.

Le vernis, la nacre, l’iridescence, le carbone et l’usure reposent sur des matériaux physiques locaux. `vehicle-studio.js` construit une réflexion PMREM à partir de quatre surfaces de studio, sans HDR téléchargé. Les six modèles ne sont pas tous créés à l’ouverture : le garage les construit à la demande et réutilise ensuite leurs données.

`vehicle-detail.js` met en cache une géométrie simplifiée pour la patrouille éloignée, au-delà de 85 m, ou 55 m en qualité économique. Les UV, matériaux et ruptures de normales restent séparés ; les géométries de près sont restaurées à l’identique. Ce changement ne touche ni la silhouette civile des banalisées ni leurs groupes de feux cachés.

## Utilisation en course

Choisir FLD ou DOUANE, sélectionner une des trois livrées puis **ÉQUIPER**. **PATROUILLE ALÉATOIRE** tire une livrée de la patrouille marquée au départ, à partir du seed routier existant ; un même style peut être tiré plusieurs fois. Les deux véhicules banalisés gardent leur modèle et leur peinture civile jusqu’à leur révélation.

La clé séparée `fld.course.appearance.v1` mémorise le choix. Les liens de retour transportent aussi `car` et `patrol` pour fonctionner lorsque le stockage est refusé. Ces paramètres ne commandent que l’apparence. Le retour depuis le cache de navigation recharge le choix mémorisé.

La logique RECHERCHÉ V3, ses affiches, son radar, sa carte de score, le moteur réglable indépendamment, les contrôles et les records restent présents. Le tirage rare de fin ne change pas. Le trafic et les banalisées conservent la géométrie Alexus16, ses fichiers source et l’attribution CC BY 4.0. Aucun asset 3D n’est ajouté au chargement du portail QR ; `index.html`, ses scripts, ses sons et `CNAME` restent identiques. Les imports de course utilisent la version de cache commune `atelier-002`.

## Validation de cette version

- **92 tests réussis**, **51 fichiers de syntaxe vérifiés**, `git diff --check` sans erreur. Géométrie finie et bornée, déformations réelles, atlas réutilisés, LOD restaurables, flashes et braquage protégés, stockage isolé, conservation des banalisées pendant les changements de skins.
- Gabarit mesuré : environ 2,079 m de large, 4,119 m pour FLD et 4,161 m pour la DOUANE. L’antenne explique la hauteur totale de 2,049 m de la patrouille. Les dimensions indiquées au garage sont arrondies.

| Livrée | Triangles près | Triangles éloignés |
| --- | ---: | ---: |
| Nightrunner | 25 090 | 12 590 |
| Séraphin | 26 194 | 13 346 |
| Malédiction | 25 096 | 12 596 |
| Interception | 26 282 | 15 050 |
| Infernal | 26 672 | 15 332 |
| Épave | 27 190 | 16 483 |

Comptes avec les feux initialement visibles et sans ombre plane. Le LOD en course concerne la patrouille ; les chiffres FLD décrivent la capacité du même réducteur, sans l’appliquer au joueur proche.

`node course/tools/measure.mjs` : construction initiale 405 ms, deux balayages CPU avec construction 1 011 ms, dix tronçons maximum, 346 maillages visibles et 170 géométries simultanées. Les six traversées de référence à 30/60/144 Hz retrouvent les résultats RECHERCHÉ V3. Rapport : [master-skins-cpu.json](validation/master-skins-cpu.json). Il s’agit d’un récepteur de scène CPU, pas d’un benchmark GPU.

Le rapport [master-skins-browser.json](validation/master-skins-browser.json) consigne les 38 contrôles réalisés avec Chromium 153 et WebGL logiciel : six livrées affichées, vrai logo prêt, sélection et équipement persistants, mêmes choix dans le rendu de course, maintien des deux banalisées, lancement/pause, stockage refusé et portail isolé. Les formats vérifiés sont 1440 × 1000, 390 × 844, 844 × 390 et 320 × 700. Les vues ont été inspectées à l’écran ; aucune performance sur iPhone physique n’est affirmée.

## Retour arrière

Revert du commit d’intégration puis publication GitHub Pages existante. La sauvegarde `backup/pre-master-skins-with-pursuit-v3` conserve `d7279acf9c9008719c11e0d58fda1bc966a3e828`. Pas de réécriture de main, de changement de domaine ou d’effacement des données.
