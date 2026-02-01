import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool as db } from "./db.js";

// Init express + chemins
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== TEST DB =====
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS nb FROM department");
    res.json({ ok: true, departments: rows[0].nb });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// --- JSON-based Routes ---

// 1) Liste des départements
app.get("/api/depts", (req, res) => {
  res.json(["CS", "GIM", "INFO", "RT"]);
});

// 2) Emploi du temps hebdo (JSON local pour l’instant)
// 2) Emploi du temps hebdo (depuis MySQL)
app.get("/api/schedule/:dept/:year/:week", async (req, res) => {
  const { dept, year, week } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        c.id,
        c.day,
        c.start_time,
        c.duration,
        c.course_type,
        r.name              AS room_name,
        m.name              AS module_name,
        m.abbrev            AS module_abbrev,
        m.color_bg,
        m.color_txt,
        t.identifier        AS tutor,
        g.id                AS gid,
        g.name              AS gname,
        g.train_prog        AS gtrain_prog
      FROM course c
      JOIN week w         ON c.week_id = w.id
      JOIN department d   ON w.dept_id = d.id
      LEFT JOIN room r    ON c.room_id = r.id
      LEFT JOIN module m  ON c.module_id = m.id
      LEFT JOIN tutor t   ON c.tutor_id = t.id
      LEFT JOIN course_group cg ON c.id = cg.course_id
      LEFT JOIN \`group\` g     ON cg.group_id = g.id
      WHERE d.code = ? AND w.year = ? AND w.week_num = ?
      ORDER BY c.day, c.start_time
      `,
      [dept, Number(year), Number(week)]
    );

    if (!rows.length) {
      return res.status(404).json([]);
    }

    // Reconstruire le JSON flOpEDT
    const byId = new Map();

    for (const row of rows) {
      if (!byId.has(row.id)) {
        byId.set(row.id, {
          id: row.id,
          day: row.day,
          start_time: row.start_time,
          duration: row.duration,
          room: { name: row.room_name },
          course: {
            type: row.course_type,
            module: {
              name: row.module_name,
              abbrev: row.module_abbrev,
              display: {
                color_bg: row.color_bg,
                color_txt: row.color_txt,
              },
            },
            groups: [],
          },
          tutor: row.tutor,
        });
      }
      const course = byId.get(row.id);
      if (row.gid) {
        course.course.groups.push({
          name: row.gname,
          train_prog: row.gtrain_prog,
        });
      }
    }

    res.json(Array.from(byId.values()));
  } catch (error) {
    console.error("Error reading schedule from DB:", error);
    res.status(500).json({ error: "Failed to read schedule data from DB" });
  }
});



// 3) Salles libres (calculées depuis la BD)
app.get("/api/free-rooms", async (req, res) => {
  const { dept, week, year } = req.query;

  if (!dept || !week || !year) {
    return res
      .status(400)
      .json({ error: "Missing required parameters: dept, week, year" });
  }

  try {
    // 1) Récupérer toutes les salles candidates (hors amphis, A011, Labo, combinées)
    const [roomsRows] = await db.query(
      `
      SELECT DISTINCT r.name
      FROM course c
      JOIN week w       ON c.week_id = w.id
      JOIN department d ON w.dept_id = d.id
      JOIN room r       ON c.room_id = r.id
      WHERE d.code = ? AND w.year = ? AND w.week_num = ?
      `,
      [dept, Number(year), Number(week)]
    );

    let allRooms = roomsRows
      .map((r) => r.name)
      .flatMap((roomName) => {
        // si salle combinée "B101-B102", on éclate en deux
        if (roomName.includes("-")) {
          const parts = roomName.split("-");
          if (parts.length === 2) return parts;
        }
        return [roomName];
      })
      .filter((room) => {
        const roomLower = room.toLowerCase();
        return (
          !roomLower.startsWith("amphi") &&
          room !== "A011" &&
          room !== "Labo" &&
          !room.includes("-")
        );
      });

    allRooms = Array.from(new Set(allRooms)).sort();

    // 2) Récupérer tous les créneaux occupés (par jour / start_time / salle)
    const [courses] = await db.query(
      `
      SELECT
        c.day,
        c.start_time,
        r.name AS room_name
      FROM course c
      JOIN week w       ON c.week_id = w.id
      JOIN department d ON w.dept_id = d.id
      JOIN room r       ON c.room_id = r.id
      WHERE d.code = ? AND w.year = ? AND w.week_num = ?
      `,
      [dept, Number(year), Number(week)]
    );

    // 3) Construire la liste des timeSlots (HH:MM)
    const timeSlotsSet = new Set();
    for (const c of courses) {
      if (c.start_time == null) continue;
      const hours = Math.floor(c.start_time / 60);
      const minutes = c.start_time % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      timeSlotsSet.add(timeStr);
    }
    const timeSlots = Array.from(timeSlotsSet).sort();

    // 4) Init schedule[day][time] = allRooms
    const schedule = {
      mo: {},
      tu: {},
      we: {},
      th: {},
      fr: {},
    };

    const dayMapping = {
      m: "mo",
      tu: "tu",
      w: "we",
      th: "th",
      f: "fr",
    };

    Object.keys(schedule).forEach((day) => {
      timeSlots.forEach((time) => {
        schedule[day][time] = [...allRooms];
      });
    });

    // 5) Retirer les salles occupées
    for (const c of courses) {
      if (c.start_time == null || !c.day || !c.room_name) continue;

      const hours = Math.floor(c.start_time / 60);
      const minutes = c.start_time % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      const dayKey =
        dayMapping[c.day.toLowerCase()] || c.day.toLowerCase();

      if (!schedule[dayKey] || !schedule[dayKey][timeStr]) continue;

      const roomName = c.room_name;

      if (roomName.includes("-")) {
        const parts = roomName.split("-");
        if (parts.length === 2) {
          schedule[dayKey][timeStr] = schedule[dayKey][timeStr].filter(
            (room) => room !== parts[0] && room !== parts[1]
          );
        }
      } else {
        schedule[dayKey][timeStr] = schedule[dayKey][timeStr].filter(
          (room) => room !== roomName
        );
      }
    }

    res.json({
      rooms: allRooms,
      week: parseInt(week),
      year: parseInt(year),
      timeSlots,
      schedule,
    });
  } catch (error) {
    console.error("Error calculating free rooms from DB:", error);
    res.status(500).json({ error: "Failed to calculate free rooms from DB" });
  }
});


// 4) Planning tuteur (depuis la BD)
app.get("/api/tutor-schedule", async (req, res) => {
  const { tutor, week, year } = req.query;

  if (!tutor || !week || !year) {
    return res
      .status(400)
      .json({ error: "Missing required parameters: tutor, week, year" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT
        c.id,
        c.day,
        c.start_time,
        c.duration,
        c.course_type,
        r.name              AS room_name,
        m.name              AS module_name,
        m.abbrev            AS module_abbrev,
        m.color_bg,
        m.color_txt,
        d.code              AS department,
        g.name              AS gname,
        g.train_prog        AS gtrain_prog
      FROM course c
      JOIN week w         ON c.week_id = w.id
      JOIN department d   ON w.dept_id = d.id
      LEFT JOIN room r    ON c.room_id = r.id
      LEFT JOIN module m  ON c.module_id = m.id
      LEFT JOIN tutor t   ON c.tutor_id = t.id
      LEFT JOIN course_group cg ON c.id = cg.course_id
      LEFT JOIN \`group\` g     ON cg.group_id = g.id
      WHERE t.identifier = ?
        AND w.year = ?
        AND w.week_num = ?
      ORDER BY c.day, c.start_time
      `,
      [tutor, Number(year), Number(week)]
    );

    // Regrouper par cours (id), récupérer groupes…
    const byId = new Map();
    for (const row of rows) {
      if (!byId.has(row.id)) {
        byId.set(row.id, {
          id: row.id,
          day: row.day,
          start_time: row.start_time,
          end_time: row.start_time + (row.duration ?? 90),
          duration: row.duration ?? 90,
          room_name: row.room_name || "N/A",
          module_name: row.module_name || "N/A",
          module_abbrev: row.module_abbrev || "N/A",
          course_type: row.course_type || "N/A",
          groups: [],
          train_prog: "N/A",
          department: row.department,
          display_color_bg: row.color_bg || "#6366f1",
          display_color_txt: row.color_txt || "#FFFFFF",
        });
      }
      const course = byId.get(row.id);
      if (row.gname) {
        course.groups.push(row.gname);
        if (course.train_prog === "N/A" && row.gtrain_prog) {
          course.train_prog = row.gtrain_prog;
        }
      }
    }

    const tutorCourses = Array.from(byId.values());

    // Tri identique
    const dayOrder = { m: 1, tu: 2, w: 3, th: 4, f: 5 };
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
      totalCourses: tutorCourses.length,
    });
  } catch (error) {
    console.error("Error fetching tutor schedule from DB:", error);
    res.status(500).json({ error: "Failed to fetch tutor schedule from DB" });
  }
});


// 5) Tuteurs (flOpEDT + cache)
let tutorsCache = null;
let tutorsCacheTime = 0;
const TUTORS_CACHE_DURATION = 24 * 60 * 60 * 1000;

app.get("/api/tutors", async (req, res) => {
  const { dept } = req.query;

  if (!dept) {
    return res
      .status(400)
      .json({ error: "Missing required parameter: dept" });
  }

  const now = Date.now();
  const cacheKey = `tutors_${dept}`;

  if (
    tutorsCache &&
    tutorsCache[cacheKey] &&
    now - tutorsCacheTime < TUTORS_CACHE_DURATION
  ) {
    return res.json(tutorsCache[cacheKey]);
  }

  try {
    const flopEdtUrl = `https://flopedt.iut-blagnac.fr/fr/api/user/tutor/?dept=${dept}`;
    console.log("Fetching tutors from:", flopEdtUrl);

    const response = await fetch(flopEdtUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Flop!EDT API returned ${response.status}`);
    }

    const tutors = await response.json();
    console.log("Tutors received:", tutors.length, "tutors");

    const tutorsMap = {};
    tutors.forEach((tutor) => {
      tutorsMap[tutor.username] = {
        username: tutor.username,
        first_name: tutor.first_name || "",
        last_name: tutor.last_name || "",
        email: tutor.email || "",
        departments: tutor.departments || [],
      };
    });

    if (!tutorsCache) tutorsCache = {};
    tutorsCache[cacheKey] = tutorsMap;
    tutorsCacheTime = now;

    res.json(tutorsMap);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    if (tutorsCache && tutorsCache[cacheKey]) {
      console.log("Returning stale cache due to error");
      return res.json(tutorsCache[cacheKey]);
    }
    res.status(500).json({ error: "Failed to fetch tutors data" });
  }
});

// Lancement serveur
const port = Number(process.env.PORT ?? 8000);
const host = process.env.HOST ?? "0.0.0.0";
app.listen(port, host, () =>
  console.log(`API listening on ${host}:${port}`)
);
