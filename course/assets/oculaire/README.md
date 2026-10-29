# Modèle OCULAIRE

Fichier attendu : `oculaire-tete-v4.glb`.

- Taille : 41 870 456 octets.
- SHA-256 : `08ac7e703ce322dadbd3c5a8be83955c17ca8289fa739c260575ffe248c5d10e`.
- Source validée, tête seule : cinq yeux, trois nez modélisés, trois bouches, textures incorporées.

Le fichier original est conservé dans les fichiers du projet avec sa source Blender. Le copier ici sans réexport, recompression ou modification de sculpture.

Le chargement est asynchrone et utilise le chargeur officiel Three.js r160 local. Les textures et la géométrie restent intactes. Les matériaux conservent leurs cartes PBR ; le brouillard et le tone mapping de la route sont désactivés uniquement sur cette présence céleste pour conserver ses pigments.

Si le binaire manque sur une branche de reprise, son import n'est pas livré sur cette branche et celle-ci ne doit pas être publiée. `OCULAIRE_ETAT.md` indique explicitement si son transfert est achevé. Une erreur d'import est visible dans la console et dans `#world.dataset.oculaireError` ; le jeu continue à fonctionner, mais cela ne valide pas OCULAIRE.

Le fichier `course/oculaire-preview.html` utilise le vrai moteur du jeu, avec contrôles de distance et de voie. Il ne modifie ni la simulation, ni le score, ni le tirage de la fin amoureuse.
