import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import TourModal from "@/components/TourModal";

interface Tour {
  id: string;
  date: string;
  invoice: string;
  language: string;
  name: string;
  pax: number;
  groupId: string;
  dnr: string;
  td: string;
  agent: string;
  arrivalDeparture: string;
  accommodation: string;
  gears: string;
  snowshoe: string;
  nlt: string;
  cityTour: string;
  hiking: string;
  fishing: string;
  dogSledging: string;
  snowmobileAtv: string;
  auroraVillage: string;
  payment: string;
  reservationNumber: string;
  remarks: string;
}

export default function Schedule() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async (searchQuery = "") => {
    try {
      const url = `/api/tours${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      setTours(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tours:", error);
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchTours(value);
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

  const handleDeleteTour = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tour?")) return;
    try {
      await fetch(`/api/tours/${id}`, { method: "DELETE" });
      setTours(tours.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting tour:", error);
    }
  };

  const handleEditClick = (tour: Tour) => {
    setEditingTour(tour);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTour(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tour Schedule</h1>
          <Button
            onClick={() => {
              setEditingTour(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={20} /> Add Tour
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <Input
            placeholder="Search by name, invoice, agent, or reservation number..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tours...</div>
          ) : tours.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tours found</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    DATE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    INVOICE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    LANGUAGE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    NAME
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    PAX
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    GROUP ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    DNR
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    T/D
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    AGENT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-yellow-100 border-r border-gray-300">
                    ARRIVAL/DEPARTURE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-cyan-100 border-r border-gray-300">
                    ACCOMMODATION
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-cyan-100 border-r border-gray-300">
                    GEARS
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-green-100 border-r border-gray-300">
                    SNOWSHOE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-blue-100 border-r border-gray-300">
                    NLT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-blue-100 border-r border-gray-300">
                    CITY TOUR
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-purple-100 border-r border-gray-300">
                    HIKING
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-purple-100 border-r border-gray-300">
                    FISHING
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-purple-100 border-r border-gray-300">
                    DOG SLEDGING
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-purple-100 border-r border-gray-300">
                    SNOWMOBILE/ATV
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-purple-100 border-r border-gray-300">
                    AURORA VILLAGE
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-200 border-r border-gray-300">
                    PAYMENT
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-200 border-r border-gray-300">
                    RESERVATION #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-200 border-r border-gray-300">
                    REMARKS
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-200">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr
                    key={tour.id}
                    className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.date}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.invoice}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.language}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 font-medium">
                      {tour.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.pax}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.groupId}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.dnr}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.td}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.agent}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.arrivalDeparture}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.accommodation}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.gears}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.snowshoe}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.nlt}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.cityTour}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.hiking}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.fishing}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.dogSledging}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.snowmobileAtv}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 text-center">
                      {tour.auroraVillage}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.payment}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.reservationNumber}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                      {tour.remarks}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 flex gap-2 whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(tour)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTour(tour.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
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
    </div>
  );
}
