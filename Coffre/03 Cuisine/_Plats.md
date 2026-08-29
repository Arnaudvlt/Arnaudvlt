---
type: index
---

# Plats

Clique sur un plat pour voir ses ingrédients et la marche à suivre.

```dataview
TABLE WITHOUT ID file.link AS "Plat", temps AS "Minutes", portions AS "Parts", note AS "★", tags AS "Genre"
FROM "03 Cuisine/Plats"
SORT note DESC, file.name ASC
```

## Ce qui va vite (moins de 30 min)

```dataview
LIST
FROM "03 Cuisine/Plats"
WHERE temps <= 30
SORT temps ASC
```

## Par saison

```dataview
TABLE WITHOUT ID rows.file.link AS "Plats"
FROM "03 Cuisine/Plats"
FLATTEN saison
GROUP BY saison
```

## Ingrédients référencés

```dataview
TABLE WITHOUT ID file.link AS "Ingrédient", rayon AS "Rayon"
FROM "03 Cuisine/Ingrédients"
SORT rayon ASC, file.name ASC
```
