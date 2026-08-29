---
type: maison/ingredient
rayon: "Épicerie"
unite: "g"
garde_manger: false
---

# Lentilles vertes

## Utilisé dans

```dataview
LIST
WHERE type = "maison/recette" AND contains(file.outlinks, this.file.link)
SORT file.name ASC
```

## Notes

- 
