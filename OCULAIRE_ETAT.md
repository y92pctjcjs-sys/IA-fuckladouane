# OCULAIRE — état de reprise

Date : 29 octobre 2026. Branche : `feat/oculaire-integration-20261029`.
Base : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec` (main).

## État vérifié

- Le dépôt a été cloné sans changements préexistants. Aucun AGENTS.md trouvé.
- La base publique ne contient pas OCULAIRE. Three.js local r160 ; modules statiques, GitHub Pages depuis main / racine.
- Le brief actuel a été lu intégralement dans les fichiers de travail ; sa copie intégrale demeure dans les fichiers privés du projet. Le présent état public exclut leurs identifiants internes.
- GLB v4 retrouvé : 41 870 456 octets, SHA-256 `08ac7e703ce322dadbd3c5a8be83955c17ca8289fa739c260575ffe248c5d10e`. Source Blender v4 et référence visuelle retrouvées. Aucun changement à la sculpture ou aux textures. Le binaire de travail est identique à cette empreinte après import.
- Structure GLB : 259 nœuds, 243 maillages, 40 matériaux, 24 images incorporées, 545 576 triangles. Cinq groupes d'yeux, trois nez en volume et trois bouches identifiés.
- Contrôles de base réellement exécutés : 92/92 tests Node ; syntaxe de 51 fichiers valide.
- Import local réellement observé dans le jeu : Chromium headless, WebGL 2 / SwiftShader, portrait 390 × 844. Les 243 maillages sont chargés, sans erreur JavaScript observée. La tête est au-dessus de la route et suit la voiture par son orientation générale ; les cinq regards individuels ne sont pas encore animés.
- 96/96 tests Node passent après import, dont quatre nouveaux contrôles : binaire exact et organes, erreur de chargement, libération pendant chargement, cadrage du tracé échantillonné tous les 150 m, dans trois voies et trois formats.
- Aucun nouveau déploiement réalisé. Le jalon 1 est local et partiel : autres formats et occultation en cours de vérification ; jalons 2 à 4 non commencés.

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

## Implémentation et sauvegarde

- Chargeur officiel GLTFLoader r160 et sa dépendance BufferGeometryUtils ajoutés localement, sous la licence Three.js déjà présente. Aucun CDN ajouté au jeu.
- Nouveau module `course/oculaire.js` : chargement asynchrone, orientation de la tête vers la voiture, placement distant en coordonnées 3D, erreur consignée sans arrêt du jeu, libération des ressources. L’animation autonome incorporée au GLB n’est pas jouée.
- `course/renderer.js` raccorde le module à la scène existante. `course/oculaire-preview.html` fournit une inspection avec le vrai rendu et les distances / voies choisies.
- Le premier cadrage était coupé en portrait dans le virage initial. La direction est désormais calculée sur un point plus proche de la route puis prolongée dans le monde ; correction observée dans une nouvelle capture du jeu.
- Les matériaux conservent leurs textures PBR ; seuls brouillard et tone mapping sont désactivés sur OCULAIRE pour préserver les pigments. Aucun nouveau trait ou élément du visage ajouté.
- Un test existant a signalé `renderer.js must not request a stale oculaire.js?v=oculaire-001`. Cause : version de cache différente de celle du graphe existant. Raccord harmonisé en `atelier-002` ; le contrôle passe désormais.
- Les tests CPU de scène injectent un chargeur inactif explicitement ; ils ne prétendent pas charger ou rasteriser le modèle.
- Première sauvegarde distante vérifiée par `git ls-remote` : `4b24dc1828f147d648f81e474fa36e6925c8032b` sur cette branche.
- Transfert du GLB vers GitHub encore bloqué : `git push` renvoie exactement `fatal: could not read Username for 'https://github.com': No such device or address`. Le chemin de transport Git fourni par l’environnement a le même problème : `fatal: could not read Username for 'https://git.chatgpt-team.site': No such device or address`. Ne pas répéter sans accès nouveau. Le connecteur permet de sauvegarder les textes ; aucun transfert de ce binaire de 41,9 Mo n’a abouti.
- Essais localhost du navigateur : `page.goto: net::ERR_CONNECTION_REFUSED` sur 8080 puis 8765, même après démarrage explicite du serveur sur 127.0.0.1. Le rendu vérifié utilise les fichiers locaux fournis par interception HTTP Playwright ; il ne valide pas la desserte réseau du site public.
- `apt-get update -qq` a échoué avec `E: setgroups 65534 failed - setgroups (1: Operation not permitted)` et `E: Method https has died unexpectedly!`. Aucune répétition : navigateur obtenu autrement via le paquet Chromium, décompressé dans le répertoire de travail.

## Reprise immédiate

Terminer les vérifications visuelles du jalon 1, puis sauvegarder le code et le compte rendu. Pour poursuivre avec une sauvegarde distante exploitable et ensuite publier, il faut un accès Git en écriture autorisant le transfert du binaire local. Restaurer au besoin `oculaire-tete-v4.glb` depuis les fichiers du projet, vérifier sa taille et son SHA-256, puis le placer dans `course/assets/oculaire/`. Ne pas publier la branche sans ce binaire ni avant les jalons suivants. Aucun essai sur iPhone physique.
