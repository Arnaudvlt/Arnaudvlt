---
type: maison/achats
---

# Achats

> [!tip] Mode d'emploi
> Pour un achat simple, une ligne suffit. Format libre, mais celui-ci se lit bien :
> `- [ ] Nom — [référence](https://lien) — 49 € #catégorie`
> Pour un achat qui demande une comparaison, crée une note dédiée à partir de
> `_Templates/Modèle - Achat.md` et pointe dessus : `- [ ] [[Casque audio]]`.
> Les courses alimentaires ne vont **pas** ici : elles vivent dans [[Ma liste]].

## À acheter

- [ ] Piles AA (pack de 8) — [Amazon](https://www.amazon.fr/s?k=piles+AA) — ~12 € #maison
- [ ] Filtre à eau pour la carafe — ~20 € #maison
- [ ] [[Casque audio]] — comparatif en cours #perso

## Envies / à réfléchir

- [ ] Lampe de bureau à bras articulé — [Ikea Tertial](https://www.ikea.com/fr/fr/) — ~15 € #maison
- [ ] Deuxième écran 27" — ~200 € #bureau

## Acheté

- [x] Rallonge multiprise 3 m — 14 € #maison

## Notes dédiées

```dataview
TABLE WITHOUT ID
  file.link AS "Achat",
  statut AS "Statut",
  prix AS "Prix",
  priorite AS "Priorité",
  lien AS "Lien"
WHERE type = "maison/achat" AND !contains(file.folder, "_Templates")
SORT priorite ASC, file.name ASC
```
