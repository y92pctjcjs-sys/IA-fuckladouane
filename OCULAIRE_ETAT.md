# OCULAIRE — état de reprise

Date : 29 octobre 2026. Branche : `feat/oculaire-integration-20261029`.
Base : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec` (main).

## État vérifié

- Le dépôt a été cloné sans changements préexistants. Aucun AGENTS.md trouvé.
- La base publique ne contient pas OCULAIRE. Three.js local r160 ; modules statiques, GitHub Pages depuis main / racine.
- Le brief actuel a été lu intégralement dans les fichiers de travail ; sa copie intégrale demeure dans les fichiers privés du projet. Le présent état public exclut leurs identifiants internes.
- GLB v4 retrouvé : 41 870 456 octets, SHA-256 `08ac7e703ce322dadbd3c5a8be83955c17ca8289fa739c260575ffe248c5d10e`. Source Blender v4 et référence visuelle retrouvées. Aucun changement à la sculpture ou aux textures.
- Structure GLB : 259 nœuds, 243 maillages, 40 matériaux, 24 images incorporées, 545 576 triangles. Cinq groupes d'yeux, trois nez en volume et trois bouches identifiés.
- Contrôles de base réellement exécutés : 92/92 tests Node ; syntaxe de 51 fichiers valide.
- Aucun rendu WebGL OCULAIRE observé ; aucun nouveau déploiement réalisé.

## Ordre de réalisation

1. Import 3D minimal et rendu réel ; placement dans le ciel, profondeur, occultation et fidélité.
2. Cinq regards convergents vers la voiture, clignements, présence discrète, croissance 100/106/112/118/125 %, paroles espacées sur les cinq étapes réelles.
3. Victoire : feux d'artifice, chute, arrière marqué `douaniere` lisible 1,5 s, impact puis fragmentation de surface, résultats. Fin amoureuse 1/30 inchangée.
4. Pause, reprise, redémarrage, mouvements réduits, contrôles du dépôt, performances, puis publication seulement après les vérifications indispensables.

Le QR, son domaine, le portail, les 13 km, les commandes corrigées, véhicules, skins, douaniers banalisés, difficulté, audio indépendant, records et partage doivent rester intacts.

## Journal des incidents

- Une commande Git initiale dans /workspace a renvoyé `fatal: not a git repository (or any of the parent directories): .git`. Résolu en clonant le dépôt dans son propre répertoire.
- Premier envoi de sauvegarde refusé par revue automatique : présence de contenu provenant de fichiers privés et d'identifiants internes dans un dépôt public. Ce commit local ne doit pas être poussé. La branche actuelle repart de main et contient uniquement le code demandé et le présent état technique sans ces données.
- Installation standard du navigateur : `Error: End of central directory record signature not found. Either not a zip file, or file is truncated.` Le programme d'installation a répété automatiquement le téléchargement. Diagnostic : les deux URL de binaires examinées renvoient du HTML de 195 octets, au lieu d'une archive ZIP. Ne pas relancer cette méthode ; rechercher une distribution système utilisable.

## Reprise immédiate

Terminer l'import avec le chargeur officiel r160 local. Vérifier le navigateur et capturer un rendu WebGL réel avant de déclarer le jalon 1 vérifié. Les jalons 2 à 4 ne sont pas encore commencés. Aucun essai sur iPhone physique.
