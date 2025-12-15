import { RequestHandler } from "express";

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
    },
    ...(body && { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API error: ${response.status} ${error}`);
  }

  return response.json();
}

export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const data = await makeSupabaseRequest("GET", "/staff?select=id,email,first_name,last_name,role,created_at");

    // Transform the response to match the expected format
    const transformedData = data.map((staff: any) => ({
      id: staff.id,
      email: staff.email,
      name: `${staff.first_name} ${staff.last_name}`,
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

    // Split name into first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    // Insert into staff table
    const staffData = await makeSupabaseRequest("POST", "/staff", {
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      availability_status: "available",
    });

    const createdStaff = staffData[0];

    res.status(201).json({
      success: true,
      data: {
        id: createdStaff.id,
        email: createdStaff.email,
        name: `${createdStaff.first_name} ${createdStaff.last_name}`,
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
