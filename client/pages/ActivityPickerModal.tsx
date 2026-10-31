import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Activity {
  name: string;
  timings: string[];
}

interface ActivityPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: { [key: string]: Activity };
  availableActivityKeys: string[];
  onSelectActivity: (activityKey: string, timing: string) => void;
}

export function ActivityPickerModal({
  open,
  onOpenChange,
  activities,
  availableActivityKeys,
  onSelectActivity,
}: ActivityPickerModalProps) {
  const [timings, setTimings] = useState<Record<string, string>>({});
  const availableKeysSignature = availableActivityKeys.join(",");

  useEffect(() => {
    if (open) {
      setTimings(
        Object.fromEntries(
          availableActivityKeys.map((key) => [key, activities[key]?.timings[0] || ""]),
        ),
      );
    }
  }, [open, availableKeysSignature]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select an Activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableActivityKeys.map((activityKey) => {
            const activityData = activities[activityKey];
            if (!activityData) return null;

            const timing = timings[activityKey] || "";

            return (
              <div
                key={activityKey}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-gray-900">{activityData.name}</div>
                {activityData.timings.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Suggested: {activityData.timings.join(" · ")}
                  </div>
                )}
                <label className="block text-xs font-medium text-gray-700 mt-3">
                  Activity time
                  <input
                    type="text"
                    value={timing}
                    onChange={(event) =>
                      setTimings((current) => ({ ...current, [activityKey]: event.target.value }))
                    }
                    placeholder="Enter a custom time"
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <button
                  type="button"
                  disabled={!timing.trim()}
                  onClick={() => {
                    onSelectActivity(activityKey, timing.trim());
                    onOpenChange(false);
                  }}
                  className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Add Activity
                </button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
