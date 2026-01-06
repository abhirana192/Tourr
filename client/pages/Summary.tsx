import { useState, useEffect } from "react";
import { AlertCircle, Loader2, Edit2, Save, X, Printer } from "lucide-react";

interface Tour {
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

interface Activity {
  name: string;
  timings: string[];
  notes?: string;
}

interface ActivitySchedule {
  [dayIndex: number]: {
    plannedActivities: Activity[];
    arrivalActivities: Activity[];
    hotelActivities: Activity[];
    note: string;
  };
}

interface Staff {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string;
}

interface GuestActivityRow {
  tourId: string;
  guestName: string;
  language: string;
  pax: number;
  tourName: string;
  invoiceNumber: string;
  agent: string;
  tourDuration: string;
  arrival: string;
  arrivalTime: string;
  arrivalFlight: string;
  departure: string;
  departureTime: string;
  departureFlight: string;
  accommodation: string;
  arrival_notes?: string;
  departure_notes?: string;
  activityTiming?: string;
  dayNumber?: number;
  activityDate?: string;
  activityName?: string;
}


const ACTIVITY_TIMINGS: { [key: string]: Activity } = {
  city_tour: {
    name: "City Tour",
    timings: ["10:00~10:15 AM - 12:00 PM", "3:00 PM - 4:30 PM"],
  },
  fishing: {
    name: "Ice Fishing",
    timings: ["10:30~10:50 AM - 1:45 PM", "9:30~9:50 AM - 12:45 PM"],
  },
  dog_sledging: {
    name: "Dog Sledging",
    timings: ["1:30~1:45 PM - 3:30 PM"],
  },
  snowmobile_atv: {
    name: "Snowmobile",
    timings: ["10:00~10:15 AM - 11:30 AM", "1:30~1:45 PM - 3:00 PM"],
  },
  hiking: {
    name: "Cameron Fall Hiking",
    timings: ["1:00~1:15 PM - 3:00 PM", "1:30~1:45 PM - 5:00 PM"],
  },
  aurora_village: {
    name: "Ice Lake Tour",
    timings: ["11:00 AM - 12:00 PM", "2:00~2:15 PM - 3:30 PM"],
  },
  nlt: {
    name: "Aurora Viewing",
    timings: ["9:30~9:50 PM - 1:30 AM", "10:00~10:15 PM - 2:00 AM"],
  },
  aurora_village_activity: {
    name: "Aurora Village",
    timings: [],
  },
};

interface ActivityData {
  activityKey: string;
  activityName: string;
  guests: GuestActivityRow[];
}

interface ActivityAssignment {
  id: string;
  assignment_type: "arrival" | "departure" | "activity";
  assignment_key: string;
  activity_date: string;
  van: string;
  employees: string;
  created_at: string;
  updated_at: string;
}

export default function Summary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activitiesData, setActivitiesData] = useState<ActivityData[]>([]);
  const [filterFromDate, setFilterFromDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  });
  const [filterToDate, setFilterToDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const date = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  });
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<Map<string, ActivityAssignment>>(new Map());
  const [tableAssignments, setTableAssignments] = useState<Map<string, { van: string; employees: string[]; notes: string }>>(new Map());
  const [editingTableKey, setEditingTableKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allTourGuests, setAllTourGuests] = useState<GuestActivityRow[]>([]);
  const [editingNotes, setEditingNotes] = useState<Map<string, { arrival_notes: string; departure_notes: string }>>(new Map());

  const saveTableAssignment = async (
    assignmentType: "arrival" | "departure" | "activity",
    assignmentKey: string,
    activityDate: string,
    van: string,
    employees: string[]
  ) => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentType,
          assignmentKey,
          activityDate,
          van,
          employees: employees.join(","),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save assignment");
      }

      const savedAssignment: ActivityAssignment = await response.json();
      const key = `${assignmentType}-${assignmentKey}-${activityDate}`;
      const newTableAssignments = new Map(tableAssignments);
      newTableAssignments.set(key, { van, employees });
      setTableAssignments(newTableAssignments);
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert("Failed to save assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const saveGuestNotes = async (tourId: string, arrival_notes: string, departure_notes: string) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/tours/${tourId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrival_notes,
          departure_notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      // Update the allTourGuests with new notes
      setAllTourGuests((prev) =>
        prev.map((guest) =>
          guest.tourId === tourId
            ? { ...guest, arrival_notes, departure_notes }
            : guest
        )
      );

      // Clear editing state for this guest
      const newEditingNotes = new Map(editingNotes);
      newEditingNotes.delete(tourId);
      setEditingNotes(newEditingNotes);
    } catch (err) {
      console.error("Error saving notes:", err);
      alert("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const extractDateAndTime = (value: any) => {
    if (!value) return { date: "", time: "", flight: "" };
    const str = String(value).trim();

    if (str.includes("|")) {
      const parts = str.split("|");
      const date = parts[0]?.trim() || "";
      const time = parts[1]?.trim() || "";
      const flight = parts[2]?.trim() || "";
      return { date, time, flight };
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const date = str.substring(0, 10);
      const time = str.substring(11).trim() || "";
      return { date, time, flight: "" };
    }

    return { date: str, time: "", flight: "" };
  };

  useEffect(() => {
    const fetchStaffAndAssignments = async () => {
      try {
        const staffResponse = await fetch("/api/staff");
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          setStaffList(staffData || []);
        }
      } catch (err) {
        console.warn("Failed to fetch staff:", err);
      }

      try {
        const assignmentsResponse = await fetch("/api/assignments");
        if (assignmentsResponse.ok) {
          const assignmentsData: ActivityAssignment[] = await assignmentsResponse.json();
          const assignmentMap = new Map<string, { van: string; employees: string[] }>();

          for (const assignment of assignmentsData) {
            const key = `${assignment.assignment_type}-${assignment.assignment_key}-${assignment.activity_date}`;
            assignmentMap.set(key, {
              van: assignment.van,
              employees: assignment.employees ? assignment.employees.split(",") : [],
            });
          }

          setTableAssignments(assignmentMap);
        }
      } catch (err) {
        console.warn("Failed to fetch assignments:", err);
      }
    };

    fetchStaffAndAssignments();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const toursResponse = await fetch("/api/tours");
        if (!toursResponse.ok) {
          throw new Error("Failed to fetch tours");
        }
        const tours: Tour[] = await toursResponse.json();

        const activityMap = new Map<string, Map<string, GuestActivityRow>>();
        const allTourGuests: GuestActivityRow[] = [];

        for (const tour of tours) {
          const arrivalData = extractDateAndTime(tour.arrival);
          const departureData = extractDateAndTime(tour.departure);

          // Add to all guests list for arrivals/departures
          const guestBaseRow: GuestActivityRow = {
            tourId: tour.id,
            guestName: tour.name,
            language: tour.language,
            pax: tour.pax,
            tourName: tour.name,
            invoiceNumber: tour.invoice,
            agent: tour.agent,
            tourDuration: tour.td,
            arrival: arrivalData.date,
            arrivalTime: arrivalData.time,
            arrivalFlight: arrivalData.flight,
            departure: departureData.date,
            departureTime: departureData.time,
            departureFlight: departureData.flight,
            accommodation: tour.accommodation,
            arrival_notes: tour.arrival_notes || "",
            departure_notes: tour.departure_notes || "",
          };
          allTourGuests.push(guestBaseRow);

          try {
            const scheduleResponse = await fetch(`/api/tours/${tour.id}/schedule`);
            if (scheduleResponse.ok) {
              const scheduleData = await scheduleResponse.json();
              const schedule: ActivitySchedule = scheduleData.schedule || {};

              for (const [dayIndexStr, dayData] of Object.entries(schedule)) {
                const dayIndex = parseInt(dayIndexStr);
                const allActivities = [
                  ...(dayData.plannedActivities || []),
                  ...(dayData.arrivalActivities || []),
                  ...(dayData.hotelActivities || []),
                ];

                for (const activity of allActivities) {
                  for (const [key, timingData] of Object.entries(ACTIVITY_TIMINGS)) {
                    if (timingData.name === activity.name) {
                      if (!activityMap.has(key)) {
                        activityMap.set(key, new Map());
                      }

                      const guestRow: GuestActivityRow = {
                        ...guestBaseRow,
                        activityTiming: activity.timings?.[0] || "",
                        dayNumber: dayIndex,
                      };

                      // Use tour name as key to deduplicate - only one entry per guest per activity
                      activityMap.get(key)!.set(tour.name, guestRow);
                      break;
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch schedule for tour ${tour.id}:`, err);
          }
        }

        const result: ActivityData[] = [];
        for (const [key, timingData] of Object.entries(ACTIVITY_TIMINGS)) {
          const guestMap = activityMap.get(key);
          const guests: GuestActivityRow[] = guestMap ? Array.from(guestMap.values()) : [];
          result.push({
            activityKey: key,
            activityName: timingData.name,
            guests,
          });
        }

        result.sort((a, b) => b.guests.length - a.guests.length);
        setActivitiesData(result);
        setAllTourGuests(allTourGuests);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Summary fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading activity data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-red-200 p-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error loading data</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  // Filter guests based on date range
  const uniqueGuestsByTour = Array.from(new Map(allTourGuests.map((g) => [g.tourName + g.invoiceNumber, g])).values());

  const arrivals = uniqueGuestsByTour.filter((guest) => {
    if (!guest.arrival) return false;
    return guest.arrival >= filterFromDate && guest.arrival <= filterToDate;
  });

  const departures = uniqueGuestsByTour.filter((guest) => {
    if (!guest.departure) return false;
    return guest.departure >= filterFromDate && guest.departure <= filterToDate;
  });

  console.log("Date filter:", { filterFromDate, filterToDate });
  console.log("Arrivals:", arrivals.length);
  console.log("Departures:", departures.length);

  const filteredActivities = activitiesData.map((activity) => ({
    ...activity,
    guests: (activity.guests || []).filter((guest) => {
      if (!guest.arrival) return false;
      return guest.arrival >= filterFromDate && guest.arrival <= filterToDate;
    }),
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-6">
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Summary</h1>
          <p className="text-gray-600 mt-1">Complete guest and activity overview</p>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, "0");
                const date = String(today.getDate()).padStart(2, "0");
                const todayStr = `${year}-${month}-${date}`;
                setFilterFromDate(todayStr);
                setFilterToDate(todayStr);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              Reset to Today
            </button>
            <button
              onClick={() => {
                const printWindow = window.open("", "", "height=900,width=1200");
                if (!printWindow) {
                  alert("Failed to open print window");
                  return;
                }

                const arrivalsTableRows = arrivals.map((guest) => `
                  <tr>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.guestName}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.language}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd; text-align: center;">${guest.pax}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.tourDuration || "-"}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.accommodation}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.agent}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrivalTime || "-"}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrivalFlight || "-"}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrival_notes || "-"}</td>
                  </tr>
                `).join("");

                const departuresTableRows = departures.map((guest) => `
                  <tr>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.guestName}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.language}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd; text-align: center;">${guest.pax}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.tourDuration || "-"}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.accommodation}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.agent}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.departureTime || "-"}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.departureFlight || "-"}</td>
                    <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.departure_notes || "-"}</td>
                  </tr>
                `).join("");

                let activitiesSections = "";
                filteredActivities.forEach((activity) => {
                  if (activity.guests.length === 0) return;
                  const isAuroraVillage = activity.activityKey === "aurora_village_activity";
                  let tableHeaders = "";
                  let tableRows = "";

                  if (isAuroraVillage) {
                    tableHeaders = `
                      <tr style="background-color: #f3f4f6; border: 1px solid #ddd;">
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Name</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Language</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd; text-align: center;">Pax</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">T/D</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Hotel</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Agent</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Arrival Time</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Arrival Flight</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Departure Time</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Departure Flight</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Notes</th>
                      </tr>
                    `;
                    tableRows = activity.guests.map((guest) => `
                      <tr>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.guestName}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.language}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd; text-align: center;">${guest.pax}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.tourDuration || "-"}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.accommodation}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.agent}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrivalTime || "-"}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrivalFlight || "-"}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.departureTime || "-"}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.departureFlight || "-"}</td>
                        <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrival_notes || guest.departure_notes || "-"}</td>
                      </tr>
                    `).join("");
                  } else {
                    tableHeaders = `
                      <tr style="background-color: #f3f4f6; border: 1px solid #ddd;">
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Name</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Language</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd; text-align: center;">Pax</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Tour</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Invoice</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Agent</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Hotel</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Arrival</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Departure</th>
                        <th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Notes</th>
                      </tr>
                    `;
                    tableRows = activity.guests.map((guest) => {
                      const arrivalInfo = [guest.arrival, guest.arrivalTime].filter(Boolean).join(" ") + (guest.arrivalFlight ? ` | ${guest.arrivalFlight}` : "");
                      const departureInfo = [guest.departure, guest.departureTime].filter(Boolean).join(" ") + (guest.departureFlight ? ` | ${guest.departureFlight}` : "");
                      return `
                        <tr>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.guestName}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.language}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd; text-align: center;">${guest.pax}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.tourName}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.invoiceNumber}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.agent}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.accommodation}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${arrivalInfo}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${departureInfo}</td>
                          <td style="padding: 8px; font-size: 11px; border: 1px solid #ddd;">${guest.arrival_notes || guest.departure_notes || "-"}</td>
                        </tr>
                      `;
                    }).join("");
                  }
                  const activityAssignment = tableAssignments.get(`activity-${activity.activityKey}`) || { van: "", employees: [], notes: "" };
                  activitiesSections += `
                    <div style="margin-top: 30px; page-break-inside: avoid;">
                      <h3 style="font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 12px; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">${activity.activityName}</h3>
                      <div style="margin-bottom: 12px; font-size: 11px; color: #666;">
                        <div><strong>Van:</strong> ${activityAssignment.van || "-"}</div>
                        <div><strong>Staff:</strong> ${activityAssignment.employees.length > 0 ? activityAssignment.employees.join(", ") : "-"}</div>
                        ${activityAssignment.notes ? `<div><strong>Notes:</strong> ${activityAssignment.notes}</div>` : ""}
                      </div>
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
                        <thead>${tableHeaders}</thead>
                        <tbody>${tableRows}</tbody>
                      </table>
                    </div>
                  `;
                });

                const htmlContent = `
                  <html>
                    <head>
                      <title>Summary Report</title>
                      <style>
                        @page { size: portrait; margin: 10mm; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: white; color: #333; }
                        h1 { font-size: 24px; margin-bottom: 8px; color: #1e40af; text-align: center; font-weight: bold; }
                        .date-range { color: #666; font-size: 12px; margin-bottom: 20px; text-align: center; font-style: italic; }
                        h2 { font-size: 16px; font-weight: bold; color: #047857; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #047857; padding-bottom: 8px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
                        th { background: #f3f4f6; color: #1f2937; font-weight: bold; padding: 8px; text-align: left; border: 1px solid #ddd; }
                        td { border: 1px solid #ddd; padding: 8px; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        @media print { body { margin: 0; padding: 10mm; } h2 { page-break-after: avoid; } table { page-break-inside: avoid; } }
                      </style>
                    </head>
                    <body>
                      <h1>Summary Report</h1>
                      <p class="date-range">Period: ${filterFromDate} to ${filterToDate}</p>
                      <h2>Arrivals (${arrivals.length} guests)</h2>
                      ${arrivals.length === 0 ? '<p style="color: #999; font-style: italic;">No arrivals in this period</p>' : `<table><thead><tr style="background-color: #f3f4f6; border: 1px solid #ddd;"><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Name</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Language</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd; text-align: center;">Pax</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">T/D</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Hotel</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Agent</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Arrival Time</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Arrival Flight</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Notes</th></tr></thead><tbody>${arrivalsTableRows}</tbody></table>`}
                      <h2>Departures (${departures.length} guests)</h2>
                      ${departures.length === 0 ? '<p style="color: #999; font-style: italic;">No departures in this period</p>' : `<table><thead><tr style="background-color: #f3f4f6; border: 1px solid #ddd;"><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Name</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Language</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd; text-align: center;">Pax</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">T/D</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Hotel</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Agent</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Departure Time</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Departure Flight</th><th style="padding: 8px; font-size: 11px; font-weight: bold; border: 1px solid #ddd;">Notes</th></tr></thead><tbody>${departuresTableRows}</tbody></table>`}
                      <div style="margin-top: 40px;"><h2 style="margin-top: 0;">Activities by Type</h2>${filteredActivities.every((a) => a.guests.length === 0) ? '<p style="color: #999; font-style: italic;">No activities scheduled in this period</p>' : activitiesSections}</div>
                    </body>
                  </html>
                `;

                printWindow.document.write(htmlContent);
                printWindow.document.close();
                setTimeout(() => { printWindow.print(); }, 250);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2"
            >
              <Printer size={16} /> Print
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Showing data from {filterFromDate} to {filterToDate}</p>
        </div>

        {/* Arrivals Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-green-900">Arrivals</h2>
                <p className="text-sm text-green-700 mt-1">{arrivals.length} guest{arrivals.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-4 items-end">
                {editingTableKey === "arrival" ? (
                  <div className="flex gap-3 flex-wrap">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Van</label>
                      <input
                        type="text"
                        value={tableAssignments.get("arrival-arrival-" + filterFromDate)?.van || ""}
                        onChange={(e) => {
                          const key = "arrival-arrival-" + filterFromDate;
                          const newAssignments = new Map(tableAssignments);
                          newAssignments.set(key, {
                            van: e.target.value,
                            employees: newAssignments.get(key)?.employees || [],
                            notes: newAssignments.get(key)?.notes || "",
                          });
                          setTableAssignments(newAssignments);
                        }}
                        placeholder="e.g., Van A"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                      />
                    </div>
                    <div className="flex-1 min-w-[300px]">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Staff (select one or more)</label>
                      <div className="border border-gray-300 rounded p-2 bg-white max-h-32 overflow-y-auto">
                        {staffList.length === 0 ? (
                          <p className="text-xs text-gray-500">No staff available</p>
                        ) : (
                          staffList.map((staff) => {
                            const key = "arrival-arrival-" + filterFromDate;
                            const selectedEmployees = tableAssignments.get(key)?.employees || [];
                            const isSelected = selectedEmployees.includes(staff.name);
                            return (
                              <label key={staff.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newAssignments = new Map(tableAssignments);
                                    const currentEmployees = newAssignments.get(key)?.employees || [];
                                    if (e.target.checked) {
                                      currentEmployees.push(staff.name);
                                    } else {
                                      const index = currentEmployees.indexOf(staff.name);
                                      if (index > -1) currentEmployees.splice(index, 1);
                                    }
                                    newAssignments.set(key, {
                                      van: newAssignments.get(key)?.van || "",
                                      employees: currentEmployees,
                                    });
                                    setTableAssignments(newAssignments);
                                  }}
                                  className="w-4 h-4"
                                />
                                <span>{staff.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const key = "arrival-arrival-" + filterFromDate;
                        const assignment = tableAssignments.get(key) || { van: "", employees: [] };
                        await saveTableAssignment("arrival", "arrival", filterFromDate, assignment.van, assignment.employees);
                        setEditingTableKey(null);
                      }}
                      disabled={isSaving}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTableKey(null)}
                      className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Van: </span>
                        <span className="font-medium text-gray-900">{tableAssignments.get("arrival-arrival-" + filterFromDate)?.van || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Staff: </span>
                        <span className="font-medium text-gray-900">
                          {(tableAssignments.get("arrival-arrival-" + filterFromDate)?.employees || []).length > 0
                            ? (tableAssignments.get("arrival-arrival-" + filterFromDate)?.employees || []).join(", ")
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingTableKey("arrival")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">T/D</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Flight No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Notes</th>
                </tr>
              </thead>
              <tbody>
                {arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No arrivals scheduled for this date range
                    </td>
                  </tr>
                ) : (
                  arrivals.map((guest, idx) => {
                    const isEditing = editingNotes.get(guest.tourId);
                    return (
                      <tr key={idx} className={`border-b border-gray-200 hover:bg-green-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourDuration}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrivalTime || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrivalFlight || "-"}</td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          {isEditing ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={isEditing.arrival_notes}
                                onChange={(e) => {
                                  const updated = new Map(editingNotes);
                                  updated.set(guest.tourId, { ...isEditing, arrival_notes: e.target.value });
                                  setEditingNotes(updated);
                                }}
                                placeholder="Add note..."
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => saveGuestNotes(guest.tourId, isEditing.arrival_notes, isEditing.departure_notes)}
                                disabled={isSaving}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:bg-gray-400"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  const updated = new Map(editingNotes);
                                  updated.delete(guest.tourId);
                                  setEditingNotes(updated);
                                }}
                                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const updated = new Map(editingNotes);
                                updated.set(guest.tourId, {
                                  arrival_notes: guest.arrival_notes || "",
                                  departure_notes: guest.departure_notes || "",
                                });
                                setEditingNotes(updated);
                              }}
                              className="text-xs text-gray-600 hover:text-gray-900 hover:underline cursor-pointer"
                            >
                              {guest.arrival_notes ? "✎ " + guest.arrival_notes.substring(0, 30) + (guest.arrival_notes.length > 30 ? "..." : "") : "Add note"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Departures Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 px-6 py-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-red-900">Departures</h2>
                <p className="text-sm text-red-700 mt-1">{departures.length} guest{departures.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex gap-4 items-end">
                {editingTableKey === "departure" ? (
                  <div className="flex gap-3 flex-wrap">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Van</label>
                      <input
                        type="text"
                        value={tableAssignments.get("departure-departure-" + filterToDate)?.van || ""}
                        onChange={(e) => {
                          const key = "departure-departure-" + filterToDate;
                          const newAssignments = new Map(tableAssignments);
                          newAssignments.set(key, {
                            van: e.target.value,
                            employees: newAssignments.get(key)?.employees || [],
                            notes: newAssignments.get(key)?.notes || "",
                          });
                          setTableAssignments(newAssignments);
                        }}
                        placeholder="e.g., Van A"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                      />
                    </div>
                    <div className="flex-1 min-w-[300px]">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Staff (select one or more)</label>
                      <div className="border border-gray-300 rounded p-2 bg-white max-h-32 overflow-y-auto">
                        {staffList.length === 0 ? (
                          <p className="text-xs text-gray-500">No staff available</p>
                        ) : (
                          staffList.map((staff) => {
                            const key = "departure-departure-" + filterToDate;
                            const selectedEmployees = tableAssignments.get(key)?.employees || [];
                            const isSelected = selectedEmployees.includes(staff.name);
                            return (
                              <label key={staff.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newAssignments = new Map(tableAssignments);
                                    const currentEmployees = newAssignments.get(key)?.employees || [];
                                    if (e.target.checked) {
                                      currentEmployees.push(staff.name);
                                    } else {
                                      const index = currentEmployees.indexOf(staff.name);
                                      if (index > -1) currentEmployees.splice(index, 1);
                                    }
                                    newAssignments.set(key, {
                                      van: newAssignments.get(key)?.van || "",
                                      employees: currentEmployees,
                                    });
                                    setTableAssignments(newAssignments);
                                  }}
                                  className="w-4 h-4"
                                />
                                <span>{staff.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const key = "departure-departure-" + filterToDate;
                        const assignment = tableAssignments.get(key) || { van: "", employees: [] };
                        await saveTableAssignment("departure", "departure", filterToDate, assignment.van, assignment.employees);
                        setEditingTableKey(null);
                      }}
                      disabled={isSaving}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTableKey(null)}
                      className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Van: </span>
                        <span className="font-medium text-gray-900">{tableAssignments.get("departure-departure-" + filterToDate)?.van || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Staff: </span>
                        <span className="font-medium text-gray-900">
                          {(tableAssignments.get("departure-departure-" + filterToDate)?.employees || []).length > 0
                            ? (tableAssignments.get("departure-departure-" + filterToDate)?.employees || []).join(", ")
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingTableKey("departure")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">T/D</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Flight No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Notes</th>
                </tr>
              </thead>
              <tbody>
                {departures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      No departures scheduled for this date range
                    </td>
                  </tr>
                ) : (
                  departures.map((guest, idx) => {
                    const isEditing = editingNotes.get(guest.tourId);
                    return (
                      <tr key={idx} className={`border-b border-gray-200 hover:bg-red-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourDuration}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departureTime || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departureFlight || "-"}</td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          {isEditing ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={isEditing.departure_notes}
                                onChange={(e) => {
                                  const updated = new Map(editingNotes);
                                  updated.set(guest.tourId, { ...isEditing, departure_notes: e.target.value });
                                  setEditingNotes(updated);
                                }}
                                placeholder="Add note..."
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => saveGuestNotes(guest.tourId, isEditing.arrival_notes, isEditing.departure_notes)}
                                disabled={isSaving}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-gray-400"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  const updated = new Map(editingNotes);
                                  updated.delete(guest.tourId);
                                  setEditingNotes(updated);
                                }}
                                className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const updated = new Map(editingNotes);
                                updated.set(guest.tourId, {
                                  arrival_notes: guest.arrival_notes || "",
                                  departure_notes: guest.departure_notes || "",
                                });
                                setEditingNotes(updated);
                              }}
                              className="text-xs text-gray-600 hover:text-gray-900 hover:underline cursor-pointer"
                            >
                              {guest.departure_notes ? "✎ " + guest.departure_notes.substring(0, 30) + (guest.departure_notes.length > 30 ? "..." : "") : "Add note"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activities Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Activities by Type</h2>
          <p className="text-gray-600 mt-1">Guest details for all scheduled activities</p>
        </div>

        <div className="space-y-8">
          {filteredActivities.map((activityData) => (
            <div key={activityData.activityKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {/* Activity Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900">{activityData.activityName}</h2>
                    <p className="text-sm text-blue-700 mt-1">{activityData.guests.length} guest{activityData.guests.length !== 1 ? "s" : ""} scheduled</p>
                  </div>
                  <div className="flex gap-4 items-end">
                    {editingTableKey === `activity-${activityData.activityKey}` ? (
                      <div className="flex gap-3 flex-wrap">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Van</label>
                          <input
                            type="text"
                            value={tableAssignments.get(`activity-${activityData.activityKey}`)?.van || ""}
                            onChange={(e) => {
                              const key = `activity-${activityData.activityKey}`;
                              const newAssignments = new Map(tableAssignments);
                              newAssignments.set(key, {
                                van: e.target.value,
                                employees: newAssignments.get(key)?.employees || [],
                                notes: newAssignments.get(key)?.notes || "",
                              });
                              setTableAssignments(newAssignments);
                            }}
                            placeholder="e.g., Van A"
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                          />
                        </div>
                        <div className="flex-1 min-w-[300px]">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Staff (select one or more)</label>
                          <div className="border border-gray-300 rounded p-2 bg-white max-h-32 overflow-y-auto">
                            {staffList.length === 0 ? (
                              <p className="text-xs text-gray-500">No staff available</p>
                            ) : (
                              staffList.map((staff) => {
                                const key = `activity-${activityData.activityKey}`;
                                const selectedEmployees = tableAssignments.get(key)?.employees || [];
                                const isSelected = selectedEmployees.includes(staff.name);
                                return (
                                  <label key={staff.id} className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer text-sm">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const newAssignments = new Map(tableAssignments);
                                        const currentEmployees = newAssignments.get(key)?.employees || [];
                                        if (e.target.checked) {
                                          currentEmployees.push(staff.name);
                                        } else {
                                          const index = currentEmployees.indexOf(staff.name);
                                          if (index > -1) currentEmployees.splice(index, 1);
                                        }
                                        newAssignments.set(key, {
                                          van: newAssignments.get(key)?.van || "",
                                          employees: currentEmployees,
                                          notes: newAssignments.get(key)?.notes || "",
                                        });
                                        setTableAssignments(newAssignments);
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <span>{staff.name}</span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-[300px]">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Notes</label>
                          <textarea
                            value={tableAssignments.get(`activity-${activityData.activityKey}`)?.notes || ""}
                            onChange={(e) => {
                              const key = `activity-${activityData.activityKey}`;
                              const newAssignments = new Map(tableAssignments);
                              newAssignments.set(key, {
                                van: newAssignments.get(key)?.van || "",
                                employees: newAssignments.get(key)?.employees || [],
                                notes: e.target.value,
                              });
                              setTableAssignments(newAssignments);
                            }}
                            placeholder="Add notes for this activity..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm h-20"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            const key = `activity-${activityData.activityKey}`;
                            const assignment = tableAssignments.get(key) || { van: "", employees: [], notes: "" };
                            await saveTableAssignment("activity", activityData.activityKey, filterFromDate, assignment.van, assignment.employees);
                            setEditingTableKey(null);
                          }}
                          disabled={isSaving}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingTableKey(null)}
                          className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-4 items-start">
                        <div className="flex flex-col gap-3 flex-1">
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-gray-600">Van: </span>
                              <span className="font-medium text-gray-900">{tableAssignments.get(`activity-${activityData.activityKey}`)?.van || "-"}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Staff: </span>
                              <span className="font-medium text-gray-900">
                                {(tableAssignments.get(`activity-${activityData.activityKey}`)?.employees || []).length > 0
                                  ? (tableAssignments.get(`activity-${activityData.activityKey}`)?.employees || []).join(", ")
                                  : "-"}
                              </span>
                            </div>
                          </div>
                          {(tableAssignments.get(`activity-${activityData.activityKey}`)?.notes || "").trim() && (
                            <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                              <span className="text-gray-600">Notes: </span>
                              <span className="text-gray-900">{tableAssignments.get(`activity-${activityData.activityKey}`)?.notes}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingTableKey(`activity-${activityData.activityKey}`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex-shrink-0"
                        >
                          Assign
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table or No Participants Message */}
              {activityData.guests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No participants scheduled for this activity</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        {activityData.activityKey === "aurora_village_activity" ? (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">T/D</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival Flight</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure Time</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure Flight</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Notes</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Tour</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Invoice</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arr</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Dep</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Notes</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {activityData.guests.map((guest, idx) => {
                        const arrivalInfo = [guest.arrival, guest.arrivalTime].filter(Boolean).join(" ") + (guest.arrivalFlight ? ` | ${guest.arrivalFlight}` : "");
                        const departureInfo = [guest.departure, guest.departureTime].filter(Boolean).join(" ") + (guest.departureFlight ? ` | ${guest.departureFlight}` : "");

                        if (activityData.activityKey === "aurora_village_activity") {
                          return (
                            <tr key={idx} className={`border-b border-gray-200 hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                              <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourDuration || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrivalTime || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrivalFlight || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departureTime || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departureFlight || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{guest.arrival_notes || guest.departure_notes || "-"}</td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={idx} className={`border-b border-gray-200 hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.invoiceNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{arrivalInfo}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{departureInfo}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{guest.arrival_notes || guest.departure_notes || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
