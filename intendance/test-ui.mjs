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
page.on("dialog", d => d.accept());   // les confirmations de suppression
const erreurs = [];
page.on("pageerror", e => erreurs.push("pageerror: " + e.message));
// Les Google Fonts ne sont pas joignables depuis ce bac à sable ; ce n'est pas une erreur de la page.
const bruitReseau = (t) => /ERR_CONNECTION|ERR_NAME|fonts\.googleapis|fonts\.gstatic/.test(t);
page.on("console", m => { if (m.type() === "error" && !bruitReseau(m.text())) erreurs.push("console: " + m.text()); });

await page.goto("file://" + process.cwd() + "/apercu.html");
await page.waitForTimeout(700);

console.log("\nDémarrage");
v("aucune erreur JavaScript", erreurs.length === 0, erreurs.join("\n      → "));
v("les 5 sections de base sont rendues", await page.locator('#nav .onglet[data-onglet]').count() === 5);
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
v("les 19 achats de la liste sont présents", await page.locator("#vue-achats .ligne").count() === 19);
const enTetes = await page.locator("#vue-achats .groupe > h2").allTextContents();
v("ils sont regroupés par catégorie",
  ["Soin", "Vêtements", "Équipement"].every(c => enTetes.some(t => t.startsWith(c))), enTetes.join(" | "));
v("l'entête annonce le compte", (await page.locator("#vue-achats .tete p").textContent()).includes("19 articles"));

await page.fill('[data-form="achat-ajout"] [name="texte"]', "Sac de sport");
await page.fill('[data-form="achat-ajout"] [name="categorie"]', "Équipement");
await page.fill('[data-form="achat-ajout"] [name="lien"]', "https://example.com/sac");
await page.fill('[data-form="achat-ajout"] [name="prix"]', "60");
await page.click('[data-form="achat-ajout"] button[type="submit"]');
await page.waitForTimeout(150);
const grpEquip = page.locator("#vue-achats .groupe", { hasText: "Équipement" });
v("l'achat ajouté rejoint sa catégorie", (await grpEquip.textContent()).includes("Sac de sport"));
v("le lien saisi est rendu et sécurisé",
  await page.locator('#vue-achats a[target="_blank"][rel="noopener noreferrer"]').count() === 1);
v("le total n'apparaît qu'avec un prix", (await page.locator("#vue-achats .tete p").textContent()).includes("60 €"));

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
await page.click('[data-onglet="reglages"]');
await page.waitForTimeout(250);
v("les réglages s'ouvrent en pleine page, pas en fenêtre", await page.locator("#vue-reglages").isVisible());
await page.selectOption('[data-a="theme"]', "dark");
await page.waitForTimeout(150);
v("le thème sombre s'applique", await page.evaluate(() => document.documentElement.dataset.theme === "dark"));
// luminance relative, pour ne pas coder en dur des valeurs de palette
const lum = (css) => { const [r, g, b] = css.match(/\d+/g).map(Number);
  const f = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + .05) / (y + .05); };
// on mesure sur une vue qui porte un bouton principal
await page.click('.onglet[data-onglet="taches"]');
await page.waitForTimeout(200);
const fond = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const texte = await page.evaluate(() => getComputedStyle(document.querySelector(".tete h1")).color);
v("le corps peint bien un fond sombre", lum(fond) < .1, fond);
v("le titre contraste largement avec ce fond", contraste(fond, texte) > 12,
  fond + " / " + texte + " → " + contraste(fond, texte).toFixed(1) + ":1");
const btn = await page.evaluate(() => { const b = document.querySelector(".btn-plein");
  const s = getComputedStyle(b); return [s.backgroundColor, s.color]; });
v("le bouton principal reste lisible en thème sombre", contraste(btn[0], btn[1]) >= 4.5,
  btn.join(" / ") + " → " + contraste(btn[0], btn[1]).toFixed(1) + ":1");
const doux = await page.evaluate(() => getComputedStyle(document.querySelector(".tete p")).color);
v("le texte secondaire tient le seuil AA", contraste(fond, doux) >= 4.5,
  doux + " → " + contraste(fond, doux).toFixed(1) + ":1");

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

console.log("\nListes sur mesure");
await page.click('.onglet[data-onglet="taches"]');
await page.click('[data-a="liste-neuve"]');
await page.waitForTimeout(200);
v("la nouvelle liste s'ouvre directement en renommage", await page.locator('[data-form="liste-nom"]').count() === 1);
await page.fill('[data-form="liste-nom"] [name="nom"]', "Films à voir");
await page.click('[data-form="liste-nom"] button[type="submit"]');
await page.waitForTimeout(200);
v("elle porte le nom saisi", (await page.locator("main h1").textContent()) === "Films à voir");
v("elle rejoint la navigation", (await page.locator("#nav").textContent()).includes("Films à voir"));
await page.fill('[data-form="liste-item-ajout"] [name="texte"]', "Le Samouraï");
await page.click('[data-form="liste-item-ajout"] button[type="submit"]');
await page.waitForTimeout(180);
v("un élément s'y ajoute", (await page.locator("main .pile").textContent()).includes("Le Samouraï"));
v("le compteur du rail suit", (await page.locator('#nav .onglet[aria-current="true"] .compte').textContent()) === "1");
await page.locator("main .ligne").first().locator("input[type=checkbox]").click();
await page.waitForTimeout(180);
v("cocher range l'élément dans les terminés",
  (await page.locator("main details.fini").textContent()).includes("Le Samouraï"));
await page.reload();
await page.waitForTimeout(500);
v("la liste survit au rechargement", (await page.locator("#nav").textContent()).includes("Films à voir"));

console.log("\nRéglages : listes d'options modifiables");
await page.click('[data-onglet="reglages"]');
await page.waitForTimeout(250);
v("chaque famille de réglages a son bloc", await page.locator(".bloc").count() === 8,
  (await page.locator(".bloc > h2").allTextContents()).join(" | "));

const blocRayons = page.locator('[data-bloc="rayons"]');
const nomsAvant = await blocRayons.locator(".opt-ligne .nom").allTextContents();
await blocRayons.locator(".opt-ligne").nth(1).locator('[data-a="option-monter"]').click();
await page.waitForTimeout(200);
const nomsApres = await blocRayons.locator(".opt-ligne .nom").allTextContents();
v("un rayon se remonte dans l'ordre",
  nomsApres[0] === nomsAvant[1] && nomsApres[1] === nomsAvant[0], nomsApres.slice(0, 3).join(" / "));
v("la première flèche du haut est désactivée",
  await blocRayons.locator(".opt-ligne").first().locator('[data-a="option-monter"]').isDisabled());

await blocRayons.locator('[data-a="option-renommer"]').nth(1).click();
await page.waitForTimeout(180);
await page.fill('[data-form="option-renommer"] [name="valeur"]', "Primeur");
await page.click('[data-form="option-renommer"] button[type="submit"]');
await page.waitForTimeout(220);
v("le rayon est renommé", (await blocRayons.textContent()).includes("Primeur"));
await page.click('.onglet[data-onglet="courses"]');
await page.waitForTimeout(220);
v("le renommage se propage aux ingrédients déjà classés",
  (await page.locator("#vue-courses").textContent()).includes("Primeur"));

await page.click('[data-onglet="reglages"]');
await page.waitForTimeout(220);
await page.fill('[data-form="option-ajout"][data-cle="rayons"] [name="valeur"]', "Cave");
await page.click('[data-form="option-ajout"][data-cle="rayons"] button[type="submit"]');
await page.waitForTimeout(220);
await page.click('.onglet[data-onglet="courses"]');
await page.waitForTimeout(220);
v("un rayon ajouté est proposé pour les extras",
  (await page.locator('[data-form="extra-ajout"] [name="rayon"]').textContent()).includes("Cave"));

await page.click('[data-onglet="reglages"]');
await page.waitForTimeout(220);
await page.fill('[data-form="option-ajout"][data-cle="moments"] [name="valeur"]', "Petit-déjeuner");
await page.click('[data-form="option-ajout"][data-cle="moments"] button[type="submit"]');
await page.waitForTimeout(200);
await page.fill('[data-form="option-ajout"][data-cle="unites"] [name="valeur"]', "botte");
await page.click('[data-form="option-ajout"][data-cle="unites"] button[type="submit"]');
await page.waitForTimeout(200);
await page.fill('[data-form="option-ajout"][data-cle="categoriesRecette"] [name="valeur"]', "Apéro");
await page.click('[data-form="option-ajout"][data-cle="categoriesRecette"] button[type="submit"]');
await page.waitForTimeout(200);
await page.fill('[data-form="priorite"][data-cle="haute"] [name="nom"]', "Urgent");
await page.click('[data-form="priorite"][data-cle="haute"] button[type="submit"]');
await page.waitForTimeout(220);

await page.click('.onglet[data-onglet="menu"]');
await page.waitForTimeout(200);
v("un moment de repas ajouté est planifiable",
  (await page.locator('[data-form="menu-ajout"] [name="moment"]').textContent()).includes("Petit-déjeuner"));
await page.click('.onglet[data-onglet="achats"]');
await page.waitForTimeout(200);
v("une priorité renommée s'emploie dans le formulaire",
  (await page.locator('[data-form="achat-ajout"] [name="priorite"]').textContent()).includes("Urgent"));
await page.click('.onglet[data-onglet="recettes"]');
await page.click('[data-a="recette-neuve"]');
await page.waitForTimeout(250);
v("une catégorie ajoutée est proposée dans une recette",
  (await page.locator('#dlg-recette [name="categorie"]').textContent()).includes("Apéro"));
v("une unité ajoutée rejoint les suggestions",
  (await page.locator("#unites").innerHTML()).includes('value="botte"'));
await page.click('#dlg-recette [data-a="fermer"]');
await page.waitForTimeout(150);

await page.click('[data-onglet="reglages"]');
await page.waitForTimeout(220);
const avantSuppr = await blocRayons.locator(".opt-ligne").count();
await blocRayons.locator('.opt-ligne', { hasText: "Primeur" }).locator('[data-a="option-suppr"]').click();
await page.waitForTimeout(250);
v("un rayon employé se supprime après confirmation",
  await blocRayons.locator(".opt-ligne").count() === avantSuppr - 1);
await page.click('.onglet[data-onglet="courses"]');
await page.waitForTimeout(220);
const txtCourses = await page.locator("#vue-courses").textContent();
v("ses articles sont réaffectés, aucun n'est perdu",
  !txtCourses.includes("Primeur") && txtCourses.includes("Courgette") && txtCourses.includes("Blanc de poulet"));

console.log("\nMigration d'un état déjà en place");
await page.evaluate(() => {
  localStorage.setItem("intendance:v1", JSON.stringify({
    v: 1, maj: Date.now(),
    taches: [{id:"perso1", texte:"Ma tâche à moi", contexte:"", echeance:"", fait:false}],
    achats: [{id:"a1", texte:"Casque audio", fait:false}, {id:"perso2", texte:"Mon achat à moi", fait:false}],
    recettes: [], menu: [], extras: [], rayons: {}, coches: {}
  }));
  localStorage.setItem("intendance:onglet", "achats");
});
await page.reload();
await page.waitForTimeout(500);
const apresMigration = await page.locator("#vue-achats").textContent();
v("les données déjà saisies sont conservées", apresMigration.includes("Mon achat à moi"));
v("les nouveaux achats sont ajoutés", apresMigration.includes("Bleu de Chanel") && apresMigration.includes("Henley"));
v("les exemples de départ sont retirés", !apresMigration.includes("Casque audio"));
await page.click('.onglet[data-onglet="taches"]');
await page.waitForTimeout(150);
v("les tâches existantes survivent", (await page.locator("#vue-taches").textContent()).includes("Ma tâche à moi"));
await page.reload();
await page.waitForTimeout(500);
v("la migration ne se rejoue pas au rechargement",
  (await page.locator('.onglet[data-onglet="achats"] .compte').textContent()) === "20");

console.log("\nErreurs JS accumulées : " + (erreurs.length ? "\n  " + erreurs.join("\n  ") : "aucune"));
v("aucune erreur JavaScript sur tout le parcours", erreurs.length === 0);

await nav.close();
console.log("\n" + ok + " vérifications passées, " + ko + " échec(s).");
process.exit(ko ? 1 : 0);
