# Coffre

Un coffre Obsidian où trois choses vivent ensemble : **ce que je dois acheter**,
**ce que je dois faire**, et **ce que je cuisine** — la liste de courses étant
simplement ce qui tombe quand on croise les trois.

## Installation

1. Obsidian → *Ouvrir un dossier comme coffre* → choisir ce dossier `Coffre`.
   (Ou copier son contenu dans un coffre existant.)
2. *Paramètres → Modules complémentaires* → installer et activer **Dataview**.
3. Dans les options de Dataview, activer **Enable JavaScript Queries**.
   Sans ça, la liste de courses ne se construit pas.
4. Optionnel : *Paramètres → Modules de base → Modèles* → dossier `99 Modèles`,
   puis un raccourci clavier sur « Insérer un modèle ».

Sans Dataview, rien n'est perdu : les notes restent du markdown lisible, seules
les listes automatiques ne s'affichent pas.

## Comment c'est rangé

```
00 Accueil.md            tout ce qui est en cours, sur un écran
01 Achats/               une note par objet convoité
02 Tâches/Inbox.md       des cases à cocher, en vrac
03 Cuisine/
  Plats/                 une note par plat, ingrédients dans les propriétés
  Ingrédients/           facultatif : sert à fixer le rayon d'un ingrédient
  Menu de la semaine.md  on coche des plats → la liste de courses se fabrique
99 Modèles/              les trois modèles de note
```

## Les trois types de notes

Tout repose sur une propriété `type` dans le frontmatter. C'est elle qui permet
aux listes automatiques de savoir de quoi elles parlent.

### `type: achat`

| Propriété | À quoi ça sert |
|---|---|
| `statut` | `à acheter` ou `acheté` |
| `prix` | un nombre, additionné dans le total repéré |
| `lien` | l'URL de la vidéo, de la fiche produit, du test |
| `pour` | **la phrase qui compte** : pourquoi je le veux |
| `categorie` | matos, soin, maison, fringues… |
| `urgence` | 1 à 3, sert au tri |
| `courses` | `true` → l'objet remonte dans la liste de courses |
| `rayon` | avec `courses: true`, le rayon où le ranger |

Le corps de la note sert à tout le reste : les alternatives comparées, ce qu'il
reste à vérifier, des cases à cocher pour les étapes avant l'achat.

### `type: plat`

Les ingrédients sont dans les **propriétés**, pas dans le corps — c'est ce qui
permet de les additionner. Une ligne par ingrédient, écrite normalement :

```yaml
ingredients:
  - 250 g de lentilles corail
  - 400 ml de lait de coco
  - 2 gousses d'ail
  - 1 cs d'huile d'olive
  - 3 œufs
  - une pincée de piment
  - sel
```

Ce qui est compris : les nombres (`250`, `1,5`, `1/2`, `une`, `deux`), les unités
(`g kg ml cl dl l cs càs cc càc pincée tranche gousse boîte sachet botte brin
feuille pot barquette brique bouquet cm morceau verre bol`), et le `de` / `d'`
qui suit. Un ingrédient sans quantité (`sel`) est valable, il apparaîtra sans
quantité.

Le corps de la note contient `## Préparation` et `## Notes`. C'est ce que tu vois
en cliquant sur le plat.

### `type: ingredient`

Facultatif, et c'est important : **tu n'as pas à créer de note par ingrédient**.
Le rayon est deviné automatiquement à partir du nom (une courgette part aux
fruits & légumes, la ricotta à la crèmerie). Tu ne crées une note d'ingrédient
que quand la devinette se trompe, ou quand tu veux noter une marque, un format,
un remplaçant. La propriété `rayon` de cette note l'emporte alors sur tout.

Chaque note d'ingrédient affiche aussi dans quels plats il est utilisé.

## La semaine

Dans `Menu de la semaine` :

```markdown
## Cette semaine
- [x] [[Dahl de lentilles corail]]
- [x] [[Pâtes courgette ricotta]] x2
- [ ] [[Poulet rôti au citron]]
```

**Seuls les plats cochés entrent dans la liste de courses.** Les autres restent
là comme des candidats, y compris ceux de la section « Idées, plus tard ».
Le `x2` en fin de ligne double les quantités de ce plat.

Au-dessus, la liste se construit toute seule : les quantités s'additionnent
(`2 cs` d'huile chez l'un plus `3 cs` chez l'autre font `5 cs`), le singulier et
le pluriel se rejoignent, les grammes passent en kilos quand ça dépasse 1000, et
tout est rangé par rayon dans l'ordre où on traverse le magasin. Chaque ligne
rappelle de quel plat elle vient.

Les cases se cochent pendant les courses et restent cochées — c'est gardé dans
le navigateur d'Obsidian, pas dans le fichier, donc ça ne pollue pas la note.
« Copier la liste » met le tout en texte brut, pour l'envoyer à quelqu'un.

## La routine

- **Un truc repéré** → nouvelle note dans `01 Achats` depuis le modèle, coller le
  lien, écrire la phrase `pour:`. Trente secondes.
- **Un truc à faire** → une ligne dans `02 Tâches/Inbox`. Si ça concerne un objet,
  mettre le lien : `- [ ] vérifier l'USB-C avant [[Micro-cravate Rode Wireless ME]]`.
- **Un plat réussi** → nouvelle note dans `03 Cuisine/Plats`, ingrédients dans les
  propriétés, étapes dans le corps.
- **Dimanche soir** → cocher trois ou quatre plats, la liste est prête.

## Sur le téléphone

Obsidian mobile lit le même coffre. Pour la synchro, au choix : Obsidian Sync
(payant, le plus simple), iCloud sur iPhone, ou Syncthing si tu veux rester
chez toi. La liste de courses fonctionne sur mobile, les cases comprises.

## Ce qui n'y est pas, volontairement

Pas de gestion de stock (« il me reste 200 g de riz ») : ça demande de mettre à
jour le coffre après chaque repas, et personne ne le fait plus de deux semaines.
Pas de valeurs nutritionnelles. Pas de calcul de coût par plat. Si l'un des trois
manque vraiment à l'usage, il s'ajoute — mais mieux vaut le constater que le
supposer.
