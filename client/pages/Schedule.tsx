import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Search, AlertTriangle, RotateCcw, Printer } from "lucide-react";
import TourModal from "@/components/TourModal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function Schedule() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");
  const [searchInvoice, setSearchInvoice] = useState("");
  const [searchName, setSearchName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printDateFrom, setPrintDateFrom] = useState("");
  const [printDateTo, setPrintDateTo] = useState("");

  // Ensure tours is always an array
  const safeTours = Array.isArray(tours) ? tours : [];

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async (dateFrom = "", dateTo = "", invoice = "", name = "") => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (invoice) params.append("invoice", invoice);
      if (name) params.append("name", name);

      const url = `/api/tours${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.error("Error response from API:", response.status);
        setTours([]);
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Ensure data is an array
      setTours(Array.isArray(data) ? data : []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching tours:", error);
      setTours([]);
      setLoading(false);
    }
  };

  const handleDateFromChange = (value: string) => {
    setSearchDateFrom(value);
    fetchTours(value, searchDateTo, searchInvoice, searchName);
  };

  const handleDateToChange = (value: string) => {
    setSearchDateTo(value);
    fetchTours(searchDateFrom, value, searchInvoice, searchName);
  };

  const handleInvoiceChange = (value: string) => {
    setSearchInvoice(value);
    fetchTours(searchDateFrom, searchDateTo, value, searchName);
  };

  const handleNameChange = (value: string) => {
    setSearchName(value);
    fetchTours(searchDateFrom, searchDateTo, searchInvoice, value);
  };

  const handleRefresh = () => {
    setSearchDateFrom("");
    setSearchDateTo("");
    setSearchInvoice("");
    setSearchName("");
    fetchTours("", "", "", "");
  };

  const handleAddTour = async (tourData: Omit<Tour, "id">) => {
    try {
      const response = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tourData),
      });
      const newTour = await response.json();
      setTours([...tours, newTour]);
      setIsModalOpen(false);
      setEditingTour(null);
    } catch (error) {
      console.error("Error adding tour:", error);
    }
  };

  const handleUpdateTour = async (id: string, tourData: Omit<Tour, "id">) => {
    try {
      const response = await fetch(`/api/tours/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tourData),
      });
      const updated = await response.json();
      setTours(tours.map((t) => (t.id === id ? updated : t)));
      setIsModalOpen(false);
      setEditingTour(null);
    } catch (error) {
      console.error("Error updating tour:", error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setTourToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!tourToDelete) return;

    try {
      await fetch(`/api/tours/${tourToDelete}`, { method: "DELETE" });
      setTours(tours.filter((t) => t.id !== tourToDelete));
      toast.success("Tour deleted successfully", {
        description: "The tour has been permanently removed from the system.",
      });
      setDeleteConfirmOpen(false);
      setTourToDelete(null);
    } catch (error) {
      console.error("Error deleting tour:", error);
      toast.error("Failed to delete tour", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTourToDelete(null);
  };

  const handleEditClick = (tour: Tour) => {
    setEditingTour(tour);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTour(null);
  };

  const handlePrintClick = () => {
    setPrintDialogOpen(true);
  };

  const handleConfirmPrint = () => {
    if (!printDateFrom || !printDateTo) {
      toast.error("Please select both from and to dates");
      return;
    }

    if (new Date(printDateFrom) > new Date(printDateTo)) {
      toast.error("'From' date must be before 'To' date");
      return;
    }

    const filteredTours = sortedTours.filter((tour) => {
      return tour.start_date >= printDateFrom && tour.start_date <= printDateTo;
    });

    const printWindow = window.open("", "", "height=900,width=1200");
    if (!printWindow) {
      toast.error("Failed to open print window");
      return;
    }

    const tableRows = filteredTours
      .map(
        (tour) => `
        <tr>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.start_date}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.invoice}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.language}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.name}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.pax}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.group_id}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.dnr}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.td}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.agent}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.arrival}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.departure}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.accommodation}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.gears}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.snowshoe}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.nlt}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.city_tour}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.hiking}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.fishing}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.dog_sledging}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.snowmobile_atv}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc; text-align: center;">${tour.aurora_village}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.payment}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.reservation_number}</td>
          <td style="padding: 4px; font-size: 9px; border: 1px solid #ccc;">${tour.remarks}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <html>
        <head>
          <title>Tour Schedule Report</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            html { zoom: 67%; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: white; }
            h1 { font-size: 20px; margin-bottom: 10px; color: #1e40af; text-align: center; font-weight: bold; }
            .date-range { color: #666; font-size: 12px; margin-bottom: 20px; text-align: center; font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 9px; }
            th { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: bold; padding: 4px; text-align: left; border: 1px solid #1e40af; }
            @media print {
              body { margin: 0; padding: 10mm; }
              html { zoom: 67%; }
              th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>Tour Schedule Report</h1>
          <p class="date-range">Period: ${new Date(printDateFrom).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })} to ${new Date(printDateTo).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })}</p>
          <p style="color: #666; font-size: 12px; margin-bottom: 20px;">Total Tours: ${filteredTours.length}</p>
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>INV</th>
                <th>LANG</th>
                <th>NAME</th>
                <th>PAX</th>
                <th>GRP</th>
                <th>DNR</th>
                <th>T/D</th>
                <th>AGT</th>
                <th>ARR</th>
                <th>DEP</th>
                <th>ACCOM</th>
                <th>GRS</th>
                <th>SNW</th>
                <th>NLT</th>
                <th>CTR</th>
                <th>HIK</th>
                <th>FSH</th>
                <th>DOG</th>
                <th>SLD</th>
                <th>AUR</th>
                <th>PAY</th>
                <th>RES#</th>
                <th>RMK</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setPrintDialogOpen(false);
    setPrintDateFrom("");
    setPrintDateTo("");
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleCancelPrint = () => {
    setPrintDialogOpen(false);
    setPrintDateFrom("");
    setPrintDateTo("");
  };

  const sortedTours = [...safeTours].sort((a, b) => {
    return (
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col p-2 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Tour Schedule</h1>
          <Button
            onClick={() => {
              setEditingTour(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-sm py-1 px-3"
          >
            <Plus size={16} /> Add Tour
          </Button>
        </div>

        {/* Search Filters */}
        <div className="mb-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Invoice</label>
              <Input
                placeholder="Search invoice"
                value={searchInvoice}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name</label>
              <Input
                placeholder="Search name"
                value={searchName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleRefresh}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium"
              >
                <RotateCcw size={14} /> Clear All
              </Button>
              <Button
                onClick={handlePrintClick}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium"
              >
                <Printer size={14} /> Print
              </Button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-white rounded shadow overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tours...</div>
          ) : tours.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tours found</div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="border-collapse w-max min-w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400 sticky top-0 z-30">
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-16 whitespace-nowrap sticky left-0 top-0 z-40">DATE</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-14 whitespace-nowrap">INV</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-12 whitespace-nowrap">LANG</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-20 whitespace-nowrap">NAME</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-8 whitespace-nowrap">PAX</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-12 whitespace-nowrap">GRP</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-10 whitespace-nowrap">DNR</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-10 whitespace-nowrap">T/D</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-14 whitespace-nowrap">AGT</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-12 whitespace-nowrap">ARR</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-yellow-100 border-r border-gray-400 min-w-12 whitespace-nowrap">DEP</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-cyan-100 border-r border-gray-400 min-w-14 whitespace-nowrap">ACCOM</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-cyan-100 border-r border-gray-400 min-w-12 whitespace-nowrap">GRS</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-green-100 border-r border-gray-400 min-w-10 whitespace-nowrap">SNW</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-blue-100 border-r border-gray-400 min-w-10 whitespace-nowrap">NLT</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-blue-100 border-r border-gray-400 min-w-12 whitespace-nowrap">CTR</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-purple-100 border-r border-gray-400 min-w-10 whitespace-nowrap">HIK</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-purple-100 border-r border-gray-400 min-w-10 whitespace-nowrap">FSH</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-purple-100 border-r border-gray-400 min-w-12 whitespace-nowrap">DOG</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-purple-100 border-r border-gray-400 min-w-12 whitespace-nowrap">SLD</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-purple-100 border-r border-gray-400 min-w-12 whitespace-nowrap">AUR</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-gray-200 border-r border-gray-400 min-w-12 whitespace-nowrap">PAY</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-gray-200 border-r border-gray-400 min-w-14 whitespace-nowrap">RES#</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-gray-200 border-r border-gray-400 min-w-14 whitespace-nowrap">RMK</th>
                    <th className="px-1 py-1 text-left text-[10px] font-bold text-gray-700 bg-gray-200 min-w-12 whitespace-nowrap">ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {(sortedTours || []).map((tour) => (
                    <tr key={tour.id} className="border-b border-gray-300 hover:bg-gray-100">
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-16 whitespace-nowrap sticky left-0 bg-white">{tour.start_date}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-14 whitespace-nowrap">{tour.invoice}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-12 whitespace-nowrap">{tour.language}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 font-semibold min-w-20 whitespace-nowrap">{tour.name}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-8 whitespace-nowrap">{tour.pax}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-12 whitespace-nowrap">{tour.group_id}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-10 whitespace-nowrap">{tour.dnr}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-10 whitespace-nowrap">{tour.td}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-14 whitespace-nowrap">{tour.agent}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-12 whitespace-nowrap">{tour.arrival}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-12 whitespace-nowrap">{tour.departure}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-14 whitespace-nowrap">{tour.accommodation}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-12 whitespace-nowrap">{tour.gears}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-10 whitespace-nowrap">{tour.snowshoe}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-10 whitespace-nowrap">{tour.nlt}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-12 whitespace-nowrap">{tour.city_tour}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-10 whitespace-nowrap">{tour.hiking}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-10 whitespace-nowrap">{tour.fishing}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-12 whitespace-nowrap">{tour.dog_sledging}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-12 whitespace-nowrap">{tour.snowmobile_atv}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 text-center min-w-12 whitespace-nowrap">{tour.aurora_village}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-12 whitespace-nowrap">{tour.payment}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-14 whitespace-nowrap">{tour.reservation_number}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 border-r border-gray-300 min-w-14 whitespace-nowrap">{tour.remarks}</td>
                      <td className="px-1 py-1 text-[10px] text-gray-900 flex gap-1 min-w-12">
                        <button onClick={() => handleEditClick(tour)} className="text-blue-600 hover:text-blue-800 p-0.5">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => handleDeleteClick(tour.id)} className="text-red-600 hover:text-red-800 p-0.5">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tour Edit Modal */}
      <TourModal
        isOpen={isModalOpen}
        tour={editingTour}
        onClose={handleCloseModal}
        onSubmit={
          editingTour
            ? (data) => handleUpdateTour(editingTour.id, data)
            : handleAddTour
        }
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Delete Tour Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              This action cannot be undone. The tour will be permanently deleted from the system and all its data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Tour
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Dialog Modal */}
      <AlertDialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <Printer size={20} />
              Print Tour Schedule
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              Select the date range for the tours you want to print.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
              <Input
                type="date"
                value={printDateFrom}
                onChange={(e) => setPrintDateFrom(e.target.value)}
                className="py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
              <Input
                type="date"
                value={printDateTo}
                onChange={(e) => setPrintDateTo(e.target.value)}
                className="py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPrint}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPrint}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Print
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
