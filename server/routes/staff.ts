import { RequestHandler } from "express";
import crypto from "crypto";
import { sendNotificationEmail, EmailNotification } from "../email";
import { getSessionFromRequest } from "./auth";

// Simple password hashing using crypto (alternative to bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

async function makeSupabaseRequest(method: string, path: string, body?: any) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase credentials");
  }

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
}

export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const data = await makeSupabaseRequest("GET", "/staff?select=id,email,first_name,last_name,role,created_at");

    // Transform the response to match the expected format
    const transformedData = data.map((staff: any) => ({
      id: staff.id,
      email: staff.email,
      name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
      role: staff.role,
      created_at: staff.created_at,
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
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

    // Insert into staff table
    const staffData = await makeSupabaseRequest("POST", "/staff", {
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      availability_status: "available",
      password_hash: passwordHash,
    });

    const createdStaff = staffData[0];

    // Send notification email if user is authenticated
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
      await sendNotificationEmail(notification);
    }

    res.status(201).json({
      success: true,
      data: {
        id: createdStaff.id,
        email: createdStaff.email,
        name: createdStaff.last_name ? `${createdStaff.first_name} ${createdStaff.last_name}` : createdStaff.first_name,
        role: createdStaff.role,
        created_at: createdStaff.created_at,
      }
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

    const updates: any = {};
    if (name) {
      const nameParts = name.trim().split(/\s+/);
      updates.first_name = nameParts[0];
      updates.last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    }
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (password) {
      updates.password_hash = hashPassword(password);
    }

    // Update staff record
    const updatedData = await makeSupabaseRequest("PATCH", `/staff?id=eq.${id}`, updates);

    if (!updatedData || updatedData.length === 0) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const staff = updatedData[0];

    res.json({
      success: true,
      data: {
        id: staff.id,
        email: staff.email,
        name: staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.first_name,
        role: staff.role,
        created_at: staff.created_at,
      }
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

    await makeSupabaseRequest("DELETE", `/staff?id=eq.${id}`, undefined);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
};
