import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

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

interface TourModalProps {
  isOpen: boolean;
  tour: Tour | null;
  onClose: () => void;
  onSubmit: (tour: Omit<Tour, "id">) => void;
}

const PREDEFINED_AGENTS = [
  { code: "OT", name: "Owen Travel" },
  { code: "DP", name: "Dragon Palace" },
  { code: "KK", name: "KKDay" },
  { code: "Trip", name: "Tripadvior" },
  { code: "T4F", name: "Tour 4 Fun" },
  { code: "FE", name: "First Express Travel" },
  { code: "IJ", name: "JiJiang" },
];

export default function TourModal({ isOpen, tour, onClose, onSubmit }: TourModalProps) {
  const [formData, setFormData] = useState<Omit<Tour, "id">>({
    start_date: "",
    invoice: "",
    language: "",
    name: "",
    pax: 0,
    group_id: "",
    dnr: "",
    td: "",
    agent: "",
    arrival: "",
    departure: "",
    accommodation: "",
    gears: "",
    snowshoe: "",
    nlt: "",
    city_tour: "",
    hiking: "",
    fishing: "",
    dog_sledging: "",
    snowmobile_atv: "",
    aurora_village: "",
    payment: "",
    reservation_number: "",
    remarks: "",
  });

  const [agentType, setAgentType] = useState<"predefined" | "other">("predefined");
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [arrivalTime, setArrivalTime] = useState<string>("");
  const [arrivalFlight, setArrivalFlight] = useState<string>("");
  const [departureDate, setDepartureDate] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>("");
  const [departureFlight, setDepartureFlight] = useState<string>("");

  useEffect(() => {
    if (tour) {
      const { id, ...rest } = tour;
      setFormData(rest);
      const isPredefined = PREDEFINED_AGENTS.some(a => a.code === rest.agent);
      setAgentType(isPredefined ? "predefined" : "other");
    } else {
      setFormData({
        start_date: "",
        invoice: "",
        language: "",
        name: "",
        pax: 0,
        group_id: "",
        dnr: "",
        td: "",
        agent: "",
        arrival: "",
        departure: "",
        accommodation: "",
        gears: "",
        snowshoe: "",
        nlt: "",
        city_tour: "",
        hiking: "",
        fishing: "",
        dog_sledging: "",
        snowmobile_atv: "",
        aurora_village: "",
        payment: "",
        reservation_number: "",
        remarks: "",
      });
      setAgentType("predefined");
    }
  }, [tour, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "pax" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-300 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {tour ? "Edit Tour" : "Add New Tour"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* DATE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date
              </label>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
              />
            </div>

            {/* INVOICE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Invoice
              </label>
              <Input
                type="text"
                name="invoice"
                value={formData.invoice}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
              />
            </div>

            {/* LANGUAGE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Language
              </label>
              <Input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* NAME */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Name (Leader + Members)
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                required
              />
            </div>

            {/* PAX */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Pax (Number of People)
              </label>
              <Input
                type="number"
                name="pax"
                value={formData.pax}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                min="0"
              />
            </div>

            {/* GROUP ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Group ID
              </label>
              <Input
                type="text"
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* DNR */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                DNR
              </label>
              <Input
                type="text"
                name="dnr"
                value={formData.dnr}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* T/D */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                T/D
              </label>
              <Input
                type="text"
                name="td"
                value={formData.td}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* AGENT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Agent
              </label>
              <div className="space-y-2">
                <select
                  name="agent"
                  value={agentType === "other" ? "OTHER" : formData.agent}
                  onChange={(e) => {
                    if (e.target.value === "OTHER") {
                      setAgentType("other");
                      setFormData(prev => ({ ...prev, agent: "" }));
                    } else {
                      setAgentType("predefined");
                      setFormData(prev => ({ ...prev, agent: e.target.value }));
                    }
                  }}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  required
                >
                  <option value="">-- Select Agent --</option>
                  {PREDEFINED_AGENTS.map((agent) => (
                    <option key={agent.code} value={agent.code}>
                      {agent.code} - {agent.name}
                    </option>
                  ))}
                  <option value="OTHER">Other</option>
                </select>

                {agentType === "other" && (
                  <Input
                    type="text"
                    name="agent"
                    placeholder="Enter agent name"
                    value={formData.agent}
                    onChange={handleChange}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                    required
                  />
                )}
              </div>
            </div>

            {/* ARRIVAL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Arrival
              </label>
              <Input
                type="text"
                name="arrival"
                value={formData.arrival}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* DEPARTURE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Departure
              </label>
              <Input
                type="text"
                name="departure"
                value={formData.departure}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* ACCOMMODATION */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Accommodation
              </label>
              <Input
                type="text"
                name="accommodation"
                value={formData.accommodation}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* GEARS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Gears
              </label>
              <Input
                type="text"
                name="gears"
                value={formData.gears}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* SNOWSHOE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Snowshoe
              </label>
              <Input
                type="text"
                name="snowshoe"
                value={formData.snowshoe}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* NLT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                NLT
              </label>
              <Input
                type="text"
                name="nlt"
                value={formData.nlt}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* CITY TOUR */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                City Tour
              </label>
              <Input
                type="text"
                name="city_tour"
                value={formData.city_tour}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* HIKING */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hiking
              </label>
              <Input
                type="text"
                name="hiking"
                value={formData.hiking}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* FISHING */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fishing
              </label>
              <Input
                type="text"
                name="fishing"
                value={formData.fishing}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* DOG SLEDGING */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Dog Sledging
              </label>
              <Input
                type="text"
                name="dog_sledging"
                value={formData.dog_sledging}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* SNOWMOBILE/ATV */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Snowmobile/ATV
              </label>
              <Input
                type="text"
                name="snowmobile_atv"
                value={formData.snowmobile_atv}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* AURORA VILLAGE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Aurora Village
              </label>
              <Input
                type="text"
                name="aurora_village"
                value={formData.aurora_village}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* PAYMENT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment
              </label>
              <Input
                type="text"
                name="payment"
                value={formData.payment}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* RESERVATION NUMBER */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Reservation Number
              </label>
              <Input
                type="text"
                name="reservation_number"
                value={formData.reservation_number}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>

            {/* REMARKS */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="border border-gray-300 rounded px-3 py-2 w-full h-20 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-300 pt-6">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {tour ? "Update Tour" : "Add Tour"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
