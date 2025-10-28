
import React from 'react';
import { Shield, Server, Database, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

// Mock data for integration status
const integrations = [
  { 
    id: 1,
    name: 'API Gateway',
    type: 'gateway',
    status: 'connected',
    lastSync: '5 min ago'
  },
  { 
    id: 2,
    name: 'User Directory',
    type: 'directory',
    status: 'connected',
    lastSync: '10 min ago'
  },
  { 
    id: 3,
    name: 'Data Lake',
    type: 'database',
    status: 'warning',
    lastSync: '3 hours ago'
  },
  { 
    id: 4,
    name: 'SIEM System',
    type: 'security',
    status: 'error',
    lastSync: '1 day ago'
  },
  { 
    id: 5,
    name: 'MCP Agent',
    type: 'agent',
    status: 'connected',
    lastSync: '2 min ago'
  }
];

export function IntegrationStatusWidget() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Helper function to render the appropriate icon based on integration type
  const renderIcon = (type: string) => {
    switch (type) {
      case 'gateway':
        return <Server className="h-4 w-4 text-[#90adc6]" />;
      case 'database':
        return <Database className="h-4 w-4 text-[#90adc6]" />;
      default:
        return <Shield className="h-4 w-4 text-[#90adc6]" />;
    }
  };
  
  // Helper function to render the appropriate status indicator
  const renderStatus = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-xs">Connected</span>
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center gap-1 text-[#fad02c]">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Warning</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-red-500">
            <X className="h-4 w-4" />
            <span className="text-xs">Error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {integrations.map((integration) => (
        <div 
          key={integration.id} 
          className={cn(
            "flex items-center justify-between p-2 rounded-md",
            isDark ? (
              integration.status === 'connected' ? "bg-green-900/30" :
              integration.status === 'warning' ? "bg-amber-900/30" :
              "bg-red-900/30"
            ) : (
              integration.status === 'connected' ? "bg-green-50" :
              integration.status === 'warning' ? "bg-amber-50" :
              "bg-red-50"
            )
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              isDark ? "bg-[#90adc6]/20" : "bg-[#90adc6]/10"
            )}>
              {renderIcon(integration.type)}
            </div>
            <div>
              <p className={cn(
                "font-medium text-sm",
                isDark ? "text-gray-200" : "text-[#333652]"
              )}>
                {integration.name}
              </p>
              <p className={cn(
                "text-xs",
                isDark ? "text-gray-400" : "text-[#333652]/70"
              )}>
                Last sync: {integration.lastSync}
              </p>
            </div>
          </div>
          <div>
            {renderStatus(integration.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
