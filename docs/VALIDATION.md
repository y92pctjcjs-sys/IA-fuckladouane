# Validation de la refonte IA / FLD v4

Contrôles effectués le 22 octobre 2026, sur le code de cette branche.

## Contrôles automatiques

- Vérification de syntaxe des quatre modules JavaScript : réussie.
- 14 tests Node : réussis.
- Couverture des règles : bornes et seuils du scan, mélange des huit paires, voie libre garantie, collisions de la course, invulnérabilité, arrêt après fin de partie, rebond de raquette, destruction des briques, victoire, perte des trois vies, rebond sur mur, limites de raquette et sens des records.
- Diff sans erreur d’espacement.
- CNAME existant conservé. Les deux fichiers WAV existants restent inchangés.

## Contrôles navigateur

Prévisualisation HTTP du code source dans Chrome ; formats mobiles reproduits dans des cadres de largeur 320, 390 et 768 px.

| Parcours | Résultat observé |
| --- | --- |
| Intro / veste | Veste courte à manches longues ; pluie de chiffres visible |
| Trois points de la veste | Trois inspections et archive débloquée |
| Scan complet mobile | Progression jusqu’au verdict final |
| Alibi humain | Réponse satirique et archive débloquée |
| Navigation pendant un jeu | Partie mise en pause ; reprise explicite |
| Douane Run | Lancement, boutons de direction, pause et reprise |
| Casse-frontière | Lancement, commandes clavier, pause |
| Mémoire saisie | 16 cartes ; pause pendant un échec ; fin complète en 9 coups |
| Record de mémoire | 9 coups affichés et retrouvés après rechargement |
| Commandes SWAGISTAN / OMERTA | Réponses et archives débloquées |
| Texte ressemblant à du HTML dans le terminal | Affiché comme texte ; aucune image injectée |
| Cinq pressions sur le sceau | Archive Omerta et message secret |
| Mouvement réduit simulé | FLUX désactivé au chargement |
| Stockage bloqué simulé | Scan, archives et bascule de mouvement restent utilisables |
| Son | Élément audio chargé, prêt et en lecture après activation |
| Reçu | Fenêtre de prévisualisation et image SVG 900 × 1200 chargée |
| Largeurs 320 / 390 / 768 | Aucun débordement horizontal dans les trois rubriques |

## Limites de ces contrôles

- Ce navigateur de prévisualisation n’est pas Safari iOS. Le contrôle final sur un véritable iPhone reste à faire.
- Le lien de téléchargement du reçu est présent et pointe vers le SVG généré. Le navigateur de test ne remonte pas d’événement de téléchargement : la récupération du fichier sur Safari n’est pas déclarée vérifiée.
- Les moteurs des jeux sont testés automatiquement. La victoire au casse-briques et un score de 600 à la course n’ont pas été joués manuellement dans le navigateur de test.
- Aucun déploiement sur la branche main ni changement de DNS n’a été effectué pendant ces contrôles.

## Publication

La refonte est destinée à la branche main et conserve le domaine du QR et les sons existants. Une sauvegarde de la version précédente est disponible sur backup/ia-before-v4-20261022, au commit acccac45f1713d7faa7d279b6e99f637712a1dad.

Le blocage initial HTTP 403 de l’intégration a été résolu par l’installation de l’application GitHub sur le compte propriétaire. La publication utilise un commit enfant de la version précédente et une mise à jour de main sans réécriture de son historique.

Après déploiement, tester depuis le QR de la veste une partie, le son et l’enregistrement du reçu sur un véritable Safari iPhone.
