---
type: maison/ingredient
rayon: "Épicerie"
unite: "cube"
garde_manger: true
---

# Bouillon de légumes

## Utilisé dans

```dataview
LIST
WHERE type = "maison/recette" AND contains(file.outlinks, this.file.link)
SORT file.name ASC
```

## Notes

- 
