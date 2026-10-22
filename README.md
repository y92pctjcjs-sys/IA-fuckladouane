# ia.fuckladouane.com — Protocole FLD® v5

Expérience satirique ouverte depuis le QR de la veste fuckladouane®. Le même domaine et la même racine sont conservés : aucun changement du QR brodé n’est nécessaire.

## Expérience

- Pluie de chiffres Matrix violette visible, indépendante de la fréquence de l’écran, plafonnée à 30 images/s.
- Veste schématique à **buste court, capuche et manches longues**. Ce dessin est une représentation, pas une mesure ni un patronage du prototype.
- Scan de 16,2 secondes actives : acquisition de fibres, tracé des coutures, carte du Swagistan et corrélation finale. Viseur mobile, nuage de points, faisceau lié à la progression, interceptions absurdes et alibi humain.
- Verdict « THIS GARMENT HAS BEEN MADE BY IA », exportable en reçu SVG façon pièce à conviction, avec tampon et code-barres.
- Trois jeux tactiles et clavier : **Douane Run**, **Casse-frontière**, **FLD Drop**.
- Huit archives à débloquer, dont Stock fantôme pour huit lignes évacuées dans FLD Drop ; terminal de commandes et secrets dans l’interface.
- Ambiance originale existante activable, effets sonores synthétisés et commande de mouvement.
- Scores, archives et préférence de mouvement enregistrés localement, avec fonctionnement en mémoire si le stockage est bloqué.

## Déploiement GitHub Pages

Le site reste sans dépendance, sans compilation et sans service payant.

1. Publier les fichiers à la racine de main, la branche existante du site.
2. Conserver **CNAME** exactement : **ia.fuckladouane.com**.
3. Dans **Settings → Pages**, conserver la source existante **main / racine** et le domaine personnalisé.
4. Attendre la fin du déploiement GitHub Pages, puis ouvrir l’URL depuis le QR sur Safari.
5. Si une ancienne version reste affichée, recharger la page. Les ressources de la nouvelle version portent **?v=5**.

Un commit sur main déclenche la publication si Pages utilise main / racine. Les fichiers audio d’origine restent au même endroit. Aucun fichier du shop Big Cartel n’est utilisé.

Un QR contient une URL : il ne prouve pas la possession de la veste et n’est pas un contrôle d’accès. Le site public reste ouvrable directement. La balise noindex et robots.txt demandent aux moteurs de ne pas indexer le parcours ; ils ne le rendent pas privé.

## Structure

| Fichier | Rôle |
| --- | --- |
| index.html | Écrans, veste SVG courte, clavier et interface accessible |
| styles.css | Mise en page responsive, scanner, états de mouvement |
| app.js | Scan, navigation, son, archives, terminal et export du verdict |
| matrix.js | Rendu et cycle de vie de la pluie de chiffres |
| arcade.js | Interface et rendu des trois jeux, tactile et clavier |
| core.js | Règles pures du scan, de la course et du casse-briques |
| drop.js | Moteur de FLD Drop : silhouettes, rotations, gravité, collisions, lignes, niveaux |
| tests/*.test.js | 28 tests des règles, collisions, rotations, lignes, vies et records |
| ambient-loop-22s.wav | Boucle originale conservée ; chargée à la demande |
| click-tone.wav | Son d’origine conservé pour compatibilité |
| CNAME | Domaine du QR, conservé |

## Utilisation mobile

- **Scan :** lancer, toucher les points de la veste, tenter l’alibi humain, patienter ou abréger. Changer de rubrique suspend le scan ; revenir le reprend.
- **Course :** toucher la voie, utiliser les boutons ← → ou les flèches. Les losanges rapportent des points ; les barrières coûtent une vie. Trois vies.
- **Casse-briques :** glisser le doigt ou tenir ← →. Après une balle perdue, toucher le terrain ou presser espace pour relancer. Trois vies.
- **FLD Drop :** emboîter les coupes de vêtements pour compléter des lignes. Sept arrivages mélangés sans répétition dans chaque lot : tee, zip court, denim, écharpe, colis, top crop et manches. Une silhouette en pointillés montre la pose. Gauche/droite déplacent ; ↻ tourne ; maintenir ↓ accélère ; ⇓ pose immédiatement. Sur le terrain, toucher tourne, glisser horizontalement déplace, glisser vers le bas pose. Au clavier : ← →, ↑ ou X, ↓ et espace. Huit lignes débloquent une archive ; toutes les huit lignes, le niveau augmente. Le stock atteignant le plafond termine la partie.
- **Pause :** bouton PAUSE, touche P ou Échap. Les jeux se mettent en pause en arrière-plan et lors d’un changement de rubrique. La reprise exige une action.
- **Son :** désactivé au chargement. Toucher SON l’active avec un geste autorisé par Safari. L’ambiance s’arrête en arrière-plan.
- **Mouvement :** FLUX fige les animations décoratives et la pluie, tout en conservant les jeux jouables. Une préférence système de mouvement réduit est respectée par défaut.
- **Archives :** progression propre à ce navigateur et à ce domaine, sans compte ni classement en ligne. Effacer les données du site efface cette progression.

## Progression existante

La clé locale de la V4 est conservée : les records de course et casse-briques, les sept archives toujours présentes et le réglage de mouvement restent disponibles. L’ancien memory est retiré ; son record et son archive ne sont pas convertis en récompense FLD Drop.

## Développement

Node 18+ pour les tests seulement. Aucune installation de paquet nécessaire.

~~~sh
npm run check
npm test
~~~

Servir le dossier avec un serveur HTTP statique pour tester les modules JavaScript ; ne pas ouvrir index.html en tant que fichier local.

Les secrets sont des interactions locales prédéfinies. Le terminal n’exécute aucun code, ne collecte aucun texte et ne contacte aucun serveur. Le scan ne demande ni caméra ni micro et ne produit aucune authentification réelle.
