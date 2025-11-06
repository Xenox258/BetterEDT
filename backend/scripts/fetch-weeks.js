/**
 * Script pour télécharger les JSON de toutes les semaines depuis l'API flopedt
 * Usage: node scripts/fetch-weeks.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://flopedt.iut-blagnac.fr/en/api/fetch/scheduledcourses';
const DATA_DIR = path.join(__dirname, '..', 'data', 'weeks');

// Configuration des semaines à télécharger
const DEPTS = ['INFO', 'CS', 'GIM', 'RT'];
const CURRENT_YEAR = 2025;

// Fonction pour obtenir la semaine ISO actuelle
function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

// Ne télécharger que les 8 prochaines semaines (2 mois)
const currentWeek = getCurrentWeek();
const WEEKS = Array.from({ length: 8 }, (_, i) => {
  let week = currentWeek + i;
  // Gérer le passage à l'année suivante (semaine 53 -> 1)
  if (week > 53) week = week - 53;
  return week;
});

async function fetchWeek(dept, week, year) {
  const url = `${API_BASE}/?dept=${dept}&week=${week}&year=${year}&work_copy=0`;
  
  console.log(`📥 Fetching ${dept} week ${week}/${year}...`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️  HTTP ${response.status} for ${dept} week ${week}/${year}`);
      return null;
    }
    
    const data = await response.json();
    
    // Vérifier si la réponse contient des données
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`ℹ️  No data for ${dept} week ${week}/${year}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${dept} week ${week}/${year}:`, error.message);
    return null;
  }
}

function saveWeek(dept, week, year, data) {
  const deptDir = path.join(DATA_DIR, dept);
  
  // Créer les dossiers si nécessaire
  if (!fs.existsSync(deptDir)) {
    fs.mkdirSync(deptDir, { recursive: true });
  }
  
  const filename = `${year}-W${week.toString().padStart(2, '0')}.json`;
  const filepath = path.join(deptDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Saved ${filepath} (${data.length} courses)`);
}

async function main() {
  console.log('🚀 Starting JSON fetch...\n');
  
  // Créer le dossier data/weeks s'il n'existe pas
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  let totalSaved = 0;
  let totalSkipped = 0;
  
  for (const dept of DEPTS) {
    console.log(`\n📚 Department: ${dept}`);
    
    for (const week of WEEKS) {
      const data = await fetchWeek(dept, week, CURRENT_YEAR);
      
      if (data) {
        saveWeek(dept, week, CURRENT_YEAR, data);
        totalSaved++;
      } else {
        totalSkipped++;
      }
      
      // Pause réduite pour ne pas surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Done! ${totalSaved} weeks saved, ${totalSkipped} skipped`);
  console.log(`📁 Data stored in: ${DATA_DIR}`);
}

main().catch(console.error);
