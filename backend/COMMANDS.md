rn# 🚀 Commandes rapides - EDT API

Guide de référence rapide pour les opérations courantes.

---

## 🔧 Gestion du service API (systemd)

### Contrôle du service

```bash
# Démarrer l'API
sudo systemctl start edt-api

# Arrêter l'API
sudo systemctl stop edt-api

# Redémarrer l'API (après modification du code)
sudo systemctl restart edt-api

# Recharger la configuration (sans couper le service)
sudo systemctl reload edt-api

# Voir le statut actuel
sudo systemctl status edt-api

# Voir le statut simplifié
sudo systemctl is-active edt-api
```

### Démarrage automatique

```bash
# Activer le démarrage au boot (déjà activé)
sudo systemctl enable edt-api

# Désactiver le démarrage automatique
sudo systemctl disable edt-api

# Vérifier si activé
sudo systemctl is-enabled edt-api
```

### Modification du service

```bash
# Éditer la configuration du service
sudo nano /etc/systemd/system/edt-api.service

# Recharger après modification
sudo systemctl daemon-reload
sudo systemctl restart edt-api
```

---

## 📋 Consulter les logs

### Logs du service (systemd)

```bash
# Logs en temps réel
sudo journalctl -u edt-api -f

# Dernières 50 lignes
sudo journalctl -u edt-api -n 50

# Dernières 100 lignes sans pagination
sudo journalctl -u edt-api -n 100 --no-pager

# Logs depuis 1 heure
sudo journalctl -u edt-api --since "1 hour ago"

# Logs d'aujourd'hui
sudo journalctl -u edt-api --since today

# Logs entre deux dates
sudo journalctl -u edt-api --since "2025-10-01" --until "2025-10-07"
```

### Logs applicatifs (fichiers)

```bash
# API logs en temps réel
tail -f /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/backend.log

# Sync logs en temps réel
tail -f /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend/sync.log

# Dernières 100 lignes
tail -n 100 backend.log

# Rechercher des erreurs
grep -i error backend.log | tail -20
grep -i "failed\|error\|exception" sync.log
```

---

## 🔄 Synchronisation des données

### Synchronisation manuelle

```bash
# Aller dans le dossier backend
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend

# Synchroniser une semaine spécifique
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO

# Synchroniser tous les départements
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO,CS,GIM,RT

# Synchroniser toute l'année
node scripts/sync.js --weeks=1-53 --year=2025 --depts=INFO

# Synchroniser avec nettoyage
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO --clean=true

# Mode debug (affiche les requêtes)
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO --debug=true
```

### Gestion de la synchronisation automatique (cron)

```bash
# Voir la tâche cron actuelle
crontab -l | grep sync.js

# Éditer les tâches cron
crontab -e

# Consulter les logs de synchronisation
tail -f sync.log

# Tester si cron fonctionne
grep CRON /var/log/syslog | tail -20
```

### Tâche cron configurée

Actuellement : **2 fois par jour** (minuit et midi)

```cron
0 0,12 * * * cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend && /usr/bin/node scripts/sync.js --weeks=1-53 --year=$(date +\%Y) --depts=INFO,CS,GIM,RT >> sync.log 2>&1
```

---

## 🧪 Tests et vérifications

### Tester l'API

```bash
# Test basique
curl http://localhost:8000/api/depts

# Test avec formatage JSON
curl -s http://localhost:8000/api/depts | jq .

# Tester les groupes
curl -s "http://localhost:8000/api/groups?dept=INFO&train_prog=BUT1" | jq .

# Tester un emploi du temps complet
curl -s "http://localhost:8000/api/edt/all?dept=INFO&train_prog=BUT1&week=41&year=2025" | jq '.courses | length'

# Tester les salles libres
curl -s "http://localhost:8000/api/free-rooms?dept=INFO&week=41&year=2025" | jq '.rooms | length'

# Test depuis l'extérieur (VPS)
curl http://152.228.219.56:8000/api/depts
```

### Vérifier la base de données

```bash
# Connexion à la base
docker exec -it mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db

# Requêtes SQL rapides
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "SELECT COUNT(*) FROM scheduled_course;"

# Statistiques par département
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "
SELECT dept, train_prog, COUNT(*) as total 
FROM scheduled_course 
WHERE week=41 AND promo_year=2025
GROUP BY dept, train_prog;
"

# Vérifier les salles B---
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "
SELECT COUNT(*) as total_salles_B 
FROM room 
WHERE name LIKE 'B%';
"
```

---

## 🔍 Dépannage rapide

### L'API ne répond pas

```bash
# 1. Vérifier le statut
sudo systemctl status edt-api

# 2. Vérifier les logs d'erreur
sudo journalctl -u edt-api -n 50 --no-pager | grep -i error

# 3. Tester la connexion DB
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' -e "SELECT 1"

# 4. Redémarrer le service
sudo systemctl restart edt-api

# 5. Vérifier que ça fonctionne
curl http://localhost:8000/api/depts
```

### Port déjà utilisé

```bash
# Trouver le processus qui utilise le port 8000
sudo lsof -i :8000
sudo netstat -tulpn | grep :8000

# Tuer l'ancien processus
pkill -f "node.*index.js"

# Redémarrer le service
sudo systemctl restart edt-api
```

### Synchronisation qui échoue

```bash
# 1. Tester la connexion à flOpEDT
curl -s https://flopedt.iut-blagnac.fr/fr/api/departments/ | jq .

# 2. Lancer en mode debug
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO --debug=true

# 3. Vérifier les logs
tail -50 sync.log

# 4. Vérifier la base de données
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "SELECT COUNT(*) FROM scheduled_course WHERE week=41;"
```

### Données manquantes

```bash
# Vérifier les cours pour une semaine
docker exec mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db -e "
SELECT dept, train_prog, COUNT(*) 
FROM scheduled_course 
WHERE week=41 AND promo_year=2025 
GROUP BY dept, train_prog;
"

# Re-synchroniser avec nettoyage
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend
node scripts/sync.js --weeks=41 --year=2025 --depts=INFO --clean=true
```

---

## 💾 Backup et restauration

### Backup de la base de données

```bash
# Backup complet
docker exec mariadb mariadb-dump -u flopedt_user -p'edtpassword' flopedt_db > backup_$(date +%Y%m%d).sql

# Backup compressé
docker exec mariadb mariadb-dump -u flopedt_user -p'edtpassword' flopedt_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup des cours uniquement
docker exec mariadb mariadb-dump -u flopedt_user -p'edtpassword' flopedt_db scheduled_course course_groups > backup_courses_$(date +%Y%m%d).sql
```

### Restauration

```bash
# Restaurer depuis un backup
docker exec -i mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db < backup_20251007.sql

# Restaurer depuis un backup compressé
zcat backup_20251007.sql.gz | docker exec -i mariadb mariadb -u flopedt_user -p'edtpassword' flopedt_db
```

---

## 📊 Monitoring

### Statistiques de l'API

```bash
# Nombre de requêtes dernière heure
sudo journalctl -u edt-api --since "1 hour ago" | grep "GET /api" | wc -l

# Requêtes les plus fréquentes
sudo journalctl -u edt-api --since "1 hour ago" | grep "GET /api" | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10

# Temps de réponse moyen (si logs configurés)
tail -1000 backend.log | grep "response time" | awk '{sum+=$NF; count++} END {print sum/count "ms"}'
```

### État du système

```bash
# Utilisation CPU/RAM du service
sudo systemctl status edt-api | grep -E "CPU|Memory"

# Processus Node.js
ps aux | grep "node.*index.js"

# Connexions actives
sudo netstat -an | grep :8000 | grep ESTABLISHED | wc -l

# Espace disque
df -h /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70
```

---

## 🔗 Liens rapides

- **API locale** : http://10.0.0.2:8000
- **API publique** : http://152.228.219.56:8000
- **FlOpEDT source** : https://flopedt.iut-blagnac.fr
- **Documentation complète** : [README.md](README.md)
- **Documentation développeur** : [DEVELOPER.md](DEVELOPER.md)

---

## 📞 Support rapide

| Problème | Solution rapide |
|----------|----------------|
| API ne démarre pas | `sudo systemctl restart edt-api` |
| Port occupé | `pkill -f "node.*index.js" && sudo systemctl start edt-api` |
| Logs illisibles | `sudo journalctl -u edt-api -n 50 --no-pager` |
| Sync échoue | `node scripts/sync.js --weeks=41 --year=2025 --depts=INFO --debug=true` |
| DB inaccessible | `docker restart mariadb && sleep 5 && sudo systemctl restart edt-api` |
| Données manquantes | `node scripts/sync.js --weeks=1-53 --year=2025 --clean=true` |

---

**Dernière mise à jour** : 7 octobre 2025
