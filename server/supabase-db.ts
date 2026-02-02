import { supabase } from "./supabase";

export interface Tour {
  id: string;
  invoice: string;
  language: string;
  name: string;
  pax: number;
  group_id: string;
  dnr: string;
  td: string;
  agent: string;
  arrival: string;
  departure: string;
  accommodation: string;
  gears: string;
  snowshoe: string;
  nlt: string;
  city_tour: string;
  hiking: string;
  fishing: string;
  dog_sledging: string;
  snowmobile_atv: string;
  aurora_village: string;
  aurora_village_activity: string;
  payment: string;
  reservation_number: string;
  remarks: string;
  start_date: string;
  activity_schedule?: string;
  leader?: string;
  members?: string;
  arrival_notes?: string;
  departure_notes?: string;
  activity_notes?: string;
  created_at?: string;
}

export interface ActivityAssignment {
  id: string;
  assignment_type: "arrival" | "departure" | "activity";
  assignment_key: string;
  activity_date: string;
  van: string;
  employees: string;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "staff";
  created_at: string;
  password_hash?: string;
  availability_status?: string;
}

// Tours Database Operations
export const tourDb = {
  async getTours() {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data || []) as Tour[];
  },

  async getTourById(id: string) {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data as Tour | null;
  },

  async addTour(tour: Omit<Tour, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("tours")
      .insert([{ ...tour, id: `tour-${Date.now()}`, created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    return data?.[0] as Tour;
  },

  async updateTour(id: string, updates: Partial<Tour>) {
    const { data, error } = await supabase
      .from("tours")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data?.[0] as Tour | null;
  },

  async deleteTour(id: string) {
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async searchTours(
    dateFrom?: string,
    dateTo?: string,
    invoice?: string,
    name?: string
  ) {
    let query = supabase.from("tours").select("*");

    if (dateFrom) {
      query = query.gte("start_date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("start_date", dateTo);
    }
    if (invoice) {
      query = query.ilike("invoice", `%${invoice}%`);
    }
    if (name) {
      query = query.ilike("name", `%${name}%`);
    }

    const { data, error } = await query.order("start_date", {
      ascending: true,
    });
    if (error) throw error;
    return (data || []) as Tour[];
  },
};

// Staff Database Operations
export const staffDb = {
  async getAllStaff() {
    const { data, error } = await supabase
      .from("staff")
      .select("id,email,first_name,last_name,role,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []) as StaffMember[];
  },

  async getStaffById(id: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data as StaffMember | null;
  },

  async getStaffByEmail(email: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("email", email)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data as StaffMember | null;
  },

  async getStaffByName(firstName: string) {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .ilike("first_name", firstName)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data as StaffMember | null;
  },

  async createStaff(staff: Omit<StaffMember, "id" | "created_at"> & { id?: string }) {
    const { data, error } = await supabase
      .from("staff")
      .insert([{ ...staff, id: staff.id || `staff-${Date.now()}`, created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    return data?.[0] as StaffMember;
  },

  async updateStaff(id: string, updates: Partial<StaffMember>) {
    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data?.[0] as StaffMember | null;
  },

  async deleteStaff(id: string) {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};

// Assignments Database Operations
export const assignmentDb = {
  async getAssignments() {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("activity_date", { ascending: true });
    if (error) throw error;
    return (data || []) as ActivityAssignment[];
  },

  async getAssignmentByKey(assignmentType: string, assignmentKey: string, activityDate: string) {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("assignment_type", assignmentType)
      .eq("assignment_key", assignmentKey)
      .eq("activity_date", activityDate)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data as ActivityAssignment | null;
  },

  async saveAssignment(
    assignmentType: "arrival" | "departure" | "activity",
    assignmentKey: string,
    activityDate: string,
    van: string,
    employees: string
  ) {
    const existing = await this.getAssignmentByKey(assignmentType, assignmentKey, activityDate);

    if (existing) {
      const { data, error } = await supabase
        .from("assignments")
        .update({
          van,
          employees,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select();
      if (error) throw error;
      return data?.[0] as ActivityAssignment;
    } else {
      const { data, error } = await supabase
        .from("assignments")
        .insert([
          {
            id: `assignment-${Date.now()}`,
            assignment_type: assignmentType,
            assignment_key: assignmentKey,
            activity_date: activityDate,
            van,
            employees,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();
      if (error) throw error;
      return data?.[0] as ActivityAssignment;
    }
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
