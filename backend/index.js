import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- JSON-based Routes ---

// Simple constant depts list
app.get("/api/depts", (req, res) => {
  res.json(["CS", "GIM", "INFO", "RT"]);
});

// ===== JSON FILE ENDPOINT =====
// Servir les JSON locaux directement (sans DB)
app.get("/api/schedule/:dept/:year/:week", (req, res) => {
  const { dept, year, week } = req.params;
  
  const weekPadded = week.padStart(2, '0');
  const jsonPath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${weekPadded}.json`);
  
  if (!fs.existsSync(jsonPath)) {
    return res.status(404).json({ 
      error: `No data found for ${dept} week ${week}/${year}`,
      path: jsonPath
    });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    // Retourner TOUS les cours (BUT1, BUT2, BUT3)
    // Le filtrage par train_prog est fait côté frontend
    res.json(data);
  } catch (error) {
    console.error('Error reading JSON:', error);
    res.status(500).json({ error: 'Failed to read schedule data' });
  }
});

// ===== FREE ROOMS ENDPOINT =====
// Calculate free rooms for a given week
app.get("/api/free-rooms", (req, res) => {
  const { dept, week, year } = req.query;
  
  if (!dept || !week || !year) {
    return res.status(400).json({ error: 'Missing required parameters: dept, week, year' });
  }
  
  const weekPadded = week.padStart(2, '0');
  const jsonPath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${weekPadded}.json`);
  
  if (!fs.existsSync(jsonPath)) {
    return res.status(404).json({ 
      error: `No data found for ${dept} week ${week}/${year}`
    });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    
    // Extract all unique rooms from the schedule
    const allRoomsSet = new Set();
    data.forEach(item => {
      if (item.room && item.room.name) {
        const roomName = item.room.name;
        // If it's a combined room (e.g., "B101-B102"), add both individual rooms
        if (roomName.includes('-')) {
          const parts = roomName.split('-');
          if (parts.length === 2) {
            allRoomsSet.add(parts[0]);
            allRoomsSet.add(parts[1]);
          }
        } else {
          allRoomsSet.add(roomName);
        }
      }
    });
    
    // Filter out amphitheatres, A011, Labo, and combined rooms
    const allRooms = Array.from(allRoomsSet)
      .filter(room => {
        const roomLower = room.toLowerCase();
        // Exclude amphitheatres (Amphi, Amphi1, Amphi2, etc.), A011, Labo, and combined rooms
        return !roomLower.startsWith('amphi') && 
               room !== 'A011' && 
               room !== 'Labo' &&
               !room.includes('-'); // Exclude combined rooms like "B101-B102"
      })
      .sort();
    
    // Extract all unique time slots (course start times)
    const timeSlotsSet = new Set();
    data.forEach(item => {
      if (item.start_time !== undefined) {
        const hours = Math.floor(item.start_time / 60);
        const minutes = item.start_time % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        timeSlotsSet.add(timeStr);
      }
    });
    const timeSlots = Array.from(timeSlotsSet).sort();
    
    // Build schedule: { day: { time: [free rooms] } }
    const schedule = {
      mo: {},
      tu: {},
      we: {},
      th: {},
      fr: {}
    };
    
    // Map flopedt day format to frontend format
    const dayMapping = {
      'm': 'mo',
      'tu': 'tu',
      'w': 'we',
      'th': 'th',
      'f': 'fr'
    };
    
    // Initialize all time slots with all rooms as free
    Object.keys(schedule).forEach(day => {
      timeSlots.forEach(time => {
        schedule[day][time] = [...allRooms];
      });
    });
    
    // Mark rooms as occupied based on courses
    data.forEach(item => {
      if (!item.room || !item.room.name || item.start_time === undefined || !item.day) {
        return;
      }
      
      const hours = Math.floor(item.start_time / 60);
      const minutes = item.start_time % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const dayKey = dayMapping[item.day.toLowerCase()] || item.day.toLowerCase();
      
      if (schedule[dayKey] && schedule[dayKey][timeStr]) {
        const roomName = item.room.name;
        
        // If it's a combined room (e.g., "B101-B102"), mark both rooms as occupied
        if (roomName.includes('-')) {
          const parts = roomName.split('-');
          if (parts.length === 2) {
            schedule[dayKey][timeStr] = schedule[dayKey][timeStr].filter(
              room => room !== parts[0] && room !== parts[1]
            );
          }
        } else {
          // Remove this room from free rooms list
          schedule[dayKey][timeStr] = schedule[dayKey][timeStr].filter(
            room => room !== roomName
          );
        }
      }
    });
    
    res.json({
      rooms: allRooms,
      week: parseInt(week),
      year: parseInt(year),
      timeSlots: timeSlots,
      schedule: schedule
    });
  } catch (error) {
    console.error('Error calculating free rooms:', error);
    res.status(500).json({ error: 'Failed to calculate free rooms' });
  }
});

// ===== TUTOR SCHEDULE ENDPOINT =====
// Get the schedule of a specific tutor across all departments
app.get("/api/tutor-schedule", (req, res) => {
  const { tutor, week, year } = req.query;
  
  if (!tutor || !week || !year) {
    return res.status(400).json({ error: 'Missing required parameters: tutor, week, year' });
  }
  
  const weekPadded = week.padStart(2, '0');
  const departments = ["CS", "GIM", "INFO", "RT"];
  const tutorCourses = [];
  
  try {
    // Parcourir tous les départements pour trouver les cours du prof
    for (const dept of departments) {
      const jsonPath = path.join(__dirname, 'data', 'weeks', dept, `${year}-W${weekPadded}.json`);
      
      if (!fs.existsSync(jsonPath)) {
        continue; // Skip if no data for this dept/week
      }
      
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      
      // Filtrer les cours de ce tuteur
      const coursesForTutor = data.filter(item => item.tutor === tutor);
      
      // Ajouter le département à chaque cours et normaliser
      coursesForTutor.forEach(item => {
        tutorCourses.push({
          id: item.id,
          day: item.day,
          start_time: item.start_time,
          end_time: item.start_time + (item.course?.duration || 90), // Durée par défaut 1h30
          duration: item.course?.duration || 90,
          room_name: item.room?.name || 'N/A',
          module_name: item.course?.module?.name || 'N/A',
          module_abbrev: item.course?.module?.abbrev || 'N/A',
          course_type: item.course?.type || 'N/A',
          groups: (item.course?.groups || []).map(g => g.name),
          train_prog: (item.course?.groups || [])[0]?.train_prog || 'N/A',
          department: dept,
          display_color_bg: item.course?.module?.display?.color_bg || '#6366f1',
          display_color_txt: item.course?.module?.display?.color_txt || '#FFFFFF',
        });
      });
    }
    
    // Trier par jour puis par heure de début
    const dayOrder = { 'm': 1, 'tu': 2, 'w': 3, 'th': 4, 'f': 5 };
    tutorCourses.sort((a, b) => {
      const dayDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time - b.start_time;
    });
    
    res.json({
      tutor,
      week: parseInt(week),
      year: parseInt(year),
      courses: tutorCourses,
      totalCourses: tutorCourses.length
    });
  } catch (error) {
    console.error('Error fetching tutor schedule:', error);
    res.status(500).json({ error: 'Failed to fetch tutor schedule' });
  }
});

// ===== TUTORS ENDPOINT =====
// Fetch tutors from Flop!EDT API with caching
let tutorsCache = null;
let tutorsCacheTime = 0;
const TUTORS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

app.get("/api/tutors", async (req, res) => {
  const { dept } = req.query;
  
  if (!dept) {
    return res.status(400).json({ error: 'Missing required parameter: dept' });
  }
  
  const now = Date.now();
  const cacheKey = `tutors_${dept}`;
  
  // Check cache
  if (tutorsCache && tutorsCache[cacheKey] && (now - tutorsCacheTime) < TUTORS_CACHE_DURATION) {
    return res.json(tutorsCache[cacheKey]);
  }
  
  try {
    // Fetch from Flop!EDT API - sans filtres week/year pour avoir TOUS les tuteurs
    const flopEdtUrl = `https://flopedt.iut-blagnac.fr/fr/api/user/tutor/?dept=${dept}`;
    console.log('Fetching tutors from:', flopEdtUrl);
    
    const response = await fetch(flopEdtUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Flop!EDT API returned ${response.status}`);
    }
    
    const tutors = await response.json();
    console.log('Tutors received:', tutors.length, 'tutors');
    
    // Transform the data to a simpler format with username as key
    const tutorsMap = {};
    tutors.forEach(tutor => {
      tutorsMap[tutor.username] = {
        username: tutor.username,
        first_name: tutor.first_name || '',
        last_name: tutor.last_name || '',
        email: tutor.email || '',
        departments: tutor.departments || []
      };
    });
    
    // Update cache
    if (!tutorsCache) tutorsCache = {};
    tutorsCache[cacheKey] = tutorsMap;
    tutorsCacheTime = now;
    
    res.json(tutorsMap);
  } catch (error) {
    console.error('Error fetching tutors:', error);
    
    // Return cached data if available, even if expired
    if (tutorsCache && tutorsCache[cacheKey]) {
      console.log('Returning stale cache due to error');
      return res.json(tutorsCache[cacheKey]);
    }
    
    res.status(500).json({ error: 'Failed to fetch tutors data' });
  }
});

const port = Number(process.env.PORT ?? 8000);
const host = process.env.HOST ?? '0.0.0.0'; // Écoute sur toutes les interfaces (y compris WireGuard)
app.listen(port, host, () => console.log(`API listening on ${host}:${port}`));
