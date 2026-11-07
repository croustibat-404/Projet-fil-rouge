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
- échanger des messages dans une zone de discussion ;
- gérer leurs contacts ;
- modifier leur profil et choisir un avatar.

Les comptes, les conversations et les messages sont stockés avec Supabase.

## Pages réalisées

| Page | Fichier | Description |
|------|---------|-------------|
| Connexion | [connexion.html](connexion.html) | Formulaire de connexion (adresse mail + mot de passe), avec un lien vers l'inscription. |
| Inscription | [inscription.html](inscription.html) | Formulaire de création de compte (nom, prénom, pseudo, mail, téléphone facultatif, mot de passe + confirmation). |
| Accueil | [index.html](index.html) | Messagerie : onglets Discussions / Contacts à gauche, zone de discussion à droite. |
| Paramètres | [parametres.html](parametres.html) | Infos du profil, choix d'un avatar, changement de mot de passe, déconnexion et suppression du compte. |

## Structure du projet

```
Projet-Fil-Rouge/
├── index.html         # Page d'accueil / messagerie
├── connexion.html     # Page de connexion
├── inscription.html   # Page d'inscription
├── parametres.html    # Page des paramètres du compte
├── css/
│   └── style.css      # Feuille de style commune
├── js/
│   ├── supabase.js    # Connexion à Supabase
│   └── script.js      # Script commun à toutes les pages
├── img/
│   └── logo.png       # Logo / favicon
└── README.md
```

## Fonction supplémentaire : les storys

Nous avons ajouté la possibilité de publier des storys, visibles par tout le monde.

- **Publier une story** : cliquer sur le petit **+** sur son avatar en haut à gauche, choisir une image (PNG, JPG ou WEBP, 5 Mo max) puis ajouter une légende si on veut.
- **Voir une story** : dans l'onglet Contacts, les contacts qui ont une story ont un cercle bleu autour de leur photo. Il faut cliquer sur la photo pour ouvrir la story. Le cercle devient gris une fois la story vue.
- **Dans la story** : les storys défilent toutes seules, on clique à droite pour passer à la suivante, à gauche pour revenir en arrière, et on maintient le clic pour mettre en pause. Échap ou la croix pour fermer.

## Lancer le projet

Aucune installation n'est nécessaire : il suffit d'ouvrir [connexion.html](connexion.html) dans un navigateur web (une connexion internet est nécessaire pour Supabase).
