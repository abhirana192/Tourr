import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Edit2, RotateCcw, Printer } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ActivityPickerModal } from "./ActivityPickerModal";

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
}

interface DayItinerary {
  day: string;
  arrivalInfo: string;
  activities: Activity[];
  hotelInfo: string;
  paymentInfo: string;
  note: string;
}

interface ActivitySchedule {
  [dayIndex: number]: {
    activities: Activity[];
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

export default function Arrival() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [schedules, setSchedules] = useState<{ [tourId: string]: ActivitySchedule }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);
  const [selectedDayForActivity, setSelectedDayForActivity] = useState<number | null>(null);
  const [notesEditingDay, setNotesEditingDay] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);

  const extractDateAndTime = (value: any) => {
    if (!value) return { date: "", time: "" };
    const str = String(value).trim();
    const parts = str.split("|");
    const date = parts[0]?.trim() || "";
    const time = parts[1]?.trim() || "";
    const flight = parts[2]?.trim() || "";
    return { date, time, flight };
  };

  const getAvailableActivities = (tour: Tour): string[] => {
    const available: string[] = [];
    if (tour.city_tour === "Yes") available.push("city_tour");
    if (tour.fishing === "Yes") available.push("fishing");
    if (tour.dog_sledging === "Yes") available.push("dog_sledging");
    if (tour.snowmobile_atv === "Yes") available.push("snowmobile_atv");
    if (tour.hiking === "Yes") available.push("hiking");
    if (tour.aurora_village === "Yes") available.push("aurora_village");
    if (tour.nlt === "Yes") available.push("nlt");
    return available;
  };

  const generateRandomSchedule = (tour: Tour, dayCount: number): ActivitySchedule => {
    const available = getAvailableActivities(tour);
    const schedule: ActivitySchedule = {};

    // Initialize all days including arrival and departure
    for (let i = 0; i < dayCount; i++) {
      schedule[i] = { activities: [], note: "" };
    }

    // For middle days (excluding arrival day 0 and departure day dayCount-1)
    for (let i = 1; i < dayCount - 1; i++) {
      const activities: Activity[] = [];

      // Randomly select 1-2 activities for each day
      const activitiesToAdd = Math.random() > 0.5 ? 1 : 2;
      const shuffled = [...available].sort(() => Math.random() - 0.5);

      for (let j = 0; j < Math.min(activitiesToAdd, shuffled.length); j++) {
        const activityKey = shuffled[j];
        const activityData = ACTIVITY_TIMINGS[activityKey];
        if (activityData) {
          const timing = activityData.timings[Math.floor(Math.random() * activityData.timings.length)];
          activities.push({
            name: activityData.name,
            timings: [timing],
          });
        }
      }

      schedule[i] = { activities, note: "" };
    }

    return schedule;
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchSavedSchedule = async (tourId: string): Promise<ActivitySchedule | null> => {
    try {
      const response = await fetch(`/api/tours/${tourId}/schedule`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.schedule || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!selectedTour) return;

    const arrival = extractDateAndTime(selectedTour.arrival);
    const departure = extractDateAndTime(selectedTour.departure);

    if (!arrival.date || !departure.date) return;

    if (!schedules[selectedTour.id]) {
      const arrivalDate = new Date(arrival.date);
      const departureDate = new Date(departure.date);
      const timeDiff = departureDate.getTime() - arrivalDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

      // Try to load saved schedule first
      fetchSavedSchedule(selectedTour.id).then((savedSchedule) => {
        if (savedSchedule) {
          setSchedules((prev) => ({
            ...prev,
            [selectedTour.id]: savedSchedule,
          }));
        } else {
          // If no saved schedule, generate random one
          setSchedules((prev) => ({
            ...prev,
            [selectedTour.id]: generateRandomSchedule(selectedTour, daysDiff),
          }));
        }
      });
    }

    // Reset edit mode when switching tours
    setIsEditMode(false);
  }, [selectedTour?.id]);

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

  const generateDayItinerary = (tour: Tour): DayItinerary[] => {
    const arrival = extractDateAndTime(tour.arrival);
    const departure = extractDateAndTime(tour.departure);
    const itinerary: DayItinerary[] = [];

    if (!arrival.date || !departure.date) {
      return itinerary;
    }

    // Parse dates
    const arrivalDate = new Date(arrival.date);
    const departureDate = new Date(departure.date);

    // Calculate number of days
    const timeDiff = departureDate.getTime() - arrivalDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const dayLabels = ["Arrival Day"];
    for (let i = 1; i < daysDiff; i++) {
      if (i === 1) dayLabels.push("1st Day");
      else if (i === 2) dayLabels.push("2nd Day");
      else if (i === 3) dayLabels.push("3rd Day");
      else dayLabels.push(`${i}th Day`);
    }

    const tourSchedule = schedules[tour.id] || {};

    // Generate itinerary for each day
    for (let i = 0; i < daysDiff; i++) {
      const daySchedule = tourSchedule[i] || { activities: [], note: "" };

      if (i === 0) {
        // Arrival Day
        itinerary.push({
          day: dayLabels[i],
          arrivalInfo: arrival.date ? `${arrival.date} ${arrival.time}${arrival.flight ? ` ${arrival.flight}` : ""}` : "-",
          activities: [],
          hotelInfo: tour.accommodation ? `${tour.accommodation}` : "-",
          paymentInfo: tour.pax ? `${tour.pax}` : "-",
          note: daySchedule.note || "",
        });
      } else if (i === daysDiff - 1) {
        // Departure Day
        itinerary.push({
          day: dayLabels[i],
          arrivalInfo: "Shuttle service is scheduled 2 hours before the departure flight. Please wait in the lobby of your accommodation.",
          activities: [],
          hotelInfo: `${departure.date ? departure.date : "-"} ${departure.time ? departure.time : ""}${departure.flight ? ` ${departure.flight}` : ""}\n(Cold-weather gear will be collected)`,
          paymentInfo: "-",
          note: daySchedule.note || "",
        });
      } else {
        // Middle days
        const dayActivities = daySchedule.activities || [];

        itinerary.push({
          day: dayLabels[i],
          arrivalInfo: "*Free activity",
          activities: dayActivities,
          hotelInfo: tour.accommodation ? `${tour.accommodation}` : "-",
          paymentInfo: i === 1 && tour.payment ? `*Optional (Self-pay) - ${tour.payment}` : "-",
          note: daySchedule.note || "",
        });
      }
    }

    return itinerary;
  };

  const handleActivityChange = (dayIndex: number, activityIndex: number, newActivity: Activity | null) => {
    if (!selectedTour) return;

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[dayIndex] || { activities: [], note: "" };
      const dayActivities = [...dayData.activities];

      if (newActivity) {
        dayActivities[activityIndex] = newActivity;
      } else {
        dayActivities.splice(activityIndex, 1);
      }

      tourSchedule[dayIndex] = { activities: dayActivities, note: dayData.note };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });
  };

  const handleAddActivity = (dayIndex: number) => {
    setSelectedDayForActivity(dayIndex);
    setActivityPickerOpen(true);
  };

  const handleSelectActivity = (activityKey: string) => {
    if (!selectedTour || selectedDayForActivity === null) return;

    const activityData = ACTIVITY_TIMINGS[activityKey];
    if (!activityData) return;

    const newActivity: Activity = {
      name: activityData.name,
      timings: [activityData.timings[0]],
    };

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[selectedDayForActivity] || { activities: [], note: "" };
      const dayActivities = [...dayData.activities];
      dayActivities.push(newActivity);
      tourSchedule[selectedDayForActivity] = { activities: dayActivities, note: dayData.note };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });

    setActivityPickerOpen(false);
    setSelectedDayForActivity(null);
  };

  const handleNoteChange = (dayIndex: number, noteText: string) => {
    if (!selectedTour) return;

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[dayIndex] || { activities: [], note: "" };
      tourSchedule[dayIndex] = { activities: dayData.activities, note: noteText };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedTour) return;

    setIsSaving(true);
    try {
      const scheduleData = schedules[selectedTour.id];
      const response = await fetch(`/api/tours/${selectedTour.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        throw new Error("Failed to save schedule");
      }

      toast.success("Schedule saved successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save schedule";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditSchedule = () => {
    setShowEditConfirmation(true);
  };

  const handleConfirmEdit = () => {
    setIsEditMode(true);
    setShowEditConfirmation(false);
    toast.success("Schedule is now editable");
  };

  const handleDoneEditing = () => {
    setIsEditMode(false);
    toast.success("Changes saved and schedule locked");
  };

  const handlePrint = () => {
    const tableElement = document.querySelector("table");
    if (!tableElement) {
      toast.error("Table not found");
      return;
    }

    if (!selectedTour) {
      toast.error("Guest information not found");
      return;
    }

    const printWindow = window.open("", "", "width=900,height=600");
    if (!printWindow) {
      toast.error("Failed to open print window");
      return;
    }

    // Clone and clean up the table for printing
    const tableClone = tableElement.cloneNode(true) as HTMLTableElement;
    const noteCells = tableClone.querySelectorAll("td");
    noteCells.forEach((cell) => {
      const noteElement = cell.querySelector("div");
      if (noteElement && noteElement.textContent?.includes("+ Note") && !noteElement.querySelector(".whitespace-pre-wrap")) {
        cell.innerHTML = "";
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guest Arrival Schedule</title>
          <style>
            @page {
              size: landscape;
              margin: 10mm;
              @top-left {
                content: '';
              }
              @top-center {
                content: '';
              }
              @top-right {
                content: '';
              }
              @bottom-left {
                content: '';
              }
              @bottom-center {
                content: '';
              }
              @bottom-right {
                content: '';
              }
            }
            * {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f0f9f7;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .welcome-header {
              background: linear-gradient(135deg, #1b7a5c 0%, #2da578 50%, #3ec4a0 100%);
              color: white;
              padding: 30px;
              margin-bottom: 20px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              position: relative;
              overflow: hidden;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .welcome-header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -10%;
              width: 400px;
              height: 400px;
              background: radial-gradient(circle, rgba(62, 196, 160, 0.2) 0%, transparent 70%);
              border-radius: 50%;
            }
            .header-content {
              position: relative;
              z-index: 1;
            }
            .welcome-text {
              font-size: 14px;
              opacity: 0.95;
              margin-bottom: 10px;
              letter-spacing: 1px;
            }
            .guest-title {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 20px;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            }
            .guest-info {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-top: 15px;
            }
            .info-item {
              background: rgba(255, 255, 255, 0.15);
              padding: 12px;
              border-radius: 6px;
              backdrop-filter: blur(10px);
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .info-label {
              font-weight: 600;
              font-size: 11px;
              color: rgba(255, 255, 255, 0.85);
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 16px;
              font-weight: 700;
              color: white;
            }
            .schedule-section {
              margin: 30px;
              margin-top: 0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #1b7a5c;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 3px solid #3ec4a0;
              display: inline-block;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            th {
              background: linear-gradient(135deg, #1b7a5c 0%, #2da578 100%);
              color: white;
              padding: 14px;
              text-align: left;
              font-weight: 700;
              font-size: 12px;
              letter-spacing: 0.5px;
              border: none;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            td {
              padding: 12px 14px;
              border-bottom: 1px solid #d0e8e5;
              font-size: 12px;
              color: #333;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr:nth-child(odd) {
              background-color: #e8f5f2;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr:nth-child(even) {
              background-color: #f5faf9;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr:hover {
              background-color: #d0e8e5;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .activity-box {
              background: linear-gradient(135deg, rgba(27, 122, 92, 0.1) 0%, rgba(62, 196, 160, 0.1) 100%);
              border-left: 4px solid #2da578;
              padding: 8px;
              margin: 4px 0;
              border-radius: 4px;
            }
            .activity-name {
              font-weight: 700;
              color: #1b7a5c;
              margin-bottom: 3px;
            }
            .activity-timing {
              color: #555;
              font-size: 11px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, rgba(27, 122, 92, 0.05) 0%, rgba(62, 196, 160, 0.05) 100%);
              border-radius: 8px;
              border-top: 2px solid #3ec4a0;
              color: #1b7a5c;
              font-size: 12px;
              font-style: italic;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          <div class="welcome-header">
            <div class="header-content">
              <div class="welcome-text">WELCOME TO YOUR ARCTIC ADVENTURE</div>
              <div class="guest-title">${selectedTour.name.replace(/\s*\(\d+\)\s*$/, '')}</div>
              <div class="guest-info">
                <div class="info-item">
                  <div class="info-label">Invoice</div>
                  <div class="info-value">${selectedTour.invoice}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Pax</div>
                  <div class="info-value">${selectedTour.pax}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Language</div>
                  <div class="info-value">${selectedTour.language}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Group</div>
                  <div class="info-value">${selectedTour.group_id}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="schedule-section">
            <div class="section-title">Your Itinerary</div>
            ${tableClone.outerHTML}
          </div>
          <div class="footer">
            Welcome to the Arctic! We look forward to making your stay unforgettable with authentic experiences and warm hospitality.
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
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
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Guest Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
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
                <div className="flex gap-2">
                  {!isEditMode ? (
                    <Button
                      onClick={handleEditSchedule}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                    >
                      <Edit2 size={14} /> Change Schedule
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDoneEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1.5 px-3 rounded-lg"
                    >
                      Done Editing
                    </Button>
                  )}
                  {isEditMode && (
                    <Button
                      onClick={handleSaveSchedule}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                  <Button
                    onClick={handlePrint}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <Printer size={14} /> Print
                  </Button>
                </div>
              </div>
            </div>

            {/* Itinerary Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white border-b border-gray-400 sticky top-0">
                    <th className="px-4 py-3 text-left text-xs font-bold border-r border-gray-400 min-w-24">Basic Info</th>
                    <th className="px-4 py-3 text-left text-xs font-bold border-r border-gray-400 min-w-40">Arrival Date ARR.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold border-r border-gray-400 min-w-56">Planned Activities</th>
                    <th className="px-4 py-3 text-left text-xs font-bold border-r border-gray-400 min-w-40">Hotel Stay HOTEL</th>
                    <th className="px-4 py-3 text-center text-xs font-bold min-w-20">People pax</th>
                  </tr>
                </thead>
                <tbody>
                  {dayItinerary.map((day, idx) => (
                    <tr key={`${day.day}-${idx}`} className={`border-b border-gray-400 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                      <td className="px-4 py-3 text-xs text-gray-900 border-r border-gray-400 font-semibold align-top">
                        <div className="whitespace-normal">{day.day}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-400 align-top">
                        <div className="whitespace-normal text-justify leading-relaxed">{day.arrivalInfo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-400 align-top">
                        {day.activities.length === 0 ? (
                          <div className="whitespace-normal text-gray-500 italic">*Free activity</div>
                        ) : (
                          <div className="space-y-2">
                            {day.activities.map((activity, actIdx) => (
                              <div key={actIdx} className="flex items-start justify-between gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{activity.name}</div>
                                  <div className="text-xs text-gray-600">{activity.timings[0]}</div>
                                </div>
                                {isEditMode && (
                                  <button
                                    onClick={() => handleActivityChange(idx, actIdx, null)}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {idx > 0 && idx < dayItinerary.length - 1 && isEditMode && (
                              <button
                                onClick={() => handleAddActivity(idx)}
                                className="w-full text-xs py-1 px-2 border border-dashed border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                              >
                                + Add Activity
                              </button>
                            )}
                          </div>
                        )}
                        {idx > 0 && idx < dayItinerary.length - 1 && day.activities.length === 0 && isEditMode && (
                          <button
                            onClick={() => handleAddActivity(idx)}
                            className="w-full text-xs py-1 px-2 border border-dashed border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                          >
                            + Add Activity
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-400 align-top">
                        <div className="whitespace-normal text-justify leading-relaxed">{day.hotelInfo}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 align-top">
                        <div className="space-y-2">
                          <div className="text-center font-semibold">{day.paymentInfo}</div>
                          {idx !== 0 && (
                            <>
                              {isEditMode && notesEditingDay === idx ? (
                                <textarea
                                  value={day.note}
                                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                                  onBlur={() => setNotesEditingDay(null)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                  rows={2}
                                  placeholder="Add a note..."
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() => isEditMode && setNotesEditingDay(idx)}
                                  className={`p-1.5 rounded border border-dashed border-gray-300 transition-colors min-h-8 flex items-center justify-center ${
                                    isEditMode ? "cursor-pointer hover:bg-blue-50" : "cursor-default"
                                  }`}
                                >
                                  {day.note ? (
                                    <div className="whitespace-pre-wrap text-gray-700 text-xs text-center">{day.note}</div>
                                  ) : (
                                    <div className={`italic text-xs ${isEditMode ? "text-gray-400" : "text-gray-300"}`}>+ Note</div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Picker Modal */}
        <ActivityPickerModal
          open={activityPickerOpen}
          onOpenChange={setActivityPickerOpen}
          activities={ACTIVITY_TIMINGS}
          availableActivityKeys={selectedTour ? getAvailableActivities(selectedTour) : []}
          onSelectActivity={handleSelectActivity}
        />

        {/* Edit Confirmation Dialog */}
        <Dialog open={showEditConfirmation} onOpenChange={setShowEditConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Schedule</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-700">Are you sure you want to make changes to the schedule?</p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowEditConfirmation(false)}
                variant="outline"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
