/**
 * Banc de test du générateur de liste de courses.
 *
 * Aucune copie du code n'est faite ici : le test extrait le bloc ```dataviewjs de
 * « Maison/06 Courses/Liste de courses.md », lui fournit un faux `dv` et un faux
 * `app` (l'API Obsidian utilisée se limite à dv.pages / dv.io.load / dv.table /
 * dv.paragraph / dv.el et app.vault.read|modify), puis vérifie le résultat —
 * d'abord sur le contenu réel du coffre, ensuite sur des cas limites synthétiques.
 *
 * Lancement :  node tests/test-liste-courses.mjs      (DUMP=1 pour voir la liste)
 */
import { readFile, readdir } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const COFFRE = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOTE_GENERATEUR = "Maison/06 Courses/Liste de courses.md";
const NOTE_LISTE = "Maison/06 Courses/Ma liste.md";

/* ------------------------------------------------------------------ outils */

let echecs = 0, reussites = 0;
function verifie(nom, condition, detail = "") {
  if (condition) { reussites++; console.log("  ✔ " + nom); }
  else { echecs++; console.log("  ✘ " + nom + (detail ? "\n      → " + detail : "")); }
}
const titre = (t) => console.log("\n" + t);

async function fichiersMarkdown(dossier) {
  const out = [];
  for (const e of await readdir(dossier, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "tests") continue;
    const p = join(dossier, e.name);
    if (e.isDirectory()) out.push(...await fichiersMarkdown(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Analyseur YAML minimal : suffisant pour le frontmatter du coffre. */
function frontmatter(texte) {
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const champs = {};
  let cleListe = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    const item = ligne.match(/^\s+-\s+(.*)$/);
    if (item && cleListe) { champs[cleListe].push(valeur(item[1])); continue; }
    const kv = ligne.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, cle, brut] = kv;
    if (brut.trim() === "") { champs[cle] = []; cleListe = cle; continue; }
    cleListe = null;
    champs[cle] = brut.trim() === "[]" ? [] : valeur(brut);
  }
  for (const [k, v] of Object.entries(champs)) if (Array.isArray(v) && v.length === 0) champs[k] = null;
  return champs;
}
function valeur(brut) {
  const s = brut.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  const q = s.match(/^"(.*)"$/) || s.match(/^'(.*)'$/);
  return q ? q[1] : s;
}

/** DataArray minimal (where / array), suffisant pour ce que le bloc utilise. */
function dataArray(items) {
  const a = [...items];
  a.where = (f) => dataArray(a.filter(f));
  a.array = () => [...a];
  return a;
}

/* ------------------------------------- exécution du bloc sur un jeu de notes */

const CODE = (await readFile(join(COFFRE, NOTE_GENERATEUR), "utf8"))
  .match(/```dataviewjs\r?\n([\s\S]*?)\r?\n```/)?.[1];
if (!CODE) { console.error("Bloc dataviewjs introuvable dans " + NOTE_GENERATEUR); process.exit(1); }
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function executer(contenus) {
  const pages = [];
  for (const [chemin, texte] of contenus) {
    const nom = chemin.slice(chemin.lastIndexOf("/") + 1, -3);
    pages.push({
      ...frontmatter(texte),
      file: { name: nom, path: chemin, folder: chemin.slice(0, chemin.lastIndexOf("/")), link: "[[" + nom + "]]" },
    });
  }
  const sorties = { paragraphes: [], tables: [] };
  const elements = [];
  const dv = {
    pages: () => dataArray(pages),
    current: () => pages.find(p => p.file.path === NOTE_GENERATEUR),
    io: { load: async (p) => contenus.get(p) ?? null },
    paragraph: (md) => sorties.paragraphes.push(String(md)),
    table: (entetes, lignes) => sorties.tables.push({ entetes, lignes }),
    el: (tag, texte) => {
      const el = { tag, textContent: texte, style: {}, _clics: [],
        addEventListener: (t, f) => { if (t === "click") el._clics.push(f); } };
      elements.push(el);
      return el;
    },
  };
  const disque = new Map(contenus);
  const app = { vault: {
    getAbstractFileByPath: (p) => (disque.has(p) ? { path: p } : null),
    read: async (f) => disque.get(f.path),
    modify: async (f, contenu) => { disque.set(f.path, contenu); },
  } };

  await new AsyncFunction("dv", "app", CODE)(dv, app);

  const table = sorties.tables[0];
  const parNom = new Map();
  for (const [rayon, nom, quantite, pour] of table ? table.lignes : []) {
    if (!parNom.has(nom)) parNom.set(nom, []);
    parNom.get(nom).push({ rayon, quantite, pour });
  }
  const alertes = sorties.paragraphes.filter(p => p.includes("[!caution]")).join("\n");
  const clic = elements.find(e => e.tag === "button")?._clics[0];
  return { sorties, table, parNom, alertes, disque, clic, elements };
}

/* ================================================= 1. le coffre tel qu'il est */

const reel = new Map();
for (const abs of await fichiersMarkdown(COFFRE)) {
  reel.set(relative(COFFRE, abs).split("\\").join("/"), await readFile(abs, "utf8"));
}
const A = await executer(reel);

titre("Coffre livré — agrégation");
verifie("un tableau d'aperçu est rendu", !!A.table && A.table.lignes.length > 0);
verifie("8 repas détectés dans le menu de la semaine",
  A.sorties.paragraphes.some(p => p.includes("**8 repas**")));

const q = (nom) => A.parNom.get(nom)?.[0]?.quantite;
const attendu = [
  ["Courgette", "4", "2 soupes servies en demi-portion : 2 × (4 × 0,5)"],
  ["Oignon", "4", "curry 1 + chili 1 + salade 1 + 2 soupes × 0,5"],
  ["Riz basmati", "350 g", "curry 150 g + chili 200 g"],
  ["Pomme de terre", "550 g", "saumon 400 g + 2 soupes × (150 g × 0,5)"],
  ["Huile d'olive", "10 c. à s.", "1 + 1 + 2 + 2 + 3 + 2 × (1 × 0,5)"],
  ["Ail", "5", "curry 2 + chili 2 + omelette 1"],
  ["Crème fraîche", "10 cl", "2 soupes × (10 cl × 0,5)"],
  ["Oeuf", "5", "omelette, sans unité"],
  ["Sel", "au goût", "listé sans quantité"],
];
for (const [nom, val, pourquoi] of attendu) {
  verifie(nom + " = " + val + "  (" + pourquoi + ")", q(nom) === val,
    A.parNom.has(nom) ? "obtenu : " + q(nom) : "absent du panier");
}
verifie("les recettes d'origine sont tracées",
  A.parNom.get("Oignon")?.[0].pour.split(", ").length === 4, A.parNom.get("Oignon")?.[0].pour);
verifie("le rayon vient de la fiche ingrédient",
  (A.parNom.get("Courgette")?.[0].rayon || "").includes("Fruits & légumes"));
verifie("aucune alerte de cohérence sur le coffre livré", A.alertes === "", A.alertes);

titre("Coffre livré — écriture dans « Ma liste »");
verifie("le bouton expose un gestionnaire de clic", typeof A.clic === "function");
await A.clic();
let liste = A.disque.get(NOTE_LISTE);
verifie("la liste est écrite entre les repères",
  liste.includes("<!-- COURSES:DEBUT -->") && liste.includes("<!-- COURSES:FIN -->"));
verifie("les extras saisis à la main sont conservés", liste.includes("- [ ] Papier toilette"));
verifie("le texte d'attente initial a disparu", !liste.includes("liste pas encore générée"));
verifie("les rayons structurent la liste", liste.includes("### 🥬 Fruits & légumes"));
verifie("les assaisonnements partent dans « à vérifier »",
  /##\s*À vérifier[\s\S]*- \[ \] Sel/.test(liste));
verifie("les denrées ordinaires restent dans « à acheter »",
  /## À acheter[\s\S]*- \[ \] Pâtes — 200 g[\s\S]*## À vérifier/.test(liste));
verifie("la précision écrite dans la recette est reportée",
  liste.includes("Gingembre frais — 1 (un morceau de 2 cm)"));
verifie("un ingrédient n'apparaît qu'une fois",
  (liste.match(/^- \[[ x]\] Oignon — 4$/gm) || []).length === 1);

A.disque.set(NOTE_LISTE, liste.replace("- [ ] Oignon — 4", "- [x] Oignon — 4"));
await A.clic();
liste = A.disque.get(NOTE_LISTE);
verifie("une case cochée survit à une regénération", liste.includes("- [x] Oignon — 4"));
verifie("les autres articles restent décochés", liste.includes("- [ ] Courgette — 4"));
verifie("le bloc généré n'est pas dupliqué",
  (liste.match(/<!-- COURSES:DEBUT -->/g) || []).length === 1 &&
  (liste.match(/<!-- COURSES:FIN -->/g) || []).length === 1);
if (process.env.DUMP) console.log("\n----- Ma liste.md générée -----\n" + liste);

/* ============================================================ 2. cas limites */

const fiche = (nom, rayon, gm = false) =>
  ["Maison/04 Ingrédients/" + nom + ".md",
   "---\ntype: maison/ingredient\nrayon: \"" + rayon + "\"\ngarde_manger: " + gm + "\n---\n"];

function fixtures({ actif = true } = {}) {
  return new Map([
    fiche("Citron", "Fruits & légumes"),
    fiche("Oeuf", "Crèmerie"),
    fiche("Huile d'olive", "Épicerie", true),
    ["Maison/03 Recettes/Recette A.md",
`---
type: maison/recette
portions: 2
---
## Ingrédients
- 1/2 [[Citron]]
- 200 g [[Citron]]
- 100 g [[Farine sans fiche]]
- 2 [[Oeuf]]
- 1 c. à s. [[Huile d'olive]]
> - 50 g [[Piège dans une citation]]

## Préparation
1. Ajouter 999 g de [[Piège hors section]].
- 999 g [[Piège hors section]]
`],
    ["Maison/03 Recettes/Recette B.md",
`---
type: maison/recette
portions: 1
---
## Ingrédients
- 500 g [[Citron]]
`],
    ["Maison/_Templates/Modèle - Recette.md",
`---
type: maison/recette
portions: 2
---
## Ingrédients
- 777 g [[Citron]]
`],
    ["Maison/05 Menus/Test.md",
`---
type: maison/menu
actif: ` + actif + `
---
> Exemple dans une aide : - [ ] Midi — [[Recette B]] x9

- [ ] Midi — [[Recette A]] x4
- [x] Soir — [[Recette B]]
- [ ] Soir — [[Recette fantôme]]
`],
    [NOTE_LISTE, "---\ntype: maison/liste\n---\n\n<!-- COURSES:DEBUT -->\n<!-- COURSES:FIN -->\n"],
  ]);
}

titre("Cas limites — menu actif");
const B = await executer(fixtures());
const qb = (nom) => B.parNom.get(nom)?.map(e => e.quantite).sort().join(" / ");
verifie("les portions sont mises à l'échelle (x4 sur une recette pour 2)", qb("Oeuf") === "4");
verifie("les fractions sont comprises (1/2 × 2 = 1)", (B.parNom.get("Citron") || []).some(e => e.quantite === "1"));
verifie("les unités incompatibles ne sont pas additionnées (Citron : à l'unité et en g)",
  qb("Citron") === "1 / 400 g", "obtenu : " + qb("Citron"));
verifie("un repas coché sort de la liste", !(B.parNom.get("Citron") || []).some(e => e.quantite === "500 g"));
verifie("les lignes hors section « Ingrédients » sont ignorées", !B.parNom.has("Piège hors section"));
verifie("les lignes d'aide en citation sont ignorées",
  !B.parNom.has("Piège dans une citation") && !B.parNom.has("Recette B"));
verifie("le dossier _Templates est exclu", !(B.parNom.get("Citron") || []).some(e => e.quantite.includes("777")));
verifie("un ingrédient sans fiche est rangé dans Divers",
  (B.parNom.get("Farine sans fiche")?.[0].rayon || "").includes("Divers"));
verifie("une fiche ingrédient manquante est signalée", B.alertes.includes("Farine sans fiche"));
verifie("une recette introuvable est signalée", B.alertes.includes("Recette fantôme"));
verifie("l'écriture fonctionne sur un bloc vide",
  (await B.clic(), /<!-- COURSES:DEBUT -->\n\*Généré/.test(B.disque.get(NOTE_LISTE))));

titre("Cas limites — aucun menu actif");
const C = await executer(fixtures({ actif: false }));
verifie("l'absence de menu actif est signalée sans planter",
  C.sorties.paragraphes.some(p => p.includes("Aucun menu actif")));
verifie("aucun tableau n'est rendu dans ce cas", C.sorties.tables.length === 0);

/* ================================================== 3. cohérence des données */

titre("Cohérence des données du coffre");
const pagesReelles = [...reel].map(([chemin, texte]) => ({ ...frontmatter(texte), chemin }));
const recettes = pagesReelles.filter(p => p.type === "maison/recette" && !p.chemin.includes("_Templates"));
const fiches = new Set(pagesReelles.filter(p => p.type === "maison/ingredient")
  .map(p => p.chemin.slice(p.chemin.lastIndexOf("/") + 1, -3)));
const orphelins = [];
for (const r of recettes) {
  for (const l of reel.get(r.chemin).split(/\r?\n/)) {
    const m = l.match(/^\s*[-*]\s+.*?\[\[([^\]|#]+)/);
    if (m && !fiches.has(m[1].trim())) orphelins.push(r.chemin + " → " + m[1]);
  }
}
verifie("toutes les recettes pointent vers une fiche ingrédient existante", orphelins.length === 0, orphelins.join(", "));
verifie("chaque recette déclare un nombre de portions", recettes.every(r => typeof r.portions === "number" && r.portions > 0));
verifie("chaque fiche ingrédient déclare un rayon",
  pagesReelles.filter(p => p.type === "maison/ingredient").every(p => typeof p.rayon === "string" && p.rayon.length > 0));
verifie("il existe exactement une note type: maison/liste",
  pagesReelles.filter(p => p.type === "maison/liste").length === 1);

const notes = new Set([...reel.keys()].map(c => c.slice(c.lastIndexOf("/") + 1, -3)));
const casses = [];
for (const [chemin, texte] of reel) {
  if (chemin.includes("_Templates")) continue;
  // Obsidian ne transforme pas en lien ce qui est dans du code : on l'ignore aussi
  const sansCode = texte.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  for (const m of sansCode.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
    const cible = m[1].trim();
    if (!notes.has(cible)) casses.push(chemin + " → [[" + cible + "]]");
  }
}
verifie("aucun lien interne cassé dans le coffre", casses.length === 0, casses.join("\n      → "));

console.log("\n" + reussites + " vérifications passées, " + echecs + " échec(s).");
process.exit(echecs === 0 ? 0 : 1);
