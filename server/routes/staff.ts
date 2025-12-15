import { RequestHandler } from "express";
import { supabase } from "../supabase";

export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase.from("staff").select("id, email, name, role, created_at");
    if (error) throw error;
    res.json(data || []);
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

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { data, error } = await supabase.from("staff").insert([
      {
        id: authData.user.id,
        email,
        name,
        role,
      },
    ]);

    if (error) throw error;

    res.status(201).json({ success: true, data: data?.[0] });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({ error: "Failed to create staff" });
  }
};

export const updateStaff: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, password } = req.body;

    if (!id) {
      res.status(400).json({ error: "Missing staff ID" });
      return;
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (role) updates.role = role;

    if (password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(id, {
        password,
      });
      if (pwError) throw pwError;
    }

    const { data, error } = await supabase.from("staff").update(updates).eq("id", id).select();

    if (error) throw error;

    res.json({ success: true, data: data?.[0] });
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

    await supabase.auth.admin.deleteUser(id);

    const { error } = await supabase.from("staff").delete().eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
};
