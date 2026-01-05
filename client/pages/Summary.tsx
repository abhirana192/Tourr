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

interface ActivityDetail {
  activityKey: string;
  activityName: string;
  timings: string[];
  totalGuests: number;
  tours: Array<{
    tourId: string;
    tourName: string;
    invoiceNumber: string;
    pax: number;
    occurrences: number;
  }>;
}

export default function Summary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<ActivityDetail[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all tours
        const toursResponse = await fetch("/api/tours");
        if (!toursResponse.ok) {
          throw new Error("Failed to fetch tours");
        }
        const tours: Tour[] = await toursResponse.json();

        // Aggregate activities
        const activityMap = new Map<string, ActivityDetail>();

        // Initialize activity map with all activity types
        for (const [key, data] of Object.entries(ACTIVITY_TIMINGS)) {
          activityMap.set(key, {
            activityKey: key,
            activityName: data.name,
            timings: data.timings,
            totalGuests: 0,
            tours: [],
          });
        }

        // Process each tour
        for (const tour of tours) {
          try {
            // Fetch schedule for this tour
            const scheduleResponse = await fetch(`/api/tours/${tour.id}/schedule`);
            if (!scheduleResponse.ok) continue;

            const scheduleData = await scheduleResponse.json();
            const schedule: ActivitySchedule = scheduleData.schedule || {};

            // Count activity occurrences for this tour
            const activityCounts = new Map<string, number>();

            // Iterate through all days in schedule
            for (const dayData of Object.values(schedule) as any[]) {
              const allActivities = [
                ...(dayData.plannedActivities || []),
                ...(dayData.arrivalActivities || []),
                ...(dayData.hotelActivities || []),
              ];

              for (const activity of allActivities) {
                // Find the activity key by matching the name
                for (const [key, timingData] of Object.entries(ACTIVITY_TIMINGS)) {
                  if (timingData.name === activity.name) {
                    const count = activityCounts.get(key) || 0;
                    activityCounts.set(key, count + 1);
                    break;
                  }
                }
              }
            }

            // Add tour data to activities
            for (const [activityKey, count] of activityCounts.entries()) {
              const detail = activityMap.get(activityKey);
              if (detail) {
                detail.totalGuests += tour.pax;
                const existingTour = detail.tours.find((t) => t.tourId === tour.id);
                if (existingTour) {
                  existingTour.occurrences += count;
                } else {
                  detail.tours.push({
                    tourId: tour.id,
                    tourName: tour.name,
                    invoiceNumber: tour.invoice,
                    pax: tour.pax,
                    occurrences: count,
                  });
                }
              }
            }
          } catch (err) {
            console.warn(`Failed to fetch schedule for tour ${tour.id}:`, err);
          }
        }

        // Filter to only activities that have been scheduled, sort by total guests
        const activeActivities = Array.from(activityMap.values())
          .filter((a) => a.tours.length > 0)
          .sort((a, b) => b.totalGuests - a.totalGuests);

        setActivities(activeActivities);
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

  const toggleActivityExpand = (activityKey: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityKey)) {
      newExpanded.delete(activityKey);
    } else {
      newExpanded.add(activityKey);
    }
    setExpandedActivities(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-2 pt-6">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Summary</h1>
          <p className="text-gray-600 mt-1">Complete overview of all scheduled activities across all tours</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error loading data</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading activity data...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No activities have been scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.activityKey} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Activity Header */}
                <button
                  onClick={() => toggleActivityExpand(activity.activityKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{activity.activityName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.tours.length} tour{activity.tours.length !== 1 ? "s" : ""} • {activity.totalGuests} total guest{activity.totalGuests !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {activity.totalGuests} guests
                    </div>
                  </div>
                  <div className={`ml-4 transition-transform ${expandedActivities.has(activity.activityKey) ? "rotate-180" : ""}`}>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </button>

                {/* Activity Details */}
                {expandedActivities.has(activity.activityKey) && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    {/* Timings */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Available Timings</h4>
                      <div className="space-y-2">
                        {activity.timings.map((timing, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span>{timing}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tours breakdown */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Tours ({activity.tours.length})</h4>
                      <div className="space-y-3">
                        {activity.tours.map((tour) => (
                          <div key={tour.tourId} className="bg-white rounded border border-gray-200 p-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{tour.tourName}</p>
                                <p className="text-xs text-gray-600 mt-1">Invoice: {tour.invoiceNumber}</p>
                                <p className="text-xs text-gray-600">Group ID / PAX: {tour.pax}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-2xl font-bold text-blue-600">{tour.pax}</div>
                                <p className="text-xs text-gray-600">guests</p>
                                <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {tour.occurrences} occurrence{tour.occurrences !== 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
