# 📅 BetterEDT IUT Blagnac - Emploi du Temps

Application web pour consulter les emplois du temps de l'IUT de Blagnac.

Accès à la version publique : [edt.xenox.fr](https://edt.xenox.fr/)

## 🎯 Présentation

Application complète avec backend API et frontend React pour afficher les emplois du temps des départements CS, GIM, INFO et RT.
 

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
         │ fetch-weeks-db.js
         ↓
┌─────────────────┐
│    MariaDB      │  schéma: department/week/course/…
└────────┬────────┘
         │ SQL
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
- Architecture **avec base de données** (MariaDB)
- Synchronisation flOpEDT → DB via script
- Frontend React avec TypeScript
- Données synchronisées périodiquement via cron

## 📁 Structure du projet

```
edt-iut/
├── backend/              # API Express + scripts
│   ├── index.js          # Serveur API (47 lignes)
│   ├── scripts/
│   │   └── fetch-weeks-db.js # Sync flOpEDT → MariaDB
│   ├── db.js             # Connexion MariaDB
│   ├── README.md         # Documentation backend
│   ├── DEVELOPER.md      # Doc développeur
│   └── docs-archive/     # Archives documentation
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
node scripts/fetch-weeks-db.js
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
0 0 * * * cd /srv/.../backend && node scripts/fetch-weeks-db.js
```

### Reverse Proxy (Nginx)

Le backend tourne sur le port 8000 et est accessible via reverse proxy :
- **Public** : (URL publique configurée)
- **Local** : (URL locale configurée)

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

## 📊 Données & base de données

Les cours sont stockés dans MariaDB (tables `department`, `week`, `course`, `room`, `module`, `tutor`, `group`, `course_group`).

Voir le schéma et l’usage des tables dans [backend/DB.md](backend/DB.md).

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
# Relancer une synchronisation DB
cd backend
node scripts/fetch-weeks-db.js
```

### Frontend n'affiche rien

```bash
# Vérifier l'API
curl http://localhost:8000/api/schedule/INFO/2025/41

# Vérifier la console navigateur (F12)
# Chercher les logs "🔍 Filtering..."
```

## 📈 Historique

### Version Passée (Novembre 2025)

**Architecture JSON** : Stockage des cours dans des fichiers JSON temporaires

### Version actuelle (Février 2026)

**Architecture DB** : Utilisation de MariaDB pour stocker les cours.

## 📞 Support

- **Logs backend** : `sudo journalctl -u edt-api -f`
- **Logs téléchargement** : `tail -f backend/sync.log`
- **Console frontend** : F12 dans le navigateur

## 📄 Licence

Interne IUT de Blagnac

---

**Développé avec ❤️ pour les étudiants de l'IUT de Blagnac**
