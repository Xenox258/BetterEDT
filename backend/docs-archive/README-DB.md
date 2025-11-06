# API Emploi du Temps - Guide d'utilisation

## 📋 Vue d'ensemble

Cette API REST permet de consulter les emplois du temps de l'IUT de Blagnac. Elle synchronise les données depuis l'API flOpEDT officielle et les expose via des endpoints simples.

## ⚡ Commandes essentielles (Quick Reference)

```bash
# Gestion du service API
sudo systemctl start edt-api       # Démarrer
sudo systemctl stop edt-api        # Arrêter
sudo systemctl restart edt-api     # Redémarrer
sudo systemctl status edt-api      # Statut

# Logs
sudo journalctl -u edt-api -f      # Logs en temps réel
tail -f backend.log                # Logs fichier

# Synchronisation manuelle
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO

# Tâches cron
crontab -l | grep sync.js          # Voir la config
tail -f sync.log                   # Logs de sync

# Tests rapides
curl http://localhost:8000/api/depts
curl "http://localhost:8000/api/free-rooms?dept=INFO&week=41&year=2025"
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- MariaDB 10.11+ (via Docker recommandé)
- Accès réseau à l'API flOpEDT : `https://flopedt.iut-blagnac.fr`

### Installation

```bash
cd backend
npm install
```

### Configuration

Les variables d'environnement peuvent être définies dans un fichier `.env` :

```env
# Base de données
DB_HOST=10.0.0.2
DB_USER=flopedt_user
DB_PASSWORD=edtpassword
DB_NAME=flopedt_db
DB_PORT=3306

# Serveur API
PORT=8000
HOST=0.0.0.0

# Source des données
SOURCE_BASE=https://flopedt.iut-blagnac.fr
```

### Initialisation de la base de données

```bash
# Créer la structure
mysql -h 10.0.0.2 -u flopedt_user -p < schema.sql

# Ou via Docker
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' < schema.sql
```

## 📊 Synchronisation des données

### Commande de base

```bash
node scripts/sync.js
```

### Options disponibles

| Option | Description | Exemple |
|--------|-------------|---------|
| `--depts` | Départements à synchroniser (séparés par virgules) | `--depts=INFO,CS` |
| `--weeks` | Semaines à synchroniser (range ou liste) | `--weeks=36` ou `--weeks=1-53` |
| `--year` | Année calendaire | `--year=2025` |
| `--clean` | Nettoyer avant insertion | `--clean=true` |
| `--debug` | Mode debug (affiche les requêtes) | `--debug=true` |
| `--base` | URL de base de l'API source | `--base=https://flopedt.iut-blagnac.fr` |

### Exemples d'utilisation

```bash
# Synchroniser INFO pour la semaine 36
node scripts/sync.js --depts=INFO --weeks=36 --year=2025

# Synchroniser tous les départements pour le semestre 1
node scripts/sync.js --weeks=1-26 --year=2025

# Synchroniser avec debug activé
node scripts/sync.js --depts=INFO --weeks=36 --debug=true

# Synchroniser sans nettoyer (mode incrémental)
node scripts/sync.js --clean=false
```

### Synchronisation automatique (Cron)

Une tâche cron est configurée pour synchroniser automatiquement les données **2 fois par jour** :
- 🌙 **00h00** (minuit) - Synchronisation nocturne
- 🕛 **12h00** (midi) - Synchronisation en milieu de journée

#### Gestion de la tâche cron

```bash
# Voir la tâche cron actuelle
crontab -l | grep sync.js

# Éditer les tâches cron
crontab -e

# Consulter les logs de synchronisation
tail -f /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log

# Tester manuellement la synchronisation
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO
```

#### Configuration cron actuelle

```cron
# Synchronisation EDT avec FlOpEDT - 2 fois par jour (minuit et midi)
0 0,12 * * * cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend && /usr/bin/node scripts/sync.js --weeks=1-53 --year=$(date +\%Y) --depts=INFO,CS,GIM,RT >> /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log 2>&1
```

## 🌐 API Endpoints

### Base URL

- **Production** : `http://152.228.219.56:8000`
- **Local (RPi)** : `http://10.0.0.2:8000`

### 1. Liste des départements

```http
GET /api/depts
```

**Réponse** :
```json
["CS", "GIM", "INFO", "RT"]
```

---

### 2. Liste des groupes

```http
GET /api/groups?dept=INFO&train_prog=BUT1
```

**Paramètres** :
- `dept` (requis) : Code du département (CS, GIM, INFO, RT)
- `train_prog` (optionnel) : Promotion (BUT1, BUT2, BUT3)

**Réponse** :
```json
["1", "1A", "1B", "2", "2A", "2B", "3", "3A", "3B", "4", "4A", "4B"]
```

---

### 3. Semaines disponibles

```http
GET /api/weeks?dept=INFO&year=2025
```

**Paramètres** :
- `dept` (requis) : Code du département
- `year` (requis) : Année calendaire

**Réponse** :
```json
[1, 2, 3, ..., 52, 53]
```

---

### 4. Emploi du temps (endpoint principal)

```http
GET /api/edt/all?dept=INFO&train_prog=BUT1&week=36&promo_year=2025&groups=1A,1B
```

**Paramètres** :
- `dept` (requis) : Code du département
- `week` (requis) : Numéro de semaine ISO (1-53)
- `promo_year` (requis) : Année calendaire
- `train_prog` (optionnel) : Filtre par promotion (BUT1/2/3)
- `groups` (optionnel) : Liste de groupes séparés par virgules

**Réponse** :
```json
[
  {
    "id": 123,
    "external_id": "flopedt-456",
    "dept": "INFO",
    "train_prog": "BUT1",
    "promo_year": 2025,
    "week": 36,
    "day": "mo",
    "start_time": 480,
    "end_time": 570,
    "course_type": "CM",
    "module_name": "Algorithmique",
    "module_abbrev": "ALGO",
    "tutor_username": "jdupont",
    "room_name": "B005",
    "display_color_bg": "#3b82f6",
    "display_color_txt": "#FFFFFF",
    "groups": ["1A", "1B"]
  }
]
```

**Format des horaires** :
- `start_time` / `end_time` : Minutes depuis minuit (480 = 08h00, 570 = 09h30)

**Codes des jours** :
- `mo` : Lundi
- `tu` : Mardi
- `we` : Mercredi
- `th` : Jeudi
- `fr` : Vendredi

---

## 🔧 Démarrage du serveur

### Mode développement

```bash
node index.js
```

### Mode production (Service systemd - RECOMMANDÉ)

Le service systemd est configuré pour démarrer automatiquement au boot du Raspberry Pi.

#### Gestion du service

```bash
# Démarrer le service
sudo systemctl start edt-api

# Arrêter le service
sudo systemctl stop edt-api

# Redémarrer le service (après modification du code)
sudo systemctl restart edt-api

# Voir le statut
sudo systemctl status edt-api

# Activer le démarrage automatique (déjà activé)
sudo systemctl enable edt-api

# Désactiver le démarrage automatique
sudo systemctl disable edt-api
```

#### Consulter les logs

```bash
# Logs en temps réel avec systemd
sudo journalctl -u edt-api -f

# Dernières 50 lignes
sudo journalctl -u edt-api -n 50

# Logs dans le fichier backend.log
tail -f backend.log
```

### Mode production alternatif (avec PM2)

```bash
# Démarrage
pm2 start index.js --name edt-api

# Redémarrage automatique au boot
pm2 startup
pm2 save

# Voir les logs
pm2 logs edt-api

# Redémarrer
pm2 restart edt-api
```

## 📝 Codes d'erreur

| Code | Description |
|------|-------------|
| 400 | Paramètres manquants ou invalides |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur (base de données, etc.) |

## 🐛 Dépannage

### La synchronisation échoue

```bash
# Vérifier la connexion à flOpEDT
curl https://flopedt.iut-blagnac.fr/fr/api/departments/

# Vérifier la connexion à la base de données
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' -e "SELECT 1"
```

### Le serveur ne démarre pas

```bash
# Vérifier le statut du service
sudo systemctl status edt-api

# Voir les erreurs dans les logs
sudo journalctl -u edt-api -n 50 --no-pager

# Port déjà utilisé - arrêter l'ancien processus
pkill -f "node.*index.js"
sudo systemctl restart edt-api

# Tester l'API manuellement
curl http://localhost:8000/api/depts
```

### Cours manquants dans l'API

```bash
# Vérifier le nombre de cours en base
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "
SELECT dept, train_prog, COUNT(*) as total 
FROM scheduled_course 
WHERE week=36 
GROUP BY dept, train_prog;
"

# Re-synchroniser
node scripts/sync.js --depts=INFO --weeks=36 --clean=true --debug=true
```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs : `pm2 logs edt-api`
2. Activer le mode debug : `node scripts/sync.js --debug=true`
3. Consulter la documentation développeur : [`DEVELOPER.md`](DEVELOPER.md )

## 📄 Licence

Interne IUT de Blagnac
