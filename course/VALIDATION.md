# Validation de l'extension course — 22 octobre 2026

## Statut

**Branche de travail uniquement : validation graphique WebGL non terminée. Ne pas fusionner/publication GitHub Pages avant cette validation.** Le site de production et sa configuration restent sur le commit initial.

## Vérifications terminées

- 48 tests Node réussis : les 28 tests d'origine et 20 tests de l'extension.
- Syntaxe des cinq modules d'origine et des neuf modules du jeu vérifiée.
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
- Interface seule : vérifiée dans une prévisualisation locale remplaçant exclusivement le renderer par un fond 2D explicitement marqué QA. Cette vérification ne valide ni le rendu ni la fluidité du jeu.

## Contrôle de la géométrie sans GPU

Le vrai constructeur de scène Three.js a été exécuté avec un récepteur de rendu injecté dans les tests : secteurs, véhicules instanciés, matrices et caméra, arrivée normale, interception et scène romantique sans objet manquant ou valeur non finie. Le nombre de maillages visibles reste sous 350 dans ces instantanés ; cela ne constitue pas une mesure GPU.

Un aperçu local utilise le SVGRenderer officiel de Three.js r160 sur la géométrie réelle. Les instances y sont développées pour inspection. Les vues industrie, tunnel et rencontre ont été inspectées ; cela a permis de dégager l'accès à la station et d'orienter les personnages face à face. Les captures portent un avertissement explicite : ce rendu CPU ne valide pas WebGL, les textures, le brouillard ou la fluidité. Aucun de ces fichiers d'aperçu ne fait partie du commit.

## Blocage graphique observé

Le navigateur distant refuse la création du contexte WebGL. L'erreur Three.js indique `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, puis `BindToCurrentSequence failed`. Un nouvel essai avec la préférence graphique standard donne le même échec. Le repli visible offre un retour au protocole.

Il n'y a donc **aucune capture validée de la course 3D**. Les images jointes documentent le bouton mobile, le blocage réel et des aperçus CPU explicitement identifiés ; elles ne doivent pas être présentées comme une preuve de jouabilité 3D.

## Contrôles à terminer avant fusion

Sur un navigateur disposant de WebGL, puis sur Safari d'un iPhone réel :

1. Vérifier le rendu de la route, des trois secteurs, des marquages, des voitures et des collisions pendant une course complète.
2. Tester une victoire manuelle, une interception et le bouton rejouer avec le moteur 3D actif.
3. Vérifier l'arrivée habituelle et la scène romantique : positions, caméra, approche, dialogue et transitions. Injecter un générateur uniquement dans une prévisualisation locale exclue de Git ; ne pas ajouter de commande de forçage dans la production.
4. Vérifier 320, 390 et 768 px avec le rendu actif ; orientation et barres Safari, zones système, lisibilité du HUD et boutons tactiles.
5. Maintenir direction + nitro puis drift avec plusieurs doigts, relâcher hors du bouton et annuler un contact.
6. Vérifier la fluidité soutenue, la chauffe, la lisibilité nocturne et le comportement aux variations de fréquence. Le plafond de résolution et l'instanciation réduisent le coût, sans constituer une mesure de performance sur appareil.
7. Vérifier le son et son mixage moteur/nitro/impacts/sirènes, le passage en arrière-plan, le retour nécessitant une reprise et le mouvement réduit.
8. Faire un parcours avec localStorage réellement bloqué et confirmer le résultat conservé en mémoire.
9. Après ces contrôles seulement : fusionner dans main, attendre GitHub Pages, ouvrir l'URL publique et vérifier le lien et les fichiers. Aucun déploiement n'est déclaré validé à ce stade.

## Protection du dépôt

Le nouveau commit doit avoir pour parent le main actuel vérifié. Le nouvel arbre reprend l'arbre de départ et ajoute uniquement `course.html`, `course-entry.css`, les fichiers `course/` et les deux ajouts de `index.html`. Les sons existants sont hérités de l'arbre de départ, sans lecture/écriture ou remplacement de leurs blobs. Aucun changement de CNAME, GitHub Pages ou domaine.

Sauvegarde : `backup/pre-course-2026-10-22` → `d0abc539c9e43c3b5b5bd7a9e8a10367b6e36293`.
