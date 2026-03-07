FROM node:20.20.0-alpine3.22
RUN apk update && apk upgrade zlib
RUN npm install -g npm@11.6.4

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
