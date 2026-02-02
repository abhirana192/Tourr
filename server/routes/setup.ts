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
  res.json({
    success: true,
    message: "Password initialization is no longer needed. Use the setup endpoint to create users.",
  });
};
