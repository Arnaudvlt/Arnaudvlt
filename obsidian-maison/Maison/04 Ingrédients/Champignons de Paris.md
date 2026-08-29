---
type: maison/ingredient
rayon: "Fruits & légumes"
unite: "g"
garde_manger: false
---

# Champignons de Paris

## Utilisé dans

```dataview
LIST
WHERE type = "maison/recette" AND contains(file.outlinks, this.file.link)
SORT file.name ASC
```

## Notes

- 
