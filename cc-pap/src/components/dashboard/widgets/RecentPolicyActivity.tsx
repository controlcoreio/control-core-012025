
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

// Mock data
const recentActivities = [
  {
    id: 1,
    policyName: "API Access Control",
    action: "Updated",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: 2,
    policyName: "Data Lake Security",
    action: "Created",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 3,
    policyName: "Internal API Policy",
    action: "Promoted",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 4,
    policyName: "User Authentication",
    action: "Analyzed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30), // 30 hours ago
  },
];

export function RecentPolicyActivity() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Helper function to format time
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="space-y-4">
      {recentActivities.map((activity) => (
        <div 
          key={activity.id} 
          className={cn(
            "flex items-center justify-between rounded-lg border p-3 transition-colors",
            isDark 
              ? "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50" 
              : "border-[#90adc6]/20 hover:bg-[#e9eaec]/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              isDark ? "bg-[#90adc6]/20" : "bg-[#90adc6]/10"
            )}>
              <FileText className="h-4 w-4 text-[#90adc6]" />
            </div>
            <div>
              <p className={cn(
                "font-medium",
                isDark ? "text-gray-200" : "text-foreground"
              )}>
                {activity.policyName}
              </p>
              <p className={cn(
                "text-xs flex items-center gap-1",
                isDark ? "text-gray-400" : "text-[#333652]/70"
              )}>
                <Clock className="h-3 w-3" />
                {activity.action} {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex justify-end">
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
          <Link to="/audit" className="flex items-center gap-1">
            View all activities
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
