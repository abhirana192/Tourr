import { useState, useEffect } from "react";
import { Calendar, AlertCircle } from "lucide-react";

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

interface DailyActivityCount {
  date: string;
  count: number;
  hiking: number;
  fishing: number;
  dog_sledging: number;
  snowmobile_atv: number;
  aurora_village: number;
  city_tour: number;
  snowshoe: number;
  gears: number;
  dnr: number;
  td: number;
  nlt: number;
}

export default function MonthlyPlan() {
  const [activities, setActivities] = useState<DailyActivityCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Initialize date range to current month
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const fromStr = firstDay.toISOString().split("T")[0];
    const toStr = lastDay.toISOString().split("T")[0];

    setDateFrom(fromStr);
    setDateTo(toStr);
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [selectedMonth, isCustomRange, dateFrom, dateTo]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/tours");

      if (!response.ok) {
        throw new Error("Failed to fetch tours");
      }

      const tours: Tour[] = await response.json();

      // Determine the date range to display
      let rangeStart: Date;
      let rangeEnd: Date;

      if (isCustomRange && dateFrom && dateTo) {
        rangeStart = new Date(dateFrom);
        rangeEnd = new Date(dateTo);
      } else {
        // Default to current month
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        rangeStart = new Date(year, month, 1);
        rangeEnd = new Date(year, month + 1, 0);
      }

      // Filter tours within the date range
      const filteredTours = tours.filter((tour) => {
        const tourDate = new Date(tour.start_date);
        return tourDate >= rangeStart && tourDate <= rangeEnd;
      });

      // Group tours by date and count activities
      const dateMap = new Map<string, DailyActivityCount>();

      filteredTours.forEach((tour) => {
        if (!dateMap.has(tour.start_date)) {
          dateMap.set(tour.start_date, {
            date: tour.start_date,
            count: 0,
            hiking: 0,
            fishing: 0,
            dog_sledging: 0,
            snowmobile_atv: 0,
            aurora_village: 0,
            city_tour: 0,
            snowshoe: 0,
            gears: 0,
            dnr: 0,
            td: 0,
            nlt: 0,
          });
        }

        const dayData = dateMap.get(tour.start_date)!;
        dayData.count += 1;

        // Count activities (Yes values)
        if (tour.hiking && tour.hiking.toLowerCase() === "yes") dayData.hiking += 1;
        if (tour.fishing && tour.fishing.toLowerCase() === "yes") dayData.fishing += 1;
        if (tour.dog_sledging && tour.dog_sledging.toLowerCase() === "yes") dayData.dog_sledging += 1;
        if (tour.snowmobile_atv && tour.snowmobile_atv.toLowerCase() === "yes") dayData.snowmobile_atv += 1;
        if (tour.aurora_village && tour.aurora_village.toLowerCase() === "yes") dayData.aurora_village += 1;
        if (tour.city_tour && tour.city_tour.toLowerCase() === "yes") dayData.city_tour += 1;
        if (tour.snowshoe && tour.snowshoe.toLowerCase() === "yes") dayData.snowshoe += 1;
        if (tour.gears && tour.gears.toLowerCase() === "yes") dayData.gears += 1;
        if (tour.dnr && tour.dnr.toLowerCase() === "yes") dayData.dnr += 1;
        if (tour.td && tour.td.toLowerCase() === "yes") dayData.td += 1;
        if (tour.nlt && tour.nlt.toLowerCase() === "yes") dayData.nlt += 1;
      });

      // Generate all dates for the range
      const allDates: DailyActivityCount[] = [];
      const currentDate = new Date(rangeStart);

      while (currentDate <= rangeEnd) {
        const dateStr = currentDate.toISOString().split("T")[0];
        allDates.push(
          dateMap.get(dateStr) || {
            date: dateStr,
            count: 0,
            hiking: 0,
            fishing: 0,
            dog_sledging: 0,
            snowmobile_atv: 0,
            aurora_village: 0,
            city_tour: 0,
            snowshoe: 0,
            gears: 0,
            dnr: 0,
            td: 0,
            nlt: 0,
          }
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setActivities(allDates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load activities";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const resetToCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const fromStr = firstDay.toISOString().split("T")[0];
    const toStr = lastDay.toISOString().split("T")[0];

    setDateFrom(fromStr);
    setDateTo(toStr);
    setIsCustomRange(false);
  };

  const handleApplyDateRange = () => {
    if (dateFrom && dateTo) {
      if (new Date(dateFrom) > new Date(dateTo)) {
        setError("'From' date must be before 'To' date");
        return;
      }
      setIsCustomRange(true);
      setError("");
    }
  };

  const monthName = selectedMonth.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Monthly Plan</h1>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={previousMonth}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-lg font-semibold text-gray-700 min-w-40 text-center">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleApplyDateRange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={resetToCurrentMonth}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
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

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Hiking</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Fishing</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Dog Sledding</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Snowmobile/ATV</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aurora Village</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">City Tour</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Snowshoe</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Gears</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">DNR</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">T/D</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">NLT</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                      No activities found for this month
                    </td>
                  </tr>
                ) : (
                  activities.map((day, idx) => (
                    <tr
                      key={day.date}
                      className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 z-10 bg-inherit">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-blue-600 bg-blue-50">
                        {day.count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.hiking > 0 ? day.hiking : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.fishing > 0 ? day.fishing : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.dog_sledging > 0 ? day.dog_sledging : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.snowmobile_atv > 0 ? day.snowmobile_atv : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.aurora_village > 0 ? day.aurora_village : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.city_tour > 0 ? day.city_tour : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.snowshoe > 0 ? day.snowshoe : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.gears > 0 ? day.gears : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.dnr > 0 ? day.dnr : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.td > 0 ? day.td : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.nlt > 0 ? day.nlt : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
