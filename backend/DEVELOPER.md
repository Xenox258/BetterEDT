# Documentation Développeur - API EDT# API Emploi du Temps - Documentation développeur



## 🏗️ Architecture## 🏗️ Architecture



### Vue d'ensemble### Stack technique



```- **Runtime** : Node.js 20+ (ESM modules)

flopedt API (source)- **Framework** : Express.js 4.x

      ↓- **Base de données** : MariaDB 10.11+

fetch-weeks.js (download)- **ORM** : mysql2 (raw SQL)

      ↓- **API source** : flOpEDT REST API

data/weeks/{DEPT}/{YEAR}-W{WEEK}.json (storage)

      ↓### Structure du projet

index.js (Express API)

      ↓```

Frontend React (consumption)backend/

```├── db.js              # Configuration MySQL + pool de connexions

├── index.js           # Serveur Express + endpoints API

**Principe** : Architecture sans base de données, les fichiers JSON servent directement de source de données.├── schema.sql         # Schéma de base de données

├── package.json       # Dépendances Node.js

### Avantages de cette architecture└── scripts/

    └── sync.js        # Script de synchronisation flOpEDT → DB

✅ **Simplicité** : Pas de base de données à gérer  ```

✅ **Performance** : Lecture directe de fichiers  

✅ **Fiabilité** : Pas de synchronisation complexe  ---

✅ **Maintenance** : Code minimal (~47 lignes pour l'API)  

✅ **Portabilité** : Fonctionne partout (Node.js uniquement)  ## 🗄️ Schéma de base de données



## 📁 Structure du projet### Tables principales



```#### `scheduled_course`

backend/Cours planifiés (table centrale).

├── index.js              # Serveur API Express (JSON uniquement)

├── routes-db.js          # Anciens endpoints DB (archivé)| Colonne | Type | Description |

├── db.js                 # Connexion DB (archivé)|---------|------|-------------|

├── schema.sql            # Schéma DB (archivé)| `id` | INT PK | Clé primaire auto-incrémentée |

├── package.json| `external_id` | VARCHAR(255) UNIQUE | Identifiant unique (depuis API ou généré) |

├── README.md             # Documentation utilisateur (JSON)| `dept` | VARCHAR(10) | Code département (INFO, CS, GIM, RT) |

├── DEVELOPER.md          # Cette documentation| `train_prog` | VARCHAR(10) | Promotion (BUT1, BUT2, BUT3, CS1, etc.) |

├── COMMANDS.md           # Commandes utiles| `promo_year` | INT | Année calendaire (2025, 2026, etc.) |

│| `week` | INT | Semaine ISO (1-53) |

├── scripts/| `day` | VARCHAR(2) | Jour (mo, tu, we, th, fr) |

│   ├── fetch-weeks.js    # Télécharge les JSON depuis flOpEDT| `start_time` | INT | Heure de début (minutes depuis minuit) |

│   └── sync.js           # Ancien script de sync DB (archivé)| `end_time` | INT | Heure de fin (minutes depuis minuit) |

│| `type` | VARCHAR(50) | Type de cours (CM, TD, TP) |

├── data/| `module_id` | INT FK | Référence vers `module.id` |

│   └── weeks/| `room_id` | INT FK | Référence vers `room.id` |

│       ├── INFO/         # JSON par semaine pour INFO| `tutor_id` | INT FK | Référence vers `tutor.id` |

│       ├── CS/

│       ├── GIM/**Index** :

│       └── RT/- `idx_dept_week_year` : (dept, week, promo_year)

│- `idx_schedule_time` : (day, start_time, end_time)

└── docs-archive/         # Documentation de l'ancienne version DB- `idx_external_id` : (external_id) UNIQUE

    ├── README-DB.md

    └── DEVELOPER-DB.md---

```

#### `course_groups`

## 🔧 Code principalLiaison Many-to-Many entre cours et groupes.



### index.js - Serveur API| Colonne | Type | Description |

|---------|------|-------------|

Le serveur est extrêmement simple (~47 lignes) :| `course_id` | INT FK | Référence vers `scheduled_course.id` |

| `group_name` | VARCHAR(100) | Nom du groupe (1A, 2B, 3, etc.) |

```javascript

import express from 'express';**Clé primaire composite** : (course_id, group_name)  

import cors from 'cors';**Contrainte** : `ON DELETE CASCADE` → suppression du cours supprime les liaisons

import fs from 'fs';

import path from 'path';---

import { fileURLToPath } from 'url';

#### `group_hierarchy`

const __filename = fileURLToPath(import.meta.url);Hiérarchie parent-enfant des groupes.

const __dirname = path.dirname(__filename);

| Colonne | Type | Description |

const app = express();|---------|------|-------------|

const PORT = process.env.PORT || 8000;| `dept` | VARCHAR(10) | Département |

| `parent_group` | VARCHAR(100) | Groupe parent (ex: "1") |

app.use(cors());| `child_group` | VARCHAR(100) | Groupe enfant (ex: "1A") |

app.use(express.json());

Exemple :

// Liste des départements```

app.get('/api/depts', (req, res) => {dept=INFO, parent_group="1", child_group="1A"

  res.json(['CS', 'GIM', 'INFO', 'RT']);dept=INFO, parent_group="1", child_group="1B"

});```



// Emploi du temps d'une semaine---

app.get('/api/schedule/:dept/:year/:week', (req, res) => {

  const { dept, year, week } = req.params;#### `module`, `room`, `tutor`

  Tables de référence normalisées.

  // Validation

  if (!['CS', 'GIM', 'INFO', 'RT'].includes(dept)) {**Clé unique composite** : (dept, name) ou (dept, username)

    return res.status(400).json({ error: 'Invalid dept' });

  }---

  

  const weekNum = parseInt(week);## 🔄 Script de synchronisation (`sync.js`)

  if (isNaN(weekNum) || weekNum < 1 || weekNum > 53) {

    return res.status(400).json({ error: 'Invalid week' });### Flux de traitement

  }

  ```mermaid

  // Lire le fichier JSONgraph TD

  const filePath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${week}.json`);    A[Démarrage] --> B[Parse CLI args]

      B --> C[Pour chaque dept]

  try {    C --> D[Fetch groupes structurels]

    const data = fs.readFileSync(filePath, 'utf-8');    D --> E[Build group_hierarchy]

    res.json(JSON.parse(data));    E --> F[Pour chaque semaine]

  } catch (err) {    F --> G[Fetch cours BUT1/2/3]

    if (err.code === 'ENOENT') {    G --> H[Normaliser données]

      res.status(404).json({ error: 'Week not found' });    H --> I[Upsert module/room/tutor]

    } else {    I --> J[Insert scheduled_course]

      res.status(500).json({ error: 'Internal server error' });    J --> K[Insert course_groups]

    }    K --> F

  }    F --> L[Fin]

});```



app.listen(PORT, '0.0.0.0', () => {### Fonctions clés

  console.log(`API running on http://0.0.0.0:${PORT}`);

});#### `fetchScheduled(dept, week, year)`

```Récupère les cours depuis l'API flOpEDT.



**Points clés** :- Appelle `/fetch/scheduledcourses/` pour chaque promo (BUT1, BUT2, BUT3)

- Aucune dépendance à une base de données- Ajoute `_fetched_train_prog` à chaque cours pour traçabilité

- Validation simple des paramètres- Gère les erreurs 404/406 (train_prog invalide)

- Lecture synchrone des fichiers (acceptable pour des petits fichiers)

- Gestion d'erreurs basique (404, 400, 500)```javascript

const items = await fetchScheduled('INFO', 36, 2025);

### scripts/fetch-weeks.js - Téléchargement// [{ id: 123, day: 'mo', start_time: 480, _fetched_train_prog: 'BUT1', ... }]

```

Ce script télécharge les emplois du temps depuis flOpEDT :

---

```javascript

const API_BASE = 'https://flopedt.iut-blagnac.fr';#### `computeExternalId(dept, week, it)`

Génère un identifiant unique pour éviter les doublons.

// Pour chaque département, année, semaine

const url = `${API_BASE}/en/api/fetch/scheduledcourses/?dept=${dept}&year=${year}&week=${week}`;**Priorité** :

const response = await fetch(url);1. Utiliser `it.id` de l'API si présent → `flopedt-${it.id}`

const data = await response.json();2. Sinon, générer un hash stable : `gen-${hash}-${timestamp}`



// Sauvegarder dans un fichier**Champs pris en compte** :

const filePath = `data/weeks/${dept}/${year}-W${week}.json`;- dept, year, week, train_prog

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));- day, start_time, end_time

```- room, module, tutor, groups



**Avantages** :```javascript

- Téléchargement direct depuis la source officielleconst externalId = computeExternalId('INFO', 36, courseData);

- Pas de transformation des données// → "flopedt-12345" ou "gen-987654321-123456"

- Format JSON natif de flOpEDT conservé```

- Incrémental (ne re-télécharge pas les fichiers existants sauf si `--force`)

---

## 📊 Format des données flOpEDT

#### `saveScheduledBatch(conn, dept, week, year, groupsByPromo, allGroupsMap, items)`

### Structure d'un coursSauvegarde les cours en base de données.



```typescript**Transaction SQL** :

interface Course {1. `upsertModule()` → Crée/récupère l'ID du module

  id: number;                    // ID unique du cours2. `upsertRoom()` → Crée/récupère l'ID de la salle

  room: {3. `upsertTutor()` → Crée/récupère l'ID du tuteur

    id: number;4. `INSERT ... ON DUPLICATE KEY UPDATE` → Upsert du cours

    name: string;                // "B105", "Amphi A", etc.5. `INSERT IGNORE INTO course_groups` → Liaison cours-groupes

  };

  start_time: number;            // Minutes depuis minuit (480 = 08h00)**Clé d'upsert** : `external_id` (UNIQUE)

  day: string;                   // "m", "tu", "w", "th", "f"

  course: {---

    groups: Array<{

      train_prog: string;        // "BUT1", "BUT2", "BUT3"#### `buildGroupHierarchy(conn, dept)`

      name: string;              // "1A", "2", "CE", etc.Construit la table `group_hierarchy` depuis l'API `/groups/structural/tree/`.

      is_structural: boolean;

    }>;Exemple de structure :

    module: {```json

      name: string;              // "Développement Web"{

      abbrev: string;            // "DevWeb"  "name": "1",

      display: {  "children": [

        color_bg: string;        // "#ffeb3b"    { "name": "1A", "children": [] },

        color_txt: string;       // "#000000"    { "name": "1B", "children": [] }

      };  ]

    };}

    type: string;                // "CM", "TD", "TP"```

  };

  tutor: string;                 // Username du profGénère :

}```sql

```INSERT INTO group_hierarchy (dept, parent_group, child_group)

VALUES ('INFO', '1', '1A'), ('INFO', '1', '1B');

### Codes des jours```



| Code | Jour | Anglais |---

|------|------|---------|

| `m` | Lundi | Monday |### Gestion des erreurs

| `tu` | Mardi | Tuesday |

| `w` | Mercredi | Wednesday || Erreur | Cause | Solution |

| `th` | Jeudi | Thursday ||--------|-------|----------|

| `f` | Vendredi | Friday || 404 `/groups/` | Endpoint inexistant | Fallback vers `/groups/structural/` |

| 406 `Multiple training programme` | `train_prog` invalide | Utiliser codes spécifiques (CS1/CS2/CS3) |

### Horaires| Duplicate `external_id` | Hash collision | Ajouter timestamp dans `computeExternalId()` |



Les horaires sont en **minutes depuis minuit** :---

- `480` = 08h00

- `510` = 08h30## 🌐 API Express (`index.js`)

- `665` = 11h05

- `1080` = 18h00### Architecture des endpoints



**Conversion** :```javascript

```javascript// Pattern général

const hours = Math.floor(minutes / 60);app.get("/api/{resource}", async (req, res) => {

const mins = minutes % 60;  try {

const time = `${hours}:${mins.toString().padStart(2, '0')}`;    // 1. Validation des paramètres

```    if (!req.query.requiredParam) {

      return res.status(400).json({ error: "Missing param" });

## 🎯 Filtrage des cours (Frontend)    }

    

### Logique de filtrage par groupe    // 2. Requête SQL

    const [rows] = await pool.query(sql, params);

Le frontend applique une logique hiérarchique pour afficher les cours :    

    // 3. Transformation des données

```typescript    const result = rows.map(transformFunction);

// Exemple : étudiant en groupe "3A" (TP)    

const groupsToInclude = new Set(['3A']);  // Son groupe TP    // 4. Réponse JSON

groupsToInclude.add('3');                 // Son groupe TD parent    res.json(result);

groupsToInclude.add('CE');                // Cours communs (amphi)  } catch (e) {

    console.error(e);

// Filtre    res.status(500).json({ error: "Database error" });

const filteredCourses = courses.filter(course =>   }

  course.groups.some(g => groupsToInclude.has(g))});

);```

```

---

**Règle** :

- Groupe TP (ex: `3A`) → inclure TD parent (`3`) + cours communs (`CE`)### Endpoint critique : `/api/edt/all`

- Groupe TD (ex: `3`) → inclure cours communs (`CE`)

- `CE` (Cours Entier) → cours communs à toute la promo#### Logique de filtrage des groupes



### Types de groupesLe filtre groupe utilise une **logique hiérarchique** :



| Type | Format | Exemples | Description |```sql

|------|--------|----------|-------------|-- Un cours est inclus si :

| TP | `[0-9]+[A-Z]` | `1A`, `2B`, `3A` | Groupes de TP (~15 étudiants) |-- 1. Il est pour un groupe exact demandé (ex: "1A")

| TD | `[0-9]+` | `1`, `2`, `3` | Groupes de TD (~25 étudiants) |-- 2. OU il est pour un parent du groupe demandé (ex: "1" si on demande "1A")

| Amphi | `CE` | `CE` | Cours Entier (toute la promo) |-- 3. OU il est pour un enfant du groupe demandé (ex: "1A"/"1B" si on demande "1")



## 🔄 Workflow de développementWHERE EXISTS (

  SELECT 1 FROM course_groups cg2

### Développement local  WHERE cg2.course_id = sc.id 

  AND (

```bash    cg2.group_name IN (?) -- Exact match

# 1. Télécharger les données    OR EXISTS (

node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025      SELECT 1 FROM group_hierarchy gh

      WHERE gh.dept = sc.dept

# 2. Démarrer l'API      AND (

node index.js        (gh.parent_group IN (?) AND cg2.group_name = gh.child_group) -- Parent→Child

        OR (gh.child_group IN (?) AND cg2.group_name = gh.parent_group) -- Child→Parent

# 3. Tester      )

curl http://localhost:8000/api/schedule/INFO/2025/41    )

```  )

)

### Déploiement sur Raspberry Pi```



```bash**Exemple** :

# 1. Pousser le code- Requête : `?groups=1A`

git push origin main- Cours inclus :

  - Cours avec groupe "1A" (exact)

# 2. Sur le RPi : pull  - Cours avec groupe "1" (parent de 1A)

cd /srv/.../backend  - Cours sans groupe (amphi commun)

git pull

---

# 3. Télécharger les nouvelles semaines

node scripts/fetch-weeks.js --weeks=41-51 --year=2025 --depts=INFO,CS,GIM,RT### Fonctions utilitaires



# 4. Redémarrer le service#### `colorFor(name, light = false)`

sudo systemctl restart edt-apiGénère une couleur HSL stable depuis un nom.



# 5. Vérifier```javascript

sudo journalctl -u edt-api -fcolorFor("ALGO") // → "hsl(234 55% 42%)"

curl http://localhost:8000/api/deptscolorFor("ALGO", true) // → "hsl(234 55% 88%)"

``````



### Tests**Algorithme** :

1. Somme des codes ASCII du nom

```bash2. Modulo 360 → Teinte (H)

# Liste des départements3. Saturation fixe : 55%

curl http://localhost:8000/api/depts4. Luminosité : 42% (foncé) ou 88% (clair)



# EDT d'une semaine---

curl http://localhost:8000/api/schedule/INFO/2025/41 | jq '.'

#### `dayLetter(dbDay)`

# Compter les coursConvertit le code jour DB vers la notation française.

curl -s http://localhost:8000/api/schedule/INFO/2025/41 | jq 'length'

```javascript

# Groupes uniquesdayLetter("mo") // → "l" (lundi)

curl -s http://localhost:8000/api/schedule/INFO/2025/41 | jq '[.[].course.groups[].name] | unique'dayLetter("fr") // → "v" (vendredi)

```

# Cours d'un groupe spécifique

curl -s http://localhost:8000/api/schedule/INFO/2025/41 | jq '[.[] | select(.course.groups[].name == "3A")]'---

```

## 🔐 Configuration réseau

## 🚀 Performance

### Architecture WireGuard

### Optimisations actuelles

```

✅ Lecture synchrone acceptable (fichiers < 100KB)  Internet ←→ VPS (152.228.219.56) ←→ WireGuard ←→ RPi (10.0.0.2)

✅ Pas de base de données = pas de latence réseau                      ↓                                    ↓

✅ Fichiers JSON en cache système                  Nginx proxy                      Backend :8000

✅ CORS activé pour tous les domaines                  Port 8000                        MariaDB :3306

```

### Optimisations futures possibles

### Bind sur WireGuard

🔄 **Cache en mémoire** : Garder les fichiers JSON en mémoire  

```javascript```javascript

const cache = new Map();const host = process.env.HOST ?? '0.0.0.0';

app.listen(port, host, () => console.log(`API listening on ${host}:${port}`));

app.get('/api/schedule/:dept/:year/:week', (req, res) => {```

  const key = `${dept}-${year}-${week}`;

  **Important** : Bind sur `0.0.0.0` pour accepter les connexions depuis WireGuard.

  if (cache.has(key)) {

    return res.json(cache.get(key));---

  }

  ## 🧪 Tests et debugging

  const data = JSON.parse(fs.readFileSync(filePath));

  cache.set(key, data);### Test des endpoints

  res.json(data);

});```bash

```# Sanity check

curl http://10.0.0.2:8000/api/depts

🔄 **Compression** : Activer gzip pour réduire la taille des réponses  

```javascript# Test avec filtres

import compression from 'compression';curl "http://10.0.0.2:8000/api/edt/all?dept=INFO&train_prog=BUT1&week=36&year=2025&groups=1A" | jq

app.use(compression());

```# Compter les résultats

curl "..." | jq 'length'

🔄 **ETags** : Cache HTTP pour éviter les re-téléchargements  

```javascript# Extraire un champ

app.set('etag', 'strong');curl "..." | jq '.[].module_abbrev'

``````



## 🐛 Debugging---



### Logs importants### Debugging SQL



```bashActiver les logs MySQL :

# Logs API

sudo journalctl -u edt-api -f```javascript

// Dans db.js (temporaire)

# Logs téléchargementexport const pool = mysql.createPool({

tail -f sync.log  ...DB_CONFIG,

  debug: true // ⚠️ Ne pas commit en production

# Tester un fichier JSON});

cat data/weeks/INFO/2025-W41.json | jq '.' | less```

```

---

### Problèmes courants

### Vérifier les doublons

#### 404 - Fichier non trouvé

```bash```sql

# Vérifier que le fichier existe-- Doublons d'external_id

ls -la data/weeks/INFO/2025-W41.jsonSELECT external_id, COUNT(*) as cnt 

FROM scheduled_course 

# Télécharger la semaineGROUP BY external_id 

node scripts/fetch-weeks.js --depts=INFO --weeks=41 --year=2025HAVING cnt > 1;

```

-- Cours sans groupes

#### Cours manquants dans le frontendSELECT sc.id, sc.module_id, 

```bash       (SELECT COUNT(*) FROM course_groups WHERE course_id = sc.id) as grp_count

# Compter les cours dans le JSONFROM scheduled_course sc

cat data/weeks/INFO/2025-W41.json | jq 'length'WHERE grp_count = 0;

```

# Vérifier les groupes

cat data/weeks/INFO/2025-W41.json | jq '[.[].course.groups[].name] | unique'---



# Vérifier le filtrage frontend (console navigateur)## 🚀 Performance

# Chercher les logs "🔍 Filtering..."

```### Index critiques



#### API ne répond pas```sql

```bash-- Pour les requêtes par semaine

# Vérifier le serviceCREATE INDEX idx_dept_week_year ON scheduled_course(dept, week, promo_year);

sudo systemctl status edt-api

-- Pour les jointures

# Port déjà utiliséCREATE INDEX idx_course_id ON course_groups(course_id);

sudo lsof -i :8000CREATE INDEX idx_group_name ON course_groups(group_name);

pkill -f "node.*index.js"```

```

### Pool de connexions

## 📦 Dépendances

```javascript

```jsonconnectionLimit: 10 // Ajuster selon la charge

{```

  "dependencies": {

    "express": "^4.18.2",**Monitoring** :

    "cors": "^2.8.5"```javascript

  }pool.on('connection', (conn) => console.log('New connection', conn.threadId));

}pool.on('release', (conn) => console.log('Release connection', conn.threadId));

``````



**Note** : Version minimale, pas de base de données !---



## 📖 Références## 🐛 Points d'attention



- **API flOpEDT** : https://flopedt.iut-blagnac.fr/en/api/fetch/scheduledcourses/### 1. Collision d'`external_id`

- **Documentation flOpEDT** : https://github.com/FlOpEDT/FlOpEDT

- **Express.js** : https://expressjs.com/**Symptôme** : Cours manquants après sync.



## 🔐 Sécurité**Cause** : Deux cours différents génèrent le même hash.



### Validation des entrées**Solution** : Ajouter un timestamp dans `computeExternalId()`.



```javascript---

// Départements en whitelist

const VALID_DEPTS = ['CS', 'GIM', 'INFO', 'RT'];### 2. Cours en amphi non visibles

if (!VALID_DEPTS.includes(dept)) {

  return res.status(400).json({ error: 'Invalid dept' });**Symptôme** : Cours communs (sans groupes) absents des filtres.

}

**Cause** : SQL `EXISTS` trop restrictif.

// Validation des semaines

const week = parseInt(req.params.week);**Solution** : Inclure explicitement les cours sans groupes.

if (isNaN(week) || week < 1 || week > 53) {

  return res.status(400).json({ error: 'Invalid week' });```sql

}WHERE (

```  NOT EXISTS (SELECT 1 FROM course_groups WHERE course_id = sc.id)

  OR EXISTS (SELECT 1 FROM course_groups WHERE course_id = sc.id AND ...)

### Path traversal)

```

```javascript

// ✅ SÉCURISÉ : Utilise path.join avec __dirname---

const filePath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${week}.json`);

### 3. train_prog NULL

// ❌ DANGEREUX : Concaténation de strings

// const filePath = `data/weeks/${dept}/${year}-W${week}.json`;**Symptôme** : Cours avec `train_prog = NULL` affichés dans tous les filtres.

```

**Cause** : `promoOfGroup()` échoue à deviner la promo.

## 📄 Licence

**Solution** : Utiliser `_fetched_train_prog` ajouté par `fetchScheduled()`.

Interne IUT de Blagnac

---

## 📦 Déploiement

### PM2 Ecosystem

Créer `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'edt-api',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8000,
      HOST: '0.0.0.0'
    },
    error_file: '/var/log/edt-api-error.log',
    out_file: '/var/log/edt-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Commandes :
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Nginx reverse proxy

```nginx
server {
    listen 8000;
    server_name 152.228.219.56;
    
    location / {
        proxy_pass http://10.0.0.2:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts pour requêtes longues (sync)
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

---

## 🔄 Roadmap

### Améliorations futures

- [ ] Cache Redis pour `/api/edt/all`
- [ ] Webhook flOpEDT pour sync en temps réel
- [ ] API GraphQL pour requêtes complexes
- [ ] Export iCal des emplois du temps
- [ ] Notifications changements de cours

---

## �️ Maintenance et opérations

### Service systemd

Le service `edt-api.service` gère l'API en production sur le Raspberry Pi.

```bash
# Fichier de configuration
sudo nano /etc/systemd/system/edt-api.service

# Recharger après modification
sudo systemctl daemon-reload
sudo systemctl restart edt-api

# Surveiller l'état
watch -n 2 'sudo systemctl status edt-api --no-pager | head -20'
```

### Synchronisation automatique (Cron)

La synchronisation avec flOpEDT est automatique via cron (2x/jour).

```bash
# Éditer la configuration cron
crontab -e

# Format de la tâche actuelle
# 0 0,12 * * * = à 00h00 et 12h00 chaque jour

# Forcer une synchronisation manuelle
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend
node scripts/sync.js --weeks=1-53 --year=2025 --depts=INFO,CS,GIM,RT

# Surveiller les logs de synchronisation
tail -f sync.log
```

### Monitoring et debugging

```bash
# Vérifier la santé de l'API
curl -s http://localhost:8000/api/depts && echo " ✓ API OK" || echo " ✗ API KO"

# Tester un endpoint complet
curl -s "http://localhost:8000/api/edt/all?dept=INFO&train_prog=BUT1&week=41&year=2025" | jq '.courses | length'

# Logs en temps réel (3 sources)
sudo journalctl -u edt-api -f              # Logs systemd
tail -f backend.log                        # Logs application
tail -f sync.log                           # Logs synchronisation

# Statistiques base de données
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "
SELECT 
  dept, 
  train_prog, 
  COUNT(*) as cours_total,
  COUNT(DISTINCT week) as semaines,
  MIN(week) as semaine_min,
  MAX(week) as semaine_max
FROM scheduled_course 
WHERE promo_year = 2025
GROUP BY dept, train_prog;
"

# Performance monitoring
sudo journalctl -u edt-api --since "1 hour ago" | grep "GET /api" | wc -l  # Requêtes dernière heure
```

### Backup de la base de données

```bash
# Backup complet
docker exec mariadb mariadb-dump -u flopedt_user -p'edtpassword' flopedt_db > backup_$(date +%Y%m%d).sql

# Restauration
docker exec -i mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db < backup_20251007.sql

# Backup automatique quotidien (ajout cron)
# 0 3 * * * docker exec mariadb mariadb-dump -u flopedt_user -p'edtpassword' flopedt_db | gzip > /backups/edt_$(date +\%Y\%m\%d).sql.gz
```

---

## �📚 Ressources

- **flOpEDT API** : https://flopedt.iut-blagnac.fr/fr/api/
- **mysql2 docs** : https://sidorares.github.io/node-mysql2/
- **Express.js** : https://expressjs.com/
- **Systemd** : https://systemd.io/
- **Cron syntax** : https://crontab.guru/

---

## 🤝 Contribution

### Workflow Git

```bash
# Créer une branche
git checkout -b feature/my-feature

# Commits atomiques
git commit -m "feat: add endpoint /api/xyz"

# Push et PR
git push origin feature/my-feature
```

### Conventions de code

- **ESM modules** : `import`/`export` (pas de `require`)
- **Async/await** : Pas de callbacks
- **Nommage** : camelCase pour variables, PascalCase pour classes
- **SQL** : Uppercase pour keywords, lowercase pour identifiers

---

## 📞 Contact

Pour toute question technique : équipe dev IUT Blagnac
