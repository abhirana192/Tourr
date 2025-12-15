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
  onSelectActivity: (activityKey: string) => void;
}

export function ActivityPickerModal({
  open,
  onOpenChange,
  activities,
  availableActivityKeys,
  onSelectActivity,
}: ActivityPickerModalProps) {
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

            return (
              <button
                key={activityKey}
                onClick={() => {
                  onSelectActivity(activityKey);
                  onOpenChange(false);
                }}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-semibold text-gray-900">{activityData.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {activityData.timings.map((timing, idx) => (
                    <div key={idx}>{timing}</div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
