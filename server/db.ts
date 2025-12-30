import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../data.db");

// Initialize database connection
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

// Initialize schema
export function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
      password_hash TEXT,
      availability_status TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tours (
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
      payment TEXT,
      reservation_number TEXT,
      remarks TEXT,
      start_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tour_schedules (
      id TEXT PRIMARY KEY,
      tour_id TEXT NOT NULL UNIQUE,
      schedule_data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
    CREATE INDEX IF NOT EXISTS idx_staff_first_name ON staff(first_name);
    CREATE INDEX IF NOT EXISTS idx_tours_start_date ON tours(start_date);
    CREATE INDEX IF NOT EXISTS idx_tours_invoice ON tours(invoice);
  `);

  console.log("[Database] Initialized SQLite database at", dbPath);
}

// Prepare statements for better performance
export const staffQueries = {
  getAll: db.prepare("SELECT id, email, first_name, last_name, role, created_at FROM staff ORDER BY created_at ASC"),
  getById: db.prepare("SELECT * FROM staff WHERE id = ?"),
  getByEmail: db.prepare("SELECT * FROM staff WHERE email = ?"),
  getByFirstName: db.prepare("SELECT * FROM staff WHERE first_name = ?"),
  create: db.prepare(`
    INSERT INTO staff (id, email, first_name, last_name, role, password_hash, availability_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE staff 
    SET email = COALESCE(?, email),
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        role = COALESCE(?, role),
        password_hash = COALESCE(?, password_hash),
        availability_status = COALESCE(?, availability_status)
    WHERE id = ?
  `),
  delete: db.prepare("DELETE FROM staff WHERE id = ?"),
};

export const tourQueries = {
  getAll: db.prepare("SELECT * FROM tours ORDER BY start_date ASC"),
  getById: db.prepare("SELECT * FROM tours WHERE id = ?"),
  create: db.prepare(`
    INSERT INTO tours (id, invoice, language, name, pax, group_id, dnr, td, agent, arrival, departure, 
                       accommodation, gears, snowshoe, nlt, city_tour, hiking, fishing, dog_sledging, 
                       snowmobile_atv, aurora_village, payment, reservation_number, remarks, start_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE tours 
    SET invoice = COALESCE(?, invoice),
        language = COALESCE(?, language),
        name = COALESCE(?, name),
        pax = COALESCE(?, pax),
        group_id = COALESCE(?, group_id),
        dnr = COALESCE(?, dnr),
        td = COALESCE(?, td),
        agent = COALESCE(?, agent),
        arrival = COALESCE(?, arrival),
        departure = COALESCE(?, departure),
        accommodation = COALESCE(?, accommodation),
        gears = COALESCE(?, gears),
        snowshoe = COALESCE(?, snowshoe),
        nlt = COALESCE(?, nlt),
        city_tour = COALESCE(?, city_tour),
        hiking = COALESCE(?, hiking),
        fishing = COALESCE(?, fishing),
        dog_sledging = COALESCE(?, dog_sledging),
        snowmobile_atv = COALESCE(?, snowmobile_atv),
        aurora_village = COALESCE(?, aurora_village),
        payment = COALESCE(?, payment),
        reservation_number = COALESCE(?, reservation_number),
        remarks = COALESCE(?, remarks),
        start_date = COALESCE(?, start_date)
    WHERE id = ?
  `),
  delete: db.prepare("DELETE FROM tours WHERE id = ?"),
  search: db.prepare(`
    SELECT * FROM tours 
    WHERE 1=1
      AND (? IS NULL OR start_date >= ?)
      AND (? IS NULL OR start_date <= ?)
      AND (? IS NULL OR invoice LIKE ?)
      AND (? IS NULL OR name LIKE ?)
    ORDER BY start_date ASC
  `),
};

export const scheduleQueries = {
  getByTourId: db.prepare("SELECT * FROM tour_schedules WHERE tour_id = ?"),
  create: db.prepare(`
    INSERT INTO tour_schedules (id, tour_id, schedule_data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE tour_schedules 
    SET schedule_data = ?, updated_at = ?
    WHERE tour_id = ?
  `),
};
