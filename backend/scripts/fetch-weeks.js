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

// Fonction pour obtenir l'année courante dynamiquement
function getCurrentYear() {
  return new Date().getFullYear();
}

// Fonction pour obtenir la semaine ISO actuelle
function getCurrentWeek() {
  const now = new Date();
  const temp = new Date(now.getTime());
  temp.setHours(0, 0, 0, 0);
  const dayNum = temp.getDay() || 7;
  temp.setDate(temp.getDate() + 4 - dayNum);
  const yearStart = new Date(temp.getFullYear(), 0, 1);
  const week = Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: temp.getFullYear() };
}

// Générer la liste des semaines à télécharger (8 prochaines semaines)
// Gère automatiquement le passage à l'année suivante
function getWeeksToFetch(count = 8) {
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const weeks = [];
  
  for (let i = 0; i < count; i++) {
    let week = currentWeek + i;
    let year = currentYear;
    
    // Gérer le passage à l'année suivante (semaine > 52)
    if (week > 52) {
      week = week - 52;
      year = currentYear + 1;
    }
    
    weeks.push({ week, year });
  }
  
  return weeks;
}

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
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const weeksToFetch = getWeeksToFetch(8);
  
  console.log('🚀 Starting JSON fetch...');
  console.log(`📅 Current: Week ${currentWeek} of ${currentYear}`);
  console.log(`📆 Fetching ${weeksToFetch.length} weeks:\n`);
  
  // Afficher les semaines qui seront téléchargées
  weeksToFetch.forEach(({ week, year }) => {
    console.log(`   - Week ${week}/${year}`);
  });
  console.log('');
  
  // Créer le dossier data/weeks s'il n'existe pas
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  let totalSaved = 0;
  let totalSkipped = 0;
  
  for (const dept of DEPTS) {
    console.log(`\n📚 Department: ${dept}`);
    
    for (const { week, year } of weeksToFetch) {
      const data = await fetchWeek(dept, week, year);
      
      if (data) {
        saveWeek(dept, week, year, data);
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
