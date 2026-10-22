# Validation de l'extension course — 22 octobre 2026

## Statut

**Publication autorisée par l'utilisateur le 22 octobre 2026 pour permettre les essais sur son appareil.** Les 53 tests sont réussis ; la validation graphique WebGL et Safari iPhone reste non terminée. Le jeu est une option accessible depuis le bouton vert, sans charger son moteur sur la page principale. Cette autorisation remplace la suspension de publication précédente et ne constitue pas une validation du rendu sur appareil réel.

## Vérifications terminées

- 53 tests Node réussis : les 28 tests d'origine et 25 tests de l'extension.
- Syntaxe des cinq modules d'origine et des modules du jeu, y compris modèles, matériaux, décor et effets vérifiée.
- Identité binaire des modules `app.js`, `arcade.js`, `core.js`, `drop.js`, `matrix.js`, du CSS existant, de `CNAME` et des tests existants.
- Enlever les deux ajouts de `index.html` restitue exactement le blob Git initial. Footer et secret 404 intacts.
- Accueil chargé dans Chrome distant : aucun fichier sous `/course/` demandé ; seule la feuille isolée `course-entry.css` s'ajoute.
- Accueil et arcade à 320, 390 et 768 px : pas de débordement horizontal observé. Le nouveau lien est après le footer, avec `target="_blank"` et `rel="noopener"`.
- Parcours du scan complet jusqu'au verdict, accès à FLD Drop, lancement, rotation, pose immédiate (32 points), pause/reprise accessibles.
- Simulation : deux parcours complets indépendants réussis par un contrôleur utilisant les commandes de direction et nitro ; franchissement des trois secteurs, arrivée puis résultats. Pas de téléportation de progression pour ce test.
- Nitro, frein, glisse et reprise d'adhérence, collisions visibles, immunité aux impacts répétés, barrages ouverts, poursuite et interception après quatre secondes d'immobilisation couverts par les tests.
- Pause du décompte, de la course et des scènes terminales ; score, dégâts et résultat figés après la fin.
- Tirage : les 30 valeurs produisent une seule issue romantique ; rejet des valeurs du seau incomplet ; tirage exécuté une fois par victoire et jamais lors d'une défaite.
- Stockage corrompu/refusé et souvenir persistant couverts par tests. Aucune écriture hors de `fld.course.v1`.
- Multitouch tourner + nitro, relâchement indépendant, annulation/perte de capture, clavier et perte de focus couverts par événements dans les tests.
- Interface seule : décompte, pause au clavier P, reprise, fin romantique déterministe, résultats, souvenir et bouton rejouer vérifiés dans une prévisualisation locale avec rendu explicitement marqué QA. Le démarrage et la pause fonctionnent aussi lorsque l’accès à localStorage déclenche réellement une SecurityError dans la page. Cette vérification ne valide ni le rendu ni la fluidité du jeu.
- Nouvelle partie : HUD rafraîchi immédiatement, caméra réinitialisée et traces de drift effacées ; construction et réinitialisation couvertes par le test de scène.

## Contrôle de la géométrie sans GPU

Le vrai constructeur de scène Three.js a été exécuté avec un récepteur de rendu injecté dans les tests : secteurs, véhicules instanciés, matrices et caméra, arrivée normale, interception et scène romantique sans objet manquant ou valeur non finie. Le nombre de maillages visibles reste sous 350 dans ces instantanés ; cela ne constitue pas une mesure GPU.

Un aperçu local utilise le SVGRenderer officiel de Three.js r160 sur la géométrie réelle. Les instances y sont développées pour inspection. Les vues industrie, tunnel et rencontre ont été inspectées ; cela a permis de dégager l'accès à la station et d'orienter les personnages face à face. Les captures portent un avertissement explicite : ce rendu CPU ne valide pas WebGL, les textures, le brouillard ou la fluidité. Les scripts de cet aperçu restent exclus du commit ; seules les captures de diagnostic sont jointes dans `validation/`.

## Blocage graphique observé

Le navigateur distant refuse la création du contexte WebGL. L'erreur Three.js indique `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, puis `BindToCurrentSequence failed`. Un nouvel essai avec la préférence graphique standard donne le même échec. Le repli visible offre un retour au protocole.

Il n'y a donc **aucune capture validée de la course 3D**. Les images jointes documentent le bouton mobile, le blocage réel et des aperçus CPU explicitement identifiés ; elles ne doivent pas être présentées comme une preuve de jouabilité 3D.

## Contrôles restant à faire sur appareil réel

Sur un navigateur disposant de WebGL, puis sur Safari d'un iPhone réel :

1. Vérifier le rendu de la route, des trois secteurs, des marquages, des voitures et des collisions pendant une course complète.
2. Tester une victoire manuelle, une interception et le bouton rejouer avec le moteur 3D actif.
3. Vérifier l'arrivée habituelle et la scène romantique : positions, caméra, approche, dialogue et transitions. Injecter un générateur uniquement dans une prévisualisation locale exclue de Git ; ne pas ajouter de commande de forçage dans la production.
4. Vérifier 320, 390 et 768 px avec le rendu actif ; orientation et barres Safari, zones système, lisibilité du HUD et boutons tactiles.
5. Maintenir direction + nitro puis drift avec plusieurs doigts, relâcher hors du bouton et annuler un contact.
6. Vérifier la fluidité soutenue, la chauffe, la lisibilité nocturne et le comportement aux variations de fréquence. Le plafond de résolution et l'instanciation réduisent le coût, sans constituer une mesure de performance sur appareil.
7. Vérifier le son et son mixage moteur/nitro/impacts/sirènes, le passage en arrière-plan, le retour nécessitant une reprise et le mouvement réduit.
8. Faire un parcours avec localStorage réellement bloqué et confirmer le résultat conservé en mémoire.
9. La publication est demandée pour permettre ces essais : contrôler séparément le succès de GitHub Pages, l'URL publique, le bouton et les fichiers. Un déploiement réussi ne valide pas à lui seul la conduite et la fluidité sur iPhone.

## Protection du dépôt

La branche de travail descend du main vérifié `d0abc539c9e43c3b5b5bd7a9e8a10367b6e36293`. Elle ajoute uniquement `course.html`, `course-entry.css`, les fichiers `course/` et les deux ajouts de `index.html`. La refonte graphique part du commit de cette branche `37a23a6a1f205c1f16339028d38b69e348e193cf`. Les sons existants sont hérités de l'arbre de départ, sans remplacement de leurs blobs. Aucun changement de CNAME, GitHub Pages ou domaine.

Sauvegarde : `backup/pre-course-2026-10-22` → `d0abc539c9e43c3b5b5bd7a9e8a10367b6e36293`.

## Refonte graphique après recherche des jeux ouverts

- Référence principale : pmndrs/racing-game, commit 7816a5d954b75e6ad853ae4e4f0cbbd628072643. Licence du code MIT lue ; attribution spécifique du modèle Alexus16 en CC BY 4.0 retenue malgré le résumé CC0 du README. Sources binaires comparées à leurs blobs Git et crédits intégrés au menu.
- Modèle de voiture de plusieurs milliers de triangles avec carrosserie, vitrages, optiques, chrome et roues distincts. Dimensions du modèle adaptées et testées contre les collisions existantes. Géométrie partagée entre véhicules.
- PBR avec peinture et clearcoat, environnement de réflexion procédural, asphalte et normales, façades et métal texturés. Aucun fichier HDR ni texture géante.
- Quais, conduites, cheminées, skyline, éclairage de tunnel, échangeur, clôtures, guérites et station enrichis. Personnages arrondis et caméra plus basse.
- Traces de pneus, fumée et boost adaptés des modules MIT de pmndrs avec 160 marques, 48 bouffées et 16 éléments de boost au maximum. Temps de simulation, pause, effacement et mouvement réduit testés.
- Cinq nouveaux tests couvrent les buffers et index du modèle, son empreinte au sol, le partage des géométries et les roues, les pools d'effets, les cartes et les sources/licences. Les roues gauches sont tournées vers l'extérieur par rotation, sans échelle négative, pour conserver des matrices compatibles avec l'instanciation et la même géométrie partagée.
- Vue CPU rapprochée du véhicule, secteurs et rencontre inspectés. Ce rendu de diagnostic ignore les cartes et reflets et produit des erreurs de tri sur les grandes surfaces : il ne représente pas le rendu WebGL final et ne valide pas la performance.
- Nouvel essai du moteur réel dans le navigateur distant : même refus de contexte WebGL. Le rendu PBR, les textures, les transparences et la fluidité GPU restent à vérifier sur un appareil disposant de WebGL pendant les essais après mise en ligne demandés par l'utilisateur.
- QR, CNAME et page principale conservés. Référence de sauvegarde avant graphismes : backup/course-before-graphics-20261022 → 37a23a6a1f205c1f16339028d38b69e348e193cf.

Les captures rapprochées de diagnostic de cette refonte restent hors du dépôt public : le contrôle automatique a refusé leur publication JPEG, faute de validation de leur contenu. Elles montrent la géométrie modifiée, sans préjuger du rendu GPU des matériaux.
