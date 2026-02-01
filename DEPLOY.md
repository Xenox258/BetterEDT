# Déploiement EDT-IUT avec Docker

## 📦 Prérequis

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

## 🚀 Déploiement complet (Frontend + Backend)

### Option 1 : Avec Docker Compose (recommandé)

```bash
# Depuis la racine du projet
docker-compose up -d --build
```

Cela va :
- Builder les images Docker pour le frontend et le backend
- Démarrer les conteneurs en arrière-plan
- Le frontend sera accessible sur http://localhost
- Le backend sera accessible sur http://localhost:8000

⚠️ La base de données MariaDB n’est pas incluse dans ce compose. Voir la section “Base de données” ci-dessous.

### Option 2 : Seulement le Frontend

```bash
# Aller dans le dossier frontend
cd frontend

# Builder l'image
docker build -t edt-iut-frontend .

# Lancer le conteneur
docker run -d -p 80:80 --name edt-iut-frontend edt-iut-frontend
```

Le site sera accessible sur http://localhost

### Option 3 : Seulement le Backend

```bash
# Aller dans le dossier backend
cd backend

# Builder l'image
docker build -t edt-iut-backend .

# Lancer le conteneur avec volume pour les données
docker run -d -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  --name edt-iut-backend \
  edt-iut-backend
```

L'API sera accessible sur http://localhost:8000

## 🔧 Commandes utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Frontend seulement
docker-compose logs -f frontend

# Backend seulement
docker-compose logs -f backend
```

### Arrêter les conteneurs
```bash
docker-compose down
```

### Redémarrer les conteneurs
```bash
docker-compose restart
```

### Mettre à jour après des changements de code
```bash
# Rebuilder et redémarrer
docker-compose up -d --build

# Ou pour un service spécifique
docker-compose up -d --build frontend
```

### Nettoyer les anciennes images
```bash
docker system prune -a
```

## 🌐 Déploiement sur un serveur

### Configuration avec un nom de domaine

1. Modifier `docker-compose.yml` pour utiliser un reverse proxy (nginx-proxy ou Traefik)
2. Ajouter les labels pour le SSL avec Let's Encrypt

Exemple avec nginx-proxy :

```yaml
services:
  frontend:
    # ...
    environment:
      - VIRTUAL_HOST=edt.votredomaine.fr
      - LETSENCRYPT_HOST=edt.votredomaine.fr
      - LETSENCRYPT_EMAIL=votre@email.fr
```

### Variables d'environnement

Pour la production, créez un fichier `.env` :

```bash
# Backend
NODE_ENV=production
PORT=8000
DB_HOST=<DB_HOST>
DB_PORT=<DB_PORT>
DB_NAME=<DB_NAME>
DB_USER=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>

# Frontend (si nécessaire)
VITE_API_URL=https://api.votredomaine.fr

## 🗄️ Base de données (MariaDB)

Le backend lit/écrit les cours dans MariaDB. Exemple de lancement local :

```bash
docker run -d --name edt-mariadb \
  -e MYSQL_ROOT_PASSWORD=<ROOT_PASSWORD> \
  -e MYSQL_DATABASE=<DB_NAME> \
  -e MYSQL_USER=<DB_USER> \
  -e MYSQL_PASSWORD=<DB_PASSWORD> \
  -p 3306:3306 \
  -v $(pwd)/mariadb-data:/var/lib/mysql \
  mariadb:11
```

Initialisation et synchronisation des données :

```bash
cd backend
node scripts/fetch-weeks-db.js
```
```

## 📊 Monitoring

### Vérifier l'état des conteneurs
```bash
docker-compose ps
```

### Utilisation des ressources
```bash
docker stats
```

## 🔐 Sécurité

- Les données du backend sont persistées dans `./backend/data`
- Pensez à configurer un firewall pour limiter l'accès
- Utilisez HTTPS en production (Let's Encrypt recommandé)
- Ne pas exposer directement le port 8000 du backend en production

## 🐛 Dépannage

### Le frontend ne se connecte pas au backend

Vérifiez que l'URL du backend dans le code frontend pointe vers la bonne adresse. En production, modifiez l'URL dans le code ou utilisez une variable d'environnement.

### Erreur de build

```bash
# Supprimer les conteneurs et images
docker-compose down -v
docker system prune -a

# Rebuilder
docker-compose up -d --build
```

### Logs d'erreur

```bash
# Voir tous les logs
docker-compose logs

# Entrer dans un conteneur pour débugger
docker exec -it edt-iut-frontend sh
docker exec -it edt-iut-backend sh
```
