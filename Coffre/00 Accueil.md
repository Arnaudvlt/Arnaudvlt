---
type: accueil
---

# Accueil

```dataviewjs
const a = dv.pages('"01 Achats"').where(p => p.type === "achat" && p.statut !== "acheté");
const t = dv.pages('"02 Tâches"').file.tasks.where(x => !x.completed);
const p = dv.pages('"03 Cuisine/Plats"');
dv.paragraph("**" + t.length + "** choses à faire · **" + a.length + "** à acheter · **" + p.length + "** plats");
```

## À faire

```dataview
TASK
FROM "02 Tâches"
WHERE !completed
```

## À acheter

```dataview
TABLE WITHOUT ID file.link AS "Objet", pour AS "Pourquoi", prix AS "Prix"
FROM "01 Achats"
WHERE type = "achat" AND statut != "acheté"
SORT urgence DESC
LIMIT 8
```

→ [[_Achats|Tout voir]]

## Cuisine

→ [[Menu de la semaine]] · [[_Plats|Tous les plats]]

```dataview
TABLE WITHOUT ID file.link AS "Plat", temps AS "Minutes", note AS "★"
FROM "03 Cuisine/Plats"
SORT file.mtime DESC
LIMIT 5
```
