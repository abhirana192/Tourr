import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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

interface DayItinerary {
  day: string;
  arrivalInfo: string;
  departureInfo: string;
  hotelInfo: string;
  paymentInfo: string;
}

export default function Arrival() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async (dateFrom = "", dateTo = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const url = `/api/tours${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch tours");
      }

      const data = await response.json();
      setTours(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load tours";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFromChange = (value: string) => {
    setSearchDateFrom(value);
    fetchTours(value, searchDateTo);
  };

  const handleDateToChange = (value: string) => {
    setSearchDateTo(value);
    fetchTours(searchDateFrom, value);
  };

  const handleReset = () => {
    setSearchDateFrom("");
    setSearchDateTo("");
    setSelectedTour(null);
    fetchTours("", "");
  };

  const extractDateAndTime = (value: any) => {
    if (!value) return { date: "", time: "" };
    const str = String(value).trim();
    const parts = str.split("|");
    const date = parts[0]?.trim() || "";
    const time = parts[1]?.trim() || "";
    const flight = parts[2]?.trim() || "";
    return { date, time, flight };
  };

  const generateDayItinerary = (tour: Tour): DayItinerary[] => {
    const arrival = extractDateAndTime(tour.arrival);
    const departure = extractDateAndTime(tour.departure);
    const itinerary: DayItinerary[] = [];

    const getDayActivities = (dayIndex: number): string => {
      const activities: string[] = [];

      if (dayIndex === 0) {
        if (tour.remarks) {
          activities.push(tour.remarks);
        } else {
          activities.push("Welcome and airport pickup");
        }
      } else {
        const dayActivities = [];
        if (tour.hiking === "Yes") dayActivities.push("Hiking");
        if (tour.fishing === "Yes") dayActivities.push("Fishing");
        if (tour.dog_sledging === "Yes") dayActivities.push("Dog Sledding");
        if (tour.snowmobile_atv === "Yes") dayActivities.push("Snowmobile/ATV");
        if (tour.aurora_village === "Yes") dayActivities.push("Aurora Village");
        if (tour.city_tour === "Yes") dayActivities.push("City Tour");
        if (tour.snowshoe === "Yes") dayActivities.push("Snowshoe");

        if (dayActivities.length === 0) {
          activities.push("*Free activity");
        } else {
          activities.push(dayActivities.join(", "));
        }
      }

      return activities.join(" ");
    };

    // Arrival Day
    itinerary.push({
      day: "Arrival Day",
      arrivalInfo: arrival.date ? `${arrival.date} ${arrival.time}${arrival.flight ? ` ${arrival.flight}` : ""}` : "-",
      departureInfo: "*Free activity",
      hotelInfo: tour.accommodation ? `${tour.accommodation}` : "-",
      paymentInfo: tour.pax ? `${tour.pax}` : "-",
    });

    // Day 1, 2, 3
    for (let i = 1; i <= 3; i++) {
      itinerary.push({
        day: i === 1 ? "1st Day" : i === 2 ? "2nd Day" : "3rd Day",
        arrivalInfo: "*Free activity",
        departureInfo: i < 3 ? "*Free activity" : `${departure.date ? departure.date : "-"} ${departure.time ? departure.time : ""}`,
        hotelInfo: tour.accommodation ? `Aurora Viewing 9:30PM - 1:30AM` : "*Free activity",
        paymentInfo: i === 1 && tour.payment ? `*Optional (Self-pay) - ${tour.payment}` : "-",
      });
    }

    // Departure Day (4th Day)
    itinerary.push({
      day: "4th Day",
      arrivalInfo: "Shuttle service is scheduled 2 hours before the departure flight. Please wait in the lobby of your accommodation.",
      departureInfo: `(Cold-weather gear will be collected at the end of the 3rd itinerary)`,
      hotelInfo: tour.accommodation ? `${tour.accommodation}` : "-",
      paymentInfo: "-",
    });

    return itinerary;
  };

  const dayItinerary = selectedTour ? generateDayItinerary(selectedTour) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-2 pt-6">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Guest Arrival Information</h1>
        </div>

        {/* Filters */}
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">From Date</label>
              <Input
                type="date"
                value={searchDateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">To Date</label>
              <Input
                type="date"
                value={searchDateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Guest</label>
              <select
                value={selectedTour?.id || ""}
                onChange={(e) => {
                  const tour = tours.find((t) => t.id === e.target.value);
                  setSelectedTour(tour || null);
                }}
                className="w-full py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select a guest...</option>
                {tours.map((tour) => (
                  <option key={tour.id} value={tour.id}>
                    {tour.name} ({tour.pax} pax) - {tour.start_date}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleReset}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium"
              >
                <RotateCcw size={14} /> Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !selectedTour && (
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
            <p className="text-gray-500 text-center">
              Select a guest from the dropdown above to view their arrival information
            </p>
          </div>
        )}

        {/* Arrival Information Table */}
        {!loading && selectedTour && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Guest Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">{selectedTour.name}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-gray-600">Invoice:</span>
                  <p className="font-semibold text-gray-900">{selectedTour.invoice}</p>
                </div>
                <div>
                  <span className="text-gray-600">Pax:</span>
                  <p className="font-semibold text-gray-900">{selectedTour.pax}</p>
                </div>
                <div>
                  <span className="text-gray-600">Language:</span>
                  <p className="font-semibold text-gray-900">{selectedTour.language}</p>
                </div>
                <div>
                  <span className="text-gray-600">Group:</span>
                  <p className="font-semibold text-gray-900">{selectedTour.group_id}</p>
                </div>
              </div>
            </div>

            {/* Itinerary Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-yellow-100 border-b border-gray-300">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-300 min-w-24">BASIC INFO</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-300 min-w-32">ARRIVAL (AFR)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-300 min-w-32">DEPARTURE (DEP)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-300 min-w-40">HOTEL (ACCOMMODATION)</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 min-w-16">PAX</th>
                  </tr>
                </thead>
                <tbody>
                  {dayItinerary.map((day, idx) => {
                    const arrival = extractDateAndTime(selectedTour.arrival);
                    const departure = extractDateAndTime(selectedTour.departure);

                    return (
                      <tr key={`${day.day}-${idx}`} className={`border-b border-gray-300 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                        <td className="px-4 py-3 text-xs text-gray-900 border-r border-gray-300 font-semibold">
                          <div>{day.day}</div>
                          <div className="text-gray-600">{day.date}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 border-r border-gray-300">
                          {idx === 0 && arrival.date ? (
                            <div>
                              <div className="font-semibold">{arrival.date}</div>
                              <div className="text-gray-600">{arrival.time}</div>
                              {arrival.flight && <div className="text-gray-500">{arrival.flight}</div>}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 border-r border-gray-300">
                          {idx === dayItinerary.length - 1 && departure.date ? (
                            <div>
                              <div className="font-semibold">{departure.date}</div>
                              <div className="text-gray-600">{departure.time}</div>
                              {departure.flight && <div className="text-gray-500">{departure.flight}</div>}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900 border-r border-gray-300">
                          {selectedTour.accommodation ? (
                            <div>{selectedTour.accommodation}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900">
                          {selectedTour.pax}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Activities Section */}
            {dayItinerary.some((day) => day.activities.length > 0) && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Planned Activities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayItinerary.map((day) => (
                    <div key={day.day} className="bg-white p-3 rounded border border-gray-200">
                      <div className="font-semibold text-xs text-gray-700 mb-2">{day.day}</div>
                      <div className="space-y-1 text-xs">
                        {day.activities.map((activity, idx) => (
                          <div key={idx} className="text-gray-600">
                            {activity.time && <span className="font-semibold">{activity.time}:</span>} {activity.activity}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
