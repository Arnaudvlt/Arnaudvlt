---
type: menu
semaine: 2026-W36
---

# Menu de la semaine

## Liste de courses

```dataviewjs
/* ---------- réglages ---------- */
const ORDRE_RAYONS = ["Fruits & légumes","Boucherie & poissonnerie","Crèmerie","Boulangerie","Épicerie","Surgelés","Boissons","Maison","Autres"];

const UNITES = {
  "kg":{b:"g",f:1000}, "g":{b:"g",f:1},
  "l":{b:"ml",f:1000}, "dl":{b:"ml",f:100}, "cl":{b:"ml",f:10}, "ml":{b:"ml",f:1},
  "cs":{b:"cs",f:1}, "càs":{b:"cs",f:1},
  "cc":{b:"cc",f:1}, "càc":{b:"cc",f:1}
};
const MOTS_UNITES = "kg|g|l|dl|cl|ml|càs|cs|càc|cc|pincées?|tranches?|gousses?|boîtes?|boites?|sachets?|bottes?|brins?|feuilles?|pots?|barquettes?|briques?|bouquets?|bocaux|bocal|cm|morceaux?|tiges?|verres?|bols?";
const MOTS_NOMBRES = {"un":1,"une":1,"deux":2,"trois":3,"quatre":4,"cinq":5,"six":6,"sept":7,"huit":8,"neuf":9,"dix":10,"demi":0.5,"demie":0.5};
const RE_ING = new RegExp(
  "^\\s*(?:(\\d+\\s*/\\s*\\d+|\\d+(?:[.,]\\d+)?|" + Object.keys(MOTS_NOMBRES).join("|") + ")\\b\\s*)?"
  + "(?:(" + MOTS_UNITES + ")\\b\\.?\\s*)?"
  + "(?:(?:d['’]|de\\s+la\\s+|de\\s+l['’]|de\\s+|du\\s+|des\\s+))?\\s*(.+?)\\s*$", "i");
const UNITES_MOT = ["pincée","tranche","gousse","boîte","boite","sachet","botte","brin","feuille","pot","barquette","brique","bouquet"];

/* rayon deviné d'après le nom — les notes d'ingrédient (propriété rayon:) l'emportent toujours */
const EXCEPTIONS = [
  [/(lait|crème)\s+de\s+coco/i, "Épicerie"],
  [/tomates?\s+(concassées?|pelées?|en\s+(boîte|conserve))/i, "Épicerie"],
  [/(purée|coulis|concentré)\s+de\s+tomates?/i, "Épicerie"],
  [/(lait|crème)\s+(de\s+)?(soja|amande|avoine)/i, "Épicerie"],
  [/haricots?\s+verts?/i, "Fruits & légumes"],
  [/(petits\s+pois|épinards?)\s+surgel/i, "Surgelés"]
];
const MOTS_RAYONS = [
  [/(tomate|courgette|carotte|oignon|\bail\b|échalote|salade|roquette|épinard|poireau|pomme de terre|patate|citron|pomme|banane|orange|champignon|poivron|aubergine|brocoli|chou|concombre|avocat|persil|coriandre|basilic|menthe|thym|romarin|gingembre|fraise|raisin|butternut|potiron|courge|radis|betterave|céleri|navet|fenouil|mangue|poire|pêche|abricot)/i, "Fruits & légumes"],
  [/(poulet|boeuf|bœuf|porc|veau|agneau|dinde|saucisse|lardon|jambon|steak|merguez|poisson|saumon|cabillaud|crevette|thon frais|merlu|dorade|truite)/i, "Boucherie & poissonnerie"],
  [/(lait|beurre|crème|yaourt|fromage|parmesan|mozzarella|ricotta|feta|comté|gruyère|chèvre|œuf|oeuf|skyr|mascarpone)/i, "Crèmerie"],
  [/(pain|baguette|brioche|tortilla|wrap|pita|viennoiserie)/i, "Boulangerie"],
  [/(pâtes|nouilles|riz|lentille|pois chiche|haricot|farine|sucre|\bsel\b|poivre|épice|curcuma|cumin|paprika|curry|harissa|huile|vinaigre|coulis|concentré|bouillon|coco|semoule|quinoa|boulgour|miel|moutarde|olive|câpre|chocolat|levure|conserve|thon|sardine|sauce soja|tahini|cacahuète|amande|noix|graine)/i, "Épicerie"],
  [/(surgel|glace|glaçon)/i, "Surgelés"],
  [/(\beau\b|jus|bière|vin|café|thé|infusion|soda|limonade)/i, "Boissons"],
  [/(éponge|lessive|papier toilette|essuie-tout|sac poubelle|liquide vaisselle|savon|nettoyant|pile)/i, "Maison"]
];

/* ---------- outils purs ---------- */
function nombre(txt){
  if(!txt) return null;
  const s = String(txt).trim().toLowerCase().replace(",", ".");
  if(MOTS_NOMBRES[s] !== undefined) return MOTS_NOMBRES[s];
  const fr = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if(fr) return parseInt(fr[1],10) / parseInt(fr[2],10);
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normaliseUnite(q, u){
  if(!u) return {q:q, u:""};
  const brut = u.toLowerCase();
  let conv = UNITES[brut], cle = brut;
  if(!conv){
    const sing = brut.replace(/s$/,"");
    if(UNITES[sing]){ conv = UNITES[sing]; cle = sing; } else { cle = sing; }
  }
  if(conv) return {q: (q==null ? null : q*conv.f), u: conv.b};
  return {q:q, u:cle};
}

function parseIngredient(ligne){
  const m = String(ligne == null ? "" : ligne).match(RE_ING);
  if(!m) return null;
  const nom = (m[3] || "").trim().replace(/\s{2,}/g," ");
  if(!nom) return null;
  const n = normaliseUnite(nombre(m[1]), m[2]);
  return {q:n.q, u:n.u, nom:nom};
}

function facteurDe(texte){
  const m = String(texte || "").match(/(?:^|\s)[x×]\s*(\d+(?:[.,]\d+)?)\s*$/i);
  return m ? nombre(m[1]) : 1;
}

function rayonDevine(nom){
  for(const [re, r] of EXCEPTIONS){ if(re.test(nom)) return r; }
  for(const [re, r] of MOTS_RAYONS){ if(re.test(nom)) return r; }
  return "Autres";
}

/* clé de regroupement : insensible au singulier/pluriel, pour que
   « oignon » et « oignons », « pomme de terre » et « pommes de terre » se cumulent */
function cle(nom){
  return nom.toLowerCase().replace(/[’']/g,"'").trim()
    .split(/\s+/)
    .map(function(m){ return (m.length > 3 && /[sx]$/.test(m) && !/ss$/.test(m)) ? m.slice(0,-1) : m; })
    .join(" ");
}

function agrege(entrees){
  /* entrees : [{q,u,nom,origine}] -> [{nom,u,q,origines:[]}] */
  const map = new Map();
  for(const e of entrees){
    if(!e || !e.nom) continue;
    const k = cle(e.nom) + "|" + e.u;
    if(!map.has(k)) map.set(k, {nom:e.nom, u:e.u, q:null, rayon:e.rayon || null, origines:[]});
    const cur = map.get(k);
    if(!cur.rayon && e.rayon) cur.rayon = e.rayon;
    if(e.q != null) cur.q = (cur.q || 0) + e.q;
    if(e.origine && cur.origines.indexOf(e.origine) < 0) cur.origines.push(e.origine);
  }
  return Array.from(map.values());
}

function formateQte(q, u){
  if(q == null) return "";
  let v = q, unite = u;
  if(u === "g" && v >= 1000){ v = v/1000; unite = "kg"; }
  if(u === "ml" && v >= 1000){ v = v/1000; unite = "l"; }
  const arrondi = Math.round(v*100)/100;
  const txt = String(arrondi).replace(".", ",");
  if(arrondi > 1 && UNITES_MOT.indexOf(unite) >= 0) unite = unite + "s";
  return unite ? txt + " " + unite : txt;
}

/* ---------- lecture du coffre ---------- */
const cont = this.container;
const courant = dv.current();

/* les plats cochés dans « Cette semaine » */
const choisis = [];
for(const t of (courant.file.tasks || [])){
  if(!(t.completed || t.checked)) continue;
  for(const lien of (t.outlinks || [])){
    const p = dv.page(lien.path);
    if(p && p.type === "plat") choisis.push({page:p, facteur:facteurDe(t.text)});
  }
}

/* index des rayons déclarés dans les notes d'ingrédient */
const idxRayon = new Map();
for(const p of dv.pages('"03 Cuisine/Ingrédients"')){
  if(!p.rayon) continue;
  idxRayon.set(cle(p.file.name), String(p.rayon));
  let al = p.aliases || p.alias;
  if(al){ try{ for(const a of dv.array(al).array()) idxRayon.set(cle(String(a)), String(p.rayon)); }catch(e){} }
}
function rayonDe(nom, force){
  if(force) return String(force);
  return idxRayon.get(cle(nom)) || rayonDevine(nom);
}

/* ingrédients des plats retenus */
const entrees = [];
for(const c of choisis){
  let liste = [];
  if(c.page.ingredients){
    try{ liste = dv.array(c.page.ingredients).array(); }catch(e){ liste = [].concat(c.page.ingredients); }
  }
  for(const ing of liste){
    const p = parseIngredient(String(ing));
    if(!p) continue;
    entrees.push({q:(p.q == null ? null : p.q * c.facteur), u:p.u, nom:p.nom,
                  origine:c.page.file.name, rayon:rayonDe(p.nom, null)});
  }
}

/* + les achats marqués « courses » */
const achats = dv.pages('"01 Achats"')
  .where(p => p.type === "achat" && p.courses === true && String(p.statut || "") !== "acheté");
for(const a of achats){
  entrees.push({q:null, u:"", nom:a.file.name, origine:"à acheter", rayon:rayonDe(a.file.name, a.rayon)});
}

/* ---------- rendu ---------- */
if(!entrees.length){
  cont.createEl("p", {text:"Coche des plats dans « Cette semaine » plus bas, et la liste se construit ici."})
      .style.opacity = .6;
} else {
  const groupes = new Map();
  for(const g of agrege(entrees)){
    const r = g.rayon || "Autres";
    if(!groupes.has(r)) groupes.set(r, []);
    groupes.get(r).push(g);
  }
  const rayons = ORDRE_RAYONS.filter(r => groupes.has(r))
    .concat(Array.from(groupes.keys()).filter(r => ORDRE_RAYONS.indexOf(r) < 0).sort());

  const CLEF = "courses/" + courant.file.path;
  let coches;
  try{ coches = new Set(JSON.parse(localStorage.getItem(CLEF) || "[]")); }catch(e){ coches = new Set(); }
  const sauver = function(){ try{ localStorage.setItem(CLEF, JSON.stringify(Array.from(coches))); }catch(e){} };

  const resume = cont.createEl("p");
  resume.style.opacity = .6;
  resume.setText(choisis.length + (choisis.length > 1 ? " plats · " : " plat · ")
                 + entrees.length + " lignes · " + agrege(entrees).length + " articles");

  const lignesTexte = [];
  for(const r of rayons){
    const h = cont.createEl("p"); h.style.margin = "0.9em 0 0.2em";
    h.createEl("strong", {text:r});
    lignesTexte.push("— " + r + " —");
    const ul = cont.createEl("ul");
    ul.style.listStyle = "none"; ul.style.paddingLeft = "0"; ul.style.margin = "0";

    groupes.get(r).sort((a,b) => a.nom.localeCompare(b.nom, "fr"));
    for(const g of groupes.get(r)){
      const qte = formateQte(g.q, g.u);
      const txt = (qte ? qte + " " : "") + g.nom;
      lignesTexte.push("[ ] " + txt + (g.origines.length ? "   (" + g.origines.join(", ") + ")" : ""));

      const li = ul.createEl("li");
      li.style.display = "flex"; li.style.alignItems = "baseline"; li.style.gap = "0.5em";
      const cb = li.createEl("input", {attr:{type:"checkbox"}});
      const lab = li.createEl("span");
      lab.createEl("span", {text:txt});
      if(g.origines.length){
        const src = lab.createEl("span", {text:"  " + g.origines.join(", ")});
        src.style.opacity = .45; src.style.fontSize = "0.85em";
      }
      const peindre = function(){
        lab.style.textDecoration = cb.checked ? "line-through" : "none";
        lab.style.opacity = cb.checked ? .4 : 1;
      };
      cb.checked = coches.has(txt);
      peindre();
      cb.addEventListener("change", function(){
        if(cb.checked) coches.add(txt); else coches.delete(txt);
        sauver(); peindre();
      });
    }
  }

  const barre = cont.createEl("p"); barre.style.marginTop = "1em";
  barre.style.display = "flex"; barre.style.gap = "0.5em";
  const bCopier = barre.createEl("button", {text:"Copier la liste"});
  bCopier.addEventListener("click", function(){
    navigator.clipboard.writeText(lignesTexte.join("\n"));
    bCopier.setText("Copié"); setTimeout(function(){ bCopier.setText("Copier la liste"); }, 1500);
  });
  const bVider = barre.createEl("button", {text:"Tout décocher"});
  bVider.addEventListener("click", function(){
    coches.clear(); sauver();
    cont.querySelectorAll("input[type=checkbox]").forEach(function(c){
      c.checked = false; c.dispatchEvent(new Event("change"));
    });
  });
}
```

## Cette semaine

Coche un plat pour le mettre au menu. Ajoute `x2` en fin de ligne pour doubler les quantités.

- [x] [[Dahl de lentilles corail]]
- [x] [[Pâtes courgette ricotta]] x2
- [ ] [[Poulet rôti au citron]]

## Idées, plus tard

Rien ici n'entre dans la liste de courses tant que ce n'est pas coché au-dessus.

- [ ] [[Poulet rôti au citron]]
