---
type: index
---

# Achats

```dataviewjs
const a = dv.pages('"01 Achats"').where(p => p.type === "achat" && p.statut !== "acheté");
const total = a.array().reduce((s,p) => s + (Number(p.prix) || 0), 0);
dv.paragraph("**" + a.length + "** objets en attente · **" + total.toLocaleString("fr-FR") + " €** repérés");
```

## En attente

```dataview
TABLE WITHOUT ID file.link AS "Objet", pour AS "Pourquoi", prix AS "Prix", categorie AS "Catégorie", lien AS "Lien"
FROM "01 Achats"
WHERE type = "achat" AND statut != "acheté"
SORT urgence DESC, file.mtime DESC
```

## Déjà acheté

```dataview
TABLE WITHOUT ID file.link AS "Objet", prix AS "Prix", file.mtime AS "Le"
FROM "01 Achats"
WHERE type = "achat" AND statut = "acheté"
SORT file.mtime DESC
LIMIT 20
```
