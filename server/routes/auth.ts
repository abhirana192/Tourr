import { RequestHandler } from "express";
import crypto from "crypto";

// Simple password hashing using crypto (alternative to bcrypt)
function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "salt")
    .digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Simple in-memory session storage (replace with database in production)
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

  // Check if session is expired
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

// Demo user for development/testing without Supabase
const DEMO_USER = {
  id: "demo-user-1",
  email: "admin@example.com",
  first_name: "abhi",
  last_name: "admin",
  role: "admin",
  password_hash: hashPassword("password"),
};

async function getStaffByName(name: string) {
  // Always check demo user first, regardless of Supabase availability
  if (name.toLowerCase() === DEMO_USER.first_name.toLowerCase()) {
    return DEMO_USER;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Use anon key since this is a public read
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("[getStaffByName] Missing Supabase credentials");
    return null;
  }

  try {
    // Search by first_name (exact match)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/staff?first_name=eq.${encodeURIComponent(name)}&select=id,email,first_name,last_name,role,password_hash`,
      {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
      },
    );

    if (!response.ok) {
      console.error(`[getStaffByName] Supabase API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("[getStaffByName] Error connecting to Supabase:", error);
    // Don't throw - just return null so login can proceed with demo user or fail gracefully
    return null;
  }
}

export const login: RequestHandler = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      res.status(400).json({ error: "Name and password are required" });
      return;
    }

    // Get staff user from database using REST API
    const staffData = await getStaffByName(name);

    if (!staffData) {
      res.status(401).json({ error: "Invalid name or password" });
      return;
    }

    // Verify password against hashed password
    if (
      !staffData.password_hash ||
      !verifyPassword(password, staffData.password_hash)
    ) {
      res.status(401).json({ error: "Invalid name or password" });
      return;
    }

    // Create session token
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

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

    // Check if session is expired
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
