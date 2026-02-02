import { RequestHandler } from "express";
import crypto from "crypto";
import { staffDb } from "../supabase-db";

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

const DEMO_USER = {
  id: "demo-user-1",
  email: "admin@example.com",
  first_name: "abhi",
  last_name: "admin",
  role: "admin",
  password_hash: hashPassword("password"),
};

async function getStaffByName(name: string) {
  if (name.toLowerCase() === DEMO_USER.first_name.toLowerCase()) {
    return DEMO_USER;
  }

  try {
    const staff = await staffDb.getStaffByName(name);
    return staff;
  } catch (error) {
    console.error("[getStaffByName] Database error:", error);
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

    const staffData = await getStaffByName(name);

    if (!staffData) {
      res.status(401).json({ error: "Invalid name or password" });
      return;
    }

    if (
      !staffData.password_hash ||
      !verifyPassword(password, staffData.password_hash)
    ) {
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
