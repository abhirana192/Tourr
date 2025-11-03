import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  payment: string;
  reservation_number: string;
  remarks: string;
  start_date: string;
}

export const tourDb = {
  async getTours() {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getTourById(id: string) {
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async addTour(tour: Omit<Tour, "id">) {
    const { data, error } = await supabase
      .from("tours")
      .insert([{ ...tour, start_date: tour.start_date }])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async updateTour(id: string, updates: Partial<Tour>) {
    const { data, error } = await supabase
      .from("tours")
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data?.[0];
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
    return data || [];
  },
};
