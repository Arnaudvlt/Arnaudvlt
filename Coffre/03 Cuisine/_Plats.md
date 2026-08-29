---
type: index
---

# Plats

Clique sur un plat pour voir ses ingrédients et la marche à suivre.

```dataview
TABLE WITHOUT ID file.link AS "Plat", temps AS "Minutes", portions AS "Parts", note AS "★", tags AS "Genre"
WHERE type = "plat" AND !contains(file.path, "Modèles")
SORT note DESC, file.name ASC
```

## Ce qui va vite (moins de 30 min)

```dataview
LIST
WHERE type = "plat" AND temps <= 30 AND !contains(file.path, "Modèles")
SORT temps ASC
```

## Par saison

```dataview
TABLE WITHOUT ID rows.file.link AS "Plats"
WHERE type = "plat" AND !contains(file.path, "Modèles")
FLATTEN saison
GROUP BY saison
```

## Ingrédients référencés

```dataview
TABLE WITHOUT ID file.link AS "Ingrédient", rayon AS "Rayon"
WHERE type = "ingredient" AND !contains(file.path, "Modèles")
SORT rayon ASC, file.name ASC
```
