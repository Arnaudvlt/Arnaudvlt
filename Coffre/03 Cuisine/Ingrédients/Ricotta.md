---
type: ingredient
rayon: Crèmerie
aliases: []
---

Pot de 250 g. Se remplace par de la brousse ou du fromage frais.

## Dans quels plats

```dataviewjs
const nom = dv.current().file.name.toLowerCase();
const noms = [nom].concat((dv.current().aliases ? dv.array(dv.current().aliases).array() : []).map(a => String(a).toLowerCase()));
const plats = dv.pages().where(p => p.type === "plat").where(p => {
  let l = []; try{ l = dv.array(p.ingredients || []).array(); }catch(e){}
  return l.some(i => noms.some(n => String(i).toLowerCase().includes(n)));
});
if(plats.length) dv.list(plats.map(p => p.file.link));
else dv.paragraph("*Aucun plat ne l'utilise pour l'instant.*");
```
