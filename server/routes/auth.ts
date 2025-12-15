import { RequestHandler } from "express";
import { supabase } from "../supabase";

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("id, email, first_name, last_name, role")
        .eq("auth_user_id", data.user.id)
        .single();

      if (staffError) throw staffError;

      res.json({
        success: true,
        user: {
          id: staffData.id,
          email: staffData.email,
          name: `${staffData.first_name} ${staffData.last_name}`,
          role: staffData.role,
        },
        session: data.session,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({ error: errorMessage });
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

export const getSession: RequestHandler = async (req, res) => {
  try {
    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      const { data: staffData, error } = await supabase
        .from("staff")
        .select("id, email, name, role")
        .eq("id", data.session.user.id)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        user: {
          id: data.session.user.id,
          email: staffData.email,
          name: staffData.name,
          role: staffData.role,
        },
        session: data.session,
      });
    } else {
      res.json({ success: true, user: null, session: null });
    }
  } catch (error) {
    console.error("Session error:", error);
    res.json({ success: true, user: null, session: null });
  }
};
