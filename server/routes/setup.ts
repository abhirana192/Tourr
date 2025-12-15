import { RequestHandler } from "express";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

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

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      // If user already exists in auth, that's okay
      if (!authError.message.includes("already registered")) {
        throw authError;
      }
    }

    const userId = authData?.user?.id;

    // Create staff record with proper schema
    const { error: staffError } = await supabase.from("staff").insert([
      {
        email: DEMO_EMAIL,
        first_name: "Admin",
        last_name: "User",
        role: "admin",
        phone: null,
        availability_status: "available",
        auth_user_id: userId,
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
