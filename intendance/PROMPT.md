# Prompt de référence — « Intendance »

> Spécification complète et autonome de l'application. Copie-la telle quelle dans une nouvelle
> session pour faire reconstruire, reprendre ou faire évoluer le projet : elle ne suppose aucune
> connaissance de l'historique.

---

## 1. Contexte

Je veux **un seul outil personnel** pour ma vie domestique. Aujourd'hui ces choses vivent dans
des endroits séparés (notes, listes, mémoire) et ne communiquent pas :

- ce que je dois **faire** ;
- ce que je dois **acheter** (objets, avec liens et références) ;
- les **plats** que je sais cuisiner, avec leurs ingrédients ;
- la **liste de courses**, que je refais à la main chaque semaine.

Le point qui compte, celui pour lequel l'outil existe : **la liste de courses ne doit pas se
saisir, elle doit se déduire** des repas que j'ai planifiés. Je pose « Chili sin carne pour 4 »
sur jeudi soir, et le riz, les haricots et les tomates apparaissent dans mes courses avec les
bonnes quantités, fusionnés avec ceux des autres plats de la semaine.

**Historique des essais** (pour ne pas les refaire) :

1. Un coffre **Obsidian** avec Dataview : rejeté, je n'aime pas Obsidian.
2. Une application HTML avec une palette maison : rejetée, « ça fait trop AI ».
3. La version actuelle : application HTML sur le système de design **shadcn/ui**. Retenue.

**Public** : moi seul. Ce n'est pas un produit multi-utilisateur, il n'y a pas de comptes, pas de
partage, pas d'onboarding à concevoir.

**Langue** : toute l'interface, les libellés, les messages d'erreur et les commentaires du code
sont en **français**.

---

## 2. Ce que je veux

### 2.1 Les cinq sections

| Section | Contenu | Comportement attendu |
| --- | --- | --- |
| **Tâches** | Ce que j'ai à faire | Saisie en une ligne. Contexte libre (`admin`, `maison`…) et échéance facultatifs. Regroupement automatique : en retard, aujourd'hui, dans la semaine, plus tard, sans échéance. Terminées repliées en bas. |
| **Achats** | Objets à acheter | Intitulé, **catégorie libre**, **lien** (ouvert dans un nouvel onglet, `rel="noopener noreferrer"`), **prix** facultatif, priorité. Regroupement par catégorie, total des prix renseignés en entête. |
| **Recettes** | Mes plats | Liste à gauche, fiche à droite. Portions, temps, catégorie, ingrédients (quantité + unité + nom + rayon), étapes, note. **Un compteur de portions qui recalcule les quantités en direct.** Bouton « Ajouter à la semaine ». |
| **Semaine** | Les repas planifiés | Grille des sept jours, jour courant marqué. Un repas = une recette + un moment + un nombre de portions. Case « cuisiné » qui le sort des courses. |
| **Courses** | Ce que je ramène | **Entièrement calculé** depuis la Semaine, plus des extras saisis à la main. Groupé par rayon, cochable. |

### 2.2 Le calcul de la liste de courses — le cœur

Pour chaque repas planifié **non coché comme cuisiné** :

1. Facteur d'échelle = `portions du repas / portions de la recette`.
2. Chaque ingrédient est mis à l'échelle et cumulé.
3. **Clé d'agrégation = `nom + unité`.** Deux recettes qui écrivent `400 g` et `2 pièces` du
   même ingrédient donnent **deux lignes distinctes** : on n'additionne pas des grammes avec
   des pièces. C'est voulu, ce n'est pas un bug à corriger.
4. Un ingrédient **sans unité** se compte à la pièce : la quantité finale est **arrondie au
   supérieur**. On n'achète pas 3,5 oignons.
5. Un ingrédient **sans quantité** apparaît quand même, en « au goût ».
6. Le rayon vient de la fiche ingrédient ; à défaut, « Divers ».
7. Chaque ligne indique **de quelle(s) recette(s) elle vient**, en mention discrète.
8. Les fractions saisies (`1/2`, `1 1/2`) et la virgule décimale française sont comprises.

### 2.3 Tout doit se modifier depuis l'interface

**Exigence forte : je ne dois jamais avoir à toucher au code pour adapter l'outil.** Un écran
**Réglages** en pleine page permet d'ajouter, renommer, réordonner et supprimer :

- les **rayons** — leur ordre est celui de la liste de courses ;
- les **moments de repas** (Midi, Soir, et ce que je veux : Petit-déjeuner, Goûter…) ;
- les **catégories de recettes** ;
- les **unités** suggérées ;
- les **noms des trois niveaux de priorité** d'achat.

Règles de sûreté sur ces listes :

- chaque valeur affiche **combien de fois elle est employée** ;
- **renommer propage** partout (un rayon renommé se met à jour sur tous les ingrédients et
  extras concernés) ;
- **supprimer une valeur employée demande confirmation** en annonçant le nombre d'éléments
  touchés et la valeur de repli, puis **réaffecte** — rien n'est perdu silencieusement ;
- exception pour les unités : les recettes gardent l'unité écrite, elle cesse simplement
  d'être suggérée ;
- on ne peut jamais vider complètement une liste.

Je veux aussi pouvoir **créer mes propres listes à cocher** (« Films à voir », « Cadeaux »,
« Voyage »…) depuis le rail de navigation, en plus des cinq sections. Elles se renomment et se
suppriment, et apparaissent dans la navigation avec leur compteur.

### 2.4 Mes données

- **Export / import JSON** depuis les Réglages.
- **Tout effacer**, avec confirmation.
- Choix du thème : suivre le système / clair / sombre.

---

## 3. Modèle de données

Un seul objet JSON. `maj` est un horodatage qui sert à départager deux copies.

```jsonc
{
  "v": 1,
  "maj": 1756480000000,
  "graine": 2,                 // version du contenu de départ déjà appliqué
  "retirer": ["a1", "a2"],     // ids d'exemples à retirer lors d'une migration

  "taches":  [{ "id", "texte", "contexte", "echeance": "AAAA-MM-JJ", "fait" }],
  "achats":  [{ "id", "texte", "categorie", "lien", "prix", "priorite", "fait" }],
  "recettes":[{ "id", "nom", "portions", "temps", "categorie", "notes",
                "ingredients": [{ "nom", "qte", "unite" }],
                "etapes": ["…"] }],
  "rayons":  { "nom d'ingrédient en minuscules": "Rayon" },
  "menu":    [{ "id", "jour": 0, "moment": "Soir", "recetteId", "portions", "fait" }],
  "extras":  [{ "id", "texte", "rayon", "fait" }],
  "coches":  { "nom|unite": true },      // articles calculés déjà cochés
  "listes":  [{ "id", "nom", "items": [{ "id", "texte", "fait" }] }],
  "options": { "rayons": [], "moments": [], "categoriesRecette": [], "unites": [] },
  "priorites": [{ "cle": "haute", "nom": "Prioritaire" }]  // trois clés fixes, noms libres
}
```

**Migration de graine.** Le HTML embarque un état de départ portant un numéro `graine`. Au
chargement, si l'état enregistré porte un numéro inférieur, les nouveaux éléments sont **ajoutés
par id** sans écraser ce qui existe, les ids listés dans `retirer` sont supprimés, et le numéro
est relevé. C'est ce qui permet de livrer du contenu nouveau sans détruire mes saisies.

---

## 4. Persistance

Deux niveaux, dans cet ordre :

1. **`localStorage`** à chaque modification : instantané, survit au rechargement, fonctionne
   partout.
2. **`artifact.publish({"data/etat.json": …})`** — la *forme fichiers* de l'API des Artifacts
   claude.ai — **1,5 s après la dernière action** (anti-rebond). Cette forme garde la page
   inchangée et **ne recharge pas la vue**, contrairement à la forme HTML. C'est ce qui fait
   suivre les données d'un appareil à l'autre.

Au chargement : on part de l'état embarqué, `localStorage` gagne s'il est plus récent, puis
`fetch("data/etat.json")` remplace le tout s'il est plus récent **et** qu'aucune modification
n'a encore été faite dans la session.

Traitement des erreurs de publication : `conflict` est bénin (une autre vue a publié, on ne
retente pas) ; `rate_limited` déclenche un report ; tout le reste fait basculer en mode local
et **le dire dans l'interface** — un indicateur dans le rail annonce « Enregistré » ou « Gardé
sur cet appareil ». Ne jamais laisser croire à une sauvegarde distante qui n'a pas eu lieu.

---

## 5. Design

### 5.1 Système

**shadcn/ui**, écrit directement en CSS — c'est son mode de distribution : on copie le
composant, on le possède. Pas de dépendance à charger.

Jetons en canaux HSL, définis sur `:root`, redéfinis dans `@media (prefers-color-scheme: dark)`
sous `:root:not([data-theme="light"])`, **et** sous `:root[data-theme="dark"]` :

```
--background --foreground --card --sidebar --muted --muted-foreground
--primary --primary-foreground --secondary --accent --destructive --border --input --ring
--radius: 0.5rem
```

Base neutre **zinc**. Primaire **quasi-noire** en clair, **quasi-blanche** en sombre. Pas de
couleur d'accent décorative : seul `--destructive` colore, pour ce qui détruit. Ombres `sm`
discrètes.

**Règle absolue** : aucune couleur ne doit être définie *uniquement* dans un bloc `@media` ou
`[data-theme]`, sinon la page rend le texte d'un thème sur le fond de l'autre. `body` peint
toujours un fond explicite.

### 5.2 Typographie

**Geist** et **Geist Mono** (Google Fonts), repli sur `system-ui, -apple-system, "Segoe UI"`.
Corps à 14 px. Titre de page 24 px semi-gras. Chiffres en `tabular-nums` partout où ils
s'alignent (quantités, prix, compteurs).

### 5.3 Composants et mise en page

- Rail de navigation à gauche (220 px, fond `--sidebar`, collant), qui devient une **barre
  d'onglets en bas** sous 760 px.
- Boutons : hauteur 36 px, rayon 6 px, variantes `défaut` / `plein` / `destructif` / `nu`.
- Champs : hauteur 36 px, bordure `--input`, anneau de focus `--ring`.
- Listes : une carte bordée, lignes séparées par une bordure, survol légèrement teinté.
- Badges : arrondis complets, `--secondary`, variante « contour » et variante destructive.
- Cases à cocher : 16 px, rayon 4 px, cochée = fond `--primary` avec la coche en
  `--primary-foreground`.
- Dialogues natifs `<dialog>` pour créer/modifier une recette et planifier un repas.
- Les actions d'une ligne (crayon, corbeille) n'apparaissent qu'au survol — **mais restent
  visibles en permanence sous `@media (hover: none)`**.

### 5.4 Ce qu'il ne faut pas faire

Pas de palette crème + serif + terracotta, pas de dégradé violet-bleu, pas d'emoji comme
marqueurs de section, pas de tout-centré, pas d'ombres colorées. L'outil doit ressembler à un
logiciel, pas à une page de présentation.

---

## 6. Contraintes techniques

- **Fichier unique HTML**, publié comme Artifact claude.ai. La plateforme enveloppe le contenu :
  **ne pas écrire de balises `<!DOCTYPE>`, `<html>`, `<head>` ni `<body>`** — commencer
  directement par `<title>`, `<style>`, puis le balisage.
- **CSP du bac à sable** : scripts uniquement depuis `cdnjs.cloudflare.com`,
  `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, `code.jquery.com` ; **feuilles de style
  externes uniquement depuis `fonts.googleapis.com`**. Tout le reste est bloqué sans message
  d'erreur. C'est ce qui interdit Shoelace, Flowbite et Carbon, qui ont besoin de charger leur
  CSS.
- **Aucune bibliothèque au moment de l'exécution.** Du JavaScript nu : rendu par chaînes de
  caractères, délégation d'événements sur `document` via des attributs `data-a` / `data-form`,
  état unique en mémoire, re-rendu complet de la vue active à chaque modification.
- Capacités déclarées : `{ artifact: {}, downloads: true }`.
- Accessibilité : `aria-current` sur l'onglet actif, `aria-label` sur les boutons à icône seule,
  focus visible, `prefers-reduced-motion` respecté.
- Aucun débordement horizontal : le contenu large défile dans son propre conteneur.

---

## 7. Exigence de qualité

Je ne veux pas de bugs. Concrètement :

- **Piloter un vrai navigateur** (Playwright + Chromium) sur le parcours complet avant de me
  livrer quoi que ce soit : ajout, édition en ligne, regroupements, mise à l'échelle des
  portions, agrégation des courses, création de recette, persistance après rechargement,
  création et suppression d'une liste, chaque opération des Réglages avec sa propagation.
- **Mesurer les contrastes** en thème sombre plutôt que comparer des couleurs codées en dur.
- Vérifier l'absence d'erreur JavaScript et l'absence de débordement horizontal en 390 px.
- Regarder les captures d'écran produites et corriger ce qui ne va pas visuellement — ne pas se
  contenter des tests verts.
- Si une dépendance ne peut pas être vérifiée depuis l'environnement de développement, **ne pas
  la prendre** : me le dire et proposer l'alternative.

---

## 8. Hors sujet

Pas de comptes, pas de synchronisation multi-utilisateur, pas de notifications, pas de suivi
nutritionnel, pas de scan de code-barres, pas d'import de recettes depuis le web, pas de
back-end. Un fichier, mes données, mon navigateur.
