# API Emploi du Temps - Guide d'utilisation# API Emploi du Temps - Guide d'utilisation



## 📋 Vue d'ensemble## 📋 Vue d'ensemble



Cette API REST permet de consulter les emplois du temps de l'IUT de Blagnac. Elle sert directement les fichiers JSON téléchargés depuis l'API flOpEDT officielle, sans base de données.Cette API REST permet de consulter les emplois du temps de l'IUT de Blagnac. Elle synchronise les données depuis l'API flOpEDT officielle et les expose via des endpoints simples.



**Architecture simplifiée** : JSON files → API REST → Frontend## ⚡ Commandes essentielles (Quick Reference)



## ⚡ Commandes essentielles (Quick Reference)```bash

# Gestion du service API

```bashsudo systemctl start edt-api       # Démarrer

# Gestion du service APIsudo systemctl stop edt-api        # Arrêter

sudo systemctl start edt-api       # Démarrersudo systemctl restart edt-api     # Redémarrer

sudo systemctl stop edt-api        # Arrêtersudo systemctl status edt-api      # Statut

sudo systemctl restart edt-api     # Redémarrer

sudo systemctl status edt-api      # Statut# Logs

sudo journalctl -u edt-api -f      # Logs en temps réel

# Logstail -f backend.log                # Logs fichier

sudo journalctl -u edt-api -f      # Logs en temps réel

tail -f backend.log                # Logs fichier# Synchronisation manuelle

node scripts/sync.js --weeks=41 --year=2025 --depts=INFO

# Télécharger les emplois du temps

node scripts/fetch-weeks.js --weeks=41 --year=2025 --depts=INFO# Tâches cron

crontab -l | grep sync.js          # Voir la config

# Tests rapidestail -f sync.log                   # Logs de sync

curl http://localhost:8000/api/depts

curl http://localhost:8000/api/schedule/INFO/2025/41# Tests rapides

```curl http://localhost:8000/api/depts

curl "http://localhost:8000/api/free-rooms?dept=INFO&week=41&year=2025"

## 🚀 Démarrage rapide```



### Prérequis## 🚀 Démarrage rapide



- Node.js 20+### Prérequis

- Accès réseau à l'API flOpEDT : `https://flopedt.iut-blagnac.fr`

- Node.js 20+

### Installation- MariaDB 10.11+ (via Docker recommandé)

- Accès réseau à l'API flOpEDT : `https://flopedt.iut-blagnac.fr`

```bash

cd backend### Installation

npm install

``````bash

cd backend

### Configurationnpm install

```

Les variables d'environnement peuvent être définies dans un fichier `.env` :

### Configuration

```env

# Serveur APILes variables d'environnement peuvent être définies dans un fichier `.env` :

PORT=8000

HOST=<HOST>```env

# Base de données

# Source des donnéesDB_HOST=<DB_HOST>

SOURCE_BASE=https://flopedt.iut-blagnac.frDB_USER=flopedt_user

```DB_PASSWORD=<DB_PASSWORD>

DB_NAME=flopedt_db

## 📥 Téléchargement des donnéesDB_PORT=3306



### Script de téléchargement# Serveur API

PORT=8000

Le script `fetch-weeks.js` télécharge les emplois du temps depuis flOpEDT et les stocke dans `data/weeks/{DEPT}/{YEAR}-W{WEEK}.json`.HOST=<HOST>



### Commande de base# Source des données

SOURCE_BASE=https://flopedt.iut-blagnac.fr

```bash```

node scripts/fetch-weeks.js

```### Initialisation de la base de données



### Options disponibles```bash

# Créer la structure

| Option | Description | Exemple |mysql -h <DB_HOST> -u flopedt_user -p < schema.sql

|--------|-------------|---------|

| `--depts` | Départements à télécharger (séparés par virgules) | `--depts=INFO,CS` |# Ou via Docker

| `--weeks` | Semaines à télécharger (range ou liste) | `--weeks=41` ou `--weeks=38-51` |docker exec mariadb mariadb -u flopedt_user -p'<DB_PASSWORD>' < schema.sql

| `--year` | Année calendaire | `--year=2025` |```

| `--base` | URL de base de l'API source | `--base=https://flopedt.iut-blagnac.fr` |

## 📊 Synchronisation des données

### Exemples d'utilisation

### Commande de base

```bash

# Télécharger INFO pour la semaine 41```bash

node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025node scripts/sync.js

```

# Télécharger tous les départements pour le semestre 1

node scripts/fetch-weeks.js --weeks=1-26 --year=2025 --depts=INFO,CS,GIM,RT### Options disponibles



# Télécharger plusieurs semaines| Option | Description | Exemple |

node scripts/fetch-weeks.js --depts=INFO --weeks=38-51 --year=2025|--------|-------------|---------|

```| `--depts` | Départements à synchroniser (séparés par virgules) | `--depts=INFO,CS` |

| `--weeks` | Semaines à synchroniser (range ou liste) | `--weeks=36` ou `--weeks=1-53` |

### Structure des fichiers| `--year` | Année calendaire | `--year=2025` |

| `--clean` | Nettoyer avant insertion | `--clean=true` |

```| `--debug` | Mode debug (affiche les requêtes) | `--debug=true` |

backend/| `--base` | URL de base de l'API source | `--base=https://flopedt.iut-blagnac.fr` |

  data/

    weeks/### Exemples d'utilisation

      INFO/

        2025-W41.json    # Semaine 41 de 2025 pour INFO```bash

        2025-W42.json# Synchroniser INFO pour la semaine 36

        ...node scripts/sync.js --depts=INFO --weeks=36 --year=2025

      CS/

        2025-W41.json# Synchroniser tous les départements pour le semestre 1

        ...node scripts/sync.js --weeks=1-26 --year=2025

      GIM/

      RT/# Synchroniser avec debug activé

```node scripts/sync.js --depts=INFO --weeks=36 --debug=true



### Format des fichiers JSON# Synchroniser sans nettoyer (mode incrémental)

node scripts/sync.js --clean=false

Chaque fichier contient un tableau de cours au format flOpEDT :```



```json### Synchronisation automatique (Cron)

[

  {Une tâche cron est configurée pour synchroniser automatiquement les données **2 fois par jour** :

    "id": 521552,- 🌙 **00h00** (minuit) - Synchronisation nocturne

    "room": {- 🕛 **12h00** (midi) - Synchronisation en milieu de journée

      "id": 28,

      "name": "B105"#### Gestion de la tâche cron

    },

    "start_time": 665,```bash

    "day": "f",# Voir la tâche cron actuelle

    "course": {crontab -l | grep sync.js

      "groups": [

        {# Éditer les tâches cron

          "train_prog": "BUT1",crontab -e

          "name": "2A",

          "is_structural": true# Consulter les logs de synchronisation

        }tail -f /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log

      ],

      "module": {# Tester manuellement la synchronisation

        "name": "Développement Web",cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend

        "abbrev": "DevWeb",node scripts/sync.js --weeks=41 --year=2025 --depts=INFO

        "display": {```

          "color_bg": "#ffeb3b",

          "color_txt": "#000000"#### Configuration cron actuelle

        }

      },```cron

      "type": "TP"# Synchronisation EDT avec FlOpEDT - 2 fois par jour (minuit et midi)

    },0 0,12 * * * cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend && /usr/bin/node scripts/sync.js --weeks=1-53 --year=$(date +\%Y) --depts=INFO,CS,GIM,RT >> /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log 2>&1

    "tutor": "MDM"```

  }

]## 🌐 API Endpoints

```

### Base URL

**Champs importants** :

- `id` : Identifiant unique du cours- **Production** : `<PUBLIC_API_URL>`

- `day` : Jour de la semaine (`m`, `tu`, `w`, `th`, `f`)- **Local (RPi)** : `<LOCAL_API_URL>`

- `start_time` : Heure de début en minutes depuis minuit (665 = 11h05)

- `course.type` : Type de cours (`CM`, `TD`, `TP`)### 1. Liste des départements

- `course.groups[].train_prog` : Promotion (`BUT1`, `BUT2`, `BUT3`)

- `course.groups[].name` : Nom du groupe (`1`, `2A`, `3A`, `CE`, etc.)```http

GET /api/depts

## 🌐 API Endpoints```



### Base URL**Réponse** :

```json

- **Production** : `<PUBLIC_API_URL>`["CS", "GIM", "INFO", "RT"]

- **Local (RPi)** : `<LOCAL_API_URL>````



### 1. Liste des départements---



```http### 2. Liste des groupes

GET /api/depts

``````http

GET /api/groups?dept=INFO&train_prog=BUT1

**Réponse** :```

```json

["CS", "GIM", "INFO", "RT"]**Paramètres** :

```- `dept` (requis) : Code du département (CS, GIM, INFO, RT)

- `train_prog` (optionnel) : Promotion (BUT1, BUT2, BUT3)

---

**Réponse** :

### 2. Emploi du temps d'une semaine (endpoint principal)```json

["1", "1A", "1B", "2", "2A", "2B", "3", "3A", "3B", "4", "4A", "4B"]

```http```

GET /api/schedule/:dept/:year/:week

```---



**Paramètres** :### 3. Semaines disponibles

- `dept` : Code du département (CS, GIM, INFO, RT)

- `year` : Année calendaire (2025)```http

- `week` : Numéro de semaine ISO (1-53)GET /api/weeks?dept=INFO&year=2025

```

**Exemple** :

```http**Paramètres** :

GET /api/schedule/INFO/2025/41- `dept` (requis) : Code du département

```- `year` (requis) : Année calendaire



**Réponse** : Retourne le contenu du fichier JSON correspondant (format flOpEDT)**Réponse** :

```json

```json[1, 2, 3, ..., 52, 53]

[```

  {

    "id": 521552,---

    "room": { "id": 28, "name": "B105" },

    "start_time": 665,### 4. Emploi du temps (endpoint principal)

    "day": "f",

    "course": {```http

      "groups": [{ "train_prog": "BUT1", "name": "2A" }],GET /api/edt/all?dept=INFO&train_prog=BUT1&week=36&promo_year=2025&groups=1A,1B

      "module": {```

        "name": "Développement Web",

        "abbrev": "DevWeb",**Paramètres** :

        "display": { "color_bg": "#ffeb3b", "color_txt": "#000000" }- `dept` (requis) : Code du département

      },- `week` (requis) : Numéro de semaine ISO (1-53)

      "type": "TP"- `promo_year` (requis) : Année calendaire

    },- `train_prog` (optionnel) : Filtre par promotion (BUT1/2/3)

    "tutor": "MDM"- `groups` (optionnel) : Liste de groupes séparés par virgules

  }

]**Réponse** :

``````json

[

**Codes d'erreur** :  {

- `400` : Paramètres invalides    "id": 123,

- `404` : Fichier non trouvé (semaine non téléchargée)    "external_id": "flopedt-456",

- `500` : Erreur serveur    "dept": "INFO",

    "train_prog": "BUT1",

---    "promo_year": 2025,

    "week": 36,

## 🔧 Démarrage du serveur    "day": "mo",

    "start_time": 480,

### Mode développement    "end_time": 570,

    "course_type": "CM",

```bash    "module_name": "Algorithmique",

node index.js    "module_abbrev": "ALGO",

```    "tutor_username": "jdupont",

    "room_name": "B005",

### Mode production (Service systemd - RECOMMANDÉ)    "display_color_bg": "#3b82f6",

    "display_color_txt": "#FFFFFF",

Le service systemd est configuré pour démarrer automatiquement au boot du Raspberry Pi.    "groups": ["1A", "1B"]

  }

#### Gestion du service]

```

```bash

# Démarrer le service**Format des horaires** :

sudo systemctl start edt-api- `start_time` / `end_time` : Minutes depuis minuit (480 = 08h00, 570 = 09h30)



# Arrêter le service**Codes des jours** :

sudo systemctl stop edt-api- `mo` : Lundi

- `tu` : Mardi

# Redémarrer le service (après modification du code)- `we` : Mercredi

sudo systemctl restart edt-api- `th` : Jeudi

- `fr` : Vendredi

# Voir le statut

sudo systemctl status edt-api---



# Activer le démarrage automatique (déjà activé)## 🔧 Démarrage du serveur

sudo systemctl enable edt-api

### Mode développement

# Désactiver le démarrage automatique

sudo systemctl disable edt-api```bash

```node index.js

```

#### Consulter les logs

### Mode production (Service systemd - RECOMMANDÉ)

```bash

# Logs en temps réel avec systemdLe service systemd est configuré pour démarrer automatiquement au boot du Raspberry Pi.

sudo journalctl -u edt-api -f

#### Gestion du service

# Dernières 50 lignes

sudo journalctl -u edt-api -n 50```bash

# Démarrer le service

# Logs dans le fichier backend.logsudo systemctl start edt-api

tail -f backend.log

```# Arrêter le service

sudo systemctl stop edt-api

## 🔄 Mise à jour automatique des données

# Redémarrer le service (après modification du code)

### Configuration recommandée (Cron)sudo systemctl restart edt-api



Pour maintenir les données à jour, configurez une tâche cron qui télécharge les emplois du temps régulièrement :# Voir le statut

sudo systemctl status edt-api

```bash

# Éditer les tâches cron# Activer le démarrage automatique (déjà activé)

crontab -esudo systemctl enable edt-api

```

# Désactiver le démarrage automatique

Ajouter cette ligne pour télécharger tous les soirs à minuit :sudo systemctl disable edt-api

```

```cron

# Téléchargement EDT - chaque jour à minuit#### Consulter les logs

0 0 * * * cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend && /usr/bin/node scripts/fetch-weeks.js --weeks=1-53 --year=$(date +\%Y) --depts=INFO,CS,GIM,RT >> /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log 2>&1

``````bash

# Logs en temps réel avec systemd

### Vérifier les téléchargementssudo journalctl -u edt-api -f



```bash# Dernières 50 lignes

# Voir les fichiers téléchargéssudo journalctl -u edt-api -n 50

ls -lh data/weeks/INFO/

# Logs dans le fichier backend.log

# Compter les fichiers par départementtail -f backend.log

find data/weeks/ -name "*.json" | wc -l```



# Voir le contenu d'un fichier### Mode production alternatif (avec PM2)

cat data/weeks/INFO/2025-W41.json | jq '.' | less

``````bash

# Démarrage

## 📊 Structure des groupespm2 start index.js --name edt-api



### Types de cours et groupes# Redémarrage automatique au boot

pm2 startup

- **CM (Cours Magistral)** : Groupe `CE` (Cours Entier = tout le promo)pm2 save

- **TD (Travaux Dirigés)** : Groupes `1`, `2`, `3`, `3A` (groupes TD)

- **TP (Travaux Pratiques)** : Groupes `1A`, `1B`, `2A`, `2B`, `3A` (groupes TP)# Voir les logs

pm2 logs edt-api

### Hiérarchie des groupes

# Redémarrer

Pour BUT2 par exemple :pm2 restart edt-api

- **CE** : Tous les étudiants de BUT2 (amphis)```

- **1, 2, 3** : Groupes TD (environ 20-30 étudiants)

- **1A, 1B, 2A, 2B, 3A** : Groupes TP (environ 12-16 étudiants)## 📝 Codes d'erreur



**Note** : Un étudiant en groupe TP `3A` appartient aussi au groupe TD `3` et suit les CM communs `CE`.| Code | Description |

|------|-------------|

## 🐛 Dépannage| 400 | Paramètres manquants ou invalides |

| 404 | Ressource non trouvée |

### Le téléchargement échoue| 500 | Erreur serveur (base de données, etc.) |



```bash## 🐛 Dépannage

# Vérifier la connexion à flOpEDT

curl https://flopedt.iut-blagnac.fr/en/api/fetch/departments/### La synchronisation échoue



# Tester un téléchargement manuel```bash

curl "https://flopedt.iut-blagnac.fr/en/api/fetch/scheduledcourses/?dept=INFO&year=2025&week=41" | jq '.'# Vérifier la connexion à flOpEDT

```curl https://flopedt.iut-blagnac.fr/fr/api/departments/



### Le serveur ne démarre pas# Vérifier la connexion à la base de données

docker exec mariadb mariadb -u flopedt_user -p'<DB_PASSWORD>' -e "SELECT 1"

```bash```

# Vérifier le statut du service

sudo systemctl status edt-api### Le serveur ne démarre pas



# Voir les erreurs dans les logs```bash

sudo journalctl -u edt-api -n 50 --no-pager# Vérifier le statut du service

sudo systemctl status edt-api

# Port déjà utilisé - arrêter l'ancien processus

pkill -f "node.*index.js"# Voir les erreurs dans les logs

sudo systemctl restart edt-apisudo journalctl -u edt-api -n 50 --no-pager



# Tester l'API manuellement# Port déjà utilisé - arrêter l'ancien processus

curl http://localhost:8000/api/deptspkill -f "node.*index.js"

```sudo systemctl restart edt-api



### Fichier non trouvé (404)# Tester l'API manuellement

curl http://localhost:8000/api/depts

```bash```

# Vérifier que le fichier existe

ls -la data/weeks/INFO/2025-W41.json### Cours manquants dans l'API



# Télécharger la semaine manquante```bash

node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025# Vérifier le nombre de cours en base

docker exec mariadb mariadb -u flopedt_user -p'<DB_PASSWORD>' flopedt_db -e "

# Vérifier les permissionsSELECT dept, train_prog, COUNT(*) as total 

chmod 644 data/weeks/INFO/*.jsonFROM scheduled_course 

```WHERE week=36 

GROUP BY dept, train_prog;

### Cours manquants"



Si des cours manquent dans le frontend, vérifiez :# Re-synchroniser

node scripts/sync.js --depts=INFO --weeks=36 --clean=true --debug=true

1. **Le fichier JSON est complet** :```

```bash

cat data/weeks/INFO/2025-W41.json | jq 'length'  # Nombre de cours## 📞 Support

```

Pour toute question ou problème :

2. **Le filtre de groupe inclut les cours communs** :1. Vérifier les logs : `pm2 logs edt-api`

   - Un étudiant en `3A` doit voir les cours du groupe `3` (TD) et `CE` (CM)2. Activer le mode debug : `node scripts/sync.js --debug=true`

   - Le frontend gère automatiquement cette logique3. Consulter la documentation développeur : [`DEVELOPER.md`](DEVELOPER.md )



3. **Re-télécharger les données** :## 📄 Licence

```bash

node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025Interne IUT de Blagnac

```

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs : `sudo journalctl -u edt-api -f`
2. Consulter la documentation développeur : [`DEVELOPER.md`](DEVELOPER.md)
3. Vérifier les fichiers JSON : `ls -lh data/weeks/`

## 📄 Archives

L'ancienne documentation basée sur MariaDB est disponible dans le dossier [`docs-archive/`](docs-archive/).

## 📄 Licence

Interne IUT de Blagnac
