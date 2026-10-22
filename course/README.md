# FUITE DOUANIÈRE — SWAGISTAN MOTOR CLUB

Extension statique indépendante du protocole IA / FLD. Entrée : `/course.html`.

## Modules

- `track.js` : route de 5 200 m, échantillonnage partagé, reliefs, secteurs et barrages.
- `simulation.js` : physique arcade, trafic, trois poursuivants au maximum, collisions, états et horloge fixe à 120 Hz.
- `renderer.js` : Three.js, compacte FLD et décors procéduraux, scène d'arrivée et rencontre.
- `input.js` : clavier et contacts indépendants avec capture des pointeurs.
- `main.js` : interface, orchestration, pause, cycle de vie de la page et résultats.
- `ending.js` : décision terminale par tirage cryptographique uniforme, générateur injectable dans les tests.
- `storage.js` : records et souvenir dans `fld.course.v1`, repli en mémoire.
- `audio.js` : synthèse locale, sans fichiers sonores externes, silence initial.
- `vendor/three.module.min.js` : Three.js **0.160.0**, distribution officielle `r160`, un module autonome, licence MIT jointe.

## Exécution et contrôles

Servir le dépôt avec un serveur HTTP statique, puis ouvrir `/course.html`. Aucun assemblage, installation, CDN, API ou compte requis. Les modules ES ne sont pas destinés à être ouverts par `file://`.

- Direction : flèches gauche/droite ou A/D.
- Frein : flèche bas ou S.
- Drift : espace avec direction ; relâcher pour reprendre l'adhérence.
- Nitro : Majuscule.
- Pause/reprise : P ou Échap, ou bouton Ⅱ.
- Sur écran tactile : maintenir les boutons correspondants, y compris plusieurs contacts.

Le chronomètre et les règles ne dépendent pas du rendu : accumulateur à pas fixe, rattrapage plafonné à 250 ms pour éviter une explosion de simulation après une interruption. Les collisions possèdent une fenêtre de protection de 900 ms. Les barrages signalés à 100 m laissent au moins une ouverture de largeur suffisante. Le son est activé uniquement par un geste et suspendu en arrière-plan.

## Vérifications

Depuis la racine :

```sh
npm run check
node --test tests/*.test.js course/tests/*.test.js
node --check course/boot.js
node --check course/main.js
node --check course/renderer.js
node --check course/audio.js
node --check course/input.js
```

Le lancement automatique `npm test` découvre également les tests de la course dans un checkout propre. Ne pas conserver dans le dépôt un export de prévisualisation qui en dupliquerait les tests.

Tests déterministes : 30 issues du tirage, rejet de valeurs hors du seau uniforme, tirage unique par arrivée, défaite sans tirage, parcours complet et rejouabilité, interception, collisions, drift, nitro, direction, pause, horloge à 30/60/144 Hz, stockage bloqué, multitouch et protection du protocole.

## Retour arrière

Le commit de départ est `d0abc539c9e43c3b5b5bd7a9e8a10367b6e36293`. Sa référence distante est `backup/pre-course-2026-10-22`. La branche de travail est `feat/fuite-douaniere`. Après une éventuelle fusion, préférer un revert du commit d'intégration afin de conserver l'historique.

Les fichiers de prévisualisation, adaptations sans GPU, import maps de test et moyens d'injecter une fin déterministe restent locaux : ils ne font pas partie de cette extension publiée.
