# Validation — Route 02 / Swagistan 13K

Rapport archivé. La validation de RECHERCHÉ est dans [VALIDATION-V3.md](VALIDATION-V3.md).

> Ce document conserve le compte rendu de la publication initiale. Pour la mise à jour des voitures, le garage et les vérifications WebGL du 23 octobre 2026, lire [VEHICLES.md](VEHICLES.md).

Date : 22 octobre 2026. Branche : `feat/swagistan-night-run`.
Référence de départ : `main` → `ed6d9f01fbc3474a74010b00ce15c94ef35826f5`, revérifiée sur GitHub avant modification.

**État : publication de cette version autorisée par l’utilisateur le 22 octobre 2026.** La sauvegarde distante `backup/pre-swagistan-13k-2026-10-22` conserve exactement la version publique précédente (`ed6d9f01fbc3474a74010b00ce15c94ef35826f5`). L’intégration passe par la PR #2 et la publication GitHub Pages existante ; aucun changement de domaine, QR ou configuration Pages. Les limites de validation sur appareil ci-dessous restent applicables.

## Référence et protections

Les 53 tests de départ ont réussi avant toute modification. Les instructions README et les documents de validation du portail et de la course ont été lus ; aucun `AGENTS.md` n’a été trouvé dans le checkout.

Le test `course/tests/protection.test.js` est conservé sans modification, y compris ses empreintes. Les modules `app.js`, `arcade.js`, `core.js`, `drop.js`, `matrix.js`, `styles.css`, `index.html`, `course-entry.css`, `CNAME`, `.nojekyll`, les deux WAV et les tests du portail n’ont aucun diff. Le bouton vert reste après le footer, en nouvel onglet, sans chargement du moteur sur le portail. Aucune configuration Pages, DNS ou QR n’est modifiée. Le scan, le verdict, l’export, les trois autres jeux, les archives, secrets et préférences restent ceux de main.

Un test complémentaire vérifie les blobs des WAV et du marqueur Pages. `ending.js`, les modèles source GLB, leurs crédits/licences et Three.js 0.160.0 ne sont pas remplacés.

## Vérifications automatiques terminées

- **68 tests Node réussis**, dont les 28 tests du portail conservés.
- **34 fichiers de syntaxe vérifiés** par `npm run check` : les cinq modules du portail, tous les modules de course, données JS, outils et tests. Le défaut de couverture de la commande racine est corrigé.
- `git diff --check` : aucune erreur.
- Cinq étapes sans trou ni recouvrement, coordonnées continues aux raccords et 13 000 mètres partagés entre logique, rendu et interface.
- Barrages : ouverture physique de plus d’une largeur de voiture ; alerte d’au moins trois secondes à 18, 48 et 68 m/s. Trafic dirigé hors du corridor ; poursuite en récupération à l’annonce.
- Direction progressive, entrée/sortie de drift, frein, nitro, reprise après nitro vide, collisions à délai et frottement prolongé sans impact à chaque pas.
- Gestion analogique : amplitude partielle, saturation, sensibilité, contact indépendant de la nitro, relâchement hors zone, annulation, perte de capture et de focus. Les flèches restent utilisables dans les champs de réglage.
- Poursuivants : trois maximum, rôles distincts, phases d’approche et récupération, accélération bornée, aucune téléportation au contact.
- Pause : gel de tous les champs de course, décompte et cinématiques, reprise explicite. Nouvelle partie indépendante et remise à zéro de la caméra/effets.
- Traversées intégrales à 30, 60 et 144 Hz avec la même commande calculée à chaque pas fixe, et non seulement un test court du moteur.
- Défaite sans tirage ; un seul tirage par victoire ; résultat fixé pendant pause et résultats. Exactement une issue romantique sur les 30 seaux uniformes ; valeurs du seau incomplet rejetées. L’algorithme cryptographique d’origine est intact.
- `fld.course.v1` reste byte pour byte intact ; son souvenir amoureux est hérité. Aucun ancien temps n’entre dans les records `fld.course.v2` de la route `swagistan-13k-v2`. Préférences dans leur clé propre ; refus, corruption, absence du stockage et mauvaise version de route couverts.
- Géométries valides, tailles des deux modèles douaniers compatibles avec l’enveloppe de collision et silhouettes de hauteurs différentes. Roulement/braquage séparés sur véhicules mobiles ; partage des géométries conservé.
- Ciel : un seul maillage instancié, atlas partagé, test de profondeur, pas d’écriture de profondeur, mouvement réduit figé, densité diminuée en économie et à l’arrivée.
- Audio : partition à 108 BPM distincte entre introduction, phrases et secteurs, résolution sans percussion ; contexte non créé avant geste, un seul ordonnanceur, pause/reprise, réinitialisations répétées, abandon des notes trop tardives, arrêt après interruption simulée de type Safari et réactivation explicite.

## Mesures réellement obtenues

Reproduction : `node course/tools/measure.mjs`. Résultat brut versionné : `validation/night-run-cpu.json`.

| Parcours automatisé | 30 Hz | 60 Hz | 144 Hz | Résistance finale |
| --- | --- | --- | --- | --- |
| Sans nitro | 273,9667 s | 273,9667 s | 273,9667 s | 67 % |
| Nitro selon la poursuite | 270,5833 s | 270,5833 s | 270,5833 s | 78 % |

Les six essais franchissent les cinq étapes et gagnent. Ils n’utilisent pas le drift : la victoire ne nécessite donc pas trois contacts simultanés. Ces temps correspondent au contrôleur automatisé, pas à une partie manuelle sur iPhone.

Construction CPU réelle de la scène avec un récepteur de rendu injecté, parcourue deux fois :

| Mesure CPU | Valeur |
| --- | --- |
| Construction initiale | 74 ms sur cet hôte |
| Deux balayages de scène | 409 ms cumulées, construction comprise |
| Tronçons conservés | 10 maximum |
| Maillages visibles dans les instantanés | 337 maximum |
| Géométries observées simultanément | 138 maximum |
| Géométries partagées restantes après retrait du décor et des effets | 64 |

Les maillages visibles ne sont pas des draw calls GPU mesurés. Les durées CPU ci-dessus ne sont pas des FPS, n’intègrent pas le coût d’un pilote graphique et varient selon l’hôte. Les objectifs de 60 FPS / 30 FPS en économie restent **à mesurer** sur appareil.

## Navigateur disponible

Le vrai chargement `course.html` a été tenté dans Chrome distant via le serveur de prévisualisation autorisé. Three.js refuse le contexte :

`GL_VENDOR = Disabled, GL_RENDERER = Disabled, ErrorMessage = BindToCurrentSequence failed`

Le message de repli et le retour au protocole apparaissent. Aucun moteur de substitution ne fait partie du livrable.

Une copie locale de diagnostic, exclue de Git et du déploiement, reprend la vraie interface et la logique sans rendu. Elle porte explicitement **DIAGNOSTIC INTERFACE SANS WEBGL — AUCUNE VALIDATION 3D**. Les commandes pour présenter des fins de manière déterministe n’existent que dans cette copie de test, jamais dans les fichiers livrés.

Contrôles d’interface obtenus dans cette copie :

- Largeurs 320 et 390 pixels en portrait, 844 × 390 en paysage : pas de débordement horizontal observé.
- À 320 pixels, boutons gauche/droite de 56 × 68 px ; frein 60 × 56 px, drift 60 × 72 px et nitro 72 × 72 px, tous dans la largeur.
- Lancement, décompte, HUD remis à zéro, pause et reprise explicite, réglages, direction par boutons et qualité économique, préférences retrouvées après rechargement.
- Arrivée normale et écran MADE IN SWAGISTAN affichés ; nouvelle partie relancée avec chronomètre, résistance et nitro réinitialisés.
- Web Audio réel activé par SON dans Chrome : contexte `running`, ordonnanceur actif, cinq voix transitoires initiales. Après rechargement : contexte non initialisé et SON OFF, même avec préférences enregistrées. Aucun message d’erreur provenant de l’audio du jeu observé lors de ces manipulations. Les erreurs de l’extension de métadonnées du navigateur sont distinctes du jeu.

La copie de diagnostic ne prouve ni la conduite manuelle avec image 3D, ni l’occlusion du ciel, ni la lisibilité des modèles, ni la qualité musicale perçue, ni les performances.

## Validation restant sur un appareil avec WebGL

Sur la version publiée, puis sur Safari iPhone accessible :

1. Course manuelle entière en portrait et paysage : conduite à deux pouces, zones système, barre Safari, retour au centre, drift et reprise d’adhérence.
2. Route, reliefs, matériaux, ciel réellement derrière le décor, occultation par le tunnel, éclairage, voitures et concordance avec collisions.
3. Barrages à vitesse normale et nitro : trois secondes d’anticipation, ouverture libre, clarté des trajectoires.
4. Une arrivée, une interception, une nouvelle partie ; caméra de frontière et séquence de station. Le comportement rare est testé automatiquement sans contrôle public de forçage.
5. Audio sur haut-parleur et écouteurs, volumes, mixage sirènes/musique, absence de pics gênants, cinq minutes de composition ; appel/interruption audio, arrière-plan, retour et reprise explicite.
6. FPS et chauffe en qualité adaptative puis économique pendant plusieurs minutes. Les statistiques dans ⚙ décrivent le navigateur en train de rendre la scène. Noter le modèle d’iPhone, la version Safari, la qualité et les valeurs réellement obtenues.
7. Stockage bloqué sur l’appareil ; sauvegarde en session, souvenir existant et séparation des records.
8. QR et portail après publication, distinctement du résultat d’un déploiement.

## Retour arrière

La branche distante `backup/pre-swagistan-13k-2026-10-22` conserve la référence de départ `ed6d9f01fbc3474a74010b00ce15c94ef35826f5`. Pour revenir à cette sauvegarde, revert du commit de merge de la PR #2 (`git revert -m 1 SHA_DU_MERGE`), puis publication par GitHub Pages existant. Ne pas faire de reset forcé, modifier CNAME ou effacer le stockage. Les nouvelles clés sont sans effet sur la version précédente.

## Livraison et hébergement de test

PR : https://github.com/y92pctjcjs-sys/IA-fuckladouane/pull/2. Le code testé a été poussé sous le commit `250d68b099a2e94e5b3ad45cf38dc67eb932d139` ; l’arbre Git distant a été comparé à l’arbre local testé. Les commits de préparation de publication suivants ne changent que la documentation.

Contrôles d’interface complémentaires après les essais ci-dessus : écran INTERCEPTÉ obtenu, résultat romantique et souvenir AMOUR NON DÉCLARÉ affichés dans la copie locale de diagnostic. Ces présentations utilisent uniquement les moyens de test exclus du livrable et ne constituent toujours pas une validation 3D.

L’hébergement de test Vercel n’est pas livré comme un lien jouable : le premier envoi d’un nouveau projet a été classé `production`, y compris sur une tentative portant `target: staging`. Les projets de test ont été mis en pause. Le contrôle automatique d’approbation a ensuite explicitement rejeté une réactivation, au motif qu’elle rétablirait un déploiement classé production malgré la restriction de l’utilisateur. Aucun contournement de ce refus n’est utilisé. Le mode de test par serveur HTTP depuis la branche reste complet et autonome.

Ressources de test laissées désactivées : `fld-swagistan-review-13k` (`prj_PoTi7mlC0mqP7UGjE33pimUZByjn`) et `fld-swagistan-staging-13k` (`prj_fESLbuLfGWmvEmZ0v4ltOzqvnQGr`). Elles n’ont aucun domaine personnalisé ni raccord au QR. L’autorisation reçue ensuite concerne l’application de la version au site existant via GitHub Pages ; ces projets de test restent désactivés.

## Autorisation de publication

Le 22 octobre 2026, l’utilisateur demande : « applique les modifications si ça ne me plait pas je te dirais simplement de revenir a la sauvegarde precedente ». Les 68 tests, le contrôle de syntaxe des 34 fichiers et `git diff --check` ont été relancés avec succès avant l’intégration. La branche de sauvegarde ci-dessus a été créée et la PR est intégrée avec un commit de merge pour permettre un retour arrière par revert. Le statut du workflow Pages et les fichiers réellement servis doivent être contrôlés après cette intégration ; une réussite du déploiement ne constitue pas une validation 3D ou Safari iPhone.
