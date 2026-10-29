# OCULAIRE — adaptation de jeu

`portrait-data.js` contient les surfaces adaptées depuis la sculpture approuvée v4 : positions quantifiées, normales, pigments et indices. Le moteur décode ces attributs nativement ; aucun GLB ni texture distante à télécharger.

Préparation hors jeu : `python course/tools/prepare-oculaire.py SOURCE.glb course/assets/oculaire/portrait-data.js` (numpy, scipy, Pillow).

La sculpture et ses textures sources restent intactes. Les cinq yeux, trois nez, trois bouches et leurs proportions guident la version de production. Les dents ne font pas partie du rendu de jeu.
