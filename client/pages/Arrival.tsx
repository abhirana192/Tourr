import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Edit2, RotateCcw, Printer } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ActivityPickerModal } from "./ActivityPickerModal";
import { EmailRecipientsDialog } from "@/components/EmailRecipientsDialog";
import { PrintLanguageDialog, type LanguageOption } from "@/components/PrintLanguageDialog";

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

interface DayItinerary {
  day: string;
  arrivalInfo: string;
  plannedActivities: Activity[];
  arrivalActivities: Activity[];
  hotelActivities: Activity[];
  hotelInfo: string;
  paymentInfo: string;
  note: string;
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

const ACTIVITY_TRANSLATIONS: { [key: string]: { zh: string; ja: string } } = {
  "City Tour": { zh: "城市之旅", ja: "シティツアー" },
  "Ice Fishing": { zh: "冰钓", ja: "アイスフィッシング" },
  "Dog Sledging": { zh: "狗拉雪橇", ja: "ドッグスレッジング" },
  "Snowmobile": { zh: "雪地摩托", ja: "スノーモービル" },
  "Cameron Fall Hiking": { zh: "卡梅伦瀑布徒步", ja: "キャメロンフォールハイキング" },
  "Ice Lake Tour": { zh: "冰湖之旅", ja: "アイスレイクツアー" },
  "Aurora Viewing": { zh: "极光观赏", ja: "オーロラ鑑賞" },
};

const HEADER_TRANSLATIONS: { [key: string]: { zh: string; ja: string } } = {
  "Basic Info": { zh: "基本信息", ja: "基本情報" },
  "Arrival Date ARR.": { zh: "到达日期", ja: "到着日" },
  "Planned Activities": { zh: "计划活动", ja: "予定されたアクティビティ" },
  "Hotel Stay HOTEL": { zh: "酒店入住", ja: "ホテル滞在" },
  "People pax": { zh: "人数", ja: "人数" },
  "Your Itinerary": { zh: "您的行程", ja: "ご旅程" },
  "WELCOME TO YOUR ARCTIC ADVENTURE": { zh: "欢迎来到北极冒险", ja: "北極の冒険へようこそ" },
  "Free activity": { zh: "自由活动", ja: "自由活動" },
};

const DAY_TRANSLATIONS: { [key: string]: { zh: string; ja: string } } = {
  "Arrival Day": { zh: "到达日", ja: "到着日" },
  "1st Day": { zh: "第1天", ja: "1日目" },
  "2nd Day": { zh: "第2天", ja: "2日目" },
  "3rd Day": { zh: "第3天", ja: "3日目" },
  "4th Day": { zh: "第4天", ja: "4日目" },
  "5th Day": { zh: "第5天", ja: "5日目" },
  "6th Day": { zh: "第6天", ja: "6日目" },
  "7th Day": { zh: "第7天", ja: "7日目" },
  "Departure": { zh: "出发日", ja: "出発日" },
};

const MESSAGE_TRANSLATIONS: { [key: string]: { zh: string; ja: string } } = {
  "*Free activity": { zh: "*自由活动", ja: "*自由活動" },
  "Shuttle service is scheduled 2 hours before the departure flight. Please wait in the lobby of your accommodation.": {
    zh: "班车服务在出发航班前2小时开始。请在您的住处大厅等候。",
    ja: "シャトルサービスは出発便の2時間前に予定されています。宿泊施設のロビーでお待ちください。",
  },
  "(Cold-weather gear will be collected)": { zh: "（冬季装备将被收回）", ja: "（防寒用具は回収されます）" },
  "*Optional (Self-pay)": { zh: "*可选（自付）", ja: "*オプション（自己負担）" },
  "Welcome to the Arctic! We look forward to making your stay unforgettable with authentic experiences and warm hospitality.": {
    zh: "欢迎来到北极！我们期待为您提供真实的体验和温暖的热情款待，使您的住宿难以忘怀。",
    ja: "北極へようこそ！本物の体験と温かいおもてなしで、お客様のご滞在を忘れられないものにしたいと思います。",
  },
  "+ Add Activity": { zh: "+ 添加活动", ja: "+ アクティビティを追加" },
};

const getTranslatedText = (text: string, language: LanguageOption): string => {
  if (language === "en") return text;

  const translations =
    ACTIVITY_TRANSLATIONS[text] ||
    HEADER_TRANSLATIONS[text] ||
    DAY_TRANSLATIONS[text] ||
    MESSAGE_TRANSLATIONS[text];

  if (!translations) return text;

  if (language === "en-zh") return `${text} / ${translations.zh}`;
  if (language === "en-ja") return `${text} / ${translations.ja}`;

  return text;
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
  const [selectedColumnForActivity, setSelectedColumnForActivity] = useState<"planned" | "arrival" | "hotel" | null>(null);
  const [notesEditingDay, setNotesEditingDay] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [pendingScheduleData, setPendingScheduleData] = useState<any>(null);
  const [showPrintLanguageDialog, setShowPrintLanguageDialog] = useState(false);

  const extractDateAndTime = (value: any) => {
    if (!value) return { date: "", time: "" };
    const str = String(value).trim();

    // Handle pipe-separated format (date|time|flight)
    if (str.includes("|")) {
      const parts = str.split("|");
      const date = parts[0]?.trim() || "";
      const time = parts[1]?.trim() || "";
      const flight = parts[2]?.trim() || "";
      return { date, time, flight };
    }

    // Handle simple date format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const date = str.substring(0, 10);
      const time = str.substring(11).trim() || "";
      return { date, time, flight: "" };
    }

    // Fallback
    return { date: str, time: "", flight: "" };
  };

  const getAvailableActivities = (tour: Tour): string[] => {
    const available: string[] = [];

    // Check if any activities are explicitly marked as "Yes"
    const hasExplicitActivities =
      tour.city_tour === "Yes" ||
      tour.fishing === "Yes" ||
      tour.dog_sledging === "Yes" ||
      tour.snowmobile_atv === "Yes" ||
      tour.hiking === "Yes" ||
      tour.aurora_village === "Yes" ||
      tour.nlt === "Yes";

    // If no activities are explicitly marked, include all by default
    const includeAll = !hasExplicitActivities;

    if (tour.city_tour === "Yes" || includeAll) available.push("city_tour");
    if (tour.fishing === "Yes" || includeAll) available.push("fishing");
    if (tour.dog_sledging === "Yes" || includeAll) available.push("dog_sledging");
    if (tour.snowmobile_atv === "Yes" || includeAll) available.push("snowmobile_atv");
    if (tour.hiking === "Yes" || includeAll) available.push("hiking");
    if (tour.aurora_village === "Yes" || includeAll) available.push("aurora_village");
    if (tour.nlt === "Yes" || includeAll) available.push("nlt");

    return available;
  };

  const generateRandomSchedule = (tour: Tour, dayCount: number): ActivitySchedule => {
    const available = getAvailableActivities(tour);
    const schedule: ActivitySchedule = {};

    // Initialize all days including arrival and departure
    for (let i = 0; i < dayCount; i++) {
      schedule[i] = { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };
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

      schedule[i] = { plannedActivities: activities, arrivalActivities: [], hotelActivities: [], note: "" };
    }

    return schedule;
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const migrateScheduleToNewFormat = (schedule: any): ActivitySchedule => {
    const migrated: ActivitySchedule = {};

    for (const [dayIndex, dayData] of Object.entries(schedule)) {
      const dayNum = parseInt(dayIndex);
      const day = dayData as any;

      // If it already has the new structure, use it as is
      if (day.plannedActivities || day.arrivalActivities || day.hotelActivities) {
        migrated[dayNum] = {
          plannedActivities: day.plannedActivities || [],
          arrivalActivities: day.arrivalActivities || [],
          hotelActivities: day.hotelActivities || [],
          note: day.note || "",
        };
      } else {
        // Migrate old structure (activities array) to new structure
        migrated[dayNum] = {
          plannedActivities: day.activities || [],
          arrivalActivities: [],
          hotelActivities: [],
          note: day.note || "",
        };
      }
    }

    return migrated;
  };

  const fetchSavedSchedule = async (tourId: string): Promise<ActivitySchedule | null> => {
    try {
      const response = await fetch(`/api/tours/${tourId}/schedule`);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.schedule) return null;
      return migrateScheduleToNewFormat(data.schedule);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!selectedTour) return;

    const initializeSchedule = async () => {
      const arrival = extractDateAndTime(selectedTour.arrival);
      const departure = extractDateAndTime(selectedTour.departure);

      let daysDiff = 3; // Default to 3 days

      if (arrival.date && departure.date) {
        try {
          const arrivalDate = new Date(arrival.date);
          const departureDate = new Date(departure.date);
          const timeDiff = departureDate.getTime() - arrivalDate.getTime();
          daysDiff = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
        } catch (e) {
          console.warn("Failed to calculate day difference, using default 3 days");
        }
      }

      // Check if we already have a schedule for this tour
      if (schedules[selectedTour.id]) {
        setIsEditMode(false);
        return;
      }

      // Try to load saved schedule from server
      const savedSchedule = await fetchSavedSchedule(selectedTour.id);

      if (savedSchedule) {
        // Use saved schedule
        setSchedules((prev) => ({
          ...prev,
          [selectedTour.id]: savedSchedule,
        }));
      } else {
        // Generate random schedule for new tours
        const randomSchedule = generateRandomSchedule(selectedTour, daysDiff);
        setSchedules((prev) => ({
          ...prev,
          [selectedTour.id]: randomSchedule,
        }));
      }

      setIsEditMode(false);
    };

    initializeSchedule();
  }, [selectedTour?.id]);

  const fetchTours = async (dateFrom = "", dateTo = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const url = `/api/tours${params.toString() ? `?${params.toString()}` : ""}`;
      console.log(`[Arrival] Fetching tours from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[Arrival] Server error ${response.status}:`, errorData);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Arrival] Fetched ${Array.isArray(data) ? data.length : 0} tours`);
      setTours(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load tours";
      console.error(`[Arrival] Fetch error:`, err);
      setError(`Unable to connect to server. ${errorMessage}`);
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
      const daySchedule = tourSchedule[i] || { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };

      if (i === 0) {
        // Arrival Day
        itinerary.push({
          day: dayLabels[i],
          arrivalInfo: arrival.date ? `${arrival.date} ${arrival.time}${arrival.flight ? ` ${arrival.flight}` : ""}` : "-",
          plannedActivities: [],
          arrivalActivities: [],
          hotelActivities: [],
          hotelInfo: tour.accommodation ? `${tour.accommodation}` : "-",
          paymentInfo: tour.pax ? `${tour.pax}` : "-",
          note: daySchedule.note || "",
        });
      } else if (i === daysDiff - 1) {
        // Departure Day
        itinerary.push({
          day: dayLabels[i],
          arrivalInfo: "Shuttle service is scheduled 2 hours before the departure flight. Please wait in the lobby of your accommodation.",
          plannedActivities: [],
          arrivalActivities: [],
          hotelActivities: [],
          hotelInfo: `${departure.date ? departure.date : "-"} ${departure.time ? departure.time : ""}${departure.flight ? ` ${departure.flight}` : ""}\n(Cold-weather gear will be collected)`,
          paymentInfo: "-",
          note: daySchedule.note || "",
        });
      } else {
        // Middle days
        const plannedActivities = daySchedule.plannedActivities || [];
        const arrivalActivities = daySchedule.arrivalActivities || [];
        const hotelActivities = daySchedule.hotelActivities || [];

        itinerary.push({
          day: dayLabels[i],
          arrivalInfo: "*Free activity",
          plannedActivities,
          arrivalActivities,
          hotelActivities,
          hotelInfo: tour.accommodation ? `${tour.accommodation}` : "-",
          paymentInfo: i === 1 && tour.payment ? `*Optional (Self-pay) - ${tour.payment}` : "-",
          note: daySchedule.note || "",
        });
      }
    }

    return itinerary;
  };

  const handleActivityChange = (dayIndex: number, activityIndex: number, newActivity: Activity | null, column: "planned" | "arrival" | "hotel" = "planned") => {
    if (!selectedTour) return;

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[dayIndex] || { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };

      const columnKey = column === "planned" ? "plannedActivities" : column === "arrival" ? "arrivalActivities" : "hotelActivities";
      const dayActivities = [...(dayData[columnKey] || [])];

      if (newActivity) {
        dayActivities[activityIndex] = newActivity;
      } else {
        dayActivities.splice(activityIndex, 1);
      }

      tourSchedule[dayIndex] = {
        ...dayData,
        [columnKey]: dayActivities,
      };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });
  };

  const handleActivityNoteChange = (dayIndex: number, activityIndex: number, notes: string, column: "planned" | "arrival" | "hotel" = "planned") => {
    if (!selectedTour) return;

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[dayIndex] || { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };

      const columnKey = column === "planned" ? "plannedActivities" : column === "arrival" ? "arrivalActivities" : "hotelActivities";
      const dayActivities = [...(dayData[columnKey] || [])];

      if (dayActivities[activityIndex]) {
        dayActivities[activityIndex] = {
          ...dayActivities[activityIndex],
          notes,
        };
      }

      tourSchedule[dayIndex] = {
        ...dayData,
        [columnKey]: dayActivities,
      };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });
  };

  const handleAddActivity = (dayIndex: number, column: "planned" | "arrival" | "hotel" = "planned") => {
    setSelectedDayForActivity(dayIndex);
    setSelectedColumnForActivity(column);
    setActivityPickerOpen(true);
  };

  const handleSelectActivity = (activityKey: string) => {
    if (!selectedTour || selectedDayForActivity === null || !selectedColumnForActivity) return;

    const activityData = ACTIVITY_TIMINGS[activityKey];
    if (!activityData) return;

    const newActivity: Activity = {
      name: activityData.name,
      timings: [activityData.timings[0]],
    };

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[selectedDayForActivity] || { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };

      const columnKey = selectedColumnForActivity === "planned" ? "plannedActivities" : selectedColumnForActivity === "arrival" ? "arrivalActivities" : "hotelActivities";
      const dayActivities = [...(dayData[columnKey] || [])];
      dayActivities.push(newActivity);

      tourSchedule[selectedDayForActivity] = {
        ...dayData,
        [columnKey]: dayActivities,
      };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });

    setActivityPickerOpen(false);
    setSelectedDayForActivity(null);
    setSelectedColumnForActivity(null);
  };

  const handleNoteChange = (dayIndex: number, noteText: string) => {
    if (!selectedTour) return;

    setSchedules((prev) => {
      const tourSchedule = { ...prev[selectedTour.id] };
      const dayData = tourSchedule[dayIndex] || { plannedActivities: [], arrivalActivities: [], hotelActivities: [], note: "" };
      tourSchedule[dayIndex] = {
        ...dayData,
        note: noteText,
      };
      return {
        ...prev,
        [selectedTour.id]: tourSchedule,
      };
    });
  };

  const handleSaveSchedule = async () => {
    if (!selectedTour) return;
    setPendingScheduleData(schedules[selectedTour.id]);
    setShowEmailDialog(true);
  };

  const handleConfirmEmailRecipients = async (recipients: string[]) => {
    if (!selectedTour || !pendingScheduleData) return;

    setIsSaving(true);
    try {
      const sessionToken = localStorage.getItem("sessionToken");

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/tours/${selectedTour.id}/schedule`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          schedule: pendingScheduleData,
          customRecipients: recipients,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save schedule");
      }

      const result = await response.json();

      if (result.emailSent) {
        const emailTime = new Date(result.emailSent.timestamp).toLocaleTimeString();
        toast.success(`Email sent to ${result.emailSent.recipientCount} recipient(s) at ${emailTime}`, {
          description: `From: ${result.emailSent.senderName} - Guest schedule updated`,
        });
      } else {
        toast.success("Schedule saved successfully!");
      }

      setPendingScheduleData(null);
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

  const collectNotesFromSchedule = (): string[] => {
    if (!selectedTour || !schedules[selectedTour.id]) return [];

    const notes: string[] = [];
    const schedule = schedules[selectedTour.id];

    Object.values(schedule).forEach((dayData: any) => {
      // Collect day notes
      if (dayData.note && dayData.note.trim()) {
        notes.push(dayData.note);
      }

      // Collect activity notes from all columns
      [...(dayData.plannedActivities || []), ...(dayData.arrivalActivities || []), ...(dayData.hotelActivities || [])].forEach(
        (activity: any) => {
          if (activity.notes && activity.notes.trim()) {
            notes.push(activity.notes);
          }
        }
      );
    });

    return [...new Set(notes)]; // Remove duplicates
  };

  const translateNotes = async (notes: string[], targetLanguage: "zh" | "ja"): Promise<{ [key: string]: string }> => {
    const translations: { [key: string]: string } = {};

    if (notes.length === 0) return translations;

    try {
      for (const note of notes) {
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: note, targetLanguage }),
          });

          if (response.ok) {
            const data = await response.json();
            translations[note] = data.translated || note;
          } else {
            translations[note] = note;
          }
        } catch {
          translations[note] = note;
        }
      }
    } catch (error) {
      console.error("Error translating notes:", error);
    }

    return translations;
  };

  const handlePrint = () => {
    setShowPrintLanguageDialog(true);
  };

  const handlePrintWithLanguage = async (language: LanguageOption) => {
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

    // Collect and translate notes if needed
    let noteTranslations: { [key: string]: string } = {};
    if (language !== "en") {
      const targetLanguage = language === "en-zh" ? "zh" : "ja";
      const notes = collectNotesFromSchedule();
      if (notes.length > 0) {
        noteTranslations = await translateNotes(notes, targetLanguage);
      }
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

    // Translate table headers
    const headers = tableClone.querySelectorAll("th");
    headers.forEach((header) => {
      const originalText = header.textContent?.trim();
      if (originalText) {
        header.textContent = getTranslatedText(originalText, language);
      }
    });

    // Translate all text in table cells
    const cells = tableClone.querySelectorAll("td");
    cells.forEach((cell) => {
      // Translate day labels (first column)
      const dayLabel = cell.querySelector("div.whitespace-normal");
      if (dayLabel && dayLabel.textContent) {
        const originalDay = dayLabel.textContent.trim();
        if (DAY_TRANSLATIONS[originalDay]) {
          dayLabel.textContent = getTranslatedText(originalDay, language);
        }
      }

      // Translate activity names
      const activityNameElements = cell.querySelectorAll("div.font-semibold");
      activityNameElements.forEach((elem) => {
        const originalText = elem.textContent?.trim();
        if (originalText) {
          elem.textContent = getTranslatedText(originalText, language);
        }
      });

      // Translate italic text (like *Free activity messages)
      const italicElements = cell.querySelectorAll("div.italic");
      italicElements.forEach((elem) => {
        const originalText = elem.textContent?.trim();
        if (originalText) {
          const translated = getTranslatedText(originalText, language);
          if (translated !== originalText) {
            elem.textContent = translated;
          }
        }
      });

      // Translate regular text (arrival info, hotel info)
      const textDivs = cell.querySelectorAll("div.whitespace-normal.text-justify, div.text-justify");
      textDivs.forEach((elem) => {
        const originalText = elem.textContent?.trim();
        if (originalText) {
          const translated = getTranslatedText(originalText, language);
          if (translated !== originalText) {
            elem.textContent = translated;
          }
        }
      });

      // Translate text nodes that contain messages
      const allDivs = cell.querySelectorAll("div");
      allDivs.forEach((elem) => {
        if (elem.childNodes.length === 1 && elem.childNodes[0].nodeType === 3) {
          const originalText = elem.textContent?.trim();
          if (originalText) {
            const translated = getTranslatedText(originalText, language);
            if (translated !== originalText) {
              elem.textContent = translated;
            }
          }
        }
      });

      // Translate custom notes if language is not English
      if (language !== "en") {
        const allTextDivs = cell.querySelectorAll("div");
        allTextDivs.forEach((elem) => {
          const text = elem.textContent?.trim();
          if (text) {
            // Handle "Note: ..." format
            if (text.startsWith("Note: ")) {
              const noteText = text.replace("Note: ", "");
              if (noteTranslations[noteText]) {
                const translated = noteTranslations[noteText];
                if (language === "en-zh") {
                  elem.textContent = `Note: ${noteText} / ${translated}`;
                } else if (language === "en-ja") {
                  elem.textContent = `Note: ${noteText} / ${translated}`;
                }
              }
            } else if (noteTranslations[text]) {
              // Handle direct note text (for day notes, etc.)
              const translated = noteTranslations[text];
              if (language === "en-zh") {
                elem.textContent = `${text} / ${translated}`;
              } else if (language === "en-ja") {
                elem.textContent = `${text} / ${translated}`;
              }
            }
          }
        });
      }
    });

    // Translate day labels in first column
    const dayColumns = tableClone.querySelectorAll("td:first-child");
    dayColumns.forEach((col) => {
      const dayText = col.textContent?.trim();
      if (dayText && DAY_TRANSLATIONS[dayText]) {
        col.textContent = getTranslatedText(dayText, language);
      }
    });

    const guestName = selectedTour.name.replace(/\s*\(\d+\)\s*$/, "");
    const welcomeText = getTranslatedText("WELCOME TO YOUR ARCTIC ADVENTURE", language);
    const itineraryText = getTranslatedText("Your Itinerary", language);
    const footerText = getTranslatedText(
      "Welcome to the Arctic! We look forward to making your stay unforgettable with authentic experiences and warm hospitality.",
      language
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guest Arrival Schedule</title>
          <meta charset="UTF-8">
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
              background-color: #f8f8f8;
              position: relative;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .welcome-header {
              background: #ffffff;
              color: #333333;
              padding: 50px;
              margin-bottom: 20px;
              margin-top: 40px;
              border-radius: 0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              position: relative;
              overflow: hidden;
              border: 1px solid #e0e0e0;
              border-left: 6px solid #2da578;
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
              background: none;
              border-radius: 50%;
            }
            .header-content {
              position: relative;
              z-index: 1;
            }
            .welcome-text {
              font-size: 14px;
              opacity: 1;
              margin-bottom: 10px;
              letter-spacing: 1px;
              color: #666666;
            }
            .guest-title {
              font-size: 48px;
              font-weight: 700;
              margin-bottom: 20px;
              text-shadow: none;
              text-align: center;
              color: #1a1a1a;
            }
            .guest-info {
              display: none;
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
              color: #1a1a1a;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 3px solid #cccccc;
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
              background: #f5f5f5;
              color: #1a1a1a;
              padding: 14px;
              text-align: left;
              font-weight: 700;
              font-size: 12px;
              letter-spacing: 0.5px;
              border: 1px solid #e0e0e0;
              border-bottom: 2px solid #2da578;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            td {
              padding: 12px 14px;
              border-bottom: 1px solid #e0e0e0;
              font-size: 12px;
              color: #333333;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr:nth-child(odd) {
              background-color: #ffffff;
              border-bottom: 1px solid #e0e0e0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr:nth-child(even) {
              background-color: #fafafa;
              border-bottom: 1px solid #e0e0e0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            tbody tr:hover {
              background-color: #f5f5f5;
              border-bottom: 1px solid #e0e0e0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .activity-box {
              background: #f9f9f9;
              border-left: 4px solid #cccccc;
              padding: 8px;
              margin: 4px 0;
              border-radius: 0;
            }
            .activity-name {
              font-weight: 700;
              color: #1a1a1a;
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
              background: #ffffff;
              border-radius: 0;
              border-top: 1px solid #e0e0e0;
              color: #666666;
              font-size: 12px;
              font-style: italic;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .logo-section {
              position: relative;
              top: 0;
              left: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0;
              z-index: 10;
              background: transparent;
              padding: 0;
              border-radius: 0;
              box-shadow: none;
              border: none;
              margin-bottom: 0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .logo-image {
              width: 280px;
              height: 280px;
              object-fit: contain;
              flex-shrink: 0;
              margin-bottom: 30px;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            .company-name {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="welcome-header">
            <div class="header-content" style="display: flex; flex-direction: column; align-items: center;">
              <div class="logo-section">
                <img src="https://cdn.builder.io/api/v1/image/assets%2F009a270434b94ee6bd377e5857c4f325%2F490934e205af421d8f25ac51d3ee565b?format=webp&width=800" alt="Jiguang Tour Logo" class="logo-image" />
              </div>
              <div class="welcome-text">${welcomeText}</div>
              <div class="guest-title">${guestName}</div>
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
            <div class="section-title">${itineraryText}</div>
            ${tableClone.outerHTML}
          </div>
          <div class="footer">
            ${footerText}
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
                        {(day.arrivalActivities?.length ?? 0) === 0 && (
                          <div className="whitespace-normal text-justify leading-relaxed mb-2">{day.arrivalInfo}</div>
                        )}
                        {(day.arrivalActivities?.length ?? 0) > 0 && (
                          <div className="space-y-2 mb-2">
                            {(day.arrivalActivities || []).map((activity, actIdx) => (
                              <div key={actIdx} className="flex items-start justify-between gap-2 p-2 bg-green-50 rounded border border-green-200">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{activity.name}</div>
                                  <div className="text-xs text-gray-600">{activity.timings[0]}</div>
                                  {isEditMode && (
                                    <input
                                      type="text"
                                      placeholder="Add notes (optional)"
                                      value={activity.notes || ""}
                                      onChange={(e) => handleActivityNoteChange(idx, actIdx, e.target.value, "arrival")}
                                      className="mt-2 w-full text-xs p-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                  )}
                                  {!isEditMode && activity.notes && (
                                    <div className="text-xs text-gray-700 mt-1 italic">Note: {activity.notes}</div>
                                  )}
                                </div>
                                {isEditMode && (
                                  <button
                                    onClick={() => handleActivityChange(idx, actIdx, null, "arrival")}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm flex-shrink-0"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {idx > 0 && idx < dayItinerary.length - 1 && isEditMode && (
                          <button
                            onClick={() => handleAddActivity(idx, "arrival")}
                            className="w-full text-xs py-1 px-2 border border-dashed border-gray-300 rounded hover:bg-green-50 text-gray-600 font-medium"
                          >
                            + Add Activity
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-400 align-top">
                        {(day.plannedActivities?.length ?? 0) === 0 ? (
                          <div className="whitespace-normal text-gray-500 italic">*Free activity</div>
                        ) : (
                          <div className="space-y-2">
                            {(day.plannedActivities || []).map((activity, actIdx) => (
                              <div key={actIdx} className="flex items-start justify-between gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{activity.name}</div>
                                  <div className="text-xs text-gray-600">{activity.timings[0]}</div>
                                  {isEditMode && (
                                    <input
                                      type="text"
                                      placeholder="Add notes (optional)"
                                      value={activity.notes || ""}
                                      onChange={(e) => handleActivityNoteChange(idx, actIdx, e.target.value, "planned")}
                                      className="mt-2 w-full text-xs p-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                  )}
                                  {!isEditMode && activity.notes && (
                                    <div className="text-xs text-gray-700 mt-1 italic">Note: {activity.notes}</div>
                                  )}
                                </div>
                                {isEditMode && (
                                  <button
                                    onClick={() => handleActivityChange(idx, actIdx, null, "planned")}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm flex-shrink-0"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            {idx > 0 && idx < dayItinerary.length - 1 && isEditMode && (
                              <button
                                onClick={() => handleAddActivity(idx, "planned")}
                                className="w-full text-xs py-1 px-2 border border-dashed border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                              >
                                + Add Activity
                              </button>
                            )}
                          </div>
                        )}
                        {idx > 0 && idx < dayItinerary.length - 1 && (day.plannedActivities?.length ?? 0) === 0 && isEditMode && (
                          <button
                            onClick={() => handleAddActivity(idx, "planned")}
                            className="w-full text-xs py-1 px-2 border border-dashed border-gray-300 rounded hover:bg-gray-100 text-gray-600"
                          >
                            + Add Activity
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 border-r border-gray-400 align-top">
                        {idx === 0 || idx === dayItinerary.length - 1 ? (
                          <div className="whitespace-normal text-justify leading-relaxed">{day.hotelInfo}</div>
                        ) : (
                          <div className="space-y-2">
                            {(day.hotelActivities?.length ?? 0) > 0 ? (
                              <>
                                {(day.hotelActivities || []).map((activity, actIdx) => (
                                  <div key={actIdx} className="flex items-start justify-between gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-900">{activity.name}</div>
                                      <div className="text-xs text-gray-600">{activity.timings[0]}</div>
                                      {isEditMode && (
                                        <input
                                          type="text"
                                          placeholder="Add notes (optional)"
                                          value={activity.notes || ""}
                                          onChange={(e) => handleActivityNoteChange(idx, actIdx, e.target.value, "hotel")}
                                          className="mt-2 w-full text-xs p-1 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                      )}
                                      {!isEditMode && activity.notes && (
                                        <div className="text-xs text-gray-700 mt-1 italic">Note: {activity.notes}</div>
                                      )}
                                    </div>
                                    {isEditMode && (
                                      <button
                                        onClick={() => handleActivityChange(idx, actIdx, null, "hotel")}
                                        className="text-red-500 hover:text-red-700 font-bold text-sm flex-shrink-0"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="whitespace-normal text-gray-500 italic">
                                *Free activity
                              </div>
                            )}
                            {isEditMode && (
                              <button
                                onClick={() => handleAddActivity(idx, "hotel")}
                                className="w-full text-xs py-1 px-2 border border-dashed border-gray-300 rounded hover:bg-purple-50 text-gray-600 font-medium"
                              >
                                + Add Activity
                              </button>
                            )}
                          </div>
                        )}
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

        {/* Email Recipients Dialog */}
        <EmailRecipientsDialog
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
          onConfirm={handleConfirmEmailRecipients}
          tourName={selectedTour ? `${selectedTour.name} (${selectedTour.pax} pax)` : undefined}
          isLoading={isSaving}
        />

        {/* Print Language Dialog */}
        <PrintLanguageDialog
          open={showPrintLanguageDialog}
          onOpenChange={setShowPrintLanguageDialog}
          onConfirm={handlePrintWithLanguage}
        />
      </div>
    </div>
  );
}
