import { RequestHandler } from "express";
import crypto from "crypto";
import { createStaff, getStaffByFirstName } from "../db";

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "salt")
    .digest("hex");
}

export const initializeDemo: RequestHandler = async (req, res) => {
  try {
    console.log("[Setup] Starting admin user initialization...");

    const existingAdmin = await getStaffByFirstName("Admin");

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

    const passwordHash = hashPassword("admin123");
    const adminUser = await createStaff({
      id: `admin-${Date.now()}`,
      email: "admin@tourmanager.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      password_hash: passwordHash,
      availability_status: "available",
    });

    const verifyAdmin = await getStaffByFirstName("Admin");

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
