// Simple in-memory database for tours
export interface Tour {
  id: string;
  start_date: string;
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
  activity_schedule?: string;
  leader: string;
  members?: string;
  arrival_notes?: string;
  departure_notes?: string;
  activity_notes?: string;
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

// All data is now stored in Supabase - no dummy data
let tours: Tour[] = [];
let assignments: ActivityAssignment[] = [];

export const db = {
  getTours: () => tours,
  getTourById: (id: string) => tours.find((t) => t.id === id),
  addTour: (tour: Omit<Tour, "id">) => {
    const newTour: Tour = {
      ...tour,
      id: Date.now().toString(),
    };
    tours.push(newTour);
    return newTour;
  },
  updateTour: (id: string, updates: Partial<Tour>) => {
    const index = tours.findIndex((t) => t.id === id);
    if (index === -1) return null;
    tours[index] = { ...tours[index], ...updates };
    return tours[index];
  },
  deleteTour: (id: string) => {
    const index = tours.findIndex((t) => t.id === id);
    if (index === -1) return false;
    tours.splice(index, 1);
    return true;
  },
  searchTours: (
    dateFrom?: string,
    dateTo?: string,
    invoice?: string,
    name?: string
  ) => {
    return tours.filter((tour) => {
      const dateFromMatch = dateFrom ? tour.start_date >= dateFrom : true;
      const dateToMatch = dateTo ? tour.start_date <= dateTo : true;
      const invoiceMatch = invoice
        ? tour.invoice.toLowerCase().includes(invoice.toLowerCase())
        : true;
      const nameMatch = name
        ? tour.name.toLowerCase().includes(name.toLowerCase())
        : true;

      return dateFromMatch && dateToMatch && invoiceMatch && nameMatch;
    });
  },
  getAssignments: () => assignments,
  getAssignmentByKey: (assignmentType: string, assignmentKey: string, activityDate: string) => {
    return assignments.find(
      (a) =>
        a.assignment_type === assignmentType &&
        a.assignment_key === assignmentKey &&
        a.activity_date === activityDate
    );
  },
  saveAssignment: (
    assignmentType: "arrival" | "departure" | "activity",
    assignmentKey: string,
    activityDate: string,
    van: string,
    employees: string
  ) => {
    const existingIndex = assignments.findIndex(
      (a) =>
        a.assignment_type === assignmentType &&
        a.assignment_key === assignmentKey &&
        a.activity_date === activityDate
    );

    const now = new Date().toISOString();

    if (existingIndex !== -1) {
      assignments[existingIndex] = {
        ...assignments[existingIndex],
        van,
        employees,
        updated_at: now,
      };
      return assignments[existingIndex];
    }

    const newAssignment: ActivityAssignment = {
      id: Date.now().toString(),
      assignment_type: assignmentType,
      assignment_key: assignmentKey,
      activity_date: activityDate,
      van,
      employees,
      created_at: now,
      updated_at: now,
    };

    assignments.push(newAssignment);
    return newAssignment;
  },
  deleteAssignment: (id: string) => {
    const index = assignments.findIndex((a) => a.id === id);
    if (index === -1) return false;
    assignments.splice(index, 1);
    return true;
  },
};
