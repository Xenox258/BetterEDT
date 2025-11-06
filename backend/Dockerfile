FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste des fichiers
COPY . .

# Créer le répertoire data s'il n'existe pas
RUN mkdir -p data/weeks

# Exposer le port 8000
EXPOSE 8000

# Démarrer l'application
CMD ["node", "index.js"]
