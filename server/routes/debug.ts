import { RequestHandler } from "express";
import { createStaff, getAllStaff, getStaffByFirstName } from "../db";

export const debugStatus: RequestHandler = async (req, res) => {
  try {
    console.log("[Debug] Checking system status...");

    const allStaff = await getAllStaff();
    const adminUser = await getStaffByFirstName("Admin");
    console.log("[Debug] Admin user search result:", adminUser);

    // Return status
    res.json({
      success: true,
      status: {
        staffTableAccessible: true,
        totalStaffMembers: allStaff.length,
        adminUserExists: !!adminUser,
        allStaff: allStaff.map(s => ({
          id: s.id,
          email: s.email,
          name: `${s.first_name} ${s.last_name}`,
          role: s.role
        })),
      },
    });
  } catch (error) {
    console.error("[Debug] Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    });
  }
};

export const debugCreateAdminManual: RequestHandler = async (req, res) => {
  try {
    console.log("[Debug] Attempting to create admin user manually...");

    const crypto = await import("crypto");
    const hashPassword = (password: string) =>
      crypto.createHash("sha256").update(password + "salt").digest("hex");

    const adminUser = await createStaff({
      email: "admin@tourmanager.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      password_hash: hashPassword("admin123"),
      availability_status: "available",
    });

    const found = await getStaffByFirstName("Admin");
    console.log("[Debug] Verification search result:", found);

    res.json({
      success: true,
      message: "Admin user created",
      user: adminUser,
      verified: found ? true : false,
    });
  } catch (error) {
    console.error("[Debug] Error creating admin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
