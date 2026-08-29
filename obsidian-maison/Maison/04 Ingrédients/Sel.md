---
type: maison/ingredient
rayon: "Épicerie"
unite: ""
garde_manger: true
---

# Sel

## Utilisé dans

```dataview
LIST
WHERE type = "maison/recette" AND contains(file.outlinks, this.file.link)
SORT file.name ASC
```

## Notes

- 
