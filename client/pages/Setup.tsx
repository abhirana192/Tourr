import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { toast } from "sonner";

export default function Setup() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [error, setError] = useState("");

  const handleInitialize = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");
    setCredentials(null);

    try {
      const response = await fetch("/api/setup/initialize-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to initialize admin user");
      }

      const data = await response.json();
      setMessage(data.message);
      setCredentials(data.credentials);
      toast.success("Admin user ready!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Setup failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tour Manager Setup</h1>
          <p className="text-gray-600">Initialize your admin account</p>
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

        {/* Success Message */}
        {credentials && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-700 text-sm font-semibold">Setup Complete!</p>
                <p className="text-green-600 text-sm">{message}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded border border-green-200 mb-4">
              <p className="text-xs text-gray-600 mb-2">Your login credentials:</p>
              <p className="font-mono text-sm text-gray-900 mb-2">
                <span className="font-semibold">Username:</span> {credentials.username}
              </p>
              <p className="font-mono text-sm text-gray-900">
                <span className="font-semibold">Password:</span> {credentials.password}
              </p>
            </div>

            <a
              href="/login"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </a>
          </div>
        )}

        {/* Initialize Button */}
        {!credentials && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm text-center">
              Click the button below to create your admin account and get started.
            </p>

            <Button
              onClick={handleInitialize}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Admin Account"
              )}
            </Button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-2">What happens next?</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Admin user will be created</li>
                <li>✓ You'll receive login credentials</li>
                <li>✓ You can start managing tours immediately</li>
                <li>✓ Add more staff members from Staff Management page</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
