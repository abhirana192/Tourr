import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EmailRecipientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (recipients: string[]) => void;
  tourName?: string;
  isLoading?: boolean;
}

export function EmailRecipientsDialog({
  open,
  onOpenChange,
  onConfirm,
  tourName,
  isLoading = false,
}: EmailRecipientsDialogProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [customEmails, setCustomEmails] = useState<string[]>([]);
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data = await response.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff list");
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleStaffToggle = (staffId: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(staffId)) {
      newSelected.delete(staffId);
    } else {
      newSelected.add(staffId);
    }
    setSelectedStaff(newSelected);
  };

  const handleAddCustomEmail = () => {
    const email = customEmailInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (customEmails.includes(email)) {
      toast.error("This email is already added");
      return;
    }

    setCustomEmails([...customEmails, email]);
    setCustomEmailInput("");
  };

  const handleRemoveCustomEmail = (email: string) => {
    setCustomEmails(customEmails.filter((e) => e !== email));
  };

  const handleConfirm = () => {
    const staffEmails = Array.from(selectedStaff)
      .map((id) => staffList.find((s) => s.id === id)?.email)
      .filter(Boolean) as string[];

    const allEmails = [...staffEmails, ...customEmails];

    if (allEmails.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    onConfirm(allEmails);
    onOpenChange(false);
    setSelectedStaff(new Set());
    setCustomEmails([]);
    setCustomEmailInput("");
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedStaff(new Set());
    setCustomEmails([]);
    setCustomEmailInput("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Email Notification</DialogTitle>
          <DialogDescription>
            {tourName ? `Notify about updates to: ${tourName}` : "Select recipients for the notification"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff Selection */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Select Staff Members</h3>
            {loadingStaff ? (
              <p className="text-sm text-gray-500">Loading staff...</p>
            ) : staffList.length > 0 ? (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {staffList.map((staff) => (
                  <div key={staff.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={staff.id}
                      checked={selectedStaff.has(staff.id)}
                      onCheckedChange={() => handleStaffToggle(staff.id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={staff.id}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-xs text-gray-500">{staff.email}</div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No staff members found</p>
            )}
          </div>

          {/* Custom Email */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Add Custom Emails</h3>
            <div className="flex gap-2 mb-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={customEmailInput}
                onChange={(e) => setCustomEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomEmail();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleAddCustomEmail}
                size="sm"
                disabled={isLoading || !customEmailInput.trim()}
              >
                Add
              </Button>
            </div>

            {customEmails.length > 0 && (
              <div className="space-y-2">
                {customEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm"
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => handleRemoveCustomEmail(email)}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-2 rounded text-sm text-blue-900">
            Total recipients: {selectedStaff.size + customEmails.length}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || selectedStaff.size + customEmails.length === 0}>
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
