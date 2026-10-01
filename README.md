# Projet Fil Rouge – Messagerie en ligne 

Projet réalisé dans le cadre du cours 8WEB101

## Binôme

- **Stevan Le Bihan**
- **Celian Dusaussoy**

## Description

L'objectif du projet est de concevoir une application de messagerie en ligne permettant à des utilisateurs de :

- créer un compte ;
- se connecter ;
- consulter la liste de leurs conversations ;
- échanger des messages dans une zone de discussion.

## Pages réalisées

| Page | Fichier | Description |
|------|---------|-------------|
| Connexion | [connexion.html](connexion.html) | Formulaire de connexion (adresse mail + mot de passe), avec un lien vers l'inscription. |
| Inscription | [inscription.html](inscription.html) | Formulaire de création de compte (nom, prénom, mail, téléphone facultatif, mot de passe + confirmation). |
| Accueil | [index.html](index.html) | Interface de la messagerie : colonne des conversations à gauche, zone de discussion à droite. |

## Structure du projet

```
Projet-Fil-Rouge/
├── index.html         # Page d'accueil / messagerie
├── connexion.html     # Page de connexion
├── inscription.html   # Page d'inscription
├── css/
│   └── style.css      # Feuille de style commune
├── img/
│   └── logo.png       # Logo / favicon
└── README.md
```
## Fonction supplémentaire
Nous avons ajouté une fonctionnalité supplémentaire : la possibilité d'ajouter des storys. Les utilisateurs connectés peuvent publier des storys qui seront visibles par tout le monde. Il faut cliquer sur le profil de la personne afin de voir ses storys

## Lancer le projet

Aucune installation n'est nécessaire : il suffit d'ouvrir [connexion.html](connexion.html) dans un navigateur web.

