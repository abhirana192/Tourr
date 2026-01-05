import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

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

export default function Summary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activitiesData, setActivitiesData] = useState<ActivityData[]>([]);

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
          if (guests.length > 0) {
            result.push({
              activityKey: key,
              activityName: timingData.name,
              guests,
            });
          }
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

  if (activitiesData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No activities have been scheduled yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-6">
      <div className="max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Summary</h1>
          <p className="text-gray-600 mt-1">Guest details for all scheduled activities</p>
        </div>

        <div className="space-y-8">
          {activitiesData.map((activityData) => (
            <div key={activityData.activityKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {/* Activity Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
                <h2 className="text-xl font-bold text-blue-900">{activityData.activityName}</h2>
                <p className="text-sm text-blue-700 mt-1">{activityData.guests.length} guest{activityData.guests.length !== 1 ? "s" : ""} scheduled</p>
              </div>

              {/* Table */}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Arrival Flight</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-r border-gray-200">Departure Flight</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Activity Timing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityData.guests.map((guest, idx) => (
                      <tr key={idx} className={`border-b border-gray-200 hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{guest.guestName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.language}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center border-r border-gray-200 font-medium">{guest.pax}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.tourName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.agent}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.accommodation}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrival}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrivalTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.arrivalFlight}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departure}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departureTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">{guest.departureFlight}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{guest.activityTiming}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
