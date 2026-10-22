# FUITE DOUANIÈRE — ORIGINE NON DÉCLARÉE

Version 2 de la course autonome FLD. Une traversée nocturne de **13 km**, du Bureau des origines douteuses au Swagistan. Entrée inchangée : `/course.html`. Branche de revue : `feat/swagistan-night-run`, basée sur `main` au commit `ed6d9f01fbc3474a74010b00ce15c94ef35826f5`.

**Véhicules / 23 octobre 2026 :** la voiture joueur est désormais le coupé original **fld® / 89 NIGHTRUNNER**. Les poursuivants utilisent le modèle **DOUANE / D-89 INTERCEPTION**, en break haut et variante basse. Le [garage 3D](garage.html) permet de les examiner, au doigt ou au clavier, depuis le menu du jeu. Modèles, références et validation dans [VEHICLES.md](VEHICLES.md). Le trafic civil conserve son ancien modèle et ses crédits.

Le 22 octobre 2026, l’utilisateur autorise l’application de cette version au site existant. La publication utilise GitHub Pages, sans changer le domaine du QR. `CNAME`, la racine, le bouton vert, le protocole de la veste, les autres jeux et leurs données restent inchangés. La version publique précédente est conservée dans `backup/pre-swagistan-13k-2026-10-22`.

## Tester la branche

Node 18+ pour les contrôles ; Python 3 ou tout serveur HTTP statique pour jouer. Aucun paquet à installer pour le jeu, aucun CDN, compte ou serveur applicatif.

```sh
git clone --branch feat/swagistan-night-run https://github.com/y92pctjcjs-sys/IA-fuckladouane.git
cd IA-fuckladouane
npm run check
npm test
python3 -m http.server 8080
```

Ouvrir `http://localhost:8080/course.html`. Pour un iPhone sur le même réseau, ouvrir `http://ADRESSE_LOCALE_DU_SERVEUR:8080/course.html` dans Safari ; l’adresse locale dépend de la machine qui sert le dossier. Ne pas ouvrir le HTML par `file://` : les modules natifs nécessitent HTTP.

`node course/tools/measure.mjs` reproduit les mesures de simulation et de construction de scène **CPU seulement**. Le récepteur de rendu de cet outil ne valide ni WebGL ni les performances d’un téléphone.

## Voyage et progression

| Étape | Distance | Situation |
| --- | --- | --- |
| Bureau des origines douteuses | 0–2,2 km | Quais textiles, colis, entrepôts, première patrouille |
| From Elsewhere | 2,2–5,2 km | Route ouverte, pylônes, reliefs et ciel numérique |
| Tunnel OMERTA | 5,2–7,4 km | Béton suivant la route, conduites, lumière violette et ambiance sourde |
| Zone de contrôle | 7,4–10,5 km | Échangeur, locaux, véhicules stationnés et barrages |
| Dernière frontière | 10,5–13 km | Skyline fixe du Swagistan qui grossit à l’approche, poste frontalier puis découverte |

Neuf situations alternent pression et respiration. Les distances et paramètres sont partagés dans `track.js`. Les parcours automatisés mesurés prennent environ **4 min 31 à 4 min 34** ; la durée et la difficulté d’une partie manuelle restent à confirmer sur téléphone.

Chaque victoire franchit le poste du Swagistan et montre sept secondes d’arrivée. La rencontre après la frontière prolonge rarement cette arrivée : tirage cryptographique uniforme exact de 1/30, effectué une seule fois par victoire, jamais pour une défaite, sans compteur ni paramètre de forçage. L’algorithme de `ending.js` est inchangé.

## Commandes

| Action | Mobile | Clavier |
| --- | --- | --- |
| Direction | Zone analogique gauche, ou boutons via ⚙ | ← → / A D |
| Drift | DRIFT avec la direction | Espace |
| Nitro | NITRO | Majuscule |
| Frein | FREIN | ↓ / S |
| Pause / reprise | Ⅱ puis REPRENDRE | P / Échap |

Accélération automatique. Deux contacts suffisent pour toutes les manœuvres nécessaires. Direction lissée selon la vitesse, transition progressive vers la glisse et retour d’adhérence. Une nitro épuisée exige de relâcher le bouton avant réactivation afin d’éviter des à-coups.

Capture des pointeurs, relâchement hors zone, annulation, perte de capture et perte de focus libèrent les commandes. La pause automatique en arrière-plan fige le temps, les dégâts et la poursuite ; la reprise demande une action explicite. Le paysage est plus ouvert, le portrait reste pris en charge. Pas de plein écran ni de gyroscope requis.

Les barrages sont annoncés par des panneaux à 260 m et par un signal calculé selon la vitesse, au moins trois secondes avant le contact. Les dix rangées conservent une ouverture physique de plus d’une largeur de voiture. Trafic et poursuivants dégagent ce corridor ; les phases d’attaque sont interrompues à l’approche d’un barrage. Frottement et impacts sont différenciés, avec délai de protection.

## Audio et préférences

**ORIGINE NON DÉCLARÉE**, composition instrumentale originale à 108 BPM. Introduction, basse séquencée, batterie, nappes, inversions, plusieurs phrases d’arpèges, variation du tunnel, montée et résolution. La partition dépend du secteur, de la phrase et de la pression ; ce n’est pas un fichier court bouclé.

Web Audio programme les notes à partir de `currentTime`, indépendamment de `requestAnimationFrame` : rappel de 25 ms, anticipation de 120 ms, notes trop tardives abandonnées et voix bornées. Moteur/rapports simulés, vent, roulement, glisse, nitro, impacts, sirènes atténuées par la distance, tunnel et signaux de passage sont synthétisés localement. Le son commence uniquement après SON. Les volumes général/musique/effets sont distincts.

Une interruption audio de Safari met la partie en pause ; le retour dans la page ne force pas la réactivation. Une nouvelle partie réinitialise la partition sans empiler les séquenceurs. L’écoute et le mixage sur un iPhone réel restent à vérifier.

## Architecture et budgets

- `track.js` : route, secteurs, situations, courbure, dimensions des collisions et anticipation des barrages.
- `simulation.js` : simulation fixe à 120 Hz, conduite, trafic, rôles et phases des trois poursuivants, collisions, pause et fins.
- `input.js` : zone analogique, boutons, clavier et cycle de vie des contacts.
- `renderer.js` : dix emplacements de décor recyclés par tronçons de 80 m, géométries retirées libérées ; aucun décor complet de 13 km construit au démarrage.
- `sky.js` : un atlas 320 × 48, une géométrie instanciée et une passe GPU ; profondeur conservée, moins de chiffres en économie et après la frontière, décor figé en mouvement réduit.
- `models.js` : trafic civil, animation des roues et interface commune ; `vehicle-designs.js` : carrosseries FLD/DOUANE originales, vitrages, arches ouvertes, roues et freins ; `vehicle-livery.js` : atlas locaux et logo tribal exact. Les géométries statiques et les couleurs des feux sont regroupées par matériau.
- `scenery.js`, `materials.js`, `effects.js` : architecture, cartes partagées et pools d’effets fixes (160 traces, 48 bouffées, 16 éléments de boost).
- `quality.js` : résolution adaptative ×0,72 / ×1 / ×1,25, hystérésis, moins de décor lointain et de particules en économie. Les indications nécessaires à la conduite sont conservées.
- `score.js`, `audio.js` : composition et synthèse ; 96 voix transitoires maximum, sept couches continues.
- `storage.js`, `ending.js` : records distincts et tirage sans biais.
- `main.js`, `boot.js`, `style.css` : orchestration, interface, réglages, zones système, hauteur Safari et retour au protocole si le moteur échoue.

Objectifs : 60 images/s sur téléphone récent, environ 30 en économie sur matériel moins puissant. **Aucune de ces valeurs n’est déclarée mesurée sur téléphone.** Les statistiques accessibles dans ⚙ décrivent seulement le navigateur qui exécute réellement le rendu.

## Données

L’ancienne clé `fld.course.v1` reste lue et conservée sans écriture. Le souvenir amoureux existant est hérité. Les nouveaux chronos, scores et compteurs sont stockés dans `fld.course.v2`, avec l’identifiant `swagistan-13k-v2` ; les préférences du jeu utilisent `fld.course.preferences.v2`. Aucun record de 5,2 km n’entre dans le classement de 13 km. Stockage refusé, corrompu ou absent : fonctionnement en mémoire.

Les sources et licences sont détaillées dans [CREDITS.md](CREDITS.md), avec un écran de crédits depuis le menu. L’état des vérifications et les limites d’appareil sont dans [VALIDATION.md](VALIDATION.md).

## Retour arrière

La sauvegarde distante `backup/pre-swagistan-13k-2026-10-22` pointe sur la version publique précédente, `ed6d9f01fbc3474a74010b00ce15c94ef35826f5`. Pour revenir à cette version, faire un revert du commit d’intégration de la PR #2 avec `git revert -m 1 SHA_DU_MERGE`, puis publier ce revert par le mécanisme GitHub Pages existant. Ne pas réécrire l’historique ni modifier `CNAME`. Les anciennes données et le souvenir restent présents ; laisser les nouvelles clés en place est sans effet sur l’ancien jeu.
