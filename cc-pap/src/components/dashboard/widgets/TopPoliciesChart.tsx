
import React from 'react';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useTheme } from '@/hooks/use-theme';

// Mock data for top evaluated policies with enterprise colors
const topPoliciesData = [
  { name: 'User Authentication', evaluations: 846, color: '#0054b4' },
  { name: 'API Gateway Access', evaluations: 742, color: '#009688' },
  { name: 'Data Lake Read', evaluations: 615, color: '#4caf50' },
  { name: 'Admin Dashboard', evaluations: 590, color: '#ffc107' },
  { name: 'User Profile Edit', evaluations: 521, color: '#616161' },
];

export function TopPoliciesChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const textColor = isDark ? '#f5f5f5' : '#37474f';
  const gridColor = isDark ? '#37474f' : '#e0e0e0';
  const tooltipBg = isDark ? '#263238' : '#ffffff';
  const tooltipBorder = isDark ? '#37474f' : '#e0e0e0';
  const cursorFill = isDark ? '#37474f' : '#f5f5f5';
  
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topPoliciesData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
          <XAxis 
            type="number" 
            domain={[0, 'dataMax']} 
            tickFormatter={(value) => `${value}`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: textColor, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toLocaleString()} evaluations`, 'Evaluations']}
            contentStyle={{ 
              backgroundColor: tooltipBg, 
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '0.375rem',
              color: textColor,
              boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.12)'
            }}
            cursor={{ fill: cursorFill }}
          />
          <Bar 
            dataKey="evaluations" 
            radius={[0, 4, 4, 0]}
          >
            {topPoliciesData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
