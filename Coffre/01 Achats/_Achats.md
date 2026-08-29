---
type: index
---

# Achats

```dataviewjs
const a = dv.pages().where(p => !String(p.file.path).includes("Modèles") && p.type === "achat" && p.statut !== "acheté");
const total = a.array().reduce((s,p) => s + (Number(p.prix) || 0), 0);
dv.paragraph("**" + a.length + "** objets en attente · **" + total.toLocaleString("fr-FR") + " €** repérés");
```

## En attente

```dataview
TABLE WITHOUT ID file.link AS "Objet", pour AS "Pourquoi", prix AS "Prix", categorie AS "Catégorie", lien AS "Lien"
WHERE type = "achat" AND statut != "acheté" AND !contains(file.path, "Modèles")
SORT urgence DESC, file.mtime DESC
```

## Déjà acheté

```dataview
TABLE WITHOUT ID file.link AS "Objet", prix AS "Prix", file.mtime AS "Le"
WHERE type = "achat" AND statut = "acheté" AND !contains(file.path, "Modèles")
SORT file.mtime DESC
LIMIT 20
```
