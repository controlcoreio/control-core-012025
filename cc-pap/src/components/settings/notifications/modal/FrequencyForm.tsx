
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FrequencyFormProps {
  frequencyEnabled: boolean;
  frequencyCount: number;
  timeWindow: string;
  groupBy: string;
  eventType: string;
  onFrequencyEnabledChange: (enabled: boolean) => void;
  onFrequencyCountChange: (count: number) => void;
  onTimeWindowChange: (window: string) => void;
  onGroupByChange: (groupBy: string) => void;
}

const timeWindows = ["1 minute", "5 minutes", "15 minutes", "1 hour", "6 hours", "24 hours"];
const groupByOptions = ["Per Subject", "Per Resource", "Overall"];

export function FrequencyForm({
  frequencyEnabled,
  frequencyCount,
  timeWindow,
  groupBy,
  eventType,
  onFrequencyEnabledChange,
  onFrequencyCountChange,
  onTimeWindowChange,
  onGroupByChange
}: FrequencyFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequency & Threshold</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={frequencyEnabled}
            onCheckedChange={onFrequencyEnabledChange}
          />
          <Label>Trigger if event occurs more than X times within Y time period</Label>
        </div>

        {frequencyEnabled && (
          <>
            <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
              <div>
                <Label>Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={frequencyCount}
                  onChange={(e) => onFrequencyCountChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>Time Window</Label>
                <select
                  value={timeWindow}
                  onChange={(e) => onTimeWindowChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {timeWindows.map(window => (
                    <option key={window} value={window}>{window}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Group By</Label>
                <select
                  value={groupBy}
                  onChange={(e) => onGroupByChange(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {groupByOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              Example: "Trigger if {eventType} occurs more than {frequencyCount} times within {timeWindow} {groupBy.toLowerCase()}."
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
