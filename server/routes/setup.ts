import { RequestHandler } from "express";
import { supabase } from "../supabase";

const DEMO_EMAIL = "admin@example.com";
const DEMO_PASSWORD = "password";

export const initializeDemo: RequestHandler = async (req, res) => {
  try {
    // Check if demo user already exists
    const { data: existingUser } = await supabase
      .from("staff")
      .select("id")
      .eq("email", DEMO_EMAIL)
      .single();

    if (existingUser) {
      res.json({
        success: true,
        message: "Demo user already exists",
      });
      return;
    }

    // Create staff record with proper schema
    const { error: staffError } = await supabase.from("staff").insert([
      {
        email: DEMO_EMAIL,
        first_name: "Admin",
        last_name: "User",
        role: "admin",
        phone: null,
        availability_status: "available",
      },
    ]);

    if (staffError) throw staffError;

    res.json({
      success: true,
      message: "Demo user created successfully",
      user: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Setup failed";
    res.status(500).json({ error: errorMessage });
  }
};
