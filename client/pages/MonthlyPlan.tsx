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
  dnr: number;
  nlt: number;
  arrival: string;
  departure: string;
}

export default function MonthlyPlan() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  const defaultFromStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const defaultToStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const [activities, setActivities] = useState<DailyActivityCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentYear, currentMonth, 1));
  const [dateFrom, setDateFrom] = useState<string>(defaultFromStr);
  const [dateTo, setDateTo] = useState<string>(defaultToStr);
  const [isCustomRange, setIsCustomRange] = useState(false);

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
      let rangeStartStr: string;
      let rangeEndStr: string;

      if (isCustomRange && dateFrom && dateTo) {
        rangeStartStr = dateFrom;
        rangeEndStr = dateTo;
      } else {
        // Default to current month based on selectedMonth
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();

        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        rangeStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        rangeEndStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      }

      // Filter tours within the date range
      const filteredTours = tours.filter((tour) => {
        return tour.start_date >= rangeStartStr && tour.start_date <= rangeEndStr;
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
            dnr: 0,
            nlt: 0,
            arrival: "",
            departure: "",
          });
        }

        const dayData = dateMap.get(tour.start_date)!;

        // Count activities (Yes values) - treat empty/null fields as 0
        const isYes = (val: any) => val && String(val).toLowerCase().trim() === "yes";

        if (isYes(tour.hiking)) dayData.hiking += 1;
        if (isYes(tour.fishing)) dayData.fishing += 1;
        if (isYes(tour.dog_sledging)) dayData.dog_sledging += 1;
        if (isYes(tour.snowmobile_atv)) dayData.snowmobile_atv += 1;
        if (isYes(tour.aurora_village)) dayData.aurora_village += 1;
        if (isYes(tour.city_tour)) dayData.city_tour += 1;
        if (isYes(tour.snowshoe)) dayData.snowshoe += 1;
        if (isYes(tour.dnr)) dayData.dnr += 1;
        if (isYes(tour.nlt)) dayData.nlt += 1;

        // Store arrival and departure (take the first one for the day)
        if (!dayData.arrival && tour.arrival) {
          dayData.arrival = tour.arrival;
        }
        if (!dayData.departure && tour.departure) {
          dayData.departure = tour.departure;
        }
      });

      // Generate all dates for the range
      const allDates: DailyActivityCount[] = [];
      let currentDateStr = rangeStartStr;

      while (currentDateStr <= rangeEndStr) {
        const dayData = dateMap.get(currentDateStr) || {
          date: currentDateStr,
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
        };

        // Calculate total as sum of all activities
        dayData.count = dayData.hiking + dayData.fishing + dayData.dog_sledging + dayData.snowmobile_atv + dayData.aurora_village + dayData.city_tour + dayData.snowshoe + dayData.gears + dayData.dnr + dayData.td + dayData.nlt;

        allDates.push(dayData);

        // Increment date by 1 day using Date object for calculation only
        const parts = currentDateStr.split('-');
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1);
        currentDateStr = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
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
    const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1);
    setSelectedMonth(newMonth);

    const year = newMonth.getFullYear();
    const month = newMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const fromStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const toStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    setDateFrom(fromStr);
    setDateTo(toStr);
    setIsCustomRange(false);
  };

  const nextMonth = () => {
    const newMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
    setSelectedMonth(newMonth);

    const year = newMonth.getFullYear();
    const month = newMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const fromStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const toStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    setDateFrom(fromStr);
    setDateTo(toStr);
    setIsCustomRange(false);
  };

  const resetToCurrentMonth = () => {
    setSelectedMonth(new Date(currentYear, currentMonth, 1));
    setDateFrom(defaultFromStr);
    setDateTo(defaultToStr);
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 pt-6">
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 sticky top-0 z-30">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 top-0 z-20 bg-gray-100 border-r border-gray-300">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 bg-blue-50 border-r border-gray-300">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Hiking</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Fishing</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Dog Sledding</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Snowmobile/ATV</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Aurora Village</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">City Tour</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Snowshoe</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">Gears</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">DNR</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-300">T/D</th>
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
                      className={`border-b border-gray-300 hover:bg-blue-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 z-10 bg-inherit border-r border-gray-300">
                        {(() => {
                          const [year, month, dayNum] = day.date.split('-').map(Number);
                          const dateObj = new Date(year, month - 1, dayNum);
                          return dateObj.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          });
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-blue-600 bg-blue-50 border-r border-gray-300">
                        {day.count}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.hiking}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.fishing}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.dog_sledging}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.snowmobile_atv}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.aurora_village}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.city_tour}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.snowshoe}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.gears}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.dnr}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700 border-r border-gray-300">
                        {day.td}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {day.nlt}
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
