import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../data.db");

let db: SqlJsDatabase | null = null;
let SQL: any = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

async function initDatabase() {
  if (db && SQL) return db;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
      console.log("[Database] Loaded existing SQLite database");
    } else {
      db = new SQL.Database();
      console.log("[Database] Created new SQLite database");
    }

    initializeSchema();
    await seedDemoUser();
    return db as SqlJsDatabase;
  })();

  return initPromise;
}

function initializeSchema() {
  if (!db) return;

  const queries = [
    `CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
      password_hash TEXT,
      availability_status TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS tours (
      id TEXT PRIMARY KEY,
      invoice TEXT NOT NULL,
      language TEXT,
      name TEXT NOT NULL,
      pax INTEGER,
      group_id TEXT,
      dnr TEXT,
      td TEXT,
      agent TEXT,
      arrival TEXT,
      departure TEXT,
      accommodation TEXT,
      gears TEXT,
      snowshoe TEXT,
      nlt TEXT,
      city_tour TEXT,
      hiking TEXT,
      fishing TEXT,
      dog_sledging TEXT,
      snowmobile_atv TEXT,
      aurora_village TEXT,
      aurora_village_activity TEXT,
      payment TEXT,
      reservation_number TEXT,
      remarks TEXT,
      start_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS tour_schedules (
      id TEXT PRIMARY KEY,
      tour_id TEXT NOT NULL UNIQUE,
      schedule_data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    )`,
  ];

  for (const query of queries) {
    try {
      db.run(query);
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.error("Schema error:", error);
      }
    }
  }

  console.log("[Database] Schema initialized");
}

async function seedDemoUser() {
  if (!db) return;

  try {
    const result = db.exec("SELECT id FROM staff WHERE first_name = 'abhi' LIMIT 1");
    if (result.length > 0 && result[0].values.length > 0) {
      console.log("[Database] Demo user already exists");
      return;
    }

    const demoUserId = "demo-user-1";
    const demoEmail = "admin@example.com";
    const demoFirstName = "abhi";
    const demoLastName = "admin";
    const demoRole = "admin";
    const demoPasswordHash = hashPassword("password");
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO staff (id, email, first_name, last_name, role, password_hash, availability_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [demoUserId, demoEmail, demoFirstName, demoLastName, demoRole, demoPasswordHash, "available", now]
    );

    saveDatabase();
    console.log("[Database] Demo user seeded successfully");
  } catch (error) {
    console.error("[Database] Error seeding demo user:", error);
  }
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error("[Database] Error saving database:", error);
  }
}

export async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db as SqlJsDatabase;
}

export async function getAllStaff() {
  const database = await getDatabase();
  const result = database.exec(
    "SELECT id, email, first_name, last_name, role, created_at FROM staff ORDER BY created_at ASC"
  );
  if (result.length === 0) return [];
  return result[0].values.map((row) => ({
    id: row[0],
    email: row[1],
    first_name: row[2],
    last_name: row[3],
    role: row[4],
    created_at: row[5],
  }));
}

export async function getStaffById(id: string) {
  const database = await getDatabase();
  const result = database.exec("SELECT * FROM staff WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    email: row[1],
    first_name: row[2],
    last_name: row[3],
    role: row[4],
    password_hash: row[5],
    availability_status: row[6],
    created_at: row[7],
  };
}

export async function getStaffByEmail(email: string) {
  const database = await getDatabase();
  const result = database.exec("SELECT * FROM staff WHERE email = ?", [email]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    email: row[1],
    first_name: row[2],
    last_name: row[3],
    role: row[4],
    password_hash: row[5],
    availability_status: row[6],
    created_at: row[7],
  };
}

export async function getStaffByFirstName(firstName: string) {
  const database = await getDatabase();
  const result = database.exec("SELECT * FROM staff WHERE first_name = ?", [
    firstName,
  ]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    email: row[1],
    first_name: row[2],
    last_name: row[3],
    role: row[4],
    password_hash: row[5],
    availability_status: row[6],
    created_at: row[7],
  };
}

export async function createStaff(data: any) {
  const database = await getDatabase();
  database.run(
    `INSERT INTO staff (id, email, first_name, last_name, role, password_hash, availability_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.email,
      data.first_name,
      data.last_name,
      data.role,
      data.password_hash,
      data.availability_status,
      data.created_at,
    ]
  );
  saveDatabase();
  return getStaffById(data.id);
}

export async function updateStaff(id: string, updates: any) {
  const database = await getDatabase();
  const current = await getStaffById(id);
  if (!current) return null;

  database.run(
    `UPDATE staff SET email = ?, first_name = ?, last_name = ?, role = ?, password_hash = ?, availability_status = ? WHERE id = ?`,
    [
      updates.email ?? current.email,
      updates.first_name ?? current.first_name,
      updates.last_name ?? current.last_name,
      updates.role ?? current.role,
      updates.password_hash ?? current.password_hash,
      updates.availability_status ?? current.availability_status,
      id,
    ]
  );
  saveDatabase();
  return getStaffById(id);
}

export async function deleteStaff(id: string) {
  const database = await getDatabase();
  database.run("DELETE FROM staff WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export async function getAllTours() {
  const database = await getDatabase();
  const result = database.exec(
    "SELECT * FROM tours ORDER BY start_date ASC"
  );
  if (result.length === 0) return [];
  return result[0].values.map((row) => ({
    id: row[0],
    invoice: row[1],
    language: row[2],
    name: row[3],
    pax: row[4],
    group_id: row[5],
    dnr: row[6],
    td: row[7],
    agent: row[8],
    arrival: row[9],
    departure: row[10],
    accommodation: row[11],
    gears: row[12],
    snowshoe: row[13],
    nlt: row[14],
    city_tour: row[15],
    hiking: row[16],
    fishing: row[17],
    dog_sledging: row[18],
    snowmobile_atv: row[19],
    aurora_village: row[20],
    aurora_village_activity: row[21],
    payment: row[22],
    reservation_number: row[23],
    remarks: row[24],
    start_date: row[25],
    created_at: row[26],
  }));
}

export async function getTourById(id: string) {
  const database = await getDatabase();
  const result = database.exec("SELECT * FROM tours WHERE id = ?", [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    invoice: row[1],
    language: row[2],
    name: row[3],
    pax: row[4],
    group_id: row[5],
    dnr: row[6],
    td: row[7],
    agent: row[8],
    arrival: row[9],
    departure: row[10],
    accommodation: row[11],
    gears: row[12],
    snowshoe: row[13],
    nlt: row[14],
    city_tour: row[15],
    hiking: row[16],
    fishing: row[17],
    dog_sledging: row[18],
    snowmobile_atv: row[19],
    aurora_village: row[20],
    payment: row[21],
    reservation_number: row[22],
    remarks: row[23],
    start_date: row[24],
    created_at: row[25],
  };
}

export async function createTour(data: any) {
  const database = await getDatabase();
  database.run(
    `INSERT INTO tours (id, invoice, language, name, pax, group_id, dnr, td, agent, arrival, departure,
                        accommodation, gears, snowshoe, nlt, city_tour, hiking, fishing, dog_sledging,
                        snowmobile_atv, aurora_village, payment, reservation_number, remarks, start_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.invoice,
      data.language,
      data.name,
      data.pax,
      data.group_id,
      data.dnr,
      data.td,
      data.agent,
      data.arrival,
      data.departure,
      data.accommodation,
      data.gears,
      data.snowshoe,
      data.nlt,
      data.city_tour,
      data.hiking,
      data.fishing,
      data.dog_sledging,
      data.snowmobile_atv,
      data.aurora_village,
      data.payment,
      data.reservation_number,
      data.remarks,
      data.start_date,
      data.created_at,
    ]
  );
  saveDatabase();
  return getTourById(data.id);
}

export async function updateTour(id: string, updates: any) {
  const database = await getDatabase();
  const current = await getTourById(id);
  if (!current) return null;

  const fields = [
    "invoice",
    "language",
    "name",
    "pax",
    "group_id",
    "dnr",
    "td",
    "agent",
    "arrival",
    "departure",
    "accommodation",
    "gears",
    "snowshoe",
    "nlt",
    "city_tour",
    "hiking",
    "fishing",
    "dog_sledging",
    "snowmobile_atv",
    "aurora_village",
    "payment",
    "reservation_number",
    "remarks",
    "start_date",
  ];

  const values = fields.map((field) => updates[field] ?? current[field as keyof typeof current]);
  values.push(id);

  database.run(
    `UPDATE tours SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
    values
  );
  saveDatabase();
  return getTourById(id);
}

export async function deleteTour(id: string) {
  const database = await getDatabase();
  database.run("DELETE FROM tours WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export async function getScheduleByTourId(tourId: string) {
  const database = await getDatabase();
  const result = database.exec(
    "SELECT * FROM tour_schedules WHERE tour_id = ?",
    [tourId]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    id: row[0],
    tour_id: row[1],
    schedule_data: JSON.parse(row[2]),
    created_at: row[3],
    updated_at: row[4],
  };
}

export async function saveSchedule(tourId: string, scheduleData: any) {
  const database = await getDatabase();
  const existing = await getScheduleByTourId(tourId);

  if (existing) {
    database.run(
      "UPDATE tour_schedules SET schedule_data = ?, updated_at = ? WHERE tour_id = ?",
      [
        JSON.stringify(scheduleData),
        new Date().toISOString(),
        tourId,
      ]
    );
  } else {
    const id = `schedule-${Date.now()}`;
    database.run(
      "INSERT INTO tour_schedules (id, tour_id, schedule_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [id, tourId, JSON.stringify(scheduleData), new Date().toISOString(), new Date().toISOString()]
    );
  }

  saveDatabase();
  return getScheduleByTourId(tourId);
}
