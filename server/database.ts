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
  payment: string;
  reservation_number: string;
  remarks: string;
}

let tours: Tour[] = [
  {
    id: "1",
    start_date: "2024-01-15",
    invoice: "INV001",
    language: "English",
    name: "John Smith (5)",
    pax: 5,
    group_id: "G001",
    dnr: "Yes",
    td: "2h",
    agent: "ABC Tours",
    arrival: "2024-01-15|09:00|AC123",
    departure: "2024-01-18|17:00|AC456",
    accommodation: "Hotel X",
    gears: "Included",
    snowshoe: "Yes",
    nlt: "Yes",
    city_tour: "Yes",
    hiking: "Yes",
    fishing: "Yes",
    dog_sledging: "Yes",
    snowmobile_atv: "Yes",
    aurora_village: "Yes",
    payment: "Paid",
    reservation_number: "RES001",
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
};
