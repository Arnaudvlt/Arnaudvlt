---
type: maison/aide
---

# Mode d'emploi

## Le principe en trois phrases

Tu notes tes **tâches**, tes **achats** et tes **recettes** comme des listes markdown normales.
Une recette liste ses ingrédients sous forme de `[[liens]]` avec une quantité ; un menu de la semaine liste des `[[recettes]]` avec un nombre de portions.
La **liste de courses se déduit toute seule** du menu : quantités mises à l'échelle, additionnées entre recettes, triées par rayon de supermarché.

## Installation (une seule fois)

1. Copier le dossier `Maison` à la racine de ton coffre Obsidian.
2. Installer le plugin **Dataview** : *Paramètres → Modules complémentaires → Parcourir → Dataview → Installer → Activer*.
3. Dans les options de Dataview, activer **Enable JavaScript Queries** (et **Enable Inline JavaScript Queries**).
4. Ouvrir [[00 Accueil]]. Si les tableaux s'affichent, tout est en place.

Sans Dataview, rien n'est perdu : les notes restent des listes markdown lisibles et cochables, seuls les tableaux
automatiques et la génération de la liste de courses ne fonctionnent pas.

## Ça ne se mélangera pas avec Nextim

Deux barrières, volontairement redondantes :

- **Un dossier séparé** : tout vit sous `Maison/`. Rien n'est écrit ailleurs.
- **Un espace de noms dans les propriétés** : chaque note porte un `type` préfixé `maison/`
  (`maison/recette`, `maison/ingredient`, `maison/menu`, `maison/achat`…), et **toutes** les requêtes filtrent sur ce préfixe.
  Une note de Nextim ne peut donc pas apparaître dans ces tableaux, même si elle s'appelle « Riz » ou « Courses ».

Conséquence utile : tu peux **renommer ou déplacer le dossier `Maison`** où tu veux, rien ne casse — aucune requête
ne dépend d'un chemin. Si tu veux une séparation encore plus stricte, crée un coffre Obsidian distinct et mets `Maison` dedans.

## Les quatre gestes du quotidien

| Je veux… | Où | Comment |
| --- | --- | --- |
| noter une tâche | [[Tâches]] | une ligne `- [ ] …` dans la bonne section |
| noter un truc à acheter | [[Achats]] | `- [ ] Nom — [lien](https://…) — prix #catégorie` |
| planifier mes repas | `05 Menus` | `- [ ] Soir — [[Nom de la recette]] x2` |
| faire mes courses | [[Liste de courses]] → [[Ma liste]] | un clic sur le bouton, puis je coche au supermarché |

## Les deux formats à retenir

**Dans une recette**, sous le titre `## Ingrédients` :

```text
- 200 g [[Pâtes]]              quantité + unité + ingrédient
- 2 [[Oignon]]                 quantité seule (unité = à la pièce)
- 1/2 [[Citron]]               les fractions sont comprises
- 1 [[Gingembre frais]] (2 cm) la parenthèse est reportée dans la liste de courses
- [[Sel]]                      sans quantité : apparaît en « au goût »
```

L'ingrédient **doit** être un `[[lien]]`, et seules les lignes situées sous `## Ingrédients` sont lues
(celles de la préparation sont ignorées, tu peux donc y remettre des liens sans rien fausser).

**Dans un menu**, n'importe où dans la note :

```text
- [ ] Midi — [[Poulet curry coco]] x2     x2 = portions voulues
- [ ] Soir — [[Chili sin carne]]          sans x : portions par défaut de la recette
- [x] Soir — [[Pâtes au pesto]] x2        coché = déjà cuisiné, sort de la liste de courses
```

Un menu n'est pris en compte que si sa propriété `actif` vaut `true`. Passe l'ancienne semaine à `false`
quand tu en démarres une nouvelle — ou laisse deux semaines actives, elles s'additionneront.

## Ajouter du contenu

- **Une recette** : dupliquer `_Templates/Modèle - Recette.md` dans `03 Recettes`. Renseigner `portions` (indispensable
  pour la mise à l'échelle) et écrire les ingrédients au format ci-dessus.
- **Un ingrédient** : dès que tu écris `[[Sarrasin]]` dans une recette, Obsidian propose de créer la note.
  Duplique plutôt `_Templates/Modèle - Ingrédient.md` et renseigne `rayon` — c'est lui qui range l'article dans la liste.
  `garde_manger: true` réserve l'ingrédient à la rubrique *À vérifier dans les placards* (sel, épices, huile…).
- **Un achat important** : dupliquer `_Templates/Modèle - Achat.md` dans `02 Achats` pour comparer plusieurs options,
  et le référencer depuis [[Achats]] avec `- [ ] [[Nom de l'achat]]`.
- **Une semaine** : dupliquer `_Templates/Modèle - Menu semaine.md` dans `05 Menus`, la nommer `2026-W37`, mettre `actif: true`.

## Ce qui peut clocher, et où le voir

La section **Contrôle qualité** de [[00 Accueil]] liste les ingrédients cités sans fiche.
Le générateur, lui, affiche un encadré rouge sous le tableau quand :

- une recette citée par un menu n'existe pas (nom mal orthographié) ;
- une recette n'a pas de section `## Ingrédients` ;
- un ingrédient n'a pas de fiche — il part alors dans le rayon « Divers », rien n'est perdu.

Deux comportements normaux qui surprennent parfois :

- **Deux lignes pour le même ingrédient** quand deux recettes utilisent des unités différentes
  (`400 g` et `2 pièces`). C'est volontaire : on n'additionne pas des grammes avec des pièces.
  Uniformise l'unité dans les recettes pour les fusionner.
- **Une ligne sans quantité** (« au goût ») pour les ingrédients listés sans nombre.

## Sauvegarde

Tout est du markdown : un `git commit` ou une simple copie du dossier suffit. Aucun format propriétaire, aucune base de données.
