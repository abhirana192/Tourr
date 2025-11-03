// Simple in-memory database for tours
export interface Tour {
  id: string;
  date: string;
  invoice: string;
  language: string;
  name: string;
  pax: number;
  groupId: string;
  dnr: string;
  td: string;
  agent: string;
  arrival: string;
  departure: string;
  accommodation: string;
  gears: string;
  snowshoe: string;
  nlt: string;
  cityTour: string;
  hiking: string;
  fishing: string;
  dogSledging: string;
  snowmobileAtv: string;
  auroraVillage: string;
  payment: string;
  reservationNumber: string;
  remarks: string;
}

let tours: Tour[] = [
  {
    id: "1",
    date: "2024-01-15",
    invoice: "INV001",
    language: "English",
    name: "John Smith (5)",
    pax: 5,
    groupId: "G001",
    dnr: "Yes",
    td: "2h",
    agent: "ABC Tours",
    arrival: "09:00",
    departure: "17:00",
    accommodation: "Hotel X",
    gears: "Included",
    snowshoe: "Yes",
    nlt: "No",
    cityTour: "Yes",
    hiking: "Yes",
    fishing: "No",
    dogSledging: "Yes",
    snowmobileAtv: "No",
    auroraVillage: "Yes",
    payment: "Paid",
    reservationNumber: "RES001",
    remarks: "VIP Group",
  },
];

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
};
