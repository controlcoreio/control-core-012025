import { Badge } from "@/components/ui/badge";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { TestTube, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnvironmentBadgeProps {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EnvironmentBadge({ 
  className, 
  showIcon = true,
  size = 'md' 
}: EnvironmentBadgeProps) {
  const { currentEnvironment } = useEnvironment();
  const isSandbox = currentEnvironment === 'sandbox';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        sizeClasses[size],
        isSandbox 
          ? "bg-green-50 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700" 
          : "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700",
        className
      )}
    >
      {showIcon && (
        isSandbox 
          ? <TestTube className="h-3 w-3 mr-1 inline" />
          : <Rocket className="h-3 w-3 mr-1 inline" />
      )}
      {isSandbox ? 'Sandbox' : 'Production'}
    </Badge>
  );
}

export function EnvironmentIndicator({ className }: { className?: string }) {
  const { currentEnvironment } = useEnvironment();
  const isSandbox = currentEnvironment === 'sandbox';
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        isSandbox ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-sm font-medium">
        {isSandbox ? 'Sandbox Mode' : 'Production Mode'}
      </span>
    </div>
  );
}

