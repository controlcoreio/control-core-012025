
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

interface StorageOverviewProps {
  totalUsed: number;
  totalMax: number;
}

export function StorageOverview({ totalUsed, totalMax }: StorageOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Current Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Storage Used</span>
            <span>{totalUsed} MB / {totalMax} MB</span>
          </div>
          <Progress value={(totalUsed / totalMax) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
