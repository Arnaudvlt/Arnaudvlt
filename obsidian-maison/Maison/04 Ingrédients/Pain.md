---
type: maison/ingredient
rayon: "Boulangerie"
unite: ""
garde_manger: false
---

# Pain

## Utilisé dans

```dataview
LIST
WHERE type = "maison/recette" AND contains(file.outlinks, this.file.link)
SORT file.name ASC
```

## Notes

- 
