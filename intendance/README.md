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

## Tout est paramétrable depuis l'interface

Rien ne demande de toucher au code. L'écran **Réglages** permet d'ajouter, renommer, réordonner
et supprimer les rayons (leur ordre est celui de la liste de courses), les moments de repas, les
catégories de recettes, les unités suggérées et les noms des trois niveaux de priorité. Chaque
valeur affiche combien de fois elle est employée ; un renommage se propage aux données
existantes, et une suppression réaffecte ce qui l'utilisait après confirmation.

On peut aussi créer ses propres **listes à cocher** depuis le rail, en plus des cinq sections.

Une version de graine (`graine` dans l'état) permet de livrer du contenu nouveau sur un état
déjà enregistré : les éléments sont ajoutés par id sans écraser les saisies.

## Interface

Système de design **shadcn/ui**, écrit en CSS — c'est son mode de distribution : on copie le
composant, on le possède. Jetons `--background / --foreground / --muted / --border / --ring /
--radius` en canaux HSL, base neutre zinc, primaire quasi-noire, `--destructive` pour le rouge,
rayon 8 px, police Geist.

Les bibliothèques à charger depuis un CDN ont été écartées volontairement : le bac à sable des
Artifacts n'autorise de feuille de style externe que depuis Google Fonts, ce qui exclut Shoelace,
Flowbite et Carbon ; et le CDN Tailwind, lui autorisé, n'est pas joignable depuis l'environnement
de développement, donc impossible à vérifier avant publication.

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

76 vérifications dans Chromium via Playwright : parcours complet (ajout, édition en ligne,
regroupement par échéance, tri des achats, mise à l'échelle des portions, agrégation des
courses, création de recette, persistance après rechargement), regroupement des achats par
catégorie, migration de graine sur un état déjà enregistré, contrastes mesurés en thème sombre
(ratios calculés, pas de couleur codée en dur), absence de débordement horizontal en 390 px et
absence d'erreur JavaScript. Le script écrit aussi
`apercu-clair.png` et `apercu-sombre.png`.

## Prompt de référence

`PROMPT.md` est la spécification complète et autonome du projet — contexte, comportements
attendus, modèle de données, persistance, système de design, contraintes et exigences de
qualité. Elle se colle telle quelle dans une nouvelle session pour reprendre le travail sans
connaître l'historique.
