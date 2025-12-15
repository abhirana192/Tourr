import { RequestHandler } from "express";
import { supabase } from "../supabase";

// Simple in-memory session storage (replace with database in production)
const sessions = new Map<string, { userId: string; email: string; name: string; role: string; expiresAt: number }>();

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Simple password validation (in production, use bcrypt or similar)
    // For demo purposes: email=admin@example.com, password=password
    if (email !== "admin@example.com" || password !== "password") {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Get staff user from database
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select("id, email, first_name, last_name, role")
      .eq("email", email)
      .single();

    if (staffError || !staffData) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Create session token
    const sessionToken = generateSessionToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    sessions.set(sessionToken, {
      userId: staffData.id,
      email: staffData.email,
      name: `${staffData.first_name} ${staffData.last_name}`,
      role: staffData.role,
      expiresAt,
    });

    res.json({
      success: true,
      user: {
        id: staffData.id,
        email: staffData.email,
        name: `${staffData.first_name} ${staffData.last_name}`,
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
