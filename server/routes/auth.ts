import { RequestHandler } from "express";
import crypto from "crypto";
import { staffDb } from "../supabase-db";
import { inMemoryStaffDb, initializeInMemoryDb } from "../in-memory-db";
import { isDatabaseReady } from "../postgres-db";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const sessions = new Map<
  string,
  {
    userId: string;
    email: string;
    name: string;
    role: string;
    expiresAt: number;
  }
>();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getSessionFromRequest(
  req: any,
): { userId: string; email: string; name: string; role: string } | null {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  };
}

async function getStaffByName(name: string) {
  try {
    // Try in-memory database first (always available)
    console.log("[getStaffByName] Looking for staff with name:", name);
    let staff = await inMemoryStaffDb.getStaffByName(name);
    console.log("[getStaffByName] In-memory result:", staff ? `Found ${staff.first_name}` : "Not found");

    if (staff) {
      return staff;
    }

    // Then try Supabase if it's available
    try {
      console.log("[getStaffByName] Trying Supabase...");
      staff = await staffDb.getStaffByName(name);
      return staff;
    } catch (err) {
      console.warn("[getStaffByName] Supabase unavailable, using in-memory fallback");
      return null;
    }
  } catch (error) {
    console.error("[getStaffByName] Database error:", error);
    return null;
  }
}

export const login: RequestHandler = async (req, res) => {
  try {
    const { name, password } = req.body;

    console.log("[login] Login attempt with name:", name);

    if (!name || !password) {
      res.status(400).json({ error: "Name and password are required" });
      return;
    }

    // Ensure default admin user exists (for development/fallback)
    // This is important in case the in-memory DB was reset by hot reload
    initializeInMemoryDb();

    const staffData = await getStaffByName(name);

    if (!staffData) {
      console.log("[login] Staff not found for name:", name);
      console.log("[login] Available staff:", (await inMemoryStaffDb.getAllStaff()).map(s => s.first_name));
      res.status(401).json({ error: "Invalid name or password" });
      return;
    }

    console.log("[login] Staff found:", staffData.first_name, "with password_hash:", !!staffData.password_hash);
    const providedHash = hashPassword(password);
    console.log("[login] Provided hash matches:", providedHash === staffData.password_hash);

    if (
      !staffData.password_hash ||
      !verifyPassword(password, staffData.password_hash)
    ) {
      console.log("[login] Password verification failed for:", staffData.first_name);
      res.status(401).json({ error: "Invalid name or password" });
      return;
    }

    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const fullName = staffData.last_name
      ? `${staffData.first_name} ${staffData.last_name}`
      : staffData.first_name;

    sessions.set(sessionToken, {
      userId: staffData.id,
      email: staffData.email,
      name: fullName,
      role: staffData.role,
      expiresAt,
    });

    res.json({
      success: true,
      user: {
        id: staffData.id,
        email: staffData.email,
        name: fullName,
        role: staffData.role,
      },
      sessionToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    res.status(500).json({ error: errorMessage });
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      sessions.delete(token);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

export const getSession: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.json({ success: true, user: null, session: null });
      return;
    }

    const session = sessions.get(token);
    if (!session) {
      res.json({ success: true, user: null, session: null });
      return;
    }

    if (session.expiresAt < Date.now()) {
      sessions.delete(token);
      res.json({ success: true, user: null, session: null });
      return;
    }

    res.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    res.json({ success: true, user: null, session: null });
  }
};
