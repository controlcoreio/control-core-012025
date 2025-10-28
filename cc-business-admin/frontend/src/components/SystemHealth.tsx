import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  uptime: number;
  lastIncident: string | null;
}

const mockMetrics: SystemMetric[] = [
  {
    name: 'CPU Usage',
    value: 45,
    status: 'healthy',
    trend: 'stable',
    lastUpdated: '2024-01-20T10:30:00Z'
  },
  {
    name: 'Memory Usage',
    value: 78,
    status: 'warning',
    trend: 'up',
    lastUpdated: '2024-01-20T10:30:00Z'
  },
  {
    name: 'Disk Usage',
    value: 65,
    status: 'healthy',
    trend: 'stable',
    lastUpdated: '2024-01-20T10:30:00Z'
  },
  {
    name: 'Network Latency',
    value: 12,
    status: 'healthy',
    trend: 'down',
    lastUpdated: '2024-01-20T10:30:00Z'
  }
];

const mockServices: ServiceStatus[] = [
  {
    name: 'Control Plane API',
    status: 'online',
    responseTime: 45,
    uptime: 99.9,
    lastIncident: null
  },
  {
    name: 'Database',
    status: 'online',
    responseTime: 12,
    uptime: 99.8,
    lastIncident: null
  },
  {
    name: 'Redis Cache',
    status: 'degraded',
    responseTime: 89,
    uptime: 98.5,
    lastIncident: '2024-01-18T14:20:00Z'
  },
  {
    name: 'OPAL Server',
    status: 'online',
    responseTime: 23,
    uptime: 99.7,
    lastIncident: null
  },
  {
    name: 'Bouncer Service',
    status: 'online',
    responseTime: 34,
    uptime: 99.6,
    lastIncident: null
  }
];

export function SystemHealth() {
  const [metrics] = useState<SystemMetric[]>(mockMetrics);
  const [services] = useState<ServiceStatus[]>(mockServices);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
      case 'degraded':
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
      case 'offline':
      case 'critical':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const overallHealth = services.filter(s => s.status === 'online').length / services.length * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">
            Monitor system performance and service availability
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            View Detailed Metrics
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealth.toFixed(1)}%</div>
            <Progress value={overallHealth} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {services.filter(s => s.status === 'online').length} of {services.length} services online
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / services.length)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(services.reduce((sum, s) => sum + s.uptime, 0) / services.length * 100) / 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter(s => s.status !== 'online').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>
            Real-time system performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(metric.trend)}
                    <span className="text-sm text-muted-foreground">
                      {metric.value}%
                    </span>
                  </div>
                </div>
                <Progress value={metric.value} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last updated: {new Date(metric.lastUpdated).toLocaleTimeString()}</span>
                  {getStatusIcon(metric.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Monitor individual service health and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(service.status)}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{service.responseTime}ms</span>
                    <span>{service.uptime}% uptime</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(service.status)}
                  {service.lastIncident && (
                    <Badge variant="outline" className="text-xs">
                      Last incident: {new Date(service.lastIncident).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            Track and monitor system incidents and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Recent Incidents</h3>
            <p className="text-muted-foreground">
              All systems are operating normally
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
