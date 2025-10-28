
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  PieLabelRenderProps 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

// Mock data
const pepStatusData = [
  { name: 'Connected', value: 5, color: '#4ade80' }, // Green using Tailwind's emerald-400
  { name: 'Warning', value: 1, color: '#fad02c' },   // Yellow from our palette
  { name: 'Error', value: 1, color: '#f87171' },     // Red using Tailwind's red-400
];

const RADIAN = Math.PI / 180;

// Custom label renderer for the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: PieLabelRenderProps & {name?: string}) => {
  // Ensure cx, cy, innerRadius, and outerRadius are numbers before calculations
  const safeRadius = (typeof innerRadius === 'number' && typeof outerRadius === 'number')
    ? innerRadius + (outerRadius - innerRadius) * 0.5
    : 0;
  
  const safeCx = typeof cx === 'number' ? cx : 0;
  const safeCy = typeof cy === 'number' ? cy : 0;
  
  const x = safeCx + safeRadius * Math.cos(-midAngle * RADIAN);
  const y = safeCy + safeRadius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function PEPStatusChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const textColor = isDark ? '#e0e0e0' : '#333652';
  const tooltipBg = isDark ? '#333333' : 'white';
  const tooltipBorder = isDark ? '#555555' : '#e2e8f0';
  
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pepStatusData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pepStatusData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [`${value} PEPs`, name]}
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '0.375rem',
              color: textColor
            }}
          />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            formatter={(value, entry) => {
              const { color } = entry as unknown as { color: string };
              return <span style={{ color: textColor }}>{value}</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="flex justify-end mt-2">
        <Button 
          variant="ghost" 
          size="sm"
          asChild
          className={cn(
            isDark 
              ? "text-gray-300 hover:bg-gray-700/50 hover:text-gray-100" 
              : "text-[#333652] hover:bg-[#90adc6]/10 hover:text-[#333652]"
          )}
        >
          <Link to="/settings/pep" className="flex items-center gap-1">
            Manage PEPs
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
