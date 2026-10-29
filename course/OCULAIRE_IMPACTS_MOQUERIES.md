# PROMPT MAÎTRE — OCULAIRE / 360° ET MOQUERIES

Continuer le jeu FLD existant à partir de son dernier état publié. La tête et la chevelure actuelles sont validées. Ajouter une réaction brève et moqueuse aux dégâts du joueur, sans changer la conduite, les collisions ni la difficulté.

## Déclencheur

Chaque dégât réellement accepté par la simulation déclenche un tour complet de la tête et un bruitage de moquerie. Utiliser `hitSerial`, incrémenté par `hit()`, comme source commune du rendu et du son. Un frottement sans dégât, un contact ignoré pendant l’invulnérabilité ou une nouvelle image du même impact ne déclenche rien de plus. Inclure les barrières, véhicules et attaques de douane. Le dernier dégât fatal conserve sa réaction pendant l’interception.

## Rotation

Faire exactement 360° autour de l’axe vertical local de la tête, sur place, en 0,88 seconde. Accélérer puis ralentir avec une interpolation continue et terminer sur l’orientation normale, sans saut. La réaction se superpose à la position céleste et à l’attention portée aux patrouilles arrière ; elle ne fait tourner ni caméra, ni voiture, ni route.

Les cinq yeux et les trois bouches appartiennent au même volume. Pendant le tour, garder l’orientation locale des pupilles afin qu’elles tournent avec le visage ; le suivi de la voiture reprend à la fin. Les clignements existants continuent. La chevelure, les pigments et les reliefs ne changent pas. L’envers du crâne devient brièvement visible : cette demande remplace la restriction antérieure qui réservait toute vue arrière à la victoire. L’inscription `douaniere` et la fragmentation restent réservées à la finale.

L’animation suit le temps de simulation et se fige en pause. En mouvement réduit, conserver le tour demandé en l’étirant à une seconde, sans oscillation supplémentaire. La durée reste inférieure aux 1,05 seconde d’invulnérabilité existantes. Si plusieurs dégâts sont observés dans une même image, conserver les tours en attente. Une nouvelle partie efface toute réaction précédente. La finale de victoire garde la priorité sur la réaction de course.

## Trois bruitages originaux

Créer au moins trois signatures courtes, distinctes et non verbales : un rire « ha-ha-ha » descendant, un « gna-gna-gnère » nasal, un souffle « prrt » suivi d’un petit ricanement. Les trois doivent évoquer la moquerie plutôt qu’un avertisseur de conduite. Ne pas employer de voix externe ni de service de synthèse vocale.

Préparer les sons une seule fois dans trois buffers mono légers ; les réutiliser aux impacts. Choisir une permutation par partie et alterner les trois variantes sans répétition immédiate. Conserver le bruit de collision existant et commencer la moquerie presque simultanément avec la rotation. Passer par le bus BRUITAGES et le volume général. Respecter SON OFF, les interruptions de l’appareil et la pause. Ne pas rejouer des dégâts survenus pendant que le son était désactivé ; une réactivation attend le prochain dégât. Nettoyer les sources en fin de lecture, à la remise à zéro et à la destruction.

## Préservation et vérification

Préserver le visage validé, la coiffure, les cinq regards hors réaction, la fréquence de clignement, les réactions aux poursuivants, les deux fins, le QR, le portail, l’atlas, les véhicules, la route de 13 km, le décor, les contrôles, les scores et tous les réglages existants. Ajouter uniquement les modules de réaction et de son nécessaires, sans nouveau moteur ni dépendance de production.

Vérifier : un tour par dégât accepté ; absence de répétition par image ; fin du tour et retour du regard ; pause/reprise ; nouvelle partie ; dégât fatal ; priorité de la victoire ; trois variantes différentes et absence de répétition ; volume et absence de rattrapage après SON OFF ; buffers finis sans écrêtage ; nettoyage des sources ; maintien des tests existants. Contrôler le mouvement sur le vrai maillage. Distinguer calcul, raster CPU, observation dans le moteur WebGL et disponibilité publique. Mettre `OCULAIRE_ETAT.md` à jour et sauvegarder chaque jalon. Avant publication, vérifier le dernier SHA de main pour préserver le travail concurrent.
