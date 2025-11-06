import express from "express";
import { pool } from "./db.js";

const router = express.Router();

// --- Helpers ---
function assertParams(res, obj, keys) {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null || obj[k] === "") {
      res.status(400).json({ error: `missing parameter: ${k}` });
      return false;
    }
  }
  return true;
}

function formatMinutes(min) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function colorFor(name, light = false) {
  const h = Math.abs([...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  const s = 55;
  const l = light ? 88 : 42;
  return `hsl(${h} ${s}% ${l}%)`;
}

// --- DB-based Routes (LEGACY - NOT USED) ---

// Distinct groups for a dept+promo (BUT1/2/3)
router.get("/groups", async (req, res) => {
  const { dept, train_prog } = req.query;
  if (!dept) return res.status(400).json({ error: "Missing dept" });

  try {
    let sql = `
      SELECT DISTINCT cg.group_name
      FROM course_groups cg
      JOIN scheduled_course sc ON cg.course_id = sc.id
      WHERE sc.dept = ?
    `;
    const params = [dept];

    if (train_prog) {
      sql += " AND sc.train_prog = ?";
      params.push(train_prog);
    }

    sql += " ORDER BY cg.group_name";

    const [rows] = await pool.execute(sql, params);
    const groups = rows.map((r) => r.group_name);
    res.json(groups);
  } catch (e) {
    console.error("Error in /api/groups:", e);
    res.status(500).json({ error: e.message });
  }
});

// Weeks available for dept+year (calendar year)
router.get("/weeks", async (req, res) => {
  const { dept, year } = req.query;
  if (!dept || !year) return res.status(400).json({ error: "dept and year required" });
  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT week FROM scheduled_course WHERE dept=? AND promo_year=? ORDER BY week`,
      [dept, Number(year)]
    );
    res.json(rows.map(r => r.week));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// EDT query
router.get("/edt/all", async (req, res) => {
  const dept = String(req.query.dept || "").trim();
  const trainProg = req.query.train_prog ? String(req.query.train_prog).trim() : null;
  const week = Number(req.query.week);
  const promoYear = Number(req.query.promo_year || req.query.year);
  const groupsParam = req.query.groups
    ? String(req.query.groups).split(",").map(g => g.trim()).filter(Boolean)
    : [];

  if (!dept || !week || !promoYear) {
    return res.status(400).json({ error: "dept, week, promo_year required" });
  }

  const params = [dept, week, promoYear];
  let sql = `
    SELECT
      sc.id,
      sc.external_id,
      sc.dept,
      sc.train_prog,
      sc.promo_year,
      sc.week,
      sc.day,
      sc.start_time,
      sc.end_time,
      sc.type AS course_type,
      m.name AS module_name,
      m.abbrev AS module_abbrev,
      t.username AS tutor_username,
      r.name AS room_name,
      GROUP_CONCAT(DISTINCT cg.group_name ORDER BY cg.group_name SEPARATOR ',') AS groups
    FROM scheduled_course sc
    LEFT JOIN module m ON sc.module_id = m.id
    LEFT JOIN room r ON sc.room_id = r.id
    LEFT JOIN tutor t ON sc.tutor_id = t.id
    LEFT JOIN course_groups cg ON cg.course_id = sc.id
    WHERE sc.dept = ? AND sc.week = ? AND sc.promo_year = ?
  `;

  if (trainProg) {
    sql += " AND sc.train_prog = ?";
    params.push(trainProg);
  }

  // MODIFICATION CLÉE : Filtrage hiérarchique des groupes
  if (groupsParam.length > 0) {
    // Pour chaque groupe demandé, inclure :
    // 1. Les cours pour ce groupe exact
    // 2. Les cours pour les parents de ce groupe (ex: "1" si on demande "1A")
    // 3. Les cours pour les enfants de ce groupe (ex: "1A" et "1B" si on demande "1")
    sql += ` AND EXISTS (
      SELECT 1 FROM course_groups cg2
      WHERE cg2.course_id = sc.id 
      AND (
        cg2.group_name IN (${groupsParam.map(() => "?").join(",")})
        OR EXISTS (
          SELECT 1 FROM group_hierarchy gh
          WHERE gh.dept = sc.dept
          AND (
            (gh.parent_group IN (${groupsParam.map(() => "?").join(",")}) AND cg2.group_name = gh.child_group)
            OR (gh.child_group IN (${groupsParam.map(() => "?").join(",")}) AND cg2.group_name = gh.parent_group)
          )
        )
      )
    )`;
    // Ajouter les paramètres 3 fois (exact, parent->child, child->parent)
    params.push(...groupsParam, ...groupsParam, ...groupsParam);
  }

  sql += " GROUP BY sc.id ORDER BY sc.day, sc.start_time";

  try {
    const [rows] = await pool.query(sql, params);
    res.json(
      rows.map(row => ({
        id: row.id,
        external_id: row.external_id,
        dept: row.dept,
        train_prog: row.train_prog,
        promo_year: row.promo_year,
        week: row.week,
        day: row.day,
        start_time: row.start_time,
        end_time: row.end_time,
        course_type: row.course_type,
        module_name: row.module_name,
        module_abbrev: row.module_abbrev,
        tutor_username: row.tutor_username,
        room_name: row.room_name,
        display_color_bg: colorFor(row.module_abbrev || row.module_name || 'default'),
        display_color_txt: '#FFFFFF',
        groups: row.groups ? row.groups.split(",").map(g => g.trim()).filter(Boolean) : [],
      }))
    );
  } catch (e) {
    console.error("SQL Error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

// Free rooms endpoint - returns available B--- rooms (INFO building)
router.get("/free-rooms", async (req, res) => {
  const { dept, week, year } = req.query;
  
  if (!assertParams(res, { dept, week, year }, ["dept", "week", "year"])) return;

  try {
    // 1. Get all B--- rooms (INFO building rooms), excluding combined rooms (e.g., "B101-B102")
    const [allRooms] = await pool.query(
      "SELECT DISTINCT name FROM room WHERE name LIKE 'B%' AND name NOT LIKE '%-%' AND name NOT LIKE '%+%' ORDER BY name"
    );
    let roomNames = allRooms.map(r => r.name);

    if (roomNames.length === 0) {
      return res.json({ rooms: roomNames, schedule: {}, timeSlots: [] });
    }

    // 2. Get ALL courses (all depts: INFO, CS, GIM, RT) that use B--- rooms
    //    for the given week and year
    const [occupiedSlots] = await pool.query(
      `SELECT DISTINCT
        sc.day,
        sc.start_time,
        sc.end_time,
        r.name as room_name
       FROM scheduled_course sc
       INNER JOIN room r ON sc.room_id = r.id
       WHERE sc.week = ?
         AND sc.promo_year = ?
         AND r.name LIKE 'B%'
       ORDER BY sc.day, sc.start_time`,
      [week, year]
    );

    // 3. Parse combined rooms and mark individual rooms as occupied
    // If "B101-B102" is used, mark both B101 and B102 as occupied
    const occupied = {};
    const occupiedRoomsToExclude = new Set();
    
    for (const slot of occupiedSlots) {
      const day = slot.day;
      const roomName = slot.room_name;
      
      // Check if it's a combined room (contains - or +)
      if (roomName.includes('-') || roomName.includes('+')) {
        // Extract individual room numbers
        const separator = roomName.includes('-') ? '-' : '+';
        const parts = roomName.split(separator).map(p => p.trim());
        
        for (const part of parts) {
          occupiedRoomsToExclude.add(part);
          if (!occupied[day]) occupied[day] = {};
          if (!occupied[day][part]) occupied[day][part] = [];
          occupied[day][part].push({
            start: slot.start_time,
            end: slot.end_time,
          });
        }
      } else {
        if (!occupied[day]) occupied[day] = {};
        if (!occupied[day][roomName]) occupied[day][roomName] = [];
        occupied[day][roomName].push({
          start: slot.start_time,
          end: slot.end_time,
        });
      }
    }

    // 4. Normalize course times and collect unique slots
    // Map 11:05 -> 11:00 and 17:20 -> 17:15 (standard IUT slots)
    const normalizeTime = (minutes) => {
      if (minutes === 665) return 660;  // 11:05 -> 11:00
      if (minutes === 1040) return 1035; // 17:20 -> 17:15
      return minutes;
    };
    
    // Collect normalized start times
    const allStartTimes = new Set();
    for (const slot of occupiedSlots) {
      const normalized = normalizeTime(slot.start_time);
      // Filter out clearly end-times (12:35 = 755)
      if (normalized !== 755 && normalized >= 480 && normalized < 1140) {
        allStartTimes.add(normalized);
      }
    }
    const timeSlots = Array.from(allStartTimes).sort((a, b) => a - b);

    // If no courses, use default slots
    if (timeSlots.length === 0) {
      for (let t = 8 * 60; t < 19 * 60; t += 90) { // Every 1h30
        timeSlots.push(t);
      }
    }

    // 5. For each day and time slot, determine which rooms are free
    const days = ["mo", "tu", "we", "th", "fr"];
    const schedule = {};

    for (const day of days) {
      schedule[day] = {};
      
      for (const slotStart of timeSlots) {
        const freeRooms = [];

        for (const room of roomNames) {
          // Check if room is occupied during this slot
          // Consider tolerance: 11:00 slot includes courses starting at 11:05
          const roomOccupied = (occupied[day] && occupied[day][room]) || [];
          const isOccupied = roomOccupied.some(({ start, end }) => {
            // Normalize the course start time
            const normalizedStart = normalizeTime(start);
            // Check if course overlaps with this slot (with 10min tolerance)
            // A course starting at 11:05 should occupy the 11:00 slot
            return (normalizedStart <= slotStart + 10) && (end > slotStart);
          });

          if (!isOccupied) {
            freeRooms.push(room);
          }
        }

        const slotKey = formatMinutes(slotStart);
        schedule[day][slotKey] = freeRooms;
      }
    }

    res.json({
      rooms: roomNames,
      week: parseInt(week),
      year: parseInt(year),
      timeSlots: timeSlots.map(formatMinutes),
      schedule,
    });
  } catch (e) {
    console.error("Free rooms error:", e);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
