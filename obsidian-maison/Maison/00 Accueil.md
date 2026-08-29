---
type: maison/accueil
---

# 🏠 Maison

> [!info] Quatre entrées, un seul système
> **[[Tâches]]** ce que je dois faire · **[[Achats]]** ce que je dois acheter ·
> le menu de la semaine ci-dessous pour ce que je vais cuisiner · **[[Ma liste]]** ce que je ramène du supermarché.
> Tout est décrit dans [[Mode d'emploi]].

## ✅ À faire

```dataviewjs
const racine = dv.current().file.folder;
const EXCLUS = new Set(["maison/menu", "maison/liste", "maison/generateur", "maison/recette", "maison/ingredient"]);
const dansMaison = (p) => p.file.folder === racine || p.file.folder.startsWith(racine + "/");
const modele = (p) => String(p.file.folder || "").split("/").includes("_Templates");

const taches = dv.pages()
  .where(p => dansMaison(p) && !modele(p) && !EXCLUS.has(p.type))
  .file.tasks.where(t => !t.completed && t.text.trim().length > 0);

if (taches.length === 0) dv.paragraph("Rien en attente. 🎉");
else dv.taskList(taches, true);
```

## 🛒 Courses

```dataview
TABLE WITHOUT ID file.link AS "Menu de la semaine", debut AS "Du", fin AS "Au"
WHERE type = "maison/menu" AND actif = true AND !contains(file.folder, "_Templates")
SORT debut DESC
```

Générer la liste : **[[Liste de courses]]** → bouton *Écrire dans Ma liste*. Résultat dans **[[Ma liste]]**.

## 🍽️ Recettes

```dataview
TABLE WITHOUT ID
  file.link AS "Recette",
  categorie AS "Type",
  portions AS "Pers.",
  temps AS "Minutes",
  join(file.etags, " ") AS "Tags"
WHERE type = "maison/recette" AND !contains(file.folder, "_Templates")
SORT temps ASC
```

### Sous 20 minutes

```dataview
LIST WITHOUT ID file.link
WHERE type = "maison/recette" AND temps <= 20 AND !contains(file.folder, "_Templates")
SORT temps ASC
```

## 🥕 Ingrédients

```dataview
TABLE WITHOUT ID
  file.link AS "Ingrédient",
  rayon AS "Rayon",
  choice(unite, unite, "à l'unité") AS "Unité habituelle",
  choice(garde_manger, "oui", "") AS "Garde-manger"
WHERE type = "maison/ingredient" AND !contains(file.folder, "_Templates")
SORT rayon ASC, file.name ASC
```

## 🧹 Contrôle qualité

Ingrédients cités par une recette mais sans fiche — donc classés « Divers » dans la liste de courses :

```dataviewjs
const racine = dv.current().file.folder;
const modele = (p) => String(p.file.folder || "").split("/").includes("_Templates");
const fiches = new Set(dv.pages().where(p => p.type === "maison/ingredient").map(p => p.file.name));
const manquants = new Map();

for (const r of dv.pages().where(p => p.type === "maison/recette" && !modele(p))) {
  for (const l of (await dv.io.load(r.file.path)).split(/\r?\n/)) {
    const m = l.match(/^\s*[-*]\s+.*?\[\[([^\]|#]+)/);
    if (!m) continue;
    const nom = m[1].trim();
    if (fiches.has(nom)) continue;
    if (!manquants.has(nom)) manquants.set(nom, []);
    manquants.get(nom).push(r.file.link);
  }
}
if (manquants.size === 0) dv.paragraph("Aucune fiche manquante. ✅");
else dv.table(["Ingrédient", "Cité par"], [...manquants].map(([n, r]) => [n, r]));
```

Recettes qu'aucun menu n'a jamais programmées — à ressortir quand l'inspiration manque :

```dataviewjs
const modele = (p) => String(p.file.folder || "").split("/").includes("_Templates");
const nomDe = (lien) => String(lien.path).split("/").pop().replace(/\.md$/, "");

const programmees = new Set();
for (const menu of dv.pages().where(p => p.type === "maison/menu" && !modele(p)))
  for (const lien of menu.file.outlinks) programmees.add(nomDe(lien));

const jamais = dv.pages()
  .where(p => p.type === "maison/recette" && !modele(p) && !programmees.has(p.file.name))
  .map(p => p.file.link);

if (jamais.length === 0) dv.paragraph("Toutes les recettes ont déjà servi.");
else dv.list(jamais.array());
```
