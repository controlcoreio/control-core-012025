
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const usageHistoryData = [
  { date: "2025-05-10", count: 32 },
  { date: "2025-05-11", count: 45 },
  { date: "2025-05-12", count: 51 },
  { date: "2025-05-13", count: 40 },
  { date: "2025-05-14", count: 67 },
  { date: "2025-05-15", count: 79 },
  { date: "2025-05-16", count: 69 },
];

export function PolicyUsageHistory({ selectedPolicy }: { selectedPolicy: string }) {
  // For now, always show the same data (could filter by policy name).
  const selectedUsageHistory = usageHistoryData;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Usage History</CardTitle>
        <CardDescription>
          Visualizes evaluation frequency over time for a selected policy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={selectedUsageHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
