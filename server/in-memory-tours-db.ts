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
  is_cancelled?: boolean;
  created_at?: string;
}

// In-memory tours storage
let tours: Map<string, Tour> = new Map();

export const inMemoryToursDb = {
  async getTours(): Promise<Tour[]> {
    return Array.from(tours.values()).sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });
  },

  async getTourById(id: string): Promise<Tour | null> {
    return tours.get(id) || null;
  },

  async addTour(tour: Omit<Tour, "id" | "created_at">): Promise<Tour> {
    const id = `tour-${Date.now()}`;
    const newTour: Tour = {
      ...tour,
      id,
      created_at: new Date().toISOString(),
    };
    tours.set(id, newTour);
    console.log(`[InMemoryToursDB] Created tour: ${newTour.invoice}`);
    return newTour;
  },

  async updateTour(id: string, updates: Partial<Tour>): Promise<Tour | null> {
    const existing = tours.get(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates };
    tours.set(id, updated);
    console.log(`[InMemoryToursDB] Updated tour: ${id}`);
    return updated;
  },

  async deleteTour(id: string): Promise<boolean> {
    const deleted = tours.delete(id);
    if (deleted) {
      console.log(`[InMemoryToursDB] Deleted tour: ${id}`);
    }
    return deleted;
  },

  async searchTours(
    dateFrom?: string,
    dateTo?: string,
    invoice?: string,
    name?: string
  ): Promise<Tour[]> {
    let results = Array.from(tours.values());

    if (dateFrom) {
      results = results.filter(t => new Date(t.start_date) >= new Date(dateFrom));
    }
    if (dateTo) {
      results = results.filter(t => new Date(t.start_date) <= new Date(dateTo));
    }
    if (invoice) {
      results = results.filter(t => t.invoice.toLowerCase().includes(invoice.toLowerCase()));
    }
    if (name) {
      results = results.filter(t => t.name.toLowerCase().includes(name.toLowerCase()));
    }

    return results.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateA - dateB;
    });
  },

  // Get all tours data for syncing
  async getAllToursData(): Promise<Map<string, Tour>> {
    return new Map(tours);
  },

  // Bulk import tours (for syncing from other databases)
  async importTours(toursData: Map<string, Tour>): Promise<void> {
    tours = new Map(toursData);
    console.log(`[InMemoryToursDB] Imported ${tours.size} tours`);
  },
};
