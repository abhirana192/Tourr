import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type LanguageOption = "en" | "en-zh" | "en-ja";

interface PrintLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (language: LanguageOption) => void;
  isLoading?: boolean;
}

const LANGUAGE_OPTIONS: { value: LanguageOption; label: string; description: string }[] = [
  {
    value: "en",
    label: "English Only",
    description: "Print in English",
  },
  {
    value: "en-zh",
    label: "English + Chinese",
    description: "Print in English and Simplified Chinese",
  },
  {
    value: "en-ja",
    label: "English + Japanese",
    description: "Print in English and Japanese",
  },
];

export function PrintLanguageDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: PrintLanguageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Select Print Language</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onConfirm(option.value);
                onOpenChange(false);
              }}
              disabled={isLoading}
              className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-xs text-gray-600 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="text-xs"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { LanguageOption };
