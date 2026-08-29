# Intendance

Application d'une seule page : **tâches**, **achats**, **recettes**, **semaine de repas**, et
**liste de courses calculée** à partir des repas planifiés.

Publiée comme Artifact claude.ai. `intendance.html` est la source ; la plateforme l'enveloppe
dans un squelette HTML au moment de la publication (d'où l'absence de `<html>`/`<head>` ici).

## Le fil conducteur

Une recette porte ses ingrédients (quantité, unité, rayon de supermarché). La semaine planifie
des recettes avec un nombre de portions. La liste de courses en découle : quantités mises à
l'échelle, additionnées entre recettes, regroupées par rayon. Un repas coché comme cuisiné en
sort. Les unités incompatibles ne sont jamais additionnées ; un article sans unité s'arrondit
au supérieur (on n'achète pas 3,5 oignons).

## Sauvegarde

- **`localStorage`** à chaque modification : instantané, survit au rechargement.
- **`artifact.publish({"data/etat.json": …})`** 1,5 s après la dernière action — la forme
  « fichiers » de l'API, qui garde la page fixe et ne recharge pas la vue. C'est ce qui fait
  suivre les données d'un appareil à l'autre. Au chargement, la version la plus récente des deux
  (horodatage `maj`) gagne.
- **Export / import JSON** dans Réglages, comme filet de sécurité.

Hors plateforme (fichier ouvert en local), la capacité n'existe pas : l'app bascule sur
`localStorage` seul et l'indique dans le rail — « Gardé sur cet appareil ».

## Tests

```bash
NODE_PATH=/opt/node22/lib/node_modules node intendance/test-ui.mjs
```

46 vérifications dans Chromium via Playwright : parcours complet (ajout, édition en ligne,
regroupement par échéance, tri des achats, mise à l'échelle des portions, agrégation des
courses, création de recette, persistance après rechargement), plus thème sombre, absence de
débordement horizontal en 390 px et absence d'erreur JavaScript. Le script écrit aussi
`apercu-clair.png` et `apercu-sombre.png`.
