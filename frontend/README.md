# 📅 EDT IUT - Frontend

Application web moderne pour la consultation des emplois du temps de l'IUT, développée avec React + TypeScript + Vite.

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview
```

L'application sera accessible sur `http://localhost:5173`

## 📋 Table des Matières

- [Technologies](#-technologies)
- [Architecture](#-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Structure du Projet](#-structure-du-projet)
- [Composants Principaux](#-composants-principaux)
- [Hooks Personnalisés](#-hooks-personnalisés)
- [Responsive Design](#-responsive-design)
- [Configuration](#-configuration)
- [Développement](#-développement)

## 🛠 Technologies

### Framework & Outils
- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide avec HMR
- **React Router DOM** - Routing côté client

### UI & Styling
- **Tailwind CSS** - Framework CSS utility-first
- **Radix UI** - Composants accessibles headless
- **Lucide React** - Icônes modernes
- **PostCSS** - Transformation CSS

### Composants UI
- Dialogs, Popovers, Sheets (menus latéraux)
- Calendar picker
- Toasts (notifications)
- Scroll areas
- Buttons, Inputs, Selects

## 🏗 Architecture

### Pattern de Conception
L'application suit une architecture **component-based** avec :
- Composants réutilisables dans `src/components/`
- Pages principales dans `src/pages/`
- Hooks personnalisés pour la logique métier
- Gestion d'état local avec React hooks

### Flux de Données
```
API Backend (Node.js)
      ↓
  fetch() dans useEffect
      ↓
  State React (useState)
      ↓
Composants React (props)
      ↓
   DOM (render)
```

## ✨ Fonctionnalités

### 🎯 Principales
1. **Visualisation des emplois du temps**
   - Affichage hebdomadaire (1, 3 ou 5 jours)
   - Navigation jour par jour, semaine par semaine
   - Vue calendrier pour sélection rapide
   - Couleurs personnalisées par module

2. **Filtres avancés**
   - Département (INFO, CS, GIM, RT)
   - Promotion (BUT1, BUT2, BUT3)
   - Groupes (TP, TD, CM)
   - Mode "Tous les groupes" avec affichage multi-colonnes

3. **Gestion des profils**
   - Création/modification/suppression de profils
   - Sauvegarde des préférences (dept, année, groupe, thème)
   - Changement rapide entre profils

4. **Salles libres**
   - Consultation en temps réel des salles disponibles
   - Filtrage par jour et créneau horaire
   - Liste complète des salles B---

5. **Menu latéral déployable**
   - Navigation rapide
   - Accès aux paramètres principaux
   - Optimisé pour mobile

6. **Thème clair/sombre**
   - Bascule instantanée
   - Persistance localStorage
   - Design moderne et élégant

### 📱 Responsive Mobile
- Vue 1 jour forcée sur mobile (< 768px)
- Navigation optimisée avec boutons compacts
- Texte et espacements adaptés
- Masquage des éléments non essentiels
- Touch-friendly

## 📂 Structure du Projet

```
frontend/
├── public/                  # Assets statiques
│   └── vite.svg
├── src/
│   ├── assets/             # Images et ressources
│   │   └── react.svg
│   ├── components/         # Composants réutilisables
│   │   ├── FreeRoomsDialog.tsx    # Dialog salles libres
│   │   ├── ProfileManager.tsx     # Gestion profils
│   │   └── ui/                    # Composants UI Radix
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── dialog.tsx
│   │       ├── popover.tsx
│   │       ├── sheet.tsx
│   │       ├── toast.tsx
│   │       └── ... (30+ composants)
│   ├── hooks/              # Custom hooks
│   │   ├── use-mobile.tsx       # Détection mobile
│   │   ├── use-profiles.tsx     # Gestion profils
│   │   └── use-toast.tsx        # Notifications
│   ├── lib/                # Utilitaires
│   │   └── utils.ts            # Helpers (cn, etc.)
│   ├── pages/              # Pages principales
│   │   ├── index.tsx           # Page d'accueil
│   │   ├── NotFound.tsx        # 404
│   │   └── Timetable.tsx       # Page EDT (principale)
│   ├── App.tsx             # Composant racine + routing
│   ├── main.tsx            # Point d'entrée
│   ├── index.css           # Styles globaux + Tailwind
│   └── vite-env.d.ts       # Types Vite
├── components.json         # Config shadcn/ui
├── eslint.config.js        # Configuration ESLint
├── postcss.config.js       # Configuration PostCSS
├── tailwind.config.ts      # Configuration Tailwind
├── tsconfig.json           # Configuration TypeScript
├── vite.config.ts          # Configuration Vite
└── package.json            # Dépendances
```

## 🧩 Composants Principaux

### 1. **Timetable.tsx** (1000+ lignes)
Le composant principal de l'application.

#### État Local
```typescript
const [courses, setCourses] = useState<CoursAPI[]>([])
const [daysToShow, setDaysToShow] = useState(5)  // 1, 3 ou 5
const [startDayIndex, setStartDayIndex] = useState(0)  // 0-4
const [week, setWeek] = useState(currentWeek)
const [yearNumber, setYearNumber] = useState(currentYear)
const [dept, setDept] = useState('INFO')
const [year, setYear] = useState('BUT1')
const [groupFilter, setGroupFilter] = useState('ALL')
const [dark, setDark] = useState(false)
```

#### Logique de Colonnes
Algorithme pour afficher plusieurs cours côte à côte :
```typescript
// Détection des chevauchements
const coursesOverlap = (c1, c2) => 
  c1.start_time < c2.end_time && c2.start_time < c1.end_time

// Tri logique des groupes (1A, 1B, 2A, 2B)
const sortGroups = (groups) => 
  groups.sort((a, b) => /* tri numéro + lettre */)

// Attribution de colonnes
coursesWithColumns.forEach(course => {
  course.column = /* calcul position */
  course.totalColumns = /* nombre total */
})
```

#### Normalisation du Temps
```typescript
// IUT utilise des heures non standard
const normalizeTime = (minutes) => {
  if (minutes === 665) return 660;   // 11:05 -> 11:00
  if (minutes === 1040) return 1035; // 17:20 -> 17:15
  return minutes;
}
```

#### Affichage Responsive
```typescript
const isMobile = useIsMobile()

// Mode compact pour plusieurs colonnes
const isCompactMode = groupFilter === "ALL" && totalColumns > 1

// Grille adaptée
gridTemplateColumns: isMobile 
  ? `60px 1fr`  // Mobile: temps + 1 jour
  : `100px repeat(${daysToShow}, minmax(240px, 1fr))`
```

### 2. **FreeRoomsDialog.tsx**
Dialog pour consulter les salles libres.

#### Fonctionnalités
- Sélection du jour (Lundi-Vendredi)
- Liste des créneaux horaires standards
- Indicateur de disponibilité (badge vert avec nombre)
- Liste des salles B--- disponibles
- API call: `GET /api/free-rooms?day=...&week=...&year=...`

### 3. **ProfileManager.tsx**
Gestion des profils utilisateur.

#### Structure Profil
```typescript
interface Profile {
  id: string
  name: string
  dept: string
  year: string
  groupFilter: string
  theme: 'light' | 'dark'
}
```

#### Fonctionnalités
- Création de nouveaux profils
- Édition (nom uniquement, config en live)
- Suppression avec confirmation
- Sélection active
- Persistance localStorage

### 4. **Composants UI Radix**
Composants accessibles et personnalisables :

- **Dialog** - Modales
- **Popover** - Menus contextuels
- **Sheet** - Menus latéraux
- **Calendar** - Sélecteur de date
- **Toast** - Notifications
- **Button** - Boutons stylisés
- **Select** - Sélecteurs personnalisés
- **ScrollArea** - Zones scrollables

## 🎣 Hooks Personnalisés

### `useIsMobile()`
Détecte si l'écran est mobile (< 768px).

```typescript
const isMobile = useIsMobile()
// true sur mobile, false sur desktop
```

### `useProfiles()`
Gère les profils utilisateur avec localStorage.

```typescript
const profilesManager = useProfiles()

// Méthodes disponibles
profilesManager.createProfile(name, config)
profilesManager.updateProfile(id, updates)
profilesManager.deleteProfile(id)
profilesManager.setActiveProfile(id)

// État
profilesManager.profiles        // Profile[]
profilesManager.activeProfile   // string | null
```

### `useToast()`
Système de notifications toast.

```typescript
const { toast } = useToast()

toast({
  title: "Succès",
  description: "Profil créé",
  variant: "default" // ou "destructive"
})
```

## 📱 Responsive Design

### Breakpoints Tailwind
```css
/* Mobile first */
sm: 640px   /* Petites tablettes */
md: 768px   /* Tablettes */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Adaptations Mobile (< 768px)

#### Layout
- Padding réduit : `p-2` au lieu de `p-4/p-6/p-8`
- Marges réduites : `mb-4` au lieu de `mb-8`
- Vue 1 jour forcée automatiquement
- Grille verticale inspirée Google Agenda avec en-tête collant
- Ligne temporelle en temps réel (point rouge) sur la journée courante
- Colonne du jour en cours mise en avant (`bg-primary/5`)

#### Typographie
- Titre : `text-2xl` → `text-4xl`
- Cours (normal) : `text-xs` → `text-sm`
- Cours (compact) : `text-[10px]` → `text-xs`
- Labels temps : `text-[10px]` → `text-xs`

#### Composants
- Boutons : `w-9 h-9` → `w-11 h-11`
- Icônes : `w-4 h-4` → `w-5 h-5`
- Colonne temps : `60px` → `100px`
- Border radius : `rounded-lg` → `rounded-xl`
- Cartes cours : dégradé léger, heures visibles en haut, salle/prof alignés à gauche
- Timeline sticky + header jour `position: sticky` pour un scroll fluide

#### Éléments Masqués
- Sélecteur 1j/3j/5j (inutile, forcé à 1j)
- Profile Manager (accessible via menu)

## 📲 Progressive Web App

### Fonctionnalités
- Manifest `manifest.webmanifest` avec icônes et raccourcis (Semaine / Salles libres)
- Service worker auto-update généré par `vite-plugin-pwa`
- Cache offline des assets critiques (`generateSW` + Workbox)
- Installation "Ajouter à l'écran d'accueil" sur Android/Chrome et iOS/Safari

### Installation Utilisateur
1. Ouvrir l'application sur mobile (Chrome, Edge, Safari ≥ 16.4)
2. Android / Chrome : menu ⋮ → **Ajouter à l'écran d'accueil**
3. iOS / Safari : bouton **Partager** → **Sur l'écran d'accueil**
4. L'application se lance ensuite en mode standalone, avec splash screen sombre (`#0f172a`)

### Développement
- Dépendance : `vite-plugin-pwa@^0.19.8`
- Enregistrement : `virtual:pwa-register` appelé dans `src/main.tsx`
- Manifest : `public/manifest.webmanifest`
- Config : voir `vite.config.ts` (section `VitePWA`)

Pour re-générer et tester le service worker :

```bash
npm run build
npm run preview -- --host
```

Puis ouvrir `https://<host>:4173` (ou via tunnel HTTPS) pour valider l'installation.

## ⚙️ Configuration

### Variables d'Environnement
```bash
# .env
VITE_API_URL=<API_BASE_URL>
```

### Tailwind Custom
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: { /* ... */ },
      secondary: { /* ... */ },
      // ...
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-in',
      'scale-in': 'scaleIn 0.2s ease-out',
      'slide-up': 'slideUp 0.3s ease-out',
    }
  }
}
```

### Vite Config
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["vite.svg"],
      manifest: {
        name: "EDT IUT",
        short_name: "EDT IUT",
        start_url: "/",
        display: "standalone",
        theme_color: "#0f172a",
        icons: [
          { src: "/vite.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "/vite.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

## 🔧 Développement

### Scripts NPM

```bash
npm run dev      # Serveur de développement (port 5173)
npm run build    # Build de production
npm run preview  # Prévisualisation du build
npm run lint     # Vérification ESLint
```

### Installation de Nouveaux Composants UI

L'application utilise **shadcn/ui** pour les composants. Pour ajouter un nouveau composant :

```bash
npx shadcn@latest add <component-name>
# Exemple: npx shadcn@latest add dropdown-menu
```

### Structure d'un Cours (CoursAPI)

```typescript
interface CoursAPI {
  id: number
  day: string              // "Lundi", "Mardi", etc.
  start_time: number       // Minutes depuis minuit (e.g., 480 = 8h00)
  end_time: number
  groups: string[]         // ["1A", "1B"]
  module_name: string      // "Architecture Réseaux"
  module_abbrev: string    // "ArchiRes"
  display_color_bg: string // "#3b82f6"
  display_color_txt: string // "#ffffff"
  tutor_username: string   // "jdoe"
  room_name: string        // "B104"
  train_prog: string       // "INFO-BUT1"
}
```

### API Endpoints Utilisés

```typescript
// Récupération des groupes disponibles
GET /api/groups?dept=INFO

// Récupération des cours
GET /api/courses?dept=INFO&train_prog=INFO-BUT1&week=42&year=2024

// Salles libres
GET /api/free-rooms?day=Lundi&week=42&year=2024
```

### LocalStorage

L'application utilise localStorage pour la persistance :

```javascript
// Profils utilisateur
'edt-profiles'      // Profile[]
'edt-active-profile' // string | null

// Dernières sélections
'edt-last-dept'     // "INFO"
'edt-last-year'     // "BUT1"
'edt-last-group'    // "1A"
'edt-theme'         // "dark" | "light"
```

## 🎨 Design System

### Couleurs (CSS Variables)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Animations Personnalisées

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### Classes Utilitaires Custom

```css
.transition-smooth { transition: all 0.2s ease-in-out; }
.transition-base { transition: all 0.15s ease; }
.shadow-elegant { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.shadow-glow { box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
```

## 🐛 Debugging

### React DevTools
Installé automatiquement en développement. Permet d'inspecter :
- L'arbre des composants
- Les props et state
- Les hooks
- Les performances de rendu

### Console Logs
```typescript
// Activés en développement uniquement
console.log('Courses loaded:', courses.length)
console.log('Mobile detected:', isMobile)
```

### Erreurs Courantes

1. **API non accessible**
   - Vérifier que le backend tourne sur port 8000
   - Vérifier VITE_API_URL dans .env

2. **Composants UI manquants**
   - Installer avec `npx shadcn@latest add <component>`

3. **Types TypeScript**
   - Vérifier tsconfig.json
   - Redémarrer le serveur TypeScript dans VSCode

4. **Tailwind ne fonctionne pas**
   - Vérifier que le fichier est dans `content: []` de tailwind.config.ts
   - Redémarrer le serveur de dev

## 📦 Build & Déploiement

### Build de Production

```bash
npm run build
# Génère le dossier dist/ avec les assets optimisés
```

Le build produit :
- HTML minifié
- CSS minifié et purgé (Tailwind)
- JavaScript minifié et bundlé
- Assets avec hash pour cache-busting

### Déploiement

#### Option 1 : Serveur Statique
```bash
# Après build
cd dist
python3 -m http.server 8080
```

#### Option 2 : Nginx
```nginx
server {
  listen 80;
  server_name edt.example.com;
  
  root /path/to/dist;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Proxy API
  location /api {
    proxy_pass http://localhost:8000;
  }
}
```

> Penser à importer `VitePWA` depuis `vite-plugin-pwa` dans le fichier de configuration.

#### Option 3 : Services Cloud
- **Vercel** - `vercel deploy`
- **Netlify** - `netlify deploy --prod`
- **GitHub Pages** - Via GitHub Actions

## 🔐 Sécurité

### Best Practices Implémentées

1. **Pas de données sensibles côté client**
   - Pas de tokens stockés
   - Pas de credentials en dur

2. **Validation des entrées**
   - Validation TypeScript stricte
   - Sanitization des données API

3. **CORS géré par le backend**
   - Pas de contournement côté client

4. **Content Security Policy**
   - À configurer dans le serveur web

## 🚀 Performances

### Optimisations Appliquées

1. **Code Splitting**
   - React.lazy() pour les routes
   - Import dynamique des gros composants

2. **Memoization**
   - React.useMemo() pour calculs lourds
   - React.useCallback() pour fonctions

3. **Virtual Scrolling**
   - ScrollArea de Radix pour grandes listes

4. **Debouncing**
   - Sur les recherches et filtres

### Métriques Cibles
- **FCP** (First Contentful Paint) : < 1.5s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **TTI** (Time to Interactive) : < 3s
- **Bundle Size** : < 500KB (gzipped)

## 📚 Ressources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com)
- [shadcn/ui](https://ui.shadcn.com)

### Outils Utiles
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind Play](https://play.tailwindcss.com)

## 🤝 Contribution

### Guide de Style

1. **TypeScript**
   - Types explicites pour les props
   - Interfaces pour les objets complexes
   - Éviter `any`

2. **React**
   - Functional components uniquement
   - Hooks pour la logique
   - Props destructuring

3. **CSS**
   - Tailwind en priorité
   - Classes custom dans index.css si nécessaire
   - Pas de CSS inline sauf dynamique

4. **Nommage**
   - PascalCase pour composants
   - camelCase pour fonctions/variables
   - kebab-case pour fichiers CSS

### Workflow Git

```bash
# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Commits atomiques
git commit -m "feat: ajout du filtre par salle"

# Push et PR
git push origin feature/nouvelle-fonctionnalite
```

## 📄 Licence

Ce projet est développé pour l'IUT. Tous droits réservés.

---

**Développé avec ❤️ pour l'IUT**
