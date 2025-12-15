import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Staff {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  created_at: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff";
}

interface PasswordStatus {
  staffId: string;
  email: string;
  tempPassword: string;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data = await response.json();
      setStaff(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load staff";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", role: "staff" });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingId(staffMember.id);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      password: "",
      role: staffMember.role,
    });
    setShowPassword(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;

    try {
      const sessionToken = localStorage.getItem("sessionToken");
      const headers: HeadersInit = {};
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete staff");

      setStaff(staff.filter((s) => s.id !== id));
      toast.success("Staff member deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete staff";
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editingId && !formData.password) {
      toast.error("Password is required for new staff members");
      return;
    }

    try {
      setIsLoading(true);

      const sessionToken = localStorage.getItem("sessionToken");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      if (editingId) {
        const response = await fetch(`/api/staff/${editingId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            ...(formData.password && { password: formData.password }),
          }),
        });

        if (!response.ok) throw new Error("Failed to update staff");

        const updated = await response.json();
        setStaff(staff.map((s) => (s.id === editingId ? { ...s, ...updated.data } : s)));

        if (updated.emailSent) {
          const emailTime = new Date(updated.emailSent.timestamp).toLocaleTimeString();
          toast.success(`Email sent to ${updated.emailSent.recipientCount} staff members at ${emailTime}`, {
            description: `From: ${updated.emailSent.senderName}`,
          });
        }

        if (formData.password) {
          setPasswordStatus({
            staffId: editingId,
            email: formData.email,
            tempPassword: formData.password,
          });
        } else {
          if (!updated.emailSent) {
            toast.success("Staff member updated successfully");
          }
        }
      } else {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers,
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Failed to create staff");

        const newStaff = await response.json();
        setStaff([...staff, newStaff.data]);

        setPasswordStatus({
          staffId: newStaff.data.id,
          email: newStaff.data.email,
          tempPassword: formData.password,
        });
      }

      setIsDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: "staff" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Operation failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 pt-6">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage staff accounts and permissions</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Add Button */}
        <div className="mb-6">
          <Button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} /> Add New Staff
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Staff Table */}
        {!isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white border-b border-gray-400">
                    <th className="px-4 py-3 text-left text-sm font-bold border-r border-gray-400">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-bold border-r border-gray-400">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-bold border-r border-gray-400">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    staff.map((member, idx) => (
                      <tr
                        key={member.id}
                        className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold border-r border-gray-200">
                          {member.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                          {member.email}
                        </td>
                        <td className="px-4 py-3 text-sm border-r border-gray-200">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              member.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-2">
                          <Button
                            onClick={() => handleEdit(member)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-1 px-2 rounded-lg flex items-center gap-1"
                          >
                            <Edit2 size={14} /> Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(member.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs py-1 px-2 rounded-lg flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          </DialogHeader>

          {editingId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <strong>Password is set.</strong> Leave empty to keep current password, or enter a new one to change it.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password {editingId ? "(optional - leave empty to keep current)" : "(required)"}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "staff" })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Buttons */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                variant="outline"
                disabled={isLoading}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Dialog */}
      <Dialog open={!!passwordStatus} onOpenChange={(open) => !open && setPasswordStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              ✓ Password Changed
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Staff:</strong> {passwordStatus?.email}
              </p>
              <p className="text-sm text-gray-700">
                <strong>New Password:</strong>
              </p>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={passwordStatus?.tempPassword || ""}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <Button
                  onClick={() => {
                    if (passwordStatus) {
                      navigator.clipboard.writeText(passwordStatus.tempPassword);
                      toast.success("Password copied to clipboard");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>⚠️ Important:</strong> Save this password in a secure location. You won't see it again.
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setPasswordStatus(null)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
