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
    const data = await staffDb.getAllStaff();

    console.log("[getAllStaff] Got staff from Supabase:", data.length, "records");
    demoModeCreatedStaff = [];

    const staffList = data.map((staff: any) => ({
      id: staff.id,
      email: staff.email,
      name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
      role: staff.role,
      created_at: staff.created_at,
    }));

    const result = deduplicateStaff(staffList);
    res.json(result);
  } catch (error) {
    console.error("[getAllStaff] Error fetching from Supabase:", error);

    console.log("[getAllStaff] Falling back to demo data");
    const fallbackData = [
      ...DEMO_STAFF.map((staff: any) => ({
        id: staff.id,
        email: staff.email,
        name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
        role: staff.role,
        created_at: staff.created_at,
      })),
      ...demoModeCreatedStaff,
    ];

    const result = deduplicateStaff(fallbackData);
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
      createdStaff = await staffDb.createStaff({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        availability_status: "available",
        password_hash: passwordHash,
      });
    } catch (error) {
      console.log("[createStaff] Supabase unavailable, creating in demo mode");
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
    console.error("[createStaff] Error:", error);
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
    const oldStaff = await staffDb.getStaffById(id);
    if (!oldStaff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

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
    const staff = await staffDb.updateStaff(id, updates);

    if (!staff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

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
    console.error("[updateStaff] Error:", error);
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
    const staff = await staffDb.getStaffById(id);
    if (!staff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const fullName = staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name;

    await staffDb.deleteStaff(id);

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
    console.error("[deleteStaff] Error:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
};
