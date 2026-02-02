import { RequestHandler } from "express";
import crypto from "crypto";
import { staffDb } from "../supabase-db";

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "salt")
    .digest("hex");
}

export const initializeDemo: RequestHandler = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase configuration is missing");
    }

    const ADMIN_USER = {
      id: "admin-user-001",
      email: "admin@tourmanager.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      password_hash: hashPassword("admin123"),
      availability_status: "available",
    };

    // Check if user already exists
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/staff?id=eq.${ADMIN_USER.id}&select=id`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
    });

    const existingUsers = await checkResponse.json();
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.json({
        success: true,
        message: "Admin user already exists",
        credentials: {
          username: "Admin",
          password: "admin123",
        },
      });
      return;
    }

    // Create admin user
    const createResponse = await fetch(`${supabaseUrl}/rest/v1/staff`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(ADMIN_USER),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create admin user: ${error}`);
    }

    res.json({
      success: true,
      message: "Admin user created successfully!",
      credentials: {
        username: "Admin",
        password: "admin123",
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Setup failed";
    res.status(500).json({ error: errorMessage });
  }
};

export const initializePasswords: RequestHandler = async (req, res) => {
  try {
    // Get all staff without password_hash
    const allStaff = await makeSupabaseRequest(
      "GET",
      "/staff?password_hash=is.null&select=id",
    );

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
    const errorMessage =
      error instanceof Error ? error.message : "Initialization failed";
    res.status(500).json({ error: errorMessage });
  }
};
