
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { MOCK_POLICIES } from "@/data/mockData";

const frequentlyUsed = MOCK_POLICIES.slice(0, 5).map((policy, i) => ({
  ...policy,
  evaluationCount: 100 - i * 15
}));

export function FrequentlyUsedPolicies({ selectedPolicy, setSelectedPolicy }: { selectedPolicy: string, setSelectedPolicy: (s: string) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Lightbulb className="text-yellow-500" size={20} />
        <div>
          <CardTitle>Frequently Used Policies</CardTitle>
          <CardDescription>
            Highlights the most frequently evaluated policies in the selected timeframe.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-2">
          <span className="font-medium mr-3">Top Policies:</span>
          <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select policy" />
            </SelectTrigger>
            <SelectContent>
              {frequentlyUsed.map(p => (
                <SelectItem key={p.id} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ol className="pl-5 text-sm">
          {frequentlyUsed.map((policy, i) => (
            <li key={policy.id} className="flex items-center py-1">
              <span className="mr-2 font-bold text-base text-muted-foreground">{i + 1}.</span>
              <span className="font-medium">{policy.name}</span>
              <span className="ml-auto text-muted-foreground">
                {policy.evaluationCount.toLocaleString()} evaluations
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
