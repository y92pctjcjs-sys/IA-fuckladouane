# FUITE DOUANIÈRE — ORIGINE NON DÉCLARÉE

Version 3 **RECHERCHÉ** de la course autonome FLD. Une traversée nocturne de **13 km**, du Bureau des origines douteuses au Swagistan. Entrée inchangée : `/course.html`. Branche : `feat/swagistan-pursuit-v3`, basée sur la version publique `edd865e7512b1bdecf1e4e96bd5535c4219bb1bd`.

**Véhicules / 23 octobre 2026 :** la voiture joueur est désormais le coupé original **fld® / 89 NIGHTRUNNER**. Les poursuivants utilisent le modèle **DOUANE / D-89 INTERCEPTION**, en break haut et variante basse. Le [garage 3D](garage.html) permet de les examiner, au doigt ou au clavier, depuis le menu du jeu. Modèles, références et validation dans [VEHICLES.md](VEHICLES.md). Le trafic civil conserve son ancien modèle et ses crédits.

La publication utilise GitHub Pages, sans changer le domaine du QR. `CNAME`, la racine, le bouton vert, le protocole de la veste, les autres jeux et leurs données restent inchangés. La version de 13 km précédant cette hausse de difficulté est conservée dans `backup/pre-pursuit-v3-with-vehicles`. La sauvegarde antérieure de la course de 5,2 km reste également conservée.

## Tester la branche

Node 18+ pour les contrôles ; Python 3 ou tout serveur HTTP statique pour jouer. Aucun paquet à installer pour le jeu, aucun CDN, compte ou serveur applicatif.

```sh
git clone --branch feat/swagistan-pursuit-v3 https://github.com/y92pctjcjs-sys/IA-fuckladouane.git
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

Neuf situations alternent pression et respiration. Les distances et paramètres sont partagés dans `track.js`. Sur la séquence de référence, le contrôleur utilisant la nitro et le frein termine en environ **4 min 19** ; le contrôleur qui évite seulement le trafic termine de justesse en **4 min 35**. Ce ne sont pas des parties manuelles sur téléphone.

Seize affiches originales sont réparties sur 65 emplacements, dans les tunnels et le long des bas-côtés arborés, quais et postes de contrôle : bordereaux d’origine, SAV 06:00–06:20, stock fantôme, OMERTA, signal perdu, avis de recherche et accueil du Swagistan. Un atlas 1024 × 1536 est partagé ; seuls les panneaux des dix tronçons courants existent dans la scène.

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

Gauche et droite désignent le côté de l’écran. La conversion vers l’axe routier est centralisée ; les indications d’ouverture des barrages utilisent la même convention. Un test projette la voiture avec la vraie caméra Three.js pour protéger ce raccord.

Capture des pointeurs, relâchement hors zone, annulation, perte de capture et perte de focus libèrent les commandes. La pause automatique en arrière-plan fige le temps, les dégâts et la poursuite ; la reprise demande une action explicite. Le paysage est plus ouvert, le portrait reste pris en charge. Pas de plein écran ni de gyroscope requis.

Les barrages sont annoncés par des panneaux à 260 m et par un signal calculé selon la vitesse, au moins trois secondes avant le contact. Les dix rangées conservent une ouverture physique de plus d’une largeur de voiture. Les civils attendent devant les parties fermées puis repartent par l’ouverture après le joueur, au lieu de traverser les barrières. Les phases d’attaque sont interrompues à l’approche du barrage. Frottement et impacts restent différenciés, avec délai de protection.

## Poursuite et score

Une patrouille marquée intervient dès les premiers mètres (pression mesurée à partir de 4,24 secondes). Deux douanes banalisées partagent les peintures et la carrosserie des passagers. Elles sont visibles avant de se révéler : aucun véhicule n’apparaît contre la portière. La révélation déclenche feux bleus, signal sonore, hausse de pression et 2,4 secondes d’approche avant une attaque volontaire. Une collision avec la voiture elle-même reste possible. Trois poursuivants maximum, avec suivi, approche latérale, encerclement, réaction différée et récupération après contact.

Vitesse des douaniers bornée à 61 m/s et accélération à 9,2 m/s² ; la nitro du joueur reste plus rapide. Une voiture banalisée réellement décrochée peut revenir dans le trafic uniquement après être sortie des limites de visibilité, puis se révéler à nouveau plus loin. Le petit rétro du HUD montre seulement les douaniers déjà révélés proches, sans second rendu 3D. La séquence d’approche varie à chaque nouvelle partie.

Le score récompense l’arrivée, la résistance, les passages au ras sans contact, les échappées et la distance de drift propre ; les bonus sont plafonnés. Une victoire reçoit un rang C, B, A ou S. **GARDER LA PREUVE** génère une carte PNG 1080 × 1440 avec les valeurs exactes du résultat ; téléchargement, aperçu à enregistrer par appui long, partage de fichier quand le navigateur le propose. Aucun envoi automatique ni classement en ligne.

## Audio et préférences

**HORIZON NON DÉCLARÉ**, composition instrumentale originale à 108 BPM. Direction synthwave / dreamwave plus aérienne : introduction, basse, batterie, accords de septième, nappes stéréo, arpèges, mélodie en appels/réponses sur seize mesures, tunnel resserré, montée et résolution. Deux échos filtrés donnent de l’espace sans fichier de réverbération externe. Aucun morceau commercial ni extrait de Skydive n’est incorporé.

Web Audio programme les notes à partir de `currentTime`, indépendamment de `requestAnimationFrame` : rappel de 25 ms, anticipation de 120 ms, notes trop tardives abandonnées et voix bornées. Le moteur utilise désormais triangle et sinus graves filtrés, sans dent de scie ; les rapports ont une hystérésis pour éviter les oscillations de régime. Son volume par défaut est de 28 %, avec un **interrupteur moteur indépendant** mémorisé. Musique, bruitages et moteur ont chacun leur bus ; couper le moteur conserve vent, roulement, glisse, nitro, impacts, sirènes, tunnel et alertes. Le son commence uniquement après SON.

Une interruption audio de Safari met la partie en pause ; le retour dans la page ne force pas la réactivation. Une nouvelle partie réinitialise la partition sans empiler les séquenceurs. L’écoute et le mixage sur un iPhone réel restent à vérifier.

## Architecture et budgets

- `track.js` : route, secteurs, situations, courbure, dimensions des collisions et anticipation des barrages.
- `simulation.js` : simulation fixe à 120 Hz, conduite, trafic, rôles et phases des trois poursuivants, collisions, pause et fins.
- `pursuit.js` : patrouille et deux banalisées, files aux barrages, révélations, réactions et retours hors champ.
- `input.js` : zone analogique, boutons, clavier et cycle de vie des contacts.
- `renderer.js` : dix emplacements de décor recyclés par tronçons de 80 m, géométries retirées libérées ; aucun décor complet de 13 km construit au démarrage.
- `sky.js` : un atlas 320 × 48, une géométrie instanciée et une passe GPU ; profondeur conservée, moins de chiffres en économie et après la frontière, décor figé en mouvement réduit.
- `models.js` : interface commune et civils/banalisées ; `vehicle-designs.js` et `vehicle-livery.js` conservent les modèles originaux FLD / DOUANE, leurs roues et le vrai logo tribal. Le garage publié reste accessible.
- `scenery.js`, `materials.js`, `effects.js` : architecture, cartes partagées et pools d’effets fixes (160 traces, 48 bouffées, 16 éléments de boost).
- `quality.js` : résolution adaptative ×0,72 / ×1 / ×1,25, hystérésis, moins de décor lointain et de particules en économie. Les indications nécessaires à la conduite sont conservées.
- `score.js`, `audio.js` : composition et synthèse ; 96 voix transitoires maximum, sept couches continues.
- `posters.js` : seize graphismes originaux dans un atlas partagé, panneaux des tronçons visibles seulement.
- `results.js` : rang, format de chrono et dessin de la carte de score.
- `storage.js`, `ending.js` : records distincts et tirage sans biais.
- `main.js`, `boot.js`, `style.css` : orchestration, interface, réglages, zones système, hauteur Safari et retour au protocole si le moteur échoue.

Objectifs : 60 images/s sur téléphone récent, environ 30 en économie sur matériel moins puissant. **Aucune de ces valeurs n’est déclarée mesurée sur téléphone.** Les statistiques accessibles dans ⚙ décrivent seulement le navigateur qui exécute réellement le rendu.

## Données

`fld.course.v1` et `fld.course.v2` restent lues et conservées sans écriture. Le souvenir amoureux acquis dans l’une ou l’autre est hérité. Les nouveaux chronos, scores et compteurs RECHERCHÉ sont stockés dans `fld.course.v3`, avec l’identifiant `swagistan-13k-v3-pursuit`. Aucun record des difficultés précédentes n’entre dans le nouveau classement. Les préférences restent dans `fld.course.preferences.v2`, enrichies du volume et de l’interrupteur moteur. Stockage refusé, corrompu ou absent : fonctionnement en mémoire.

Les sources et licences sont détaillées dans [CREDITS.md](CREDITS.md), avec un écran de crédits depuis le menu. Les vérifications actuelles sont dans [VALIDATION-V3.md](VALIDATION-V3.md) ; [VALIDATION.md](VALIDATION.md) archive la validation précédente. Les URL du CSS et des modules propres à cette version portent `?v=pursuit3`, afin de charger un ensemble cohérent malgré le cache Pages de dix minutes. Les dépendances tierces locales immuables sont conservées.

## Retour arrière

La sauvegarde distante `backup/pre-pursuit-v3-with-vehicles` pointe sur la version publique précédente, `edd865e7512b1bdecf1e4e96bd5535c4219bb1bd`. Pour y revenir, faire un revert du commit de merge de `feat/swagistan-pursuit-v3`, puis publier ce revert par GitHub Pages. Le SHA du merge figure dans la PR de livraison. Ne pas réécrire l’historique ni modifier `CNAME`. Les anciennes données restent présentes ; laisser `fld.course.v3` en place est sans effet sur la version précédente. Le souvenir amoureux acquis en V3 n’est pas écrit dans les anciens formats.
