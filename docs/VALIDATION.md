# Validation IA / FLD v5 — 22 octobre 2026

## Changements

Memory remplacé par FLD Drop. Silhouettes de vêtements sur grille 10 × 18, rotation avec dégagement près des murs et du sol, arrivée par lots mélangés de sept, pose fantôme, pose immédiate, descente accélérée, pause, lignes, combos, niveaux et record local. Le scan conserve 16,2 secondes actives mais change visuellement à chacune de ses quatre phases. Verdict et reçu SVG présentés comme pièce à conviction.

## Vérification automatique

- Syntaxe des cinq modules JavaScript validée.
- 28 tests Node réussis : scan, course, casse-briques, records et moteur FLD Drop.
- Drop : ordre des arrivages, masse conservée, pose exacte, rotations, dégagement mur/sol, collision bloquée sans mutation, dégagement de quatre lignes, suppression de deux lignes sans perte des autres, délai de fixation, limite de réinitialisation, descente accélérée sans téléportation, combo, changement de niveau, débordement et arrêt définitif.
- Fichiers originaux CNAME et sons inchangés.

## Vérification navigateur

Chrome de prévisualisation ; cadres de largeur 320, 390 et 768 px.

| Parcours | Résultat |
| --- | --- |
| Scan complet | Quatre phases et arrivée au nouveau verdict |
| Scan mobile 320 / 390 | Aucun débordement ; verdict atteint |
| Verdict 320 / 390 / 768 | Reçu lisible, aucune largeur débordante |
| Bouton Écouler le stock | Ouvre directement FLD Drop |
| FLD Drop | Rotation, gauche/droite, pose par bouton et clavier, score |
| Descente | Bouton fonctionnel, accélération et pose |
| Pause / reprise | Score conservé ; commandes suspendues |
| Navigation pendant Drop | Retour à une partie en pause, reprise explicite |
| Fin de partie | Stock saisi ; record de 134 points enregistré puis retrouvé après rechargement |
| Arcade 320 / 390 / 768 | Aucun débordement horizontal |
| Mouvement réduit et stockage bloqué | FLUX OFF initial ; verdict, reçu et Drop utilisables en session |
| Reçu SVG | Prévisualisation chargée, 900 × 1200 px |

## Limites

- Aucun test sur un véritable Safari iPhone ; les commandes tactiles ont été actionnées dans Chrome et les gestes restent à confirmer sur l’appareil réel.
- Le SVG est généré et chargé correctement. Le téléchargement dans Fichiers sur iOS n’est pas déclaré vérifié.
- Les dégagements de lignes et le seuil d’archive sont couverts par le moteur testé ; aucune partie manuelle de huit lignes n’a été accomplie.
- Un clic dans le cadre mobile du navigateur distant a expiré pendant une longue série d’actions. L’interface restait jouable, et la même partie a été terminée au clavier avec un record sauvegardé.

## Publication et retour arrière

Publication sur main par commit enfant de 00f11f31933a7532379f16a98821a43d9a1f3dd6, sans changement de domaine. Le QR existant reste valable. Les ressources de cette version portent ?v=5. La V4 demeure dans l’historique Git et sur la sauvegarde backup/ia-before-v5-20261022.
