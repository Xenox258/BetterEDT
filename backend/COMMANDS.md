rn# 🚀 Commandes rapides - API EDT

Guide de référence pour les opérations courantes sur le backend.

---

## 🔧 Gestion du service API (si utilisé, ex: systemd)

### Contrôle du service

```bash
# Démarrer l'API
sudo systemctl start edt-api

# Arrêter l'API
sudo systemctl stop edt-api

# Redémarrer l'API (après une mise à jour du code)
sudo systemctl restart edt-api

# Voir le statut actuel
sudo systemctl status edt-api
```

### Consulter les logs du service

```bash
# Logs en temps réel
sudo journalctl -u edt-api -f

# Dernières 100 lignes
sudo journalctl -u edt-api -n 100 --no-pager

# Logs depuis la dernière heure
sudo journalctl -u edt-api --since "1 hour ago"
```

---

## 🔄 Téléchargement des données (Cron & Manuel)

### Lancement manuel

Toutes les commandes sont à lancer depuis le dossier `backend/`.

```bash
# Aller dans le dossier du backend
cd /srv/dev-disk-by-uuid-0818de14-ddf8-46a5-bf71-2ecaff879f70/apps/edt-iut/backend

# Télécharger la semaine 41 pour le département INFO
node scripts/fetch-weeks.js --depts=INFO --weeks=41

# Télécharger plusieurs semaines pour tous les départements
node scripts/fetch-weeks.js --depts=INFO,CS,GIM,RT --weeks=41-45

# Forcer le re-téléchargement même si les fichiers existent
node scripts/fetch-weeks.js --depts=INFO --weeks=41 --force
```

### Gestion de la tâche automatique (Cron)

```bash
# Voir les tâches cron de l'utilisateur actuel
crontab -l

# Éditer les tâches cron
crontab -e

# Consulter les logs du script de synchronisation
tail -f logs/sync.log

# Vérifier que cron a bien lancé le script
grep CRON /var/log/syslog | tail -10
```

### Tâche cron recommandée

Exemple pour une exécution toutes les 6 heures :
```cron
0 */6 * * * cd /path/to/your/project/backend && node scripts/fetch-weeks.js >> logs/sync.log 2>&1
```

---

## 🧪 Tests et vérifications

### Démarrer l'API localement

```bash
# Depuis le dossier backend/
node index.js
```

### Tester l'API avec `curl`

```bash
# Test basique : lister les départements
curl http://localhost:8000/api/depts

# Tester un emploi du temps (semaine 41, INFO)
curl http://localhost:8000/api/schedule/INFO/2025/41

# Utiliser jq pour un affichage lisible et compter les cours
curl -s http://localhost:8000/api/schedule/INFO/2025/41 | jq '.'
curl -s http://localhost:8000/api/schedule/INFO/2025/41 | jq 'length'
```

### Vérifier les fichiers de données

```bash
# Lister les fichiers pour un département
ls -l data/weeks/INFO/

# Voir le contenu d'un fichier
cat data/weeks/INFO/2025-W41.json | jq '.' | less

# Compter le nombre de cours dans un fichier
cat data/weeks/INFO/2025-W41.json | jq 'length'
```

---

## 🔍 Dépannage rapide

### L'API ne démarre pas ou ne répond pas

```bash
# 1. Y a-t-il un message d'erreur au lancement ?
node index.js

# 2. Le port est-il déjà utilisé ?
# Chercher le processus qui utilise le port 8000
sudo lsof -i :8000

# Si un processus est trouvé, l'arrêter
# pkill -f "node.*index.js"
```

### Données manquantes ou pas à jour

```bash
# 1. Vérifier les logs de synchronisation
tail -50 logs/sync.log

# 2. Lancer un téléchargement manuel en forçant
node scripts/fetch-weeks.js --depts=INFO --weeks=41 --force

# 3. Vérifier la date de modification du fichier
ls -l data/weeks/INFO/2025-W41.json
```

---
