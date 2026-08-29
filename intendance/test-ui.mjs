import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readFile, writeFile } from "node:fs/promises";

// La page publiée est enveloppée dans un squelette par la plateforme : on reproduit ça.
const contenu = await readFile("intendance.html", "utf8");
await writeFile("apercu.html",
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>' +
  '</head><body>' + contenu + '</body></html>');

let ko = 0, ok = 0;
const v = (nom, cond, det = "") => { if (cond) { ok++; console.log("  ✔ " + nom); }
  else { ko++; console.log("  ✘ " + nom + (det ? "\n      → " + det : "")); } };

const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
const erreurs = [];
page.on("pageerror", e => erreurs.push("pageerror: " + e.message));
// Les Google Fonts ne sont pas joignables depuis ce bac à sable ; ce n'est pas une erreur de la page.
const bruitReseau = (t) => /ERR_CONNECTION|ERR_NAME|fonts\.googleapis|fonts\.gstatic/.test(t);
page.on("console", m => { if (m.type() === "error" && !bruitReseau(m.text())) erreurs.push("console: " + m.text()); });

await page.goto("file://" + process.cwd() + "/apercu.html");
await page.waitForTimeout(700);

console.log("\nDémarrage");
v("aucune erreur JavaScript", erreurs.length === 0, erreurs.join("\n      → "));
v("les 5 onglets sont rendus", await page.locator(".onglet").count() === 5);
v("la vue Tâches est active", await page.locator("#vue-taches").isVisible());
v("les autres vues sont masquées", !(await page.locator("#vue-achats").isVisible()));
v("le statut de sauvegarde est honnête hors plateforme",
  (await page.locator("#sauv").textContent()).includes("cet appareil"));
v("3 tâches de départ", await page.locator("#vue-taches .ligne").count() === 3);

console.log("\nTâches");
await page.fill('[data-form="tache-ajout"] [name="texte"]', "Réserver le train");
await page.fill('[data-form="tache-ajout"] [name="contexte"]', "perso");
await page.fill('[data-form="tache-ajout"] [name="echeance"]', "2020-01-01");
await page.click('[data-form="tache-ajout"] button[type="submit"]');
await page.waitForTimeout(120);
v("la tâche est ajoutée", (await page.locator("#vue-taches").textContent()).includes("Réserver le train"));
v("une échéance passée tombe dans « En retard »",
  (await page.locator(".groupe.urgent").first().textContent()).includes("Réserver le train"));
v("le focus revient sur le champ de saisie",
  await page.evaluate(() => document.activeElement?.name === "texte"));
v("le badge de navigation compte 4 tâches",
  (await page.locator('.onglet[data-onglet="taches"] .compte').textContent()) === "4");

await page.locator(".groupe.urgent .ligne").first().locator('[data-a="tache-fait"]').click();
await page.waitForTimeout(120);
v("cocher déplace la tâche dans les terminées",
  (await page.locator("details.fini").textContent()).includes("Réserver le train"));

await page.locator("#vue-taches .ligne").first().locator('[data-a="tache-edit"]').click();
await page.waitForTimeout(100);
await page.fill('[data-form="tache-edit"] [name="texte"]', "Appeler le garage — devis");
await page.click('[data-form="tache-edit"] button[type="submit"]');
await page.waitForTimeout(120);
v("l'édition en ligne enregistre", (await page.locator("#vue-taches").textContent()).includes("devis"));

console.log("\nAchats");
await page.click('.onglet[data-onglet="achats"]');
await page.waitForTimeout(150);
v("le total des achats est affiché", (await page.locator("#vue-achats .tete p").textContent()).includes("327 €"));
v("le lien de référence est présent et sécurisé",
  await page.locator('#vue-achats a[target="_blank"][rel="noopener noreferrer"]').count() === 1);
v("les priorités sont triées en tête",
  (await page.locator("#vue-achats .ligne").first().textContent()).includes("Casque"));

console.log("\nRecettes et mise à l'échelle");
await page.click('.onglet[data-onglet="recettes"]');
await page.waitForTimeout(150);
const premiere = await page.locator(".fiche h2").textContent();
v("une fiche recette s'ouvre", premiere.length > 0, premiere);
await page.click('[data-a="recette-voir"][data-id="r3"]');
await page.waitForTimeout(120);
v("changer de recette met à jour la fiche", (await page.locator(".fiche h2").textContent()) === "Soupe de courgettes");
v("quantité de base : 4 courgettes pour 4 portions",
  (await page.locator(".ingr li").first().textContent()).includes("4"));
await page.click('[data-a="portions-moins"]');
await page.click('[data-a="portions-moins"]');
await page.waitForTimeout(120);
v("2 portions → 2 courgettes", (await page.locator(".ingr li").first().textContent()).includes("2"));
v("le compteur affiche 2 portions", (await page.locator(".compteur span").textContent()).includes("2 portions"));

console.log("\nSemaine → courses");
await page.click('.onglet[data-onglet="menu"]');
await page.waitForTimeout(150);
v("2 repas de départ sont planifiés", await page.locator(".repas").count() === 2);
await page.selectOption('[data-form="menu-ajout"] [name="recetteId"]', { label: "Poulet curry coco" });
await page.selectOption('[data-form="menu-ajout"] [name="jour"]', "4");
await page.fill('[data-form="menu-ajout"] [name="portions"]', "4");
await page.click('[data-form="menu-ajout"] button[type="submit"]');
await page.waitForTimeout(150);
v("le repas planifié apparaît dans la semaine", await page.locator(".repas").count() === 3);

await page.click('.onglet[data-onglet="courses"]');
await page.waitForTimeout(150);
const texteCourses = await page.locator("#vue-courses").textContent();
const ligneDe = async (nom) => {
  const l = page.locator("#vue-courses .ligne", { hasText: nom });
  return (await l.count()) ? (await l.first().textContent()).replace(/\s+/g, " ").trim() : null;
};
v("le poulet cumule 2 + 4 portions → 900 g", (await ligneDe("Blanc de poulet") || "").includes("900 g"),
  await ligneDe("Blanc de poulet"));
v("l'oignon cumule 1 + 2 + 0,5 et s'arrondit à 4 (article à la pièce)",
  (await ligneDe("Oignon") || "").includes("Oignon 4"), await ligneDe("Oignon"));
v("une quantité avec unité garde sa décimale", (await ligneDe("Bouillon") || "").includes("0,5 cube"), await ligneDe("Bouillon"));
v("le riz est mis à l'échelle → 450 g", (await ligneDe("Riz basmati") || "").includes("450 g"), await ligneDe("Riz basmati"));
v("les rayons regroupent les articles", texteCourses.includes("Fruits & légumes") && texteCourses.includes("Garde-manger"));
v("les extras hors recette sont listés", texteCourses.includes("Papier toilette"));
v("l'origine de chaque article est indiquée",
  await page.locator("#vue-courses .source").count() >= 5);

const avant = await page.locator("#vue-courses .ligne").count();
await page.locator("#vue-courses .ligne", { hasText: "Oignon" }).first().locator("input[type=checkbox]").click();
await page.waitForTimeout(120);
v("cocher un article le barre sans le retirer",
  await page.locator("#vue-courses .ligne").count() === avant &&
  await page.locator("#vue-courses .ligne.finie").count() >= 1);

await page.fill('[data-form="extra-ajout"] [name="texte"]', "Éponges");
await page.selectOption('[data-form="extra-ajout"] [name="rayon"]', "Maison");
await page.click('[data-form="extra-ajout"] button[type="submit"]');
await page.waitForTimeout(120);
v("un extra s'ajoute au bon rayon", (await page.locator("#vue-courses").textContent()).includes("Éponges"));

console.log("\nCréation de recette");
await page.click('.onglet[data-onglet="recettes"]');
await page.waitForTimeout(120);
await page.click('[data-a="recette-neuve"]');
await page.waitForTimeout(200);
v("le dialogue s'ouvre", await page.locator("#dlg-recette").evaluate(d => d.open));
await page.fill('#dlg-recette [name="titre"]', "Omelette aux champignons");
await page.fill('#dlg-recette [name="portions"]', "2");
await page.fill('#dlg-recette .ing-ligne [name="qte"]', "5");
await page.fill('#dlg-recette .ing-ligne [name="nom"]', "Oeuf");
await page.selectOption('#dlg-recette .ing-ligne [name="rayon"]', "Crèmerie");
await page.click('[data-a="ing-plus"]');
await page.waitForTimeout(100);
await page.fill('#dlg-recette .ing-ligne:last-child [name="qte"]', "250");
await page.fill('#dlg-recette .ing-ligne:last-child [name="unite"]', "g");
await page.fill('#dlg-recette .ing-ligne:last-child [name="nom"]', "Champignons de Paris");
await page.selectOption('#dlg-recette .ing-ligne:last-child [name="rayon"]', "Fruits & légumes");
await page.fill('#dlg-recette [name="etapes"]', "Poêler les champignons.\nBattre les oeufs.\nCuire 4 minutes.");
await page.click('#dlg-recette button[type="submit"]');
await page.waitForTimeout(200);
v("le dialogue se ferme", !(await page.locator("#dlg-recette").evaluate(d => d.open)));
v("la recette est créée et affichée", (await page.locator(".fiche h2").textContent()) === "Omelette aux champignons");
v("3 étapes enregistrées", await page.locator(".etapes li").count() === 3);
v("le rayon saisi est mémorisé",
  (await page.locator(".ingr li", { hasText: "Champignons" }).textContent()).includes("Fruits & légumes"));

await page.click('[data-a="planifier"]');
await page.waitForTimeout(200);
await page.click('#dlg-planif button[type="submit"]');
await page.waitForTimeout(200);
await page.click('.onglet[data-onglet="courses"]');
await page.waitForTimeout(150);
v("la nouvelle recette alimente la liste de courses",
  (await page.locator("#vue-courses").textContent()).includes("Champignons de Paris"));

console.log("\nPersistance");
await page.reload();
await page.waitForTimeout(500);
v("l'état survit au rechargement (localStorage)",
  (await page.locator("#vue-courses").textContent()).includes("Champignons de Paris"));
v("l'onglet actif est mémorisé", await page.locator("#vue-courses").isVisible());
v("les coches survivent au rechargement", await page.locator("#vue-courses .ligne.finie").count() >= 1);

console.log("\nRéglages, thème, mobile");
await page.click('[data-a="reglages"]');
await page.waitForTimeout(200);
await page.selectOption('[data-a="theme"]', "dark");
await page.waitForTimeout(150);
v("le thème sombre s'applique", await page.evaluate(() => document.documentElement.dataset.theme === "dark"));
const fond = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
v("le fond du corps est peint en sombre", fond === "rgb(17, 24, 21)", fond);
const contraste = await page.evaluate(() => getComputedStyle(document.querySelector(".tete h1")).color);
v("le texte reste clair sur fond sombre", contraste === "rgb(231, 235, 229)", contraste);
await page.click('#dlg-reglages [data-a="fermer"]');
await page.waitForTimeout(150);

await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(250);
const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
v("aucun débordement horizontal sur mobile", debord <= 1, "débordement de " + debord + "px");
v("la navigation passe en barre basse",
  await page.evaluate(() => getComputedStyle(document.querySelector(".rail")).position === "fixed"));

await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => { document.documentElement.removeAttribute("data-theme"); localStorage.setItem("intendance:theme","systeme"); });
await page.click('.onglet[data-onglet="taches"]');
await page.waitForTimeout(200);
await page.screenshot({ path: "apercu-clair.png", fullPage: true });
await page.emulateMedia({ colorScheme: "dark" });
await page.click('.onglet[data-onglet="courses"]');
await page.waitForTimeout(300);
await page.screenshot({ path: "apercu-sombre.png", fullPage: true });

console.log("\nErreurs JS accumulées : " + (erreurs.length ? "\n  " + erreurs.join("\n  ") : "aucune"));
v("aucune erreur JavaScript sur tout le parcours", erreurs.length === 0);

await nav.close();
console.log("\n" + ok + " vérifications passées, " + ko + " échec(s).");
process.exit(ko ? 1 : 0);
