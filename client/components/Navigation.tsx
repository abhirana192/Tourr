import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Schedule", path: "/schedule" },
    { label: "Monthly Plan", path: "/monthly-plan" },
    { label: "Arrival", path: "/arrival" },
    ...(user?.role === "admin" ? [{ label: "Staff Management", path: "/staff" }] : []),
  ];

  return (
    <>
      {/* Burger Button */}
      <button
        onClick={toggleSidebar}
        style={{
          position: "relative",
          zIndex: 50,
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#0f172a",
          margin: "16px",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        ☰
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setIsOpen(false)}
          style={{ userSelect: "none", zIndex: 35 }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ zIndex: 40 }}
      >
        <div className="pt-20 px-6 space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
            Tour Manager
          </h2>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
