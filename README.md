# 📅 EDT IUT Blagnac - Emploi du Temps

Application web pour consulter les emplois du temps de l'IUT de Blagnac.

## 🎯 Présentation

Application complète avec backend API et frontend React pour afficher les emplois du temps des départements CS, GIM, INFO et RT.
## Accès rapide
edt.xenox.fr

**Fonctionnalités** :
- ✅ Consultation des emplois du temps par département, année et groupe
- ✅ Filtrage par groupes TD/TP
- ✅ Vue hebdomadaire avec 1, 3 ou 5 jours
- ✅ Profils personnalisés (sauvegarde des préférences)
- ✅ Mode sombre/clair
- ✅ Interface responsive (mobile + desktop)
- ✅ Téléchargement automatique depuis flOpEDT

## 🏗️ Architecture

```
┌─────────────────┐
│  flOpEDT API    │  https://flopedt.iut-blagnac.fr
└────────┬────────┘
         │ fetch-weeks.js
         ↓
┌─────────────────┐
│   JSON files    │  data/weeks/{DEPT}/{YEAR}-W{WEEK}.json
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Express API    │  Port 8000 (Raspberry Pi)
└────────┬────────┘
         │ HTTP REST
         ↓
┌─────────────────┐
│  React Frontend │  Port 5173 (dev) / Nginx (prod)
└─────────────────┘
```

**Points clés** :
- Architecture **sans base de données** (fichiers JSON)
- Serveur API léger (~47 lignes)
- Frontend React avec TypeScript
- Données synchronisées quotidiennement via cron

## 📁 Structure du projet

```
edt-iut/
├── backend/              # API Express + scripts
│   ├── index.js          # Serveur API (47 lignes)
│   ├── scripts/
│   │   └── fetch-weeks.js    # Téléchargement des EDTs
│   ├── data/
│   │   └── weeks/        # Fichiers JSON par dept/semaine
│   ├── README.md         # Documentation backend
│   ├── DEVELOPER.md      # Doc développeur
│   └── docs-archive/     # Ancienne doc (version DB)
│
└── frontend/             # Application React
    ├── src/
    │   ├── pages/
    │   │   └── Timetable.tsx    # Page principale EDT
    │   ├── components/   # Composants UI (Radix)
    │   └── hooks/        # Hooks React (profiles, mobile)
    ├── package.json
    └── README.md
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone <repo-url>
cd edt-iut

# Backend
cd backend
npm install
node scripts/fetch-weeks.js --weeks=41-51 --year=2025 --depts=INFO,CS,GIM,RT
node index.js

# Frontend (dans un autre terminal)
cd ../frontend
npm install
npm run dev
```

### Accès

- **Backend API** : http://localhost:8000
- **Frontend** : http://localhost:5173

## 📚 Documentation

### Backend

- [`backend/README.md`](backend/README.md) - Documentation utilisateur complète
- [`backend/DEVELOPER.md`](backend/DEVELOPER.md) - Documentation développeur
- [`backend/COMMANDS.md`](backend/COMMANDS.md) - Commandes utiles

### Endpoints API

```
GET /api/depts                          # Liste des départements
GET /api/schedule/:dept/:year/:week    # EDT d'une semaine
```

Exemples :
```bash
curl http://localhost:8000/api/depts
curl http://localhost:8000/api/schedule/INFO/2025/41
```

## 🔧 Configuration Production (Raspberry Pi)

### Service systemd (backend)

```bash
sudo systemctl start edt-api
sudo systemctl status edt-api
sudo journalctl -u edt-api -f
```

### Cron (téléchargement automatique)

```cron
# Téléchargement quotidien à minuit
0 0 * * * cd /srv/.../backend && node scripts/fetch-weeks.js --weeks=1-53 --year=$(date +\%Y) --depts=INFO,CS,GIM,RT
```

### Reverse Proxy (Nginx)

Le backend tourne sur le port 8000 et est accessible via reverse proxy :
- **Public** : http://152.228.219.56:8000
- **Local** : http://10.0.0.2:8000

## 🎨 Frontend

### Technologies

- **Framework** : React 18 + TypeScript
- **Build** : Vite
- **UI** : Radix UI + Tailwind CSS
- **State** : React Hooks (useState, useEffect)
- **Responsive** : Mobile-first design

### Fonctionnalités clés

- **Filtrage intelligent** : Groupe TP → inclut TD parent + CM communs
- **Profils** : Sauvegarde des préférences (dept, année, groupe)
- **Vue adaptative** : 1/3/5 jours selon écran
- **Thème** : Mode sombre/clair
- **PWA ready** : Service Worker pour offline

## 📊 Format des données

### Structure JSON (flOpEDT)

```json
{
  "id": 521552,
  "room": { "name": "B105" },
  "start_time": 665,
  "day": "f",
  "course": {
    "groups": [{ "train_prog": "BUT1", "name": "2A" }],
    "module": {
      "name": "Développement Web",
      "abbrev": "DevWeb",
      "display": { "color_bg": "#ffeb3b" }
    },
    "type": "TP"
  },
  "tutor": "MDM"
}
```

### Hiérarchie des groupes

```
CE (Cours Entier)           → Tout le BUT2 (amphis)
  └── 1, 2, 3, 3A           → Groupes TD (~25 étudiants)
      └── 1A, 2A, 3A        → Groupes TP (~15 étudiants)
```

## 🐛 Dépannage

### Backend ne démarre pas

```bash
sudo systemctl status edt-api
sudo journalctl -u edt-api -n 50
pkill -f "node.*index.js"
```

### Cours manquants

```bash
# Vérifier les fichiers JSON
ls -lh backend/data/weeks/INFO/

# Re-télécharger
cd backend
node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025
```

### Frontend n'affiche rien

```bash
# Vérifier l'API
curl http://localhost:8000/api/schedule/INFO/2025/41

# Vérifier la console navigateur (F12)
# Chercher les logs "🔍 Filtering..."
```

## 📈 Historique

### Version actuelle (Octobre 2025)

**Architecture JSON** : Simplification majeure, suppression de la base de données.

### Ancienne version (Mars 2024 - Octobre 2025)

**Architecture DB** : Utilisation de MariaDB pour stocker les cours.  
Documentation archivée dans [`backend/docs-archive/`](backend/docs-archive/).

## 📞 Support

- **Logs backend** : `sudo journalctl -u edt-api -f`
- **Logs téléchargement** : `tail -f backend/sync.log`
- **Console frontend** : F12 dans le navigateur

## 📄 Licence

Interne IUT de Blagnac

---

**Développé avec ❤️ pour les étudiants de l'IUT de Blagnac**
