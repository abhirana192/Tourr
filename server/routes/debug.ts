import { RequestHandler } from "express";
import { staffDb } from "../supabase-db";

export const debugStatus: RequestHandler = async (req, res) => {
  try {
    console.log("[Debug] Checking system status...");

    // Check if staff table is accessible
    const allStaff = await staffDb.getAllStaff();
    console.log("[Debug] All staff members:", allStaff);

    // Try to find Admin user
    const adminUser = await staffDb.getStaffByName("Admin");
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
    
    // Create admin user directly with timestamp
    const adminUser = await staffDb.createStaff({
      email: "admin@tourmanager.com",
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      password_hash: "6ee6e1af4d36f8b2b87f4a7e5f5c0b8a3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3", // hashed "admin123"
      availability_status: "available",
    });

    console.log("[Debug] Admin user created:", adminUser);

    // Verify it was created by searching
    const found = await staffDb.getStaffByName("Admin");
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
