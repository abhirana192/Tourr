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
  tourDuration: string;
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
  id: string;
  assignment_type: "arrival" | "departure" | "activity";
  assignment_key: string;
  activity_date: string;
  van: string;
  employee: string;
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
  const [tableAssignments, setTableAssignments] = useState<Map<string, { van: string; employee: string }>>(new Map());
  const [editingTableKey, setEditingTableKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allTourGuests, setAllTourGuests] = useState<GuestActivityRow[]>([]);

  const saveTableAssignment = async (
    assignmentType: "arrival" | "departure" | "activity",
    assignmentKey: string,
    activityDate: string,
    van: string,
    employee: string
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
          employee,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save assignment");
      }

      const savedAssignment: ActivityAssignment = await response.json();
      const key = `${assignmentType}-${assignmentKey}-${activityDate}`;
      const newTableAssignments = new Map(tableAssignments);
      newTableAssignments.set(key, { van, employee });
      setTableAssignments(newTableAssignments);
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert("Failed to save assignment");
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
          const assignmentMap = new Map<string, { van: string; employee: string }>();

          for (const assignment of assignmentsData) {
            const key = `${assignment.assignment_type}-${assignment.assignment_key}-${assignment.activity_date}`;
            assignmentMap.set(key, {
              van: assignment.van,
              employee: assignment.employee,
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

        // Calculate activities by calendar date
        const dateActivityMap = new Map<string, Map<string, ActivityByDate["activities"][0]>>();
        for (const tour of tours) {
          try {
            const scheduleResponse = await fetch(`/api/tours/${tour.id}/schedule`);
            if (!scheduleResponse.ok) continue;

            const scheduleData = await scheduleResponse.json();
            const schedule: ActivitySchedule = scheduleData.schedule || {};
            const arrivalData = extractDateAndTime(tour.arrival);

            if (!arrivalData.date) continue;

            for (const [dayIndexStr, dayData] of Object.entries(schedule)) {
              const dayIndex = parseInt(dayIndexStr);
              const allActivities = [
                ...(dayData.plannedActivities || []),
                ...(dayData.arrivalActivities || []),
                ...(dayData.hotelActivities || []),
              ];

              for (const activity of allActivities) {
                // Calculate actual date: arrival date + day offset
                const arrivalDate = new Date(arrivalData.date);
                const activityDate = new Date(arrivalDate);
                activityDate.setDate(activityDate.getDate() + dayIndex);
                const activityDateStr = activityDate.toISOString().split("T")[0];

                if (!dateActivityMap.has(activityDateStr)) {
                  dateActivityMap.set(activityDateStr, new Map());
                }

                // Create unique key to deduplicate: guest_name|activity_name
                const dedupeKey = `${tour.name}|${activity.name}`;
                const activityObj = {
                  guestName: tour.name,
                  tourName: tour.name,
                  invoiceNumber: tour.invoice,
                  language: tour.language,
                  pax: tour.pax,
                  agent: tour.agent,
                  accommodation: tour.accommodation,
                  activityName: activity.name,
                  activityTiming: activity.timings?.[0] || "",
                  dayNumber: dayIndex,
                };

                // Only add if this guest+activity combination doesn't exist for this date
                dateActivityMap.get(activityDateStr)!.set(dedupeKey, activityObj);
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch schedule for tour ${tour.id}:`, err);
          }
        }

        const dateActivityList: ActivityByDate[] = Array.from(dateActivityMap.entries())
          .map(([date, activityMap]) => ({ date, activities: Array.from(activityMap.values()) }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setActivitiesByDate(dateActivityList);
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
                  <div className="flex gap-3">
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
                            employee: newAssignments.get(key)?.employee || "",
                          });
                          setTableAssignments(newAssignments);
                        }}
                        placeholder="e.g., Van A"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                      <select
                        value={tableAssignments.get("arrival-arrival-" + filterFromDate)?.employee || ""}
                        onChange={(e) => {
                          const key = "arrival-arrival-" + filterFromDate;
                          const newAssignments = new Map(tableAssignments);
                          newAssignments.set(key, {
                            van: newAssignments.get(key)?.van || "",
                            employee: e.target.value,
                          });
                          setTableAssignments(newAssignments);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-40"
                      >
                        <option value="">Select Employee</option>
                        {staffList.map((staff) => (
                          <option key={staff.id} value={staff.name}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        const key = "arrival-arrival-" + filterFromDate;
                        const assignment = tableAssignments.get(key) || { van: "", employee: "" };
                        await saveTableAssignment("arrival", "arrival", filterFromDate, assignment.van, assignment.employee);
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
                        <span className="text-gray-600">Employee: </span>
                        <span className="font-medium text-gray-900">{tableAssignments.get("arrival-arrival-" + filterFromDate)?.employee || "-"}</span>
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
                </tr>
              </thead>
              <tbody>
                {arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No arrivals scheduled for this date range
                    </td>
                  </tr>
                ) : (
                  arrivals.map((guest, idx) => {
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
                  <div className="flex gap-3">
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
                            employee: newAssignments.get(key)?.employee || "",
                          });
                          setTableAssignments(newAssignments);
                        }}
                        placeholder="e.g., Van A"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                      <select
                        value={tableAssignments.get("departure-departure-" + filterToDate)?.employee || ""}
                        onChange={(e) => {
                          const key = "departure-departure-" + filterToDate;
                          const newAssignments = new Map(tableAssignments);
                          newAssignments.set(key, {
                            van: newAssignments.get(key)?.van || "",
                            employee: e.target.value,
                          });
                          setTableAssignments(newAssignments);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-40"
                      >
                        <option value="">Select Employee</option>
                        {staffList.map((staff) => (
                          <option key={staff.id} value={staff.name}>
                            {staff.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        const key = "departure-departure-" + filterToDate;
                        const assignment = tableAssignments.get(key) || { van: "", employee: "" };
                        await saveTableAssignment("departure", "departure", filterToDate, assignment.van, assignment.employee);
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
                        <span className="text-gray-600">Employee: </span>
                        <span className="font-medium text-gray-900">{tableAssignments.get("departure-departure-" + filterToDate)?.employee || "-"}</span>
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
                </tr>
              </thead>
              <tbody>
                {departures.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No departures scheduled for this date range
                    </td>
                  </tr>
                ) : (
                  departures.map((guest, idx) => {
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
                      </tr>
                    </thead>
                    <tbody>
                      {activityData.guests.map((guest, idx) => {
                        const arrivalInfo = [guest.arrival, guest.arrivalTime].filter(Boolean).join(" ") + (guest.arrivalFlight ? ` | ${guest.arrivalFlight}` : "");
                        const departureInfo = [guest.departure, guest.departureTime].filter(Boolean).join(" ") + (guest.departureFlight ? ` | ${guest.departureFlight}` : "");
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
