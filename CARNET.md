# Carnet de la semaine

Un mini-logiciel personnel pour trois choses qui reviennent chaque semaine :
les **courses**, les **choses à faire**, et les **recettes** repérées en vidéo.

## Où ça tourne

Le carnet est publié comme page privée sur claude.ai. Une seule adresse, ouvrable
sur téléphone comme sur ordinateur, sans compte ni installation. `carnet.html`
est la source ; la page publiée en est la copie vivante.

## Ce qu'il fait

**Saisie** — un seul champ en haut. Une ligne par élément : coller sept lignes
d'un coup crée sept entrées. `3 citrons` et `500 g farine` séparent la quantité
du nom ; `! rappeler le garage` marque la tâche urgente.

**Courses** — chaque article est rangé tout seul dans son rayon (fruits &
légumes, frais, épicerie, surgelés, boissons, maison & hygiène), dans l'ordre où
on traverse un magasin. Un article déjà présent n'est pas dupliqué : il est
décoché et sa quantité mise à jour.

**Mode magasin** — plein écran, grosses cases, barre de progression. On tape
l'article, il quitte la liste.

**Recettes** — nom, lien de la vidéo, ingrédients, notes. *Ajouter aux courses*
envoie les ingrédients cochés dans la liste, déjà triés par rayon.

**Habituels** — ce qui a été acheté au moins deux fois revient en suggestion,
à ajouter d'un clic. La liste hebdomadaire se reconstitue en quelques secondes.

**Sauvegarde** — automatique, en local et sur la page. Les modifications se
retrouvent d'un appareil à l'autre : la fusion se fait élément par élément, sur
l'horodatage, donc deux appareils modifiés séparément ne s'écrasent pas.
*Télécharger une sauvegarde* sort un `.json` restaurable à tout moment.

## Raccourcis

| Geste | Effet |
|---|---|
| `Entrée` | ajouter |
| `Maj + Entrée` | aller à la ligne |
| clic sur le texte | modifier sur place |
| `Échap` | quitter le mode magasin |

## Modifier le carnet

`carnet.html` est un fichier unique — HTML, CSS et JavaScript, sans dépendance
ni build. Les rayons se règlent dans la table `RAYONS` en tête de script :
ajouter un mot-clé suffit à faire classer un produit ailleurs.
