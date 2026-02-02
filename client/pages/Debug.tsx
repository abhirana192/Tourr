import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Debug() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logMessage]);
    console.log(logMessage);
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setError("");
    setStatus(null);
    setLogs([]);
    addLog("Checking system status...");

    try {
      addLog("Fetching /api/debug/status");
      const response = await fetch("/api/debug/status");
      const data = await response.json();
      addLog("Status received");
      setStatus(data);

      if (!response.ok) {
        addLog(`Error: ${data.error}`);
        setError(data.error);
      } else {
        addLog(`Found ${data.status.totalStaffMembers} staff members`);
        addLog(`Admin user exists: ${data.status.adminUserExists}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError("");
    setStatus(null);
    setLogs([]);
    addLog("Creating admin user...");

    try {
      addLog("Calling /api/debug/create-admin");
      const response = await fetch("/api/debug/create-admin", {
        method: "POST",
      });
      const data = await response.json();
      addLog("Response received");

      if (!response.ok) {
        addLog(`Error: ${data.error}`);
        setError(data.error);
      } else {
        setStatus(data);
        addLog("Admin user created successfully!");
        addLog("You can now try logging in with:");
        addLog('Username: "Admin"');
        addLog('Password: "admin123"');
        toast.success("Admin user created!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Console</h1>
          <p className="text-gray-600">Diagnose and fix login issues</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleCheckStatus}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Check System Status
                </>
              )}
            </Button>

            <Button
              onClick={handleCreateAdmin}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Admin User
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Information */}
        {status && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Status Information</h2>

            {status.status ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                  <span className="text-gray-700">Staff Table Accessible</span>
                  <span className="text-green-600 font-semibold">✓ Yes</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                  <span className="text-gray-700">Total Staff Members</span>
                  <span className="font-mono font-semibold">{status.status.totalStaffMembers}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                  <span className="text-gray-700">Admin User Exists</span>
                  <span className={`font-semibold ${status.status.adminUserExists ? 'text-green-600' : 'text-red-600'}`}>
                    {status.status.adminUserExists ? '✓ Yes' : '✗ No'}
                  </span>
                </div>

                {status.status.allStaff.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-bold text-gray-900 mb-2">Staff Members:</h3>
                    <div className="space-y-2">
                      {status.status.allStaff.map((staff: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                          <div className="font-semibold text-gray-900">{staff.name}</div>
                          <div className="text-gray-600">{staff.email}</div>
                          <div className="text-gray-500 text-xs">Role: {staff.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <p className="text-green-700">Admin user successfully created!</p>
                <p className="text-green-600 text-sm mt-2">
                  You can now go to login and use credentials: Admin / admin123
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Logs</h2>
            <Button
              onClick={handleClearLogs}
              className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-900 px-3 py-1"
            >
              Clear
            </Button>
          </div>

          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Logs will appear here...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="text-green-400">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-4">
          <a
            href="/setup"
            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Go to Setup
          </a>
          <a
            href="/login"
            className="flex-1 text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}
