
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface DataRetentionSetting {
  id: string;
  name: string;
  description: string;
  currentRetention: string;
  storageUsage: number;
  maxStorage: number;
}

interface RetentionOption {
  value: string;
  label: string;
}

interface DataTypeCardProps {
  dataType: DataRetentionSetting;
  retentionOptions: RetentionOption[];
  onRetentionChange: (value: string) => void;
}

export function DataTypeCard({ dataType, retentionOptions, onRetentionChange }: DataTypeCardProps) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div>
        <h3 className="font-medium">{dataType.name}</h3>
        <p className="text-sm text-muted-foreground">{dataType.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor={`retention-${dataType.id}`}>Retention Period</Label>
          <Select 
            value={dataType.currentRetention} 
            onValueChange={onRetentionChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {retentionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Current Storage</Label>
          <div className="text-sm text-muted-foreground">
            {dataType.storageUsage} MB used
          </div>
          <Progress 
            value={(dataType.storageUsage / dataType.maxStorage) * 100} 
            className="h-2 mt-1" 
          />
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Preview Impact</Button>
        </div>
      </div>
    </div>
  );
}
