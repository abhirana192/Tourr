import { useState, useEffect } from "react";
import { AlertCircle, Loader2, Edit2, Save, X } from "lucide-react";

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
  guestName: string;
  language: string;
  pax: number;
  tourName: string;
  invoiceNumber: string;
  agent: string;
  arrival: string;
  arrivalTime: string;
  arrivalFlight: string;
  departure: string;
  departureTime: string;
  departureFlight: string;
  accommodation: string;
  activityTiming?: string;
  dayNumber?: number;
  activityDate?: string;
  activityName?: string;
}

interface ActivityByDate {
  date: string;
  activities: Array<{
    guestName: string;
    tourName: string;
    invoiceNumber: string;
    language: string;
    pax: number;
    agent: string;
    accommodation: string;
    activityName: string;
    activityTiming: string;
    dayNumber: number;
  }>;
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
};

interface ActivityData {
  activityKey: string;
  activityName: string;
  guests: GuestActivityRow[];
}

interface ActivityAssignment {
  activityKey: string;
  guestIndex: number;
  van: string;
  employee: string;
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
  const [editingKey, setEditingKey] = useState<string | null>(null);

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
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff");
        if (!response.ok) throw new Error("Failed to fetch staff");
        const data = await response.json();
        setStaffList(data || []);
      } catch (err) {
        console.warn("Failed to fetch staff:", err);
      }
    };
    fetchStaff();
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

        const activityMap = new Map<string, GuestActivityRow[]>();

        for (const tour of tours) {
          try {
            const scheduleResponse = await fetch(`/api/tours/${tour.id}/schedule`);
            if (!scheduleResponse.ok) continue;

            const scheduleData = await scheduleResponse.json();
            const schedule: ActivitySchedule = scheduleData.schedule || {};

            const arrivalData = extractDateAndTime(tour.arrival);
            const departureData = extractDateAndTime(tour.departure);

            // Track which activities are present in this tour
            const activitiesInTour = new Set<string>();

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
                    activitiesInTour.add(key);

                    if (!activityMap.has(key)) {
                      activityMap.set(key, []);
                    }

                    const guestRow: GuestActivityRow = {
                      guestName: tour.name,
                      language: tour.language,
                      pax: tour.pax,
                      tourName: tour.name,
                      invoiceNumber: tour.invoice,
                      agent: tour.agent,
                      arrival: arrivalData.date,
                      arrivalTime: arrivalData.time,
                      arrivalFlight: arrivalData.flight,
                      departure: departureData.date,
                      departureTime: departureData.time,
                      departureFlight: departureData.flight,
                      accommodation: tour.accommodation,
                      activityTiming: activity.timings?.[0] || "",
                      dayNumber: dayIndex,
                    };

                    activityMap.get(key)!.push(guestRow);
                    break;
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
          const guests = activityMap.get(key) || [];
          result.push({
            activityKey: key,
            activityName: timingData.name,
            guests,
          });
        }

        result.sort((a, b) => b.guests.length - a.guests.length);
        setActivitiesData(result);
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
  const allGuests = activitiesData.flatMap((activity) => activity.guests);
  const uniqueGuestsByTour = Array.from(new Map(allGuests.map((g) => [g.tourName + g.invoiceNumber, g])).values());

  const arrivals = uniqueGuestsByTour.filter((guest) => {
    if (!guest.arrival) return false;
    return guest.arrival >= filterFromDate && guest.arrival <= filterToDate;
  });

  const departures = uniqueGuestsByTour.filter((guest) => {
    if (!guest.departure) return false;
    return guest.departure >= filterFromDate && guest.departure <= filterToDate;
  });

  const filteredActivities = activitiesData.map((activity) => ({
    ...activity,
    guests: activity.guests.filter((guest) => {
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
          </div>
        </div>

        {/* Arrivals Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-6 py-4">
            <h2 className="text-xl font-bold text-green-900">Arrivals</h2>
            <p className="text-sm text-green-700 mt-1">{arrivals.length} guest{arrivals.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Tour</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Van</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No arrivals scheduled for this date range
                    </td>
                  </tr>
                ) : (
                  arrivals.map((guest, idx) => {
                    const arrivalInfo = [guest.arrival, guest.arrivalTime].filter(Boolean).join(" ") + (guest.arrivalFlight ? ` | ${guest.arrivalFlight}` : "");
                    const assignmentKey = `arrival-${idx}`;
                    const assignment = assignments.get(assignmentKey) || { van: "", employee: "" };
                    const isEditing = editingKey === assignmentKey;
                    return (
                      <tr key={idx} className={`border-b border-gray-200 hover:bg-green-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{arrivalInfo}</td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={assignment.van}
                              onChange={(e) => {
                                const newAssignments = new Map(assignments);
                                newAssignments.set(assignmentKey, { ...assignment, van: e.target.value });
                                setAssignments(newAssignments);
                              }}
                              placeholder="e.g., Van A"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-gray-600">{assignment.van || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          {isEditing ? (
                            <select
                              value={assignment.employee}
                              onChange={(e) => {
                                const newAssignments = new Map(assignments);
                                newAssignments.set(assignmentKey, { ...assignment, employee: e.target.value });
                                setAssignments(newAssignments);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Employee</option>
                              {staffList.map((staff) => (
                                <option key={staff.id} value={staff.name}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-600">{assignment.employee || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingKey(null)}
                                className="text-green-600 hover:text-green-700 flex items-center gap-1"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAssignments(new Map(assignments));
                                  setEditingKey(null);
                                }}
                                className="text-red-600 hover:text-red-700 flex items-center gap-1"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingKey(assignmentKey)}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
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
            <h2 className="text-xl font-bold text-red-900">Departures</h2>
            <p className="text-sm text-red-700 mt-1">{departures.length} guest{departures.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Tour</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Van</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {departures.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      No departures scheduled for this date range
                    </td>
                  </tr>
                ) : (
                  departures.map((guest, idx) => {
                    const departureInfo = [guest.departure, guest.departureTime].filter(Boolean).join(" ") + (guest.departureFlight ? ` | ${guest.departureFlight}` : "");
                    const assignmentKey = `departure-${idx}`;
                    const assignment = assignments.get(assignmentKey) || { van: "", employee: "" };
                    const isEditing = editingKey === assignmentKey;
                    return (
                      <tr key={idx} className={`border-b border-gray-200 hover:bg-red-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{departureInfo}</td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={assignment.van}
                              onChange={(e) => {
                                const newAssignments = new Map(assignments);
                                newAssignments.set(assignmentKey, { ...assignment, van: e.target.value });
                                setAssignments(newAssignments);
                              }}
                              placeholder="e.g., Van A"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-gray-600">{assignment.van || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          {isEditing ? (
                            <select
                              value={assignment.employee}
                              onChange={(e) => {
                                const newAssignments = new Map(assignments);
                                newAssignments.set(assignmentKey, { ...assignment, employee: e.target.value });
                                setAssignments(newAssignments);
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Employee</option>
                              {staffList.map((staff) => (
                                <option key={staff.id} value={staff.name}>
                                  {staff.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-600">{assignment.employee || "-"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingKey(null)}
                                className="text-green-600 hover:text-green-700 flex items-center gap-1"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAssignments(new Map(assignments));
                                  setEditingKey(null);
                                }}
                                className="text-red-600 hover:text-red-700 flex items-center gap-1"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingKey(assignmentKey)}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
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
                <h2 className="text-xl font-bold text-blue-900">{activityData.activityName}</h2>
                <p className="text-sm text-blue-700 mt-1">{activityData.guests.length} guest{activityData.guests.length !== 1 ? "s" : ""} scheduled</p>
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Language</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-r border-gray-200">Pax</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Tour</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Agent</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Hotel</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arr</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Dep</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Activity Timing</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Van</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityData.guests.map((guest, idx) => {
                        const arrivalInfo = [guest.arrival, guest.arrivalTime].filter(Boolean).join(" ") + (guest.arrivalFlight ? ` | ${guest.arrivalFlight}` : "");
                        const departureInfo = [guest.departure, guest.departureTime].filter(Boolean).join(" ") + (guest.departureFlight ? ` | ${guest.departureFlight}` : "");
                        const assignmentKey = `${activityData.activityKey}-${idx}`;
                        const assignment = assignments.get(assignmentKey) || { van: "", employee: "" };
                        const isEditing = editingKey === assignmentKey;
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
                            <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.activityTiming}</td>
                            <td className="px-4 py-3 text-sm border-r border-gray-200">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={assignment.van}
                                  onChange={(e) => {
                                    const newAssignments = new Map(assignments);
                                    newAssignments.set(assignmentKey, { ...assignment, van: e.target.value });
                                    setAssignments(newAssignments);
                                  }}
                                  placeholder="e.g., Van A"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span className="text-gray-600">{assignment.van || "-"}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm border-r border-gray-200">
                              {isEditing ? (
                                <select
                                  value={assignment.employee}
                                  onChange={(e) => {
                                    const newAssignments = new Map(assignments);
                                    newAssignments.set(assignmentKey, { ...assignment, employee: e.target.value });
                                    setAssignments(newAssignments);
                                  }}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  <option value="">Select Employee</option>
                                  {staffList.map((staff) => (
                                    <option key={staff.id} value={staff.name}>
                                      {staff.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-gray-600">{assignment.employee || "-"}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingKey(null)}
                                    className="text-green-600 hover:text-green-700 flex items-center gap-1"
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAssignments(new Map(assignments));
                                      setEditingKey(null);
                                    }}
                                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setEditingKey(assignmentKey)}
                                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
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
