# Documentation Archivée - Version Base de Données

## 📦 Contenu

Ce dossier contient la documentation de l'ancienne architecture basée sur MariaDB.

### Fichiers archivés

- **README-DB.md** : Documentation utilisateur de la version avec base de données
- **DEVELOPER-DB.md** : Documentation développeur de la version avec base de données

## 🔄 Historique

### Ancienne architecture (Mars 2024 - Octobre 2025)

```
flopedt API → sync.js → MariaDB → Express API → Frontend
```

**Fonctionnalités** :
- Synchronisation périodique vers base de données MariaDB
- Endpoints complexes avec filtrage SQL
- Calcul des salles disponibles
- Hiérarchie de groupes avec train_prog

**Inconvénients** :
- Dépendance à MariaDB (Docker)
- Synchronisation complexe avec gestion des erreurs
- Maintenance de la base de données
- Code plus volumineux (~300+ lignes pour sync.js)

### Nouvelle architecture (Octobre 2025 - Présent)

```
flopedt API → fetch-weeks.js → JSON files → Express API → Frontend
```

**Avantages** :
- ✅ Pas de base de données à gérer
- ✅ Architecture simplifiée
- ✅ Code minimal (~47 lignes pour l'API)
- ✅ Fichiers JSON directement depuis la source
- ✅ Performance accrue

## 🚫 Utilisation

**Cette documentation est archivée à titre de référence uniquement.**

Pour la documentation actuelle, consultez :
- [`../README.md`](../README.md) - Documentation utilisateur (version JSON)
- [`../DEVELOPER.md`](../DEVELOPER.md) - Documentation développeur (version JSON)

## 📝 Migration

Si vous avez besoin de revenir à l'ancienne architecture DB :

1. Restaurer les fichiers :
```bash
cp docs-archive/README-DB.md README.md
cp docs-archive/DEVELOPER-DB.md DEVELOPER.md
```

2. Restaurer le code (via git) :
```bash
git log --all --oneline | grep "base de données"  # Trouver le commit
git checkout <commit-hash> -- index.js scripts/sync.js
```

3. Installer MariaDB :
```bash
docker run -d --name mariadb -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=flopedt_db \
  -e MYSQL_USER=flopedt_user \
  -e MYSQL_PASSWORD=edtpassword \
  mariadb:10.11
```

4. Initialiser le schéma :
```bash
mysql -h localhost -u flopedt_user -p < schema.sql
```

## 📄 Date d'archivage

**Octobre 2025** - Migration vers l'architecture JSON sans base de données

## 📧 Contact

Pour toute question sur l'ancienne architecture, consulter l'historique git :
```bash
git log --all -- README.md DEVELOPER.md
```
