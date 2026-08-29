---
type: accueil
---

# Accueil

```dataviewjs
const hors = p => !String(p.file.path).includes("Modèles");
const a = dv.pages().where(p => hors(p) && p.type === "achat" && p.statut !== "acheté");
const t = dv.pages("#coffre").where(hors).file.tasks.where(x => !x.completed);
const p = dv.pages().where(x => hors(x) && x.type === "plat");
dv.paragraph("**" + t.length + "** choses à faire · **" + a.length + "** à acheter · **" + p.length + "** plats");
```

## À faire

```dataview
TASK
FROM #coffre
WHERE !completed AND !contains(file.path, "Modèles")
```

## À acheter

```dataview
TABLE WITHOUT ID file.link AS "Objet", pour AS "Pourquoi", prix AS "Prix"
WHERE type = "achat" AND statut != "acheté" AND !contains(file.path, "Modèles")
SORT urgence DESC
LIMIT 8
```

→ [[_Achats|Tout voir]]

## Cuisine

→ [[Menu de la semaine]] · [[_Plats|Tous les plats]]

```dataview
TABLE WITHOUT ID file.link AS "Plat", temps AS "Minutes", note AS "★"
WHERE type = "plat" AND !contains(file.path, "Modèles")
SORT file.mtime DESC
LIMIT 5
```
