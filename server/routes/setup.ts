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
    // Check if admin user already exists
    const existingAdmin = await staffDb.getStaffByName("Admin");
    if (existingAdmin) {
      console.log("[Setup] Admin user already exists");
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

    // Create admin user using proper database helper
    const adminUser = await staffDb.createStaff({
      id: `admin-${Date.now()}`,
      email: "admin@tourmanager.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      password_hash: hashPassword("admin123"),
      availability_status: "available",
    });

    console.log("[Setup] Admin user created successfully:", adminUser);

    res.json({
      success: true,
      message: "Admin user created successfully!",
      credentials: {
        username: "Admin",
        password: "admin123",
      },
    });
  } catch (error) {
    console.error("[Setup] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Setup failed";
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
