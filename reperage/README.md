# Repérage

Une seule liste pour deux choses qui, dans la vraie vie, n'en font qu'une :
ce que je vois passer dans les vidéos et que je veux acheter, et ce que je
dois faire (souvent *parce que* j'ai vu quelque chose, ou *parce qu'il me
manque* quelque chose pour bosser).

`app.html` est l'application. Elle est publiée comme Artifact : une page web
qui se souvient d'elle-même, sans serveur, sans compte, sans base de données.

## Le modèle

Un seul type d'entrée, avec un champ `kind` :

| champ | rôle |
|---|---|
| `kind` | `buy` (à acheter) ou `do` (à faire) — c'est le seul truc qui sépare les deux mondes |
| `title` | le nom du produit ou de la tâche |
| `why` | **le champ qui fait tout marcher** : « vue dans le reel de Camille », « il m'en manque un pour les tournages » |
| `url` | le lien de la vidéo, pour y retourner |
| `tag` | contexte : taf, maison, cadeau… |
| `price` | prix estimé, agrégé en « budget repéré » |
| `flag` | urgent |
| `done` | fait |

Une tâche et un achat sont la même chose vue sous deux angles, donc ils vivent
dans la même liste, avec les mêmes filtres et la même case à cocher. C'est ça
le « mélange des deux ».

## Capturer

**Le plus simple** — sur la vidéo : *Partager → Copier le lien*, puis dans
l'app : *Coller* → *Ajouter*. Le lien est gardé, le nom du produit peut
attendre : les liens sans nom remontent en haut avec un rappel « à nommer ».

**Depuis le menu Partager (iOS)** — Raccourcis → nouveau raccourci →
« Recevoir des URL depuis le menu de partage » → action *Ouvrir l'URL* avec :

```
https://<adresse-de-l-app>/?add=[URL reçue]
```

L'app lit `?add=`, crée l'entrée et ouvre directement le champ du nom.
L'adresse exacte est affichée (et copiable) dans le panneau
« Capturer depuis TikTok, Insta ou YouTube » en bas de l'app.

**En écrivant** — une ligne suffit, l'app la découpe :

```
acheter crème Ordinary 12€ #peau parce que la mienne est finie !
```

→ type `achat`, titre `crème Ordinary`, prix `12 €`, tag `#peau`,
pourquoi `la mienne est finie`, urgent.

Reconnus automatiquement : le lien, `#tag`, `12€` / `29,90 eur`, `!` ou
`urgent` en fin de ligne, `parce que` / `car` / ` — ` pour le *pourquoi*, et
le verbe de tête (`acheter`, `commander`… → achat ; `relancer`, `appeler`,
`rdv`… → tâche). Le sélecteur *À acheter / À faire* suit la détection et
reste rectifiable avant d'ajouter.

## Ce que ça ne fait pas (encore)

**Ça ne devine pas le nom du produit à partir du seul lien.** C'est la partie
qui a l'air magique et qui ne l'est pas : une page TikTok ou Instagram ne
livre pas son contenu à une page web tierce (le navigateur l'interdit, et
l'app n'a pas le droit d'aller chercher la vidéo). Pour extraire « crème
Ordinary » d'un lien, il faut une brique qui tourne ailleurs :

1. récupérer la légende et les sous-titres de la vidéo (`yt-dlp` le fait pour
   TikTok, Instagram, YouTube) ;
2. les passer à un modèle qui en sort le nom du produit + une phrase de
   contexte ;
3. écrire le résultat dans la liste.

C'est faisable et pas très long à écrire, mais ça demande un endroit où
tourner (une machine allumée, ou un compte d'hébergement) et une clé d'API.
Tant que cette brique n'existe pas, l'app garde le lien et laisse le nom à
écrire — trois secondes, et rien n'est perdu entre-temps.

## Où sont les données

Dans la page elle-même : chaque modification republie l'app avec son contenu
embarqué. Rien n'est envoyé ailleurs. Le bouton *Exporter* rend un `.json`
complet. Si la page est ouverte sans droit d'écriture, elle bascule sur le
stockage local du navigateur et continue de fonctionner.
