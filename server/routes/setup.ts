import { RequestHandler } from "express";
import crypto from "crypto";
import { staffDb } from "../supabase-db";
import { inMemoryStaffDb, initializeInMemoryDb } from "../in-memory-db";

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "salt")
    .digest("hex");
}

export const initializeDemo: RequestHandler = async (req, res) => {
  try {
    console.log("[Setup] Starting admin user initialization...");

    // Initialize in-memory DB if not already done
    initializeInMemoryDb();

    // Check if admin user already exists (try in-memory first)
    console.log("[Setup] Checking if Admin user exists...");
    let existingAdmin = await inMemoryStaffDb.getStaffByName("Admin");
    console.log("[Setup] In-memory admin user search result:", existingAdmin);

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

    // Create admin user in in-memory database
    console.log("[Setup] Creating new admin user in in-memory database...");
    const passwordHash = hashPassword("admin123");
    console.log("[Setup] Password hash generated");

    const adminUser = await inMemoryStaffDb.createStaff({
      id: `admin-${Date.now()}`,
      email: "admin@tourmanager.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      password_hash: passwordHash,
      availability_status: "available",
    });

    console.log("[Setup] Admin user created successfully:", adminUser);

    // Verify the user was created
    const verifyAdmin = await inMemoryStaffDb.getStaffByName("Admin");
    console.log("[Setup] Verification - Admin user found:", verifyAdmin);

    res.json({
      success: true,
      message: "Admin user created successfully!",
      credentials: {
        username: "Admin",
        password: "admin123",
      },
      debug: {
        userCreated: !!adminUser,
        userVerified: !!verifyAdmin,
      },
    });
  } catch (error) {
    console.error("[Setup] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Setup failed";
    res.status(500).json({
      error: errorMessage,
      debug: error instanceof Error ? error.stack : undefined,
    });
  }
};

export const initializePasswords: RequestHandler = async (req, res) => {
  res.json({
    success: true,
    message: "Password initialization is no longer needed. Use the setup endpoint to create users.",
  });
};
