# OCULAIRE — le ciel avait un dos

Intention : une conscience solaire et inquiétante observe la voiture pendant les 13 km. Son langage mêle la perception, le vêtement, l'envers et le souvenir. La victoire révèle ce qui était caché dans sa chevelure puis détruit son volume au sol.

## Design de production

La sculpture approuvée reste la référence de proportions, de pigments et d'organes : cinq yeux en ligne, trois nez en volume, trois bouches, tête seule, symétrie des formes et asymétrie des couleurs. La version du jeu adapte les surfaces pour conserver le moteur et sa stabilité. Aucun import GLB dans le navigateur, aucun service externe, aucune nouvelle dépendance du jeu.

`tools/prepare-oculaire.py` prépare les données depuis la source approuvée, échantillonne ses pigments, simplifie et fusionne les surfaces. La source originale reste indépendante. Le résultat autonome se trouve dans `assets/oculaire/portrait-data.js`.

`oculaire.js` règle le placement, le regard indépendant, les clignements, la croissance 100 / 106 / 112 / 118 / 125 % et les interventions brèves. Les obstacles occultent la tête normalement. Les paroles attendent les situations de conduite plus calmes.

`oculaire-finale.js` déroule une seule séquence dans les durées originales : feux d'artifice, chute, rotation, `douaniere` dans les mèches du dos du crâne, contact au sol puis mille fragments issus des surfaces. La rencontre rare reste après la révélation ; la défaite ne la déclenche jamais. Les particules et les fragments ont des budgets fixes et suivent le temps de simulation, y compris en pause.

`oculaire-preview.html` est un atelier séparé pour observer le vrai moteur aux distances, voies et moments de la finale choisis. Ce n'est pas un mode de victoire accessible depuis le jeu.

## Contrôle

Exécuter `npm test`, `npm run check`, puis `node course/tools/check-oculaire-browser.cjs` avec un Chromium compatible WebGL. Le contrôle navigateur emploie Playwright uniquement en développement. Le navigateur réel, la desserte publique et un téléphone physique sont des catégories de vérification distinctes.
