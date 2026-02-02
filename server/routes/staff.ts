import { RequestHandler } from "express";
import crypto from "crypto";
import { sendNotificationEmail, EmailNotification } from "../email";
import { getSessionFromRequest } from "./auth";
import { staffDb } from "../supabase-db";

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "salt")
    .digest("hex");
}

export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const staff = await staffDb.getAllStaff();
    const formatted = staff.map((s: any) => ({
      id: s.id,
      email: s.email,
      name: s.last_name ? `${s.first_name} ${s.last_name}` : s.first_name,
      role: s.role,
      created_at: s.created_at,
    }));
    res.json(formatted);
  } catch (error) {
    console.error("[getAllStaff] Error:", error);
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

    const currentUser = getSessionFromRequest(req);
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    const passwordHash = hashPassword(password);

    const staffId = `staff-${Date.now()}`;
    const createdStaff = await staffDb.createStaff({
      id: staffId,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      password_hash: passwordHash,
      availability_status: "available",
    });

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
        name: createdStaff.last_name
          ? `${createdStaff.first_name} ${createdStaff.last_name}`
          : createdStaff.first_name,
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

    const currentUser = getSessionFromRequest(req);
    const oldStaff = await staffDb.getStaffById(id);

    if (!oldStaff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const oldFullName = oldStaff.last_name
      ? `${oldStaff.first_name} ${oldStaff.last_name}`
      : oldStaff.first_name;

    const updates: any = {};
    const changes: any = {};

    if (name) {
      const nameParts = name.trim().split(/\s+/);
      updates.first_name = nameParts[0];
      updates.last_name =
        nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
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

    if (Object.keys(updates).length === 0) {
      res.json({
        success: true,
        data: {
          id: oldStaff.id,
          email: oldStaff.email,
          name: oldFullName,
          role: oldStaff.role,
          created_at: oldStaff.created_at,
        },
      });
      return;
    }

    const staff = await staffDb.updateStaff(id, updates);

    if (!staff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

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
        name: staff.last_name
          ? `${staff.first_name} ${staff.last_name}`
          : staff.first_name,
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

    const currentUser = getSessionFromRequest(req);
    const staff = await staffDb.getStaffById(id);

    if (!staff) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    const fullName = staff.last_name
      ? `${staff.first_name} ${staff.last_name}`
      : staff.first_name;

    await staffDb.deleteStaff(id);

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
