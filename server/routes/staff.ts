import { RequestHandler } from "express";
import crypto from "crypto";
import { sendNotificationEmail, EmailNotification } from "../email";
import { getSessionFromRequest } from "./auth";
import { staffDb } from "../supabase";

// Simple password hashing using crypto (alternative to bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Demo staff data for development without Supabase connection
const DEMO_STAFF = [
  {
    id: "demo-staff-1",
    email: "abhijeet@jiguangtour.com",
    first_name: "Abhijeet",
    last_name: "Rana",
    role: "admin",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "demo-staff-2",
    email: "john@jiguangtour.com",
    first_name: "John",
    last_name: "Smith",
    role: "staff",
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "demo-staff-3",
    email: "sarah@jiguangtour.com",
    first_name: "Sarah",
    last_name: "Johnson",
    role: "staff",
    created_at: "2024-01-03T00:00:00Z",
  },
];

const DEMO_STAFF_IDS = new Set(DEMO_STAFF.map((s) => s.id));

// In-memory storage for newly created staff in demo mode
let demoModeCreatedStaff: any[] = [];

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
      // Return demo data as fallback for development
      console.warn("Using demo staff data - Supabase unavailable");
      return DEMO_STAFF;
    }
    throw error;
  }
}

function deduplicateStaff(staffArray: any[]): any[] {
  const idMap = new Map<string, any>();
  for (const staff of staffArray) {
    if (!idMap.has(staff.id)) {
      idMap.set(staff.id, staff);
    } else {
      console.warn(`[deduplicateStaff] Duplicate found and removed: ${staff.id}`);
    }
  }
  return Array.from(idMap.values());
}

export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const data = await makeSupabaseRequest("GET", "/staff?select=id,email,first_name,last_name,role,created_at");

    // Check if this is demo data (returned due to Supabase being unavailable)
    const isDemoFallback = data.length > 0 && DEMO_STAFF_IDS.has(data[0].id);

    let staffList: any[] = [];

    if (isDemoFallback) {
      // Supabase unavailable - use demo data ONLY (no mixed data)
      console.log("[getAllStaff] Supabase unavailable - using demo data only");
      staffList = DEMO_STAFF.map((staff: any) => ({
        id: staff.id,
        email: staff.email,
        name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
        role: staff.role,
        created_at: staff.created_at,
      }));
    } else if (data.length > 0) {
      // Real data from Supabase
      console.log("[getAllStaff] Received real data from Supabase");
      demoModeCreatedStaff = [];
      staffList = data.map((staff: any) => ({
        id: staff.id,
        email: staff.email,
        name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
        role: staff.role,
        created_at: staff.created_at,
      }));
    } else {
      // Empty response, use demo
      console.log("[getAllStaff] Empty response, using demo data");
      staffList = DEMO_STAFF.map((staff: any) => ({
        id: staff.id,
        email: staff.email,
        name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
        role: staff.role,
        created_at: staff.created_at,
      }));
    }

    // Add demo-mode created staff only if we're in demo mode
    if (isDemoFallback && demoModeCreatedStaff.length > 0) {
      console.log("[getAllStaff] Adding demo-created staff:", demoModeCreatedStaff.map((s: any) => s.id));
      staffList = [...staffList, ...demoModeCreatedStaff];
    }

    // Final deduplication before sending
    console.log("[getAllStaff] Before final dedup count:", staffList.length, "IDs:", staffList.map((s: any) => s.id));
    const result = deduplicateStaff(staffList);
    console.log("[getAllStaff] After final dedup count:", result.length, "IDs:", result.map((s: any) => s.id));

    res.json(result);
  } catch (error) {
    console.error("Error fetching staff:", error);

    // Fallback to demo data
    console.log("[getAllStaff] Exception occurred, returning demo data");
    const staffList = DEMO_STAFF.map((staff: any) => ({
      id: staff.id,
      email: staff.email,
      name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
      role: staff.role,
      created_at: staff.created_at,
    }));

    if (demoModeCreatedStaff.length > 0) {
      staffList.push(...demoModeCreatedStaff);
    }

    const result = deduplicateStaff(staffList);
    res.json(result);
  }
};

export const createStaff: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Get current user from session
    const currentUser = getSessionFromRequest(req);

    // Split name into first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Hash the password
    const passwordHash = hashPassword(password);

    let createdStaff: any;

    try {
      // Try to insert into Supabase
      const staffData = await makeSupabaseRequest("POST", "/staff", {
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        availability_status: "available",
        password_hash: passwordHash,
      });

      createdStaff = staffData[0];
    } catch (error) {
      // If Supabase fails, create in demo mode (in-memory)
      console.log("Creating staff in demo mode (Supabase unavailable)");
      const demoId = `staff-${Date.now()}`;
      createdStaff = {
        id: demoId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        created_at: new Date().toISOString(),
        password_hash: passwordHash,
      };

      // Store in memory for subsequent fetches
      demoModeCreatedStaff.push({
        id: createdStaff.id,
        email: createdStaff.email,
        name: createdStaff.last_name ? `${createdStaff.first_name} ${createdStaff.last_name}` : createdStaff.first_name,
        role: createdStaff.role,
        created_at: createdStaff.created_at,
      });
    }

    // Send notification email if user is authenticated
    let emailResult = null;
    if (currentUser) {
      const notification: EmailNotification = {
        action: "create",
        type: "staff",
        changes: {
          email: { new: email },
          name: { new: name },
          role: { new: role },
        },
        changedBy: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
        },
        recordId: createdStaff.id,
        recordName: name,
        timestamp: new Date().toISOString(),
      };
      emailResult = await sendNotificationEmail(notification);
    }

    res.status(201).json({
      success: true,
      data: {
        id: createdStaff.id,
        email: createdStaff.email,
        name: createdStaff.last_name ? `${createdStaff.first_name} ${createdStaff.last_name}` : createdStaff.first_name,
        role: createdStaff.role,
        created_at: createdStaff.created_at,
      },
      emailSent: emailResult,
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({ error: "Failed to create staff" });
  }
};

export const updateStaff: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!id) {
      res.status(400).json({ error: "Missing staff ID" });
      return;
    }

    // Get current user from session
    const currentUser = getSessionFromRequest(req);

    // Fetch the old staff data
    const oldStaffData = await makeSupabaseRequest("GET", `/staff?id=eq.${id}&select=id,email,first_name,last_name,role,created_at`);
    if (!oldStaffData || oldStaffData.length === 0) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const oldStaff = oldStaffData[0];
    const oldFullName = oldStaff.last_name ? `${oldStaff.first_name} ${oldStaff.last_name}` : oldStaff.first_name;

    const updates: any = {};
    const changes: any = {};

    if (name) {
      const nameParts = name.trim().split(/\s+/);
      updates.first_name = nameParts[0];
      updates.last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
      if (oldFullName !== name) {
        changes.name = { old: oldFullName, new: name };
      }
    }
    if (email && email !== oldStaff.email) {
      updates.email = email;
      changes.email = { old: oldStaff.email, new: email };
    }
    if (role && role !== oldStaff.role) {
      updates.role = role;
      changes.role = { old: oldStaff.role, new: role };
    }
    if (password) {
      updates.password_hash = hashPassword(password);
      changes.password = { old: "[Hidden]", new: "[Updated]" };
    }

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      res.json({
        success: true,
        data: {
          id: oldStaff.id,
          email: oldStaff.email,
          name: oldFullName,
          role: oldStaff.role,
          created_at: oldStaff.created_at,
        }
      });
      return;
    }

    // Update staff record
    const updatedData = await makeSupabaseRequest("PATCH", `/staff?id=eq.${id}`, updates);

    if (!updatedData || updatedData.length === 0) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const staff = updatedData[0];

    // Send notification email if user is authenticated and there are changes
    let emailResult = null;
    if (currentUser && Object.keys(changes).length > 0) {
      const notification: EmailNotification = {
        action: "update",
        type: "staff",
        changes,
        changedBy: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
        },
        recordId: staff.id,
        recordName: oldFullName,
        timestamp: new Date().toISOString(),
      };
      emailResult = await sendNotificationEmail(notification);
    }

    res.json({
      success: true,
      data: {
        id: staff.id,
        email: staff.email,
        name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
        role: staff.role,
        created_at: staff.created_at,
      },
      emailSent: emailResult,
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
};

export const deleteStaff: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Missing staff ID" });
      return;
    }

    // Get current user from session
    const currentUser = getSessionFromRequest(req);

    // Fetch the staff data before deletion
    const staffData = await makeSupabaseRequest("GET", `/staff?id=eq.${id}&select=id,email,first_name,last_name,role,created_at`);
    if (!staffData || staffData.length === 0) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const staff = staffData[0];
    const fullName = staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name;

    await makeSupabaseRequest("DELETE", `/staff?id=eq.${id}`, undefined);

    // Send notification email if user is authenticated
    let emailResult = null;
    if (currentUser) {
      const notification: EmailNotification = {
        action: "delete",
        type: "staff",
        changes: {
          email: { old: staff.email },
          name: { old: fullName },
          role: { old: staff.role },
        },
        changedBy: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
        },
        recordId: staff.id,
        recordName: fullName,
        timestamp: new Date().toISOString(),
      };
      emailResult = await sendNotificationEmail(notification);
    }

    res.json({ success: true, emailSent: emailResult });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
};
