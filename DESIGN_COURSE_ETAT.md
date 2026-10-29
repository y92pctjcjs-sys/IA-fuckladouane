# FLD / SWAGISTAN MOTOR CLUB — état design

Date : 29 octobre 2026. Branche : `feat/swagistan-design-prototype-20261029`.
Base : `e40304b73d5127b7d6be2b5daa5b701ed0b984ec` (main). Aucun changement local préexistant, aucun AGENTS.md dans le dépôt.

## Jalon 1 — audit

- Dépôt cloné avec historique et branches ; publication existante : GitHub Pages, main / racine (README). Ne pas migrer l’hébergement ni toucher CNAME.
- HTML public récupéré par HTTP 200, identique octet pour octet à la base : SHA-256 `cf86af46f43698d76bca6b5f639c4148c182c154249032fdf484b8880180ac2b`. Les 29 ressources du graphe chargé, CSS et logo ont été comparées par SHA-256 : toutes identiques. Rapport `course/validation/design-public-base.json` ; transfert HTTP seul, pas temps de chargement complet du jeu.
- Three.js local, simulation fixe 120 Hz distincte du rendu, 13 000 m / cinq étapes, dix tronçons recyclés, sept civils et trois poursuivants (une patrouille + deux banalisées), six livrées équipables. Géométrie civile actuelle partagée : voiture muscle, trois peintures.
- Gabarits de collision inchangés : trafic ±0,95 m / ±2,05 m ; poursuivant ±0,98 m / ±2,12 m. Les nouveaux modèles doivent remplir ce gabarit suffisamment pour ne pas tromper le joueur ; aucune variation de taille par transformation globale.
- `npm test` : 92/92 ; `npm run check` : 51 fichiers. Mesures de référence : `course/validation/design-baseline-cpu.json`. Construction scène CPU 1 075 ms ; deux traversées CPU 2 546 ms ; maximum 346 maillages visibles, 170 géométries vivantes, dix tronçons. Ces nombres dépendent de l’hôte et ne sont pas des appels GPU ni une mesure de fluidité.

## OCULAIRE — état protégé

- Absent de main et de sa page publique ; aucune reconstruction, aucun import dans cette mission.
- Branche `feat/oculaire-integration-20261029` : `6bde5dc9c484e9f855d5079e5f0911e9b6cf4ce5`.
- Branche `feat/oculaire-art-direction-20261029` : `900b818bc1d7f4389cbc1d205aa718518ee58f10` ; son `OCULAIRE_ETAT.md` a été lu. Adaptation v4, regards, paroles et finale déclarés implémentés ; contrôles restants et absence de publication explicitement consignés. Ce compte rendu n’est pas une revalidation.
- Les deux branches et leurs ressources restent intactes. Ne pas les fusionner implicitement avec cette refonte.

## Références examinées

- Site officiel Asphalt Legends : https://asphaltlegends.com/fr ; page d’accueil et bloc COURSE D’ARCADE réellement observés dans le navigateur.
- Gameloft : https://www.gameloft.com/newsroom/asphalt-legends-touge-masters-summer-season-update-52.
- Lecture retenue pour FLD : grand volume de carrosserie devant un horizon moins contrasté ; reflet large qui explique le galbe ; vitrage sombre continu mais piliers distincts ; optiques découpées ; panneau opaque, typographie condensée, une action dominante et peu de diagonales. Ce sont des choix de design issus de l’observation, pas une copie des ressources.

## Erreurs et limites constatées avant modification

- Recherche web sur la page du jeu : `URL https://ia.fuckladouane.com/course.html is not accessible via this tool.` Lecture HTTP et navigateur utilisés pour les contrôles adaptés.
- Navigateur cloud, Chrome, fenêtre 1365 × 936 environ : `THREE.WebGLRenderer: A WebGL context could not be created. Reason: Could not create a WebGL context ... GL_VENDOR = Disabled, GL_RENDERER = Disabled ... ErrorMessage = BindToCurrentSequence failed:` puis `Error creating WebGL context.` Le panneau MOTEUR INDISPONIBLE est visible sur la version publique de base. C’est une limite de cet environnement ; aucune preuve que le jeu échoue sur l’appareil du joueur.
- Pas de rendu de course, de FPS GPU, de régularité des images, de mémoire GPU ou de temps au premier rendu disponibles. Aucun essai sur iPhone physique. Les trois profils restent à mesurer ; aucun budget GPU définitif fixé.
- Ne pas utiliser les anciens fichiers de validation ou une projection CPU comme preuve d’un rendu WebGL actuel.

## Jalon 2 — prototype prévu

1. B01 graphite : compacte cinq portes à hayon, modules bleus de calandre / pare-brise / lunette ; C01 ivoire : citadine arrondie ; version civile de B01 partageant la même coque.
2. Un seul panneau : pause, avec priorité reprise, commandes, réglages ; identifiants et événements conservés.
3. Un morceau de quai industriel, hors conduite, ressources partagées et recyclage existant.
4. Contrôles de géométrie, empreinte, animation, révélation, recyclage, non-régression et inspection du panneau dans le navigateur.

## Condition de passage au jalon 3

Observer le prototype dans le vrai rendu du jeu à vitesse normale, en virage, portrait et paysage. Tant que WebGL est indisponible, sauvegarder une branche examinable ; ne pas multiplier les onze variantes restantes ni publier une version dont ce contrôle indispensable manque.

## Prochaine action

Terminer les empreintes publiques et sauvegarder cet audit, puis implémenter le petit prototype. Dernier jalon vérifié : audit de code ; rien de cette mission n’est encore publié.
