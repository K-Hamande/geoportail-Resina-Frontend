# Geoportail RESINA - Frontend

Interface web du Géoportail RESINA pour Décideurs (ANPTIC Burkina Faso).
Application React (Vite) consommant l'API du backend Spring Boot.

## Technologies utilisées

- **React** (JSX)
- **Vite** (outil de build et serveur de développement)
- **Node.js / npm** (gestion des dépendances)

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

| Outil | Version | Lien de téléchargement |
|-------|---------|------------------------|
| Node.js | 18 ou supérieur (LTS recommandé) | [nodejs.org](https://nodejs.org/) |
| npm | 9+ (inclus avec Node.js) | — |

> **Important** : le backend Spring Boot doit être lancé au préalable
> (voir le README du dépôt `geoportail-resina-backend`).
> Il démarre sur http://localhost:8080

## Installation et exécution

### 1. Cloner le projet

```bash
git clone https://github.com/K-Hamande/FrontEndGeoportail.git
cd geoportail-Resina-Frontend
```

### 2. Installer les dépendances

```bash
npm install
```

> Toutes les dépendances sont listées dans le fichier `package.json`
> et installées automatiquement dans le dossier `node_modules/`.
> Aucune installation manuelle n'est nécessaire.


```env
VITE_API_URL=http://localhost:8080
```

### 4. Lancer l'application en mode développement

```bash
npm run dev
```

L'application est accessible sur : **http://localhost:5173**

## Build de production

```bash
npm run build
```

Les fichiers optimisés sont générés dans le dossier `dist/`,
prêts à être déployés sur un serveur web.

Pour prévisualiser le build localement :

```bash
npm run preview
```

## Structure du projet

```
geoportail-Resina-Frontend/
├── public/                  # Fichiers statiques
├── src/
│   ├── assets/              # Images, icônes, ressources
│   ├── backoffice/          # Module d'administration (backoffice)
│   ├── decideur/            # Module décideur (géoportail)
│   ├── shared/              # Composants et utilitaires partagés
│   ├── App.jsx              # Composant racine
│   ├── App.css
│   ├── index.css
│   └── main.jsx             # Point d'entrée de l'application
├── index.html
├── vite.config.js           # Configuration Vite
├── package.json             # Dépendances npm
└── README.md
```

## Auteur

**ANPTIC** - Agence Nationale de Promotion des TIC (Burkina Faso)

---

*Projet : Geoportail RESINA - Frontend*