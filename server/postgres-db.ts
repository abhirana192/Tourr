import { Pool, QueryResult } from "pg";

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "tourmanager",
});

pool.on("error", (err) => {
  console.error("[PostgreSQL] Unexpected error on idle client", err);
});

let isInitialized = false;

export async function initializeDatabase() {
  try {
    // Test connection
    const result = await pool.query("SELECT NOW()");
    console.log("[PostgreSQL] Connected successfully at:", result.rows[0].now);

    // Create tables if they don't exist
    await createTables();
    console.log("[PostgreSQL] Database tables initialized");
    isInitialized = true;
  } catch (error) {
    console.warn("[PostgreSQL] Connection failed - running in fallback mode:", (error as any).message);
    console.warn("[PostgreSQL] The app will work but without persistent storage.");
    console.warn("[PostgreSQL] To enable full functionality, set up a PostgreSQL database and configure DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME environment variables.");
    isInitialized = false;
  }
}

export function isDatabaseReady(): boolean {
  return isInitialized;
}

async function createTables() {
  const queries = [
    // Staff table
    `CREATE TABLE IF NOT EXISTS staff (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255),
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff')),
      password_hash VARCHAR(255),
      availability_status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Tours table
    `CREATE TABLE IF NOT EXISTS tours (
      id VARCHAR(255) PRIMARY KEY,
      invoice VARCHAR(255) NOT NULL,
      language VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      pax INTEGER,
      group_id VARCHAR(255),
      dnr VARCHAR(50),
      td VARCHAR(50),
      agent VARCHAR(255),
      arrival VARCHAR(255),
      departure VARCHAR(255),
      accommodation VARCHAR(255),
      gears VARCHAR(50),
      snowshoe VARCHAR(50),
      nlt VARCHAR(50),
      city_tour VARCHAR(50),
      hiking VARCHAR(50),
      fishing VARCHAR(50),
      dog_sledging VARCHAR(50),
      snowmobile_atv VARCHAR(50),
      aurora_village VARCHAR(50),
      aurora_village_activity VARCHAR(50),
      payment VARCHAR(50),
      reservation_number VARCHAR(255),
      remarks TEXT,
      start_date DATE NOT NULL,
      activity_schedule JSONB,
      leader VARCHAR(255),
      members JSONB,
      arrival_notes TEXT,
      departure_notes TEXT,
      activity_notes JSONB,
      is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Assignments table
    `CREATE TABLE IF NOT EXISTS assignments (
      id VARCHAR(255) PRIMARY KEY,
      assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('arrival', 'departure', 'activity')),
      assignment_key VARCHAR(255) NOT NULL,
      activity_date DATE NOT NULL,
      van VARCHAR(255),
      employees TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Create indexes for better performance
    `CREATE INDEX IF NOT EXISTS idx_tours_start_date ON tours(start_date)`,
    `CREATE INDEX IF NOT EXISTS idx_tours_invoice ON tours(invoice)`,
    `CREATE INDEX IF NOT EXISTS idx_tours_name ON tours(name)`,
    `CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email)`,
    `CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(activity_date)`,
  ];

  queries.push("ALTER TABLE tours ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT FALSE");

  for (const query of queries) {
    try {
      await pool.query(query);
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.error("[PostgreSQL] Error creating table:", error);
      }
    }
  }
}

// Database operations
export const db = {
  // Staff operations
  async getAllStaff() {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, created_at 
       FROM staff ORDER BY created_at ASC`
    );
    return result.rows;
  },

  async getStaffById(id: string) {
    const result = await pool.query("SELECT * FROM staff WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  async getStaffByEmail(email: string) {
    const result = await pool.query("SELECT * FROM staff WHERE email = $1", [
      email,
    ]);
    return result.rows[0] || null;
  },

  async getStaffByName(firstName: string) {
    const result = await pool.query(
      "SELECT * FROM staff WHERE LOWER(first_name) = LOWER($1)",
      [firstName]
    );
    return result.rows[0] || null;
  },

  async createStaff(staff: any) {
    const result = await pool.query(
      `INSERT INTO staff 
       (id, email, first_name, last_name, role, password_hash, availability_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        staff.id,
        staff.email,
        staff.first_name,
        staff.last_name,
        staff.role,
        staff.password_hash,
        staff.availability_status,
      ]
    );
    return result.rows[0];
  },

  async updateStaff(id: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE staff SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async deleteStaff(id: string) {
    const result = await pool.query("DELETE FROM staff WHERE id = $1", [id]);
    return result.rowCount! > 0;
  },

  // Tour operations
  async getTours() {
    const result = await pool.query(
      "SELECT * FROM tours ORDER BY start_date ASC"
    );
    return result.rows;
  },

  async getTourById(id: string) {
    const result = await pool.query("SELECT * FROM tours WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  async addTour(tour: any) {
    const result = await pool.query(
      `INSERT INTO tours 
       (id, invoice, language, name, pax, group_id, dnr, td, agent, arrival, departure,
        accommodation, gears, snowshoe, nlt, city_tour, hiking, fishing, dog_sledging,
        snowmobile_atv, aurora_village, aurora_village_activity, payment, reservation_number,
        remarks, start_date, created_at)
       VALUES 
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        tour.id,
        tour.invoice,
        tour.language,
        tour.name,
        tour.pax,
        tour.group_id,
        tour.dnr,
        tour.td,
        tour.agent,
        tour.arrival,
        tour.departure,
        tour.accommodation,
        tour.gears,
        tour.snowshoe,
        tour.nlt,
        tour.city_tour,
        tour.hiking,
        tour.fishing,
        tour.dog_sledging,
        tour.snowmobile_atv,
        tour.aurora_village,
        tour.aurora_village_activity,
        tour.payment,
        tour.reservation_number,
        tour.remarks,
        tour.start_date,
      ]
    );
    return result.rows[0];
  },

  async updateTour(id: string, updates: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== "id") {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tours SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async deleteTour(id: string) {
    const result = await pool.query("DELETE FROM tours WHERE id = $1", [id]);
    return result.rowCount! > 0;
  },

  async searchTours(
    dateFrom?: string,
    dateTo?: string,
    invoice?: string,
    name?: string
  ) {
    let query = "SELECT * FROM tours WHERE 1=1";
    const params: any[] = [];
    let paramCount = 1;

    if (dateFrom) {
      query += ` AND start_date >= $${paramCount}`;
      params.push(dateFrom);
      paramCount++;
    }
    if (dateTo) {
      query += ` AND start_date <= $${paramCount}`;
      params.push(dateTo);
      paramCount++;
    }
    if (invoice) {
      query += ` AND invoice ILIKE $${paramCount}`;
      params.push(`%${invoice}%`);
      paramCount++;
    }
    if (name) {
      query += ` AND name ILIKE $${paramCount}`;
      params.push(`%${name}%`);
      paramCount++;
    }

    query += " ORDER BY start_date ASC";

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Assignment operations
  async getAssignments() {
    const result = await pool.query(
      "SELECT * FROM assignments ORDER BY activity_date ASC"
    );
    return result.rows;
  },

  async getAssignmentByKey(
    assignmentType: string,
    assignmentKey: string,
    activityDate: string
  ) {
    const result = await pool.query(
      `SELECT * FROM assignments 
       WHERE assignment_type = $1 AND assignment_key = $2 AND activity_date = $3`,
      [assignmentType, assignmentKey, activityDate]
    );
    return result.rows[0] || null;
  },

  async saveAssignment(
    assignmentType: string,
    assignmentKey: string,
    activityDate: string,
    van: string,
    employees: string
  ) {
    const existing = await this.getAssignmentByKey(
      assignmentType,
      assignmentKey,
      activityDate
    );

    if (existing) {
      const result = await pool.query(
        `UPDATE assignments 
         SET van = $1, employees = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [van, employees, existing.id]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO assignments 
         (id, assignment_type, assignment_key, activity_date, van, employees, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          `assignment-${Date.now()}`,
          assignmentType,
          assignmentKey,
          activityDate,
          van,
          employees,
        ]
      );
      return result.rows[0];
    }
  },

  async deleteAssignment(id: string) {
    const result = await pool.query("DELETE FROM assignments WHERE id = $1", [
      id,
    ]);
    return result.rowCount! > 0;
  },
};

export default pool;
