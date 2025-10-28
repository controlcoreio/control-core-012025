
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExportLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExport: (startDate: Date, endDate: Date) => void;
  timePeriod: string;
}

export function ExportLogsModal({
  open,
  onOpenChange,
  onConfirmExport,
  timePeriod
}: ExportLogsModalProps) {
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // Calculate date range based on time period
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timePeriod) {
      case "1h":
        startDate.setHours(now.getHours() - 1);
        break;
      case "24h":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "custom":
        return {
          startDate: customStartDate || new Date(),
          endDate: customEndDate || new Date()
        };
      default:
        startDate.setDate(now.getDate() - 1);
    }
    
    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getDateRange();
  const isCustomRange = timePeriod === "custom";
  const isNearPurgeDate = timePeriod === "90d" || 
    (startDate && (Date.now() - startDate.getTime()) > 80 * 24 * 60 * 60 * 1000); // 80+ days

  const handleConfirm = () => {
    onConfirmExport(startDate, endDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Log Export</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                You are about to export audit logs for the period from{" "}
                <strong>{format(startDate, "PPP")}</strong> to{" "}
                <strong>{format(endDate, "PPP")}</strong>. The logs will be provided in a .csv format.
              </p>
              
              <p>
                <strong>Important:</strong> ControlCore retains audit logs for 90 days by default. 
                Logs older than this period are purged.
              </p>
              
              {isNearPurgeDate && (
                <p className="font-semibold text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                  This export may include logs that are nearing their purge date. 
                  Please download them promptly if you require them for long-term retention.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {isCustomRange && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isCustomRange && (!customStartDate || !customEndDate)}
          >
            Export Logs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
