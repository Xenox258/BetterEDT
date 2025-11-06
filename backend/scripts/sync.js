#!/usr/bin/env node
import { pool, withTx } from "../db.js";

// CLI ex: --weeks=17 --year=2025 --depts=INFO,CS --base=https://flopedt.iut-blagnac.fr --clean=true
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? true];
}));

const BASE = args.base ?? process.env.SOURCE_BASE ?? "https://flopedt.iut-blagnac.fr";
const API_ROOT = `${BASE.replace(/\/$/, "")}/fr/api`;

// Depts et promos
const DEPTS = (args.depts ?? process.env.DEPTS ?? "CS,GIM,INFO,RT").split(",").map(s => s.trim()).filter(Boolean);
const PROMOS = ["BUT1", "BUT2", "BUT3"];
function getTrainProgsForDept(dept) {
  // Départements avec codes spécifiques
  const customCodes = {
    'CS': ['CS1', 'CS2', 'CS3'],
    'GIM': ['GIM1', 'GIM2', 'GIM3'],
    'INFO': ['BUT1', 'BUT2', 'BUT3'],
    'RT': ['BUT1', 'BUT2', 'BUT3']
  };
  
  // Retourner les codes custom si définis, sinon BUT1/2/3 par défaut
  return customCodes[dept] || ['BUT1', 'BUT2', 'BUT3'];
}

// Année et semaines
const year = Number(args.year ?? new Date().getFullYear());
const weekRange = String(args.weeks ?? "1-53")
  .split(",")
  .flatMap(r => {
    if (r.includes("-")) {
      const [a, b] = r.split("-").map(Number);
      return Array.from({ length: b - a + 1 }, (_, i) => a + i);
    }
    return [Number(r)];
  })
  .filter(n => Number.isFinite(n) && n >= 1 && n <= 53);

// Option: nettoyer avant insertion (évite doublons si pas de clé unique solide)
const CLEAN_BEFORE = String(args.clean ?? "true").toLowerCase() !== "false";
const DEBUG = String(args.debug ?? "false").toLowerCase() === "true";

// --- Utils ---
function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x == null) return [];
  if (typeof x === "object" && Array.isArray(x.results)) return x.results;
  return [x];
}
function buildUrl(path, params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.append(k, String(v));
  }
  return `${API_ROOT}${path}${sp.toString() ? `?${sp}` : ""}`;
}
async function fetchPaginated(url) {
  const out = [];
  let next = url;
  while (next) {
    const data = await j(next);
    if (DEBUG) console.log(`  GET ${next} -> keys: ${Object.keys(data || {}).join(",") || typeof data}`);
    if (Array.isArray(data)) {
      out.push(...data);
      break;
    }
    if (data && Array.isArray(data.results)) {
      out.push(...data.results);
      next = data.next || null;
      continue;
    }
    break;
  }
  return out;
}

async function j(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API request to ${url} failed with status ${res.status}: ${body}`);
  }
  return res.json();
}
function dayTokenFromDate(date) {
  const idx = date.getDay();
  return ["su", "mo", "tu", "we", "th", "fr", "sa"][idx] ?? "mo";
}
function hhmmLocalMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}
function normalizeDateString(str) {
  const s = String(str || "").trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?([+-]\d{2}:?\d{2}|Z)?$/.test(s)) {
    if (s.includes("T")) return s.includes("+") || /[Zz]$/.test(s) ? s : `${s}:00Z`;
    return s.replace(" ", "T") + (s.includes("+") || /[Zz]$/.test(s) ? "" : ":00Z");
  }

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const hhmm = s.length === 5 ? `${s}:00` : s;
    return `1970-01-01T${hhmm}Z`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const match = s.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (match) {
      const [, dd, mm, yyyy, hh, min, sec] = match;
      return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec ?? "00"}Z`;
    }
  }

  return s;
}
function normalizeDay(dayCode) {
  const code = String(dayCode || "").trim().toLowerCase();
  
  const mapping = {
    // Lundi
    'm': 'mo',
    'mo': 'mo',
    'mon': 'mo',
    'monday': 'mo',
    'lundi': 'mo',
    
    // Mardi
    'tu': 'tu',
    'tue': 'tu',
    'tuesday': 'tu',
    'mardi': 'tu',
    
    // Mercredi
    'w': 'we',
    'we': 'we',
    'wed': 'we',
    'wednesday': 'we',
    'mercredi': 'we',
    
    // Jeudi
    'th': 'th',
    'thu': 'th',
    'thursday': 'th',
    'jeudi': 'th',
    
    // Vendredi
    'f': 'fr',
    'fr': 'fr',
    'fri': 'fr',
    'friday': 'fr',
    'vendredi': 'fr',
    
    // Samedi
    's': 'sa',
    'sa': 'sa',
    'sat': 'sa',
    'saturday': 'sa',
    'samedi': 'sa',
    
    // Dimanche
    'su': 'su',
    'sun': 'su',
    'sunday': 'su',
    'dimanche': 'su'
  };
  
  const normalized = mapping[code];
  
  if (!normalized && DEBUG) {
    console.warn(`⚠️  Unknown day code: "${dayCode}" (normalized to: "${code}")`);
  }
  
  return normalized || code;
}

function parseDateTime(value) {
  if (value instanceof Date && !Number.isNaN(+value)) return value;
  if (typeof value === "number") return new Date(value);
  if (value && typeof value === "object") {
    const candidates = [
      value.iso, value.start, value.begin, value.date,
      value.datetime, value.value, value.text,
    ].filter(Boolean);
    for (const cand of candidates) {
      const d = parseDateTime(cand);
      if (d) return d;
    }
  }
  if (typeof value === "string") {
    const norm = normalizeDateString(value);
    if (norm) {
      const d = new Date(norm);
      if (!Number.isNaN(+d)) return d;
    }
  }
  return null;
}

// --- Upserts (supposent index unique (dept,name)/(dept,username)) ---
async function upsertModule(conn, dept, name, abbrev) {
  if (!name) name = "Module";
  await conn.execute(
    "INSERT INTO module (dept, name, abbrev) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE abbrev=VALUES(abbrev)",
    [dept, name, abbrev ?? null]
  );
  const [[row]] = await conn.execute("SELECT id FROM module WHERE dept=? AND name=?", [dept, name]);
  return row?.id;
}
async function upsertRoom(conn, dept, name) {
  if (!name) return null;
  await conn.execute(
    "INSERT INTO room (dept, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name",
    [dept, name]
  );
  const [[row]] = await conn.execute("SELECT id FROM room WHERE dept=? AND name=?", [dept, name]);
  return row?.id;
}
async function upsertTutor(conn, dept, username) {
  if (!username) return null;
  await conn.execute(
    "INSERT INTO tutor (dept, username) VALUES (?, ?) ON DUPLICATE KEY UPDATE username=username",
    [dept, username]
  );
  const [[row]] = await conn.execute("SELECT id FROM tutor WHERE dept=? AND username=?", [dept, username]);
  return row?.id;
}

// --- Groups: fetch + hierarchy ---
function flattenGroups(node) {
  if (!node || !node.name) return [];
  const all = [node.name];
  asArray(node.children).forEach(ch => { all.push(...flattenGroups(ch)); });
  return all;
}

async function fetchAllGroups(dept) {
  const map = new Map();
  const promos = getTrainProgsForDept(dept); // <-- CHANGEMENT ICI
  
  for (const promo of promos) {
    try {
      const structural = await j(
        `${API_ROOT}/groups/structural/tree/?dept=${encodeURIComponent(dept)}&train_prog=${promo}`
      );
      const transversal = await j(
        `${API_ROOT}/groups/transversal/?dept=${encodeURIComponent(dept)}&train_prog=${promo}`
      ).catch(() => []);

      const visit = (nodes) => {
        asArray(nodes).forEach((n) => {
          if (n?.id && n?.name) map.set(n.id, n.name);
          if (n?.children) visit(n.children);
        });
      };
      visit(structural);
      asArray(transversal).forEach((g) => {
        if (g?.id && g?.name) map.set(g.id, g.name);
      });
    } catch (e) {
      if (DEBUG) console.warn(`  [WARN] fetchAllGroups(${dept},${promo}): ${e.message}`);
    }
  }
  console.log(`  Fetched ${map.size} groups for ${dept}.`);
  return map;
}


async function buildGroupHierarchy(conn, dept) {
  console.log(`  Building group hierarchy for ${dept}...`);
  await conn.execute("DELETE FROM group_hierarchy WHERE dept=?", [dept]);

   const promos = getTrainProgsForDept(dept);

  for (const promo of promos) {
    try {
      const structural = await j(
        `${API_ROOT}/groups/structural/tree/?dept=${encodeURIComponent(dept)}&train_prog=${promo}`
      );
      
      const addEdges = async (node, parent = null) => {
        if (!node?.name) return;
        
        // Auto-référence (chaque groupe est son propre parent)
        await conn.execute(
          "INSERT IGNORE INTO group_hierarchy (dept, parent_group, child_group) VALUES (?, ?, ?)",
          [dept, node.name, node.name]
        );
        
        // Relation parent->enfant
        if (parent?.name && parent.name !== node.name) {
          await conn.execute(
            "INSERT IGNORE INTO group_hierarchy (dept, parent_group, child_group) VALUES (?, ?, ?)",
            [dept, parent.name, node.name]
          );
        }
        
        // Traiter récursivement les enfants
        for (const ch of asArray(node.children)) {
          await addEdges(ch, node);
        }
      };
      
      for (const root of asArray(structural)) {
        await addEdges(root, null);
      }

      // Groupes transversaux
      const transversal = await j(
        `${API_ROOT}/groups/transversal/?dept=${encodeURIComponent(dept)}&train_prog=${promo}`
      ).catch(() => []);
      
      for (const g of asArray(transversal)) {
        if (!g?.name) continue;
        
        // Auto-référence
        await conn.execute(
          "INSERT IGNORE INTO group_hierarchy (dept, parent_group, child_group) VALUES (?, ?, ?)",
          [dept, g.name, g.name]
        );
        
        // Groupes en conflit (même niveau hiérarchique)
        for (const child of asArray(g.conflicting_groups)) {
          if (!child?.name) continue;
          await conn.execute(
            "INSERT IGNORE INTO group_hierarchy (dept, parent_group, child_group) VALUES (?, ?, ?)",
            [dept, g.name, child.name]
          );
        }
      }
      
      if (DEBUG) console.log(`  ✓ Built hierarchy for ${promo}`);
      
    } catch (e) {
      console.warn(`  [WARN] buildGroupHierarchy(${dept},${promo}): ${e.message}`);
    }
  }
  
  // Vérifier le nombre de relations créées
  const [[count]] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM group_hierarchy WHERE dept=?",
    [dept]
  );
  console.log(`  ✓ Created ${count.cnt} hierarchy relations for ${dept}`);
}


async function fetchGroupsByPromo(dept) {
   const promos = getTrainProgsForDept(dept);
  const map = {};
  for (const promo of promos) {
    try {
      // Essayer plusieurs endpoints
      const endpoints = [
        `${API_ROOT}/groups/?dept=${dept}&train_prog=${promo}`,
        `${API_ROOT}/groups/structural/?dept=${dept}&train_prog=${promo}`,
        `${API_ROOT}/fetch/groups/?dept=${dept}&train_prog=${promo}`,
      ];

      let groups = [];
      for (const url of endpoints) {
        try {
          if (DEBUG) console.log(`  Trying: ${url}`);
          const data = await j(url);
          if (Array.isArray(data) && data.length > 0) {
            groups = data.map(g => g.name || g.code || g).filter(Boolean);
            if (DEBUG) console.log(`  ✓ Found ${groups.length} groups for ${promo}`);
            break;
          }
        } catch (e) {
          if (DEBUG) console.log(`  ✗ ${url} failed: ${e.message}`);
        }
      }

      map[promo] = groups;
    } catch (e) {
      if (DEBUG) console.warn(`  [WARN] fetchGroupsByPromo(${dept},${promo}): ${e.message}`);
      map[promo] = [];
    }
  }
  
  const total = Object.values(map).flat().length;
  console.log(`  Fetched ${total} total groups for ${dept}`);
  return map;
}

// --- Scheduled courses ---
async function fetchScheduled(dept, week, year) {
  const acc = [];
  const promos = getTrainProgsForDept(dept);
  for (const promo of promos) {
    try {
      const url = buildUrl("/fetch/scheduledcourses/", {
        dept,
        train_prog: promo,
        week,
        year
      });

      const arr = await fetchPaginated(url);
      if (DEBUG) console.log(`  ${dept}/${promo} week ${week} -> ${arr.length} items`);
      
      if (arr.length > 0) {
        // IMPORTANT: Associer chaque cours au train_prog qui l'a récupéré
        const withPromo = arr.map(item => ({ ...item, _fetched_train_prog: promo }));
        acc.push(...withPromo);
      }
      
    } catch (e) {
      if (DEBUG) console.log(`  [ERROR] ${dept}/${promo}: ${e.message}`);
    }
  }
  
  return acc;
}


function pickModule(it) {
  const module = it.course?.module || {};
  return {
    name: module.name || null,
    abbrev: module.abbrev || null
  };
}

function pickCourseType(it) {
  return it.course?.type || null;
}

function pickRoom(it) {
  return it.room?.name || null;
}

function pickTutor(it) {
  return it.tutor || null; // Déjà un string direct
}



function pickGroupIds(it) {
  if (Array.isArray(it.group_ids)) return it.group_ids;
  if (Array.isArray(it.groups)) {
    return it.groups.map(g => {
      if (typeof g === "number") return g;
      if (typeof g === "object") return g.id ?? g.group_id ?? null;
      return null;
    }).filter(Boolean);
  }
  return [];
}
function pickGroupNames(it) {
  if (it.course?.groups && Array.isArray(it.course.groups)) {
    return it.course.groups.map(g => g.name).filter(Boolean);
  }
  return [];
}
function computeExternalId(dept, week, it) {
  // PRIORITÉ 1 : Utiliser l'ID de l'API si présent
  if (it.id != null && it.id !== '' && it.id !== 0) {
    return `flopedt-${it.id}`;
  }
  
  // PRIORITÉ 2 : Construire une clé unique avec TOUS les champs
  const promo = it._fetched_train_prog || 'UNK';
  const day = it.day || 'XX';
  const start = String(it.start_time ?? '0').padStart(4, '0');
  const end = String(it.end_time ?? '0').padStart(4, '0');
  const room = (pickRoom(it) || 'NOROOM').replace(/\W/g, '_');
  const module = (pickModule(it).name || 'NOMOD').replace(/\W/g, '_');
  const tutor = (pickTutor(it) || 'NOTUT').replace(/\W/g, '_');
  const groups = pickGroupNames(it).sort().join('-') || 'NOGRP';
  
  // Clé texte ultra-spécifique
  const key = `${dept}|${year}|W${week}|${promo}|${day}|${start}-${end}|${room}|${module}|${tutor}|${groups}`;
  
  // Hash SHA-like simple mais fiable
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Ajouter un timestamp pour garantir l'unicité absolue
  const timestamp = Date.now() % 1000000; // 6 derniers chiffres du timestamp
  
  return `gen-${Math.abs(hash)}-${timestamp}`;
}

function promoOfGroup(groupsByPromo, groupName) {
  if (!groupName) return null;
  
  // Chercher dans tous les promos disponibles
  for (const [promo, groups] of Object.entries(groupsByPromo)) {
    if (groups?.includes(groupName)) return promo;
  }
  
  // Fallback: détecter depuis le nom du groupe
  const g = String(groupName).toUpperCase();
  
  // Pour CS
  if (g.includes("CS1") || (g.includes("CS") && g.match(/\b1[A-Z]?\b/))) return "CS1";
  if (g.includes("CS2") || (g.includes("CS") && g.match(/\b2[A-Z]?\b/))) return "CS2";
  if (g.includes("CS3") || (g.includes("CS") && g.match(/\b3[A-Z]?\b/))) return "CS3";
  
  // Pour GIM
  if (g.includes("GIM1") || (g.includes("GIM") && g.match(/\b1[A-Z]?\b/))) return "GIM1";
  if (g.includes("GIM2") || (g.includes("GIM") && g.match(/\b2[A-Z]?\b/))) return "GIM2";
  if (g.includes("GIM3") || (g.includes("GIM") && g.match(/\b3[A-Z]?\b/))) return "GIM3";
  
  // Pour INFO et RT (BUT standard)
  if (g.includes("BUT1") || g.match(/\b1[A-Z]?\b/)) return "BUT1";
  if (g.includes("BUT2") || g.match(/\b2[A-Z]?\b/)) return "BUT2";
  if (g.includes("BUT3") || g.match(/\b3[A-Z]?\b/)) return "BUT3";
  
  return null;
}


async function saveScheduledBatch(conn, dept, week, year, groupsByPromo, allGroupsMap, items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  let saved = 0;

  for (const it of items) {
    try {
      const startMin = parseMinutes(it.start_time);
      const endMin = parseMinutes(it.end_time, true, startMin) || (startMin + 90);
      const dayTok = normalizeDay(it.day);

      if (startMin === null || !dayTok || !(startMin < endMin)) {
        if (DEBUG) console.log(`  [SKIP] invalid data ${it.id}`);
        continue;
      }

      // module/room/tutor
      const { name: moduleName, abbrev: moduleAbbrev } = pickModule(it);
      const roomName = pickRoom(it);
      const tutorName = pickTutor(it);

      const moduleId = await upsertModule(conn, dept, moduleName, moduleAbbrev);
      const roomId = await upsertRoom(conn, dept, roomName);
      const tutorId = await upsertTutor(conn, dept, tutorName);

      // groupes
      const ids = pickGroupIds(it);
      const namesFromIds = ids.map(id => allGroupsMap.get(id)).filter(Boolean);
      const names = namesFromIds.length ? namesFromIds : pickGroupNames(it);
      const uniqueNames = [...new Set(names.filter(Boolean))];

      // promo
      const promo = it._fetched_train_prog || promoOfGroup(groupsByPromo, uniqueNames[0]) || null;

      // external_id
      const externalId = computeExternalId(dept, week, it);

      const sql = `
        INSERT INTO scheduled_course
          (external_id, dept, train_prog, promo_year, week, day, start_time, end_time, type, module_id, room_id, tutor_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          id=LAST_INSERT_ID(id),
          start_time=VALUES(start_time),
          end_time=VALUES(end_time),
          type=VALUES(type),
          module_id=VALUES(module_id),
          room_id=VALUES(room_id),
          tutor_id=VALUES(tutor_id),
          updated_at=CURRENT_TIMESTAMP
      `;
      const params = [
        externalId, dept, promo, year, week, dayTok,
        startMin, endMin, pickCourseType(it), moduleId ?? null, roomId ?? null, tutorId ?? null
      ];
      const [res] = await conn.execute(sql, params);
      const courseId = res.insertId || res.insertId === 0 ? res.insertId : null;

      if (courseId && uniqueNames.length) {
        // MODIFICATION : Inclure aussi les enfants des groupes
        const allGroupsToInsert = new Set(uniqueNames);
        
        for (const groupName of uniqueNames) {
          // Récupérer les enfants de ce groupe depuis group_hierarchy
          const [children] = await conn.query(
            "SELECT child_group FROM group_hierarchy WHERE dept=? AND parent_group=? AND parent_group != child_group",
            [dept, groupName]
          );
          
          children.forEach(row => allGroupsToInsert.add(row.child_group));
        }
        
        const values = [...allGroupsToInsert].map(n => [courseId, n]);
        await conn.query("INSERT IGNORE INTO course_groups (course_id, group_name) VALUES ?", [values]);
      }

      saved++;
    } catch (e) {
      console.error(`  [ERROR] save item ${it.id || 'unknown'}: ${e.message}`);
      if (DEBUG) console.error(e);
    }
  }
  return saved;
}


async function main() {
  console.log(`Starting sync for year ${year}, weeks: ${weekRange.join(", ")}`);
  for (const dept of DEPTS) {
    await withTx(async (conn) => {
      console.log(`[${dept}] Syncing...`);

      await buildGroupHierarchy(conn, dept);
      const allGroupsMap = await fetchAllGroups(dept);
      const groupsByPromo = await fetchGroupsByPromo(dept);

      for (const week of weekRange) {
        if (CLEAN_BEFORE) {
          await conn.execute("DELETE FROM course_groups WHERE course_id IN (SELECT id FROM scheduled_course WHERE dept=? AND week=? AND promo_year=?)", [dept, week, year]);
          await conn.execute("DELETE FROM scheduled_course WHERE dept=? AND week=? AND promo_year=?", [dept, week, year]);
        }

        console.log(`  Week ${week}: fetching scheduled...`);
        try {
          const items = await fetchScheduled(dept, week, year);
          if (DEBUG) console.log(`  Week ${week}: fetched ${Array.isArray(items) ? items.length : 0} raw items`);
          const saved = await saveScheduledBatch(conn, dept, week, year, groupsByPromo, allGroupsMap, asArray(items));
          console.log(`  Week ${week}: saved ${saved} items.`);
        } catch (e) {
          console.error(`  [ERROR] Week ${week}: ${e.message}`);
        }
      }
    });
  }
  console.log("Sync finished.");
}

main().catch(e => { console.error(e); process.exit(1); });

function parseMinutes(value, isEndTime = false, startMinutes = null) {
  // Si c'est end_time et undefined, calculer depuis start_time + durée
  if (isEndTime && (value === undefined || value === null) && startMinutes !== null) {
    const duration = 90; // 90 minutes par défaut
    return startMinutes + duration;
  }

  // Si c'est un nombre (minutes depuis minuit) - cas normal de l'API
  if (typeof value === "number" && Number.isFinite(value)) {
    return value; // Retourner directement les minutes
  }

  return null;
}