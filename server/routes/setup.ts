import { RequestHandler } from "express";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

const DEMO_EMAIL = "admin@example.com";
const DEMO_PASSWORD = "password";

async function makeSupabaseRequest(method: string, path: string, body?: any) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Database service is not configured");
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase API error: ${response.status} ${error}`);
    }

    const text = await response.text();
    if (!text) {
      return [];
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Supabase request failed:", error);
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      throw new Error("Database connection failed. Please check your internet connection and try again.");
    }
    throw error;
  }
}

export const initializeDemo: RequestHandler = async (req, res) => {
  try {
    // Check if demo user already exists
    const existingUsers = await makeSupabaseRequest("GET", `/staff?email=eq.${encodeURIComponent(DEMO_EMAIL)}&select=id`);

    if (existingUsers.length > 0) {
      res.json({
        success: true,
        message: "Demo user already exists",
      });
      return;
    }

    // Create demo user in staff table with hashed password
    const passwordHash = hashPassword(DEMO_PASSWORD);

    const createdStaff = await makeSupabaseRequest("POST", "/staff", {
      email: DEMO_EMAIL,
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      availability_status: "available",
      password_hash: passwordHash,
    });

    res.json({
      success: true,
      message: "Demo user created successfully",
      user: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Setup failed";
    res.status(500).json({ error: errorMessage });
  }
};

export const initializePasswords: RequestHandler = async (req, res) => {
  try {
    // Get all staff without password_hash
    const allStaff = await makeSupabaseRequest("GET", "/staff?password_hash=is.null&select=id");

    if (allStaff.length === 0) {
      res.json({
        success: true,
        message: "All staff members already have passwords",
      });
      return;
    }

    // Update all staff with null password_hash to have the demo password hash
    const passwordHash = hashPassword(DEMO_PASSWORD);

    for (const staff of allStaff) {
      await makeSupabaseRequest("PATCH", `/staff?id=eq.${staff.id}`, {
        password_hash: passwordHash,
      });
    }

    res.json({
      success: true,
      message: `Initialized passwords for ${allStaff.length} staff members`,
    });
  } catch (error) {
    console.error("Initialize passwords error:", error);
    const errorMessage = error instanceof Error ? error.message : "Initialization failed";
    res.status(500).json({ error: errorMessage });
  }
};
