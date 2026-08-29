# Maison — coffre Obsidian : tâches, achats, recettes, courses

Un petit système Obsidian qui réunit quatre choses qu'on gère d'habitude séparément :

- **les tâches** à faire ;
- **les achats** à faire, avec liens et références ;
- **les recettes**, chacune reliée à ses ingrédients — on clique sur un plat, on voit ce qu'il faut ;
- **la liste de courses**, qui n'est pas saisie mais **déduite** du menu de la semaine.

Le lien entre les trois derniers points est le cœur du système : on planifie des repas, et la liste de courses
tombe toute seule — quantités mises à l'échelle du nombre de portions, additionnées entre les recettes,
triées par rayon de supermarché, avec les fonds de placard mis à part.

## Installation

1. Copier le dossier **`Maison/`** à la racine du coffre Obsidian.
2. Installer et activer le plugin **Dataview** (*Paramètres → Modules complémentaires → Parcourir*).
3. Dans les options de Dataview, activer **Enable JavaScript Queries**.
4. Ouvrir `Maison/00 Accueil.md`.

Le mode d'emploi complet est dans le coffre : `Maison/Mode d'emploi.md`.

## Structure

```text
Maison/
├── 00 Accueil.md            tableau de bord : tâches, menu actif, recettes, contrôle qualité
├── Mode d'emploi.md         la documentation, dans le coffre
├── 01 Tâches/Tâches.md      à faire, par horizon (aujourd'hui / semaine / plus tard / en attente)
├── 02 Achats/               à acheter ; une note dédiée pour les achats qui demandent un comparatif
├── 03 Recettes/             7 recettes de départ, ingrédients en [[liens]] avec quantités
├── 04 Ingrédients/          39 fiches : rayon de supermarché + statut « garde-manger »
├── 05 Menus/                une note par semaine ; celle marquée actif: true alimente les courses
├── 06 Courses/
│   ├── Liste de courses.md  le générateur (bloc dataviewjs) + son aperçu
│   └── Ma liste.md          la liste cochable qu'on emporte au supermarché
└── _Templates/              modèles pour recette, ingrédient, achat, semaine
```

## Cloisonnement avec les autres projets du coffre

Le système ne peut pas déborder sur un projet existant (Nextim par exemple), pour deux raisons cumulées :

- il vit dans son propre dossier `Maison/` ;
- chaque note porte une propriété `type` préfixée `maison/` (`maison/recette`, `maison/menu`…) et **toutes**
  les requêtes filtrent sur ce préfixe. Une note extérieure ne peut donc pas apparaître dans ces tableaux,
  même si elle porte le même nom qu'un ingrédient.

Aucune requête ne dépend d'un chemin : le dossier `Maison` peut être renommé ou déplacé sans rien casser.

## Tests

Le générateur de liste de courses est le seul morceau de logique du système ; il est testé.
Le banc de test **n'embarque pas de copie du code** : il extrait le bloc `dataviewjs` de
`Maison/06 Courses/Liste de courses.md`, lui fournit un faux `dv` et un faux `app` (l'API Obsidian utilisée se
limite à `dv.pages`, `dv.io.load`, `dv.table`, `dv.paragraph`, `dv.el`, `app.vault.read|modify`), et vérifie
le résultat — d'abord sur le contenu réel du coffre, ensuite sur des cas limites synthétiques.

```bash
node tests/test-liste-courses.mjs          # 44 vérifications
DUMP=1 node tests/test-liste-courses.mjs   # + affiche la liste de courses générée
```

Ce que le banc couvre : mise à l'échelle des portions, fractions (`1/2`), addition entre recettes,
refus d'additionner des unités incompatibles, exclusion des repas déjà cuisinés et du dossier `_Templates`,
lignes hors section « Ingrédients » ignorées, recette ou fiche ingrédient manquante signalée, écriture entre
repères dans `Ma liste` sans toucher aux ajouts manuels, conservation des cases déjà cochées, absence de menu
actif, et cohérence des données livrées (aucun lien interne cassé, portions et rayons renseignés).
