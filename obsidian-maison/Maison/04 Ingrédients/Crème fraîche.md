---
type: maison/ingredient
rayon: "Crèmerie"
unite: "cl"
garde_manger: false
---

# Crème fraîche

## Utilisé dans

```dataview
LIST
WHERE type = "maison/recette" AND contains(file.outlinks, this.file.link)
SORT file.name ASC
```

## Notes

- 
