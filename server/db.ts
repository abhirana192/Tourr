import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const defaultDataDirectory = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "Tour Manager")
  : process.env.XDG_DATA_HOME
    ? path.join(process.env.XDG_DATA_HOME, "tour-manager")
    : process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Application Support", "Tour Manager")
      : path.join(os.homedir(), ".local", "share", "tour-manager");
const dbPath = path.resolve(process.env.SQLITE_DB_PATH || path.join(defaultDataDirectory, "data.db"));

let db: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

const tourColumns = [
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
  "aurora_village_activity",
  "payment",
  "reservation_number",
  "remarks",
  "start_date",
  "activity_schedule",
  "leader",
  "leader_first_name",
  "leader_last_name",
  "members",
  "arrival_notes",
  "departure_notes",
  "activity_notes",
  "is_cancelled",
] as const;

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

function serializeValue(value: unknown): string | number | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number;
}

function queryRows<T extends Record<string, any>>(
  database: SqlJsDatabase,
  query: string,
  values: any[] = [],
): T[] {
  const result = database.exec(query, values);
  if (result.length === 0) return [];
  return result[0].values.map((row) =>
    Object.fromEntries(result[0].columns.map((column, index) => [column, row[index]])),
  ) as T[];
}

function queryOne<T extends Record<string, any>>(
  database: SqlJsDatabase,
  query: string,
  values: any[] = [],
): T | null {
  return queryRows<T>(database, query, values)[0] || null;
}

function initializeSchema(database: SqlJsDatabase) {
  database.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
      password_hash TEXT,
      availability_status TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  database.run(`
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
      aurora_village_activity TEXT,
      payment TEXT,
      reservation_number TEXT,
      remarks TEXT,
      start_date TEXT NOT NULL,
      activity_schedule TEXT,
      leader TEXT,
      leader_first_name TEXT,
      leader_last_name TEXT,
      members TEXT,
      arrival_notes TEXT,
      departure_notes TEXT,
      activity_notes TEXT,
      is_cancelled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  const tourSchemaMigrations = [
    ["activity_schedule", "TEXT"],
    ["leader", "TEXT"],
    ["leader_first_name", "TEXT"],
    ["leader_last_name", "TEXT"],
    ["members", "TEXT"],
    ["arrival_notes", "TEXT"],
    ["departure_notes", "TEXT"],
    ["activity_notes", "TEXT"],
    ["is_cancelled", "INTEGER NOT NULL DEFAULT 0"],
    ["updated_at", "TEXT"],
  ];
  const existingTourColumns = new Set(
    queryRows<{ name: string }>(database, "PRAGMA table_info(tours)").map((column) => column.name),
  );
  for (const [column, definition] of tourSchemaMigrations) {
    if (!existingTourColumns.has(column)) {
      database.run(`ALTER TABLE tours ADD COLUMN ${column} ${definition}`);
    }
  }

  database.run(`
    CREATE TABLE IF NOT EXISTS tour_schedules (
      id TEXT PRIMARY KEY,
      tour_id TEXT NOT NULL UNIQUE,
      schedule_data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      assignment_type TEXT NOT NULL CHECK (assignment_type IN ('arrival', 'departure', 'activity')),
      assignment_key TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      van TEXT NOT NULL DEFAULT '',
      employees TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (assignment_type, assignment_key, activity_date)
    )
  `);

  database.run("CREATE INDEX IF NOT EXISTS idx_tours_start_date ON tours(start_date)");
  database.run("CREATE INDEX IF NOT EXISTS idx_tours_invoice ON tours(invoice)");
  database.run("CREATE INDEX IF NOT EXISTS idx_tours_name ON tours(name)");
  database.run("CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(activity_date)");
}

function saveDatabase() {
  if (!db) throw new Error("SQLite database is not initialized");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const temporaryPath = `${dbPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, Buffer.from(db.export()));
  fs.renameSync(temporaryPath, dbPath);
}

async function initializeDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    if (fs.existsSync(dbPath)) {
      db = new SQL.Database(fs.readFileSync(dbPath));
      console.log(`[SQLite] Loaded database from ${dbPath}`);
    } else {
      db = new SQL.Database();
      console.log(`[SQLite] Created database at ${dbPath}`);
    }

    db.run("PRAGMA foreign_keys = ON");
    initializeSchema(db);

    const admin = queryOne(db, "SELECT id FROM staff WHERE lower(first_name) = lower(?)", ["Admin"]);
    if (!admin) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO staff (id, email, first_name, last_name, role, password_hash, availability_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["admin-default", "admin@tourmanager.com", "Admin", "User", "admin", hashPassword("admin123"), "available", now],
      );
    }

    saveDatabase();
    return db;
  })();

  return initPromise;
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) await initializeDatabase();
  return db as SqlJsDatabase;
}

export async function getAllStaff() {
  const database = await getDatabase();
  return queryRows(database, "SELECT id, email, first_name, last_name, role, created_at, availability_status FROM staff ORDER BY created_at ASC");
}

export async function getStaffById(id: string) {
  const database = await getDatabase();
  return queryOne(database, "SELECT * FROM staff WHERE id = ?", [id]);
}

export async function getStaffByEmail(email: string) {
  const database = await getDatabase();
  return queryOne(database, "SELECT * FROM staff WHERE lower(email) = lower(?)", [email]);
}

export async function getStaffByFirstName(firstName: string) {
  const database = await getDatabase();
  return queryOne(database, "SELECT * FROM staff WHERE lower(first_name) = lower(?)", [firstName]);
}

export async function createStaff(data: any) {
  const database = await getDatabase();
  const staff = {
    ...data,
    id: data.id || `staff-${Date.now()}`,
    last_name: data.last_name || "",
    created_at: data.created_at || new Date().toISOString(),
  };
  database.run(
    `INSERT INTO staff (id, email, first_name, last_name, role, password_hash, availability_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [staff.id, staff.email, staff.first_name, staff.last_name, staff.role, staff.password_hash || null, staff.availability_status || "available", staff.created_at],
  );
  saveDatabase();
  return getStaffById(staff.id);
}

export async function updateStaff(id: string, updates: any) {
  const database = await getDatabase();
  const current = await getStaffById(id);
  if (!current) return null;

  const fields = ["email", "first_name", "last_name", "role", "password_hash", "availability_status"];
  const values = fields.map((field) => updates[field] ?? current[field]);
  values.push(id);
  database.run(`UPDATE staff SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`, values);
  saveDatabase();
  return getStaffById(id);
}

export async function deleteStaff(id: string) {
  const database = await getDatabase();
  const existing = await getStaffById(id);
  if (!existing) return false;
  database.run("DELETE FROM staff WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

function formatTour(row: Record<string, any>): Record<string, any> {
  return { ...row, is_cancelled: row.is_cancelled === 1 || row.is_cancelled === true };
}

export async function getAllTours() {
  const database = await getDatabase();
  return queryRows(database, "SELECT * FROM tours ORDER BY start_date ASC").map(formatTour);
}

export async function searchTours(dateFrom?: string, dateTo?: string, invoice?: string, name?: string) {
  const database = await getDatabase();
  const conditions: string[] = [];
  const values: string[] = [];
  if (dateFrom) {
    conditions.push("start_date >= ?");
    values.push(dateFrom);
  }
  if (dateTo) {
    conditions.push("start_date <= ?");
    values.push(dateTo);
  }
  if (invoice) {
    conditions.push("lower(invoice) LIKE lower(?)");
    values.push(`%${invoice}%`);
  }
  if (name) {
    conditions.push("lower(name) LIKE lower(?)");
    values.push(`%${name}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return queryRows(database, `SELECT * FROM tours ${where} ORDER BY start_date ASC`, values).map(formatTour);
}

export async function getTourById(id: string) {
  const database = await getDatabase();
  const row = queryOne(database, "SELECT * FROM tours WHERE id = ?", [id]);
  return row ? formatTour(row) : null;
}

export async function createTour(data: any): Promise<any> {
  const database = await getDatabase();
  const tour = {
    ...data,
    id: data.id || `tour-${Date.now()}`,
    is_cancelled: data.is_cancelled === true,
    created_at: data.created_at || new Date().toISOString(),
  };
  const columns = ["id", ...tourColumns, "created_at"];
  database.run(
    `INSERT INTO tours (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    columns.map((column) => serializeValue(tour[column as keyof typeof tour])),
  );
  saveDatabase();
  return getTourById(tour.id);
}

export async function updateTour(id: string, updates: any) {
  const database = await getDatabase();
  const current = await getTourById(id);
  if (!current) return null;

  const fields = tourColumns.filter((column) => Object.prototype.hasOwnProperty.call(updates, column) && updates[column] !== undefined);
  if (fields.length === 0) return current;

  const values = fields.map((field) => serializeValue(updates[field]));
  values.push(id);
  database.run(`UPDATE tours SET ${fields.map((field) => `${field} = ?`).join(", ")}, updated_at = ? WHERE id = ?`, [
    ...values.slice(0, -1),
    new Date().toISOString(),
    id,
  ]);
  saveDatabase();
  return getTourById(id);
}

export async function deleteTour(id: string) {
  const database = await getDatabase();
  if (!(await getTourById(id))) return false;
  database.run("DELETE FROM tours WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export async function getScheduleByTourId(tourId: string) {
  const database = await getDatabase();
  const row = queryOne(database, "SELECT * FROM tour_schedules WHERE tour_id = ?", [tourId]);
  if (!row) return null;
  return {
    ...row,
    schedule_data: JSON.parse(row.schedule_data),
  };
}

export async function saveSchedule(tourId: string, scheduleData: any) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const existing = await getScheduleByTourId(tourId);
  if (existing) {
    database.run("UPDATE tour_schedules SET schedule_data = ?, updated_at = ? WHERE tour_id = ?", [JSON.stringify(scheduleData), now, tourId]);
  } else {
    database.run(
      "INSERT INTO tour_schedules (id, tour_id, schedule_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [`schedule-${Date.now()}`, tourId, JSON.stringify(scheduleData), now, now],
    );
  }
  await updateTour(tourId, { activity_schedule: JSON.stringify(scheduleData) });
  saveDatabase();
  return getScheduleByTourId(tourId);
}

export async function getAssignments() {
  const database = await getDatabase();
  return queryRows(database, "SELECT * FROM assignments ORDER BY activity_date ASC");
}

export async function getAssignmentByKey(assignmentType: string, assignmentKey: string, activityDate: string) {
  const database = await getDatabase();
  return queryOne(database,
    "SELECT * FROM assignments WHERE assignment_type = ? AND assignment_key = ? AND activity_date = ?",
    [assignmentType, assignmentKey, activityDate],
  );
}

export async function saveAssignment(
  assignmentType: "arrival" | "departure" | "activity",
  assignmentKey: string,
  activityDate: string,
  van: string,
  employees: string,
) {
  const database = await getDatabase();
  const existing = await getAssignmentByKey(assignmentType, assignmentKey, activityDate);
  const now = new Date().toISOString();
  if (existing) {
    database.run("UPDATE assignments SET van = ?, employees = ?, updated_at = ? WHERE id = ?", [van, employees, now, existing.id]);
  } else {
    database.run(
      `INSERT INTO assignments (id, assignment_type, assignment_key, activity_date, van, employees, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [`assignment-${Date.now()}`, assignmentType, assignmentKey, activityDate, van, employees, now, now],
    );
  }
  saveDatabase();
  return getAssignmentByKey(assignmentType, assignmentKey, activityDate);
}

export async function deleteAssignment(id: string) {
  const database = await getDatabase();
  const existing = queryOne(database, "SELECT id FROM assignments WHERE id = ?", [id]);
  if (!existing) return false;
  database.run("DELETE FROM assignments WHERE id = ?", [id]);
  saveDatabase();
  return true;
}
