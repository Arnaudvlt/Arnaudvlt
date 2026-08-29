---
type: maison/generateur
---

# Générateur de liste de courses

Cette note **calcule** la liste à partir des menus dont la propriété `actif` vaut `true`.
Le bouton écrit le résultat dans [[Ma liste]] (seule la zone entre les deux repères y est remplacée : tout ce que tu ajoutes à la main en dehors est conservé, et les cases déjà cochées le restent).

```dataviewjs
// ===========================================================================
//  Liste de courses — agrégation des menus actifs
//  Format attendu dans un menu   : - [ ] Midi — [[Nom de la recette]] x2
//  Format attendu dans une recette (section "## Ingrédients") :
//        - 200 g [[Pâtes]]        - 2 [[Oignon]]        - [[Sel]]
// ===========================================================================

const TYPE_MENU       = "maison/menu";
const TYPE_RECETTE    = "maison/recette";
const TYPE_INGREDIENT = "maison/ingredient";
const TYPE_LISTE      = "maison/liste";
const DEBUT = "<!-- COURSES:DEBUT -->";
const FIN   = "<!-- COURSES:FIN -->";

const RAYONS = [
  ["Fruits & légumes", "🥬"], ["Boucherie", "🥩"], ["Poissonnerie", "🐟"],
  ["Crèmerie", "🧀"], ["Boulangerie", "🥖"], ["Épicerie", "🥫"],
  ["Surgelés", "🧊"], ["Boissons", "🧃"], ["Maison", "🧻"], ["Divers", "📦"],
];
const RANG = new Map(RAYONS.map(([r], i) => [r, i]));
const EMOJI = new Map(RAYONS);

const RE_LIEN = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/;

// --- petits utilitaires ----------------------------------------------------

const estModele = (p) => String(p.file.folder || "").split("/").includes("_Templates");

function nombre(txt) {
  if (txt == null) return null;
  const s = String(txt).trim().replace(",", ".");
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);          // 1 1/2
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = s.match(/^(\d+)\/(\d+)$/);                       // 1/2
  if (m) return Number(m[1]) / Number(m[2]);
  m = s.match(/^\d+(\.\d+)?$/);                        // 200  ou  1.5
  if (m) return parseFloat(s);
  return null;
}

function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return String(r).replace(".", ",");
}

// Renvoie les lignes situées sous le premier titre qui matche `titre`,
// jusqu'au titre suivant de niveau égal ou supérieur.
function section(texte, titre) {
  const out = [];
  let niveau = null;
  for (const ligne of String(texte).split(/\r?\n/)) {
    const h = ligne.match(/^(#{1,6})\s+(.*)$/);
    if (niveau === null) {
      if (h && titre.test(h[2].trim())) niveau = h[1].length;
      continue;
    }
    if (h && h[1].length <= niveau) break;
    out.push(ligne);
  }
  return out;
}

// "- 200 g [[Pâtes]]"  ->  { nom: "Pâtes", qte: 200, unite: "g", note: "" }
function ligneIngredient(brut) {
  if (/^\s*>/.test(brut)) return null;
  const m = brut.match(/^\s*[-*]\s+(.*)$/);
  if (!m) return null;
  const corps = m[1].replace(/^\[[ xX]\]\s*/, "").trim();
  const lien = corps.match(RE_LIEN);
  if (!lien) return null;

  const avant = corps.slice(0, lien.index).trim();
  const apres = corps.slice(lien.index + lien[0].length).trim().replace(/^[—–-]\s*/, "");

  let qte = null, unite = avant;
  // ordre important : les fractions passent avant le nombre simple, sinon « 1/2 » se lit « 1 » + unité « /2 »
  const q = avant.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (q) { qte = nombre(q[1]); unite = q[2].trim(); }

  return { nom: lien[1].trim(), qte, unite, note: apres.replace(/^\((.*)\)$/, "$1") };
}

// "- [ ] Soir — [[Chili sin carne]] x4"  ->  { recette, portions, fait }
function ligneMenu(brut) {
  if (/^\s*>/.test(brut)) return null;
  const m = brut.match(/^\s*[-*]\s+(?:\[([ xX])\]\s*)?(.*)$/);
  if (!m) return null;
  const fait = (m[1] || "").toLowerCase() === "x";
  const corps = m[2];
  const lien = corps.match(RE_LIEN);
  if (!lien) return null;
  const suite = corps.slice(lien.index + lien[0].length);
  const p = suite.match(/[x×]\s*(\d+(?:[.,]\d+)?)/i);
  return { recette: lien[1].trim(), portions: p ? nombre(p[1]) : null, fait };
}

// --- 1. index des recettes et des ingrédients ------------------------------

const recettes = new Map();
const ingredients = new Map();
for (const p of dv.pages().array()) {
  if (estModele(p)) continue;
  if (p.type === TYPE_RECETTE) recettes.set(p.file.name, p);
  else if (p.type === TYPE_INGREDIENT) ingredients.set(p.file.name, p);
}

// --- 2. repas planifiés dans les menus actifs ------------------------------

const menus = dv.pages().where(p => p.type === TYPE_MENU && p.actif === true && !estModele(p)).array();
const repas = [];
const alertes = [];

for (const menu of menus) {
  const texte = await dv.io.load(menu.file.path);
  if (texte == null) { alertes.push("Menu illisible : " + menu.file.path); continue; }
  for (const ligne of texte.split(/\r?\n/)) {
    const r = ligneMenu(ligne);
    if (!r || r.fait) continue;
    repas.push({ ...r, menu: menu.file.name });
  }
}

// --- 3. agrégation des ingrédients -----------------------------------------

const panier = new Map();   // clé "nom|unité" -> { nom, unite, qte, sansQte, origines }

for (const r of repas) {
  const recette = recettes.get(r.recette);
  if (!recette) { alertes.push("Recette introuvable : **" + r.recette + "** (menu " + r.menu + ")"); continue; }

  const texte = await dv.io.load(recette.file.path);
  if (texte == null) { alertes.push("Recette illisible : " + recette.file.path); continue; }

  const base = nombre(recette.portions) || 1;
  const voulu = r.portions || base;
  const facteur = voulu / base;

  const lignes = section(texte, /^Ingr[ée]dients?\b/i);
  if (lignes.length === 0) alertes.push("Pas de section « Ingrédients » dans **" + r.recette + "**");

  for (const ligne of lignes) {
    const ing = ligneIngredient(ligne);
    if (!ing) continue;
    const cle = ing.nom + "|" + ing.unite.toLowerCase();
    let e = panier.get(cle);
    if (!e) { e = { nom: ing.nom, unite: ing.unite, qte: 0, origines: new Set(), notes: new Set() }; panier.set(cle, e); }
    if (ing.qte != null) e.qte += ing.qte * facteur;
    if (ing.note) e.notes.add(ing.note);
    e.origines.add(r.recette);
  }
}

// --- 4. mise en forme -------------------------------------------------------

function libelle(e) {
  const q = (e.qte > 0) ? fmt(e.qte) + (e.unite ? " " + e.unite : "") : (e.unite || "");
  const n = (e.notes.size === 1) ? " (" + Array.from(e.notes)[0] + ")" : "";
  return e.nom + (q ? " — " + q : "") + n;
}

const aAcheter = [];   // [rayon, entrée]
const aVerifier = [];
for (const e of panier.values()) {
  const fiche = ingredients.get(e.nom);
  const rayon = (fiche && fiche.rayon) ? String(fiche.rayon) : "Divers";
  if (!fiche) alertes.push("Fiche ingrédient manquante : **" + e.nom + "** (rangé dans « Divers »)");
  (fiche && fiche.garde_manger === true ? aVerifier : aAcheter).push([rayon, e]);
}

const trier = (a, b) => {
  const ra = RANG.has(a[0]) ? RANG.get(a[0]) : 99;
  const rb = RANG.has(b[0]) ? RANG.get(b[0]) : 99;
  return ra - rb || a[1].nom.localeCompare(b[1].nom, "fr");
};
aAcheter.sort(trier);
aVerifier.sort(trier);

function bloc(entrees, titre) {
  if (entrees.length === 0) return "";
  let md = "", rayonCourant = null;
  for (const [rayon, e] of entrees) {
    if (rayon !== rayonCourant) {
      rayonCourant = rayon;
      md += "\n### " + (EMOJI.get(rayon) || "📦") + " " + rayon + "\n\n";
    }
    md += "- [ ] " + libelle(e) + "\n";
  }
  return (titre ? "\n## " + titre + "\n" : "") + md;
}

const maintenant = () => new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const corpsMarkdown = bloc(aAcheter, "À acheter") + bloc(aVerifier, "À vérifier dans les placards");
// recalculé au clic pour que l'horodatage écrit soit celui de la génération, pas celui de l'affichage
const markdown = (date) => "*Généré le " + date + " — " + repas.length + " repas, " + panier.size + " ingrédients.*\n" + corpsMarkdown;

// --- 5. aperçu --------------------------------------------------------------

if (menus.length === 0) {
  dv.paragraph("> [!warning] Aucun menu actif.\n> Ouvre un menu dans `05 Menus` et mets `actif: true` dans ses propriétés.");
} else if (repas.length === 0) {
  dv.paragraph("> [!warning] Aucun repas à préparer.\n> Les menus actifs (" + menus.map(m => m.file.name).join(", ") + ") sont vides ou tous cochés.");
} else {
  dv.paragraph("**" + repas.length + " repas** planifiés sur " + menus.length + " menu(s) actif(s) : " +
    menus.map(m => m.file.link).join(", ") + ".");
  dv.table(
    ["Rayon", "Ingrédient", "Quantité", "Pour"],
    aAcheter.concat(aVerifier).map(([rayon, e]) => [
      (EMOJI.get(rayon) || "📦") + " " + rayon,
      e.nom,
      (e.qte > 0 ? fmt(e.qte) + (e.unite ? " " + e.unite : "") : (e.unite || "au goût")),
      Array.from(e.origines).join(", "),
    ])
  );
}

if (alertes.length > 0) {
  dv.paragraph("> [!caution] À corriger\n> " + Array.from(new Set(alertes)).join("\n> "));
}

// --- 6. bouton d'écriture dans « Ma liste » ---------------------------------

const barre = dv.el("div", "");
const bouton = dv.el("button", "🛒  Écrire dans Ma liste", { container: barre });
const message = dv.el("span", "", { container: barre });
message.style.marginLeft = "0.75em";

bouton.addEventListener("click", async () => {
  try {
    const cible = dv.pages().where(p => p.type === TYPE_LISTE && !estModele(p)).array()[0];
    if (!cible) { message.textContent = "❌ Aucune note avec type: maison/liste"; return; }

    const fichier = app.vault.getAbstractFileByPath(cible.file.path);
    if (!fichier) { message.textContent = "❌ Fichier introuvable : " + cible.file.path; return; }

    const ancien = await app.vault.read(fichier);

    // on conserve les cases déjà cochées
    const cochees = new Set();
    const i0 = ancien.indexOf(DEBUT), j0 = ancien.indexOf(FIN);
    if (i0 !== -1 && j0 > i0) {
      for (const l of ancien.slice(i0, j0).split(/\r?\n/)) {
        const m = l.match(/^\s*[-*]\s+\[[xX]\]\s+(.*)$/);
        if (m) cochees.add(m[1].trim());
      }
    }
    const date = maintenant();
    const corps = markdown(date).replace(/^(\s*[-*]\s+)\[ \]\s+(.*)$/gm,
      (t, tiret, texte) => cochees.has(texte.trim()) ? tiret + "[x] " + texte : t);

    const blocFinal = DEBUT + "\n" + corps.trim() + "\n" + FIN;
    const nouveau = (i0 !== -1 && j0 > i0)
      ? ancien.slice(0, i0) + blocFinal + ancien.slice(j0 + FIN.length)
      : ancien.trimEnd() + "\n\n" + blocFinal + "\n";

    await app.vault.modify(fichier, nouveau);
    message.textContent = "✅ " + cible.file.name + " mis à jour (" + date + ")";
  } catch (e) {
    message.textContent = "❌ " + e.message;
  }
});
```

## Comment ça marche

| Étape | Où | Quoi |
| ----- | -- | ---- |
| 1 | `05 Menus` | Tu poses tes repas de la semaine. Tous les menus `actif: true` sont pris, et s'additionnent. |
| 2 | `03 Recettes` | Chaque recette liste ses ingrédients en `[[liens]]` avec une quantité. |
| 3 | `04 Ingrédients` | Chaque ingrédient porte son `rayon` et son statut `garde_manger`. |
| 4 | ici | Les quantités sont mises à l'échelle des portions, additionnées, puis triées par rayon. |
| 5 | [[Ma liste]] | Le bouton y écrit la liste cochable que tu emportes au supermarché. |

## Menus actifs

```dataview
TABLE WITHOUT ID file.link AS "Menu", debut AS "Début", fin AS "Fin"
WHERE type = "maison/menu" AND actif = true AND !contains(file.folder, "_Templates")
SORT debut DESC
```
