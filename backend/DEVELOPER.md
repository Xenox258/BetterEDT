# API Emploi du Temps - Documentation développeur

## 🏗️ Architecture

### Vue d'ensemble

```
flOpEDT API (source)
      ↓
fetch-weeks.js (téléchargement)
      ↓
data/weeks/{DEPT}/{YEAR}-W{WEEK}.json (stockage)
      ↓
index.js (API Express)
      ↓
Frontend React (consommation)
```

**Principe** : Architecture sans base de données. Les fichiers JSON téléchargés servent directement de source de données pour l'API.

### Avantages de cette architecture

✅ **Simplicité** : Pas de base de données à installer ou à gérer.
✅ **Performance** : La lecture de fichiers locaux est extrêmement rapide.
✅ **Fiabilité** : Moins de points de défaillance (pas de connexion à une base de données).
✅ **Maintenance** : Le code de l'API est minimaliste et facile à comprendre.
✅ **Portabilité** : Le projet fonctionne partout où Node.js est installé, sans dépendances externes.

## 📁 Structure du projet

```
backend/
├── index.js              # Serveur API Express (sert les fichiers JSON)
├── package.json          # Dépendances Node.js
├── DEVELOPER.md          # Cette documentation
│
├── scripts/
│   └── fetch-weeks.js    # Script qui télécharge les emplois du temps en JSON
│
├── data/
│   └── weeks/            # Dossier contenant les données des emplois du temps
│       ├── INFO/         # Fichiers JSON par semaine pour le département INFO
│       ├── CS/
│       ├── GIM/
│       └── RT/
│
└── logs/
    └── sync.log          # Fichier de log pour le script fetch-weeks.js
```

## 🔧 Code principal

### `index.js` - Serveur API

Le serveur est extrêmement simple (~47 lignes). Son rôle est de lire le fichier JSON correspondant à la requête et de le renvoyer.

```javascript
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
// ...

// Endpoint pour l'emploi du temps d'une semaine
app.get('/api/schedule/:dept/:year/:week', (req, res) => {
  const { dept, year, week } = req.params;

  // Validation simple des paramètres
  if (!['CS', 'GIM', 'INFO', 'RT'].includes(dept)) {
    return res.status(400).json({ error: 'Invalid dept' });
  }
  
  // Construction du chemin vers le fichier
  const filePath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${week}.json`);

  try {
    // Lecture et envoi du fichier
    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Fichier non trouvé
      res.status(404).json({ error: 'Week not found' });
    } else {
      // Autre erreur
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ...
```
**Points clés** :
- Aucune dépendance à une base de données.
- Validation des paramètres (`dept`, `week`).
- Lecture synchrone des fichiers, ce qui est acceptable pour des fichiers de petite taille.
- Gestion d'erreurs pour les fichiers non trouvés (404) ou autres problèmes (500).

### `scripts/fetch-weeks.js` - Téléchargement des données

Ce script est le cœur du système. Il se connecte à l'API de flOpEDT, télécharge les données des semaines demandées et les sauvegarde localement.

```javascript
const API_BASE = 'https://flopedt.iut-blagnac.fr';

// Pour chaque département, année, et semaine...
const url = `${API_BASE}/en/api/fetch/scheduledcourses/?dept=${dept}&year=${year}&week=${week}`;
const response = await fetch(url);
const data = await response.json();

// Sauvegarde dans le fichier correspondant
const filePath = `data/weeks/${dept}/${year}-W${week}.json`;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
```
**Avantages** :
- Téléchargement direct depuis la source de données officielle.
- Aucune transformation, le format JSON original est conservé.
- Le script est incrémental et ne re-télécharge pas les fichiers déjà existants (sauf si l'option `--force` est utilisée).

## 📊 Format des données (flOpEDT)

La structure des données est celle fournie par l'API de flOpEDT.

### Structure d'un cours

```typescript
interface Course {
  id: number;                    // ID unique du cours
  room: {
    id: number;
    name: string;                // "B105", "Amphi A", etc.
  };
  start_time: number;            // Minutes depuis minuit (ex: 480 pour 08h00)
  day: string;                   // "m", "tu", "w", "th", "f"
  course: {
    groups: Array<{
      train_prog: string;        // "BUT1", "BUT2", "BUT3"
      name: string;              // "1A", "2", "CE", etc.
      is_structural: boolean;
    }>;
    module: {
      name: string;              // "Développement Web"
      abbrev: string;            // "DevWeb"
      display: {
        color_bg: string;        // "#ffeb3b"
        color_txt: string;       // "#000000"
      };
    };
    type: string;                // "CM", "TD", "TP"
  };
  tutor: string;                 // Username de l'enseignant
}
```

## 🔄 Workflow de développement

### Développement local

```bash
# 1. Télécharger les données pour une semaine spécifique
node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025

# 2. Démarrer le serveur API
node index.js

# 3. Tester l'API avec curl
curl http://localhost:8000/api/schedule/INFO/2025/41
```

### Déploiement

Le déploiement se fait via un `git pull` sur le serveur, suivi du redémarrage du service qui exécute `index.js`.

```bash
# 1. Mettre à jour le code sur le serveur
git pull origin main

# 2. Télécharger les nouvelles semaines si nécessaire
node scripts/fetch-weeks.js --weeks=42-51 --year=2025

# 3. Redémarrer le service (exemple avec systemd)
sudo systemctl restart edt-api
```

## 🔐 Sécurité

### Validation des entrées

Les paramètres de l'URL (`dept`, `week`) sont validés pour s'assurer qu'ils correspondent à des valeurs attendues et éviter des erreurs.

### Prévention du Path Traversal

L'utilisation de `path.join` avec `__dirname` garantit que le chemin du fichier construit reste dans le dossier `data/` prévu, empêchant un utilisateur malveillant de lire des fichiers sensibles sur le serveur.

```javascript
// ✅ SÉCURISÉ : Utilise path.join avec le répertoire du script
const filePath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${week}.json`);

// ❌ DANGEREUX : Une simple concaténation pourrait permettre le path traversal
// const filePath = `data/weeks/${dept}/${year}-W${week}.json`;
```
