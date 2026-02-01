# Base de données MariaDB — BetterEDT (schéma actuel)

Ce document est basé sur l’analyse en direct de la base `edt` (conteneur `edt-mariadb`).

## Connexion (backend)
Fichier : [backend/db.js](db.js)
- Host : (configuré via variables d'environnement)
- Port : `3307`
- User : `edt_user`
- Password : (secret)
- Database : `edt`

## Schéma (tables & relations)

### `department`
Référentiel des départements.
- `id` (PK, int, auto_increment)
- `code` (varchar(10), unique)

### `week`
Semaine par département.
- `id` (PK, int, auto_increment)
- `dept_id` (FK → `department.id`)
- `year` (int)
- `week_num` (int)
- Unique : `(dept_id, year, week_num)`
- Index : `idx_week_dept_year_num (dept_id, year, week_num)`

### `module`
Matières.
- `id` (PK, int, auto_increment)
- `name` (varchar(255))
- `abbrev` (varchar(50))
- `color_bg` (varchar(7))
- `color_txt` (varchar(7))

### `room`
Salles.
- `id` (PK, int, auto_increment)
- `name` (varchar(100))

### `tutor`
Enseignants.
- `id` (PK, int, auto_increment)
- `identifier` (varchar(50), unique)

### `group`
Groupes pédagogiques.
- `id` (PK, int, auto_increment)
- `name` (varchar(50))
- `train_prog` (varchar(50))
- `is_structural` (tinyint(1), défaut 0)
- Index : `idx_group_trainprog_name (train_prog, name)`

### `course`
Cours planifiés.
- `id` (PK, varchar(64))
- `week_id` (FK → `week.id`)
- `day` (enum: `m`, `tu`, `w`, `th`, `f`)
- `start_time` (int, minutes depuis minuit)
- `duration` (int, défaut 90)
- `room_id` (FK → `room.id`)
- `course_type` (varchar(50))
- `tutor_id` (FK → `tutor.id`)
- `module_id` (FK → `module.id`)
- Index :
  - `idx_course_week_day_start (week_id, day, start_time)`
  - `idx_course_tutor_week (tutor_id, week_id, day, start_time)`
  - `idx_course_room_week (room_id, week_id, day, start_time)`

### `course_group`
Lien cours ↔ groupes (many-to-many).
- `course_id` (FK → `course.id`)
- `group_id` (FK → `group.id`)
- PK composite : `(course_id, group_id)`

## Utilisation par les endpoints API
Fichier : [backend/index.js](index.js)

### `GET /api/db-test`
- Table : `department`
- Utilisation : `SELECT COUNT(*) FROM department`

### `GET /api/schedule/:dept/:year/:week`
- Tables : `course`, `week`, `department`, `room`, `module`, `tutor`, `course_group`, `group`
- Jointures clés :
  - `course.week_id → week.id → department.id`
  - `course.room_id → room.id`
  - `course.module_id → module.id`
  - `course.tutor_id → tutor.id`
  - `course_group.course_id → course.id → group.id`
- Sortie : reconstitution d’un JSON type flOpEDT (groupes inclus).

### `GET /api/free-rooms?dept=...&week=...&year=...`
- Tables : `course`, `week`, `department`, `room`
- Utilisation :
  - Liste des salles pour une semaine
  - Créneaux occupés par jour/heure
  - Calcul des salles libres par créneau

### `GET /api/tutor-schedule?tutor=...&week=...&year=...`
- Tables : `course`, `week`, `department`, `room`, `module`, `tutor`, `course_group`, `group`
- Utilisation :
  - Filtre sur `tutor.identifier`
  - Reconstruction d’un planning tuteur avec groupes, couleurs, salle, module

### `GET /api/depts`
- Aucun accès DB (liste statique).

### `GET /api/tutors?dept=...`
- Aucun accès DB (source flOpEDT + cache mémoire).

## Notes d’ingestion (script DB)
Le script [backend/scripts/fetch-weeks-db.js](scripts/fetch-weeks-db.js) remplit ces tables à partir des JSON flOpEDT.
