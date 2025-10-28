import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Server, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Upload,
  Settings,
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Eye,
  Power,
  RefreshCw,
  Shield,
  Globe,
  Database
} from 'lucide-react';

interface CustomerDeployment {
  id: string;
  customerId: string;
  customerName: string;
  tier: 'kickstart' | 'pro' | 'custom';
  region: string;
  status: 'running' | 'stopped' | 'updating' | 'error';
  version: string;
  lastDeployed: string;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  endpoints: string[];
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
}

interface DeploymentAction {
  id: string;
  deploymentId: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  initiatedBy: string;
}

const mockDeployments: CustomerDeployment[] = [
  {
    id: 'dep_001',
    customerId: '1',
    customerName: 'Acme Corporation',
    tier: 'pro',
    region: 'us-east-1',
    status: 'running',
    version: '012025.01',
    lastDeployed: '2024-01-15T10:30:00Z',
    uptime: 99.9,
    cpuUsage: 45,
    memoryUsage: 78,
    diskUsage: 65,
    endpoints: ['https://acme.controlcore.io', 'https://acme-api.controlcore.io'],
    resources: {
      cpu: '2 cores',
      memory: '4GB',
      storage: '50GB'
    }
  },
  {
    id: 'dep_002',
    customerId: '2',
    customerName: 'TechCorp Inc',
    tier: 'kickstart',
    region: 'us-west-2',
    status: 'running',
    version: '012025.01',
    lastDeployed: '2024-01-18T14:20:00Z',
    uptime: 99.8,
    cpuUsage: 23,
    memoryUsage: 45,
    diskUsage: 32,
    endpoints: ['https://techcorp.controlcore.io'],
    resources: {
      cpu: '1 core',
      memory: '2GB',
      storage: '20GB'
    }
  },
  {
    id: 'dep_003',
    customerId: '3',
    customerName: 'StartupCo',
    tier: 'custom',
    region: 'eu-west-1',
    status: 'updating',
    version: '012025.01',
    lastDeployed: '2024-01-20T09:15:00Z',
    uptime: 99.7,
    cpuUsage: 67,
    memoryUsage: 89,
    diskUsage: 78,
    endpoints: ['https://startupco.controlcore.io', 'https://startupco-api.controlcore.io'],
    resources: {
      cpu: '4 cores',
      memory: '8GB',
      storage: '100GB'
    }
  }
];

const mockActions: DeploymentAction[] = [
  {
    id: 'act_001',
    deploymentId: 'dep_001',
    action: 'Deploy Update',
    status: 'completed',
    startedAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:30:00Z',
    initiatedBy: 'admin@controlcore.io'
  },
  {
    id: 'act_002',
    deploymentId: 'dep_003',
    action: 'Scale Resources',
    status: 'running',
    startedAt: '2024-01-20T09:00:00Z',
    initiatedBy: 'admin@controlcore.io'
  }
];

export function DevOpsDashboard() {
  const [deployments] = useState<CustomerDeployment[]>(mockDeployments);
  const [actions] = useState<DeploymentAction[]>(mockActions);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>;
      case 'stopped':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Stopped</Badge>;
      case 'updating':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Updating</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'kickstart':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Kickstart</Badge>;
      case 'pro':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Pro</Badge>;
      case 'custom':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Custom</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

  const getActionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'updating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDeploymentAction = (deploymentId: string, action: string) => {
    console.log(`Executing ${action} on deployment ${deploymentId}`);
    // Implement deployment actions
  };

  const runningDeployments = deployments.filter(d => d.status === 'running').length;
  const totalDeployments = deployments.length;
  const avgUptime = deployments.reduce((sum, d) => sum + d.uptime, 0) / deployments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">DevOps Dashboard</h2>
          <p className="text-muted-foreground">
            Manage and monitor all customer Control Core deployments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Deploy Update
          </Button>
        </div>
      </div>

      {/* Deployment Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeployments}</div>
            <p className="text-xs text-muted-foreground">
              Across all customers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Deployments</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningDeployments}</div>
            <p className="text-xs text-muted-foreground">
              {((runningDeployments / totalDeployments) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUptime.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Actions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actions.filter(a => a.status === 'running' || a.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DevOps Tabs */}
      <Tabs defaultValue="deployments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deployments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Deployments</CardTitle>
              <CardDescription>
                Monitor and manage all customer Control Core deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{deployment.customerName}</div>
                          <div className="text-sm text-muted-foreground">{deployment.region}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(deployment.tier)}</TableCell>
                      <TableCell>{deployment.region}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(deployment.status)}
                          {getStatusBadge(deployment.status)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{deployment.version}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{deployment.resources.cpu}</div>
                          <div className="text-muted-foreground">{deployment.resources.memory}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{deployment.uptime}%</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeploymentAction(deployment.id, 'view')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeploymentAction(deployment.id, 'restart')}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restart
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeploymentAction(deployment.id, 'scale')}>
                              <Settings className="h-4 w-4 mr-2" />
                              Scale Resources
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeploymentAction(deployment.id, 'update')}>
                              <Download className="h-4 w-4 mr-2" />
                              Deploy Update
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeploymentAction(deployment.id, 'stop')}>
                              <Pause className="h-4 w-4 mr-2" />
                              Stop
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Actions</CardTitle>
              <CardDescription>
                Track and monitor deployment actions across all customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Initiated By</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="font-medium">{action.action}</TableCell>
                      <TableCell>
                        {deployments.find(d => d.id === action.deploymentId)?.customerName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(action.status)}
                          {getActionStatusBadge(action.status)}
                        </div>
                      </TableCell>
                      <TableCell>{action.initiatedBy}</TableCell>
                      <TableCell>
                        {new Date(action.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {action.completedAt 
                          ? `${Math.round((new Date(action.completedAt).getTime() - new Date(action.startedAt).getTime()) / 1000 / 60)}m`
                          : 'In progress'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Monitoring</CardTitle>
              <CardDescription>
                Monitor resource usage across all customer deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Resource Monitoring</h3>
                <p className="text-muted-foreground mb-4">
                  CPU, memory, and storage usage across all deployments
                </p>
                <Button>
                  <Monitor className="h-4 w-4 mr-2" />
                  View Detailed Metrics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
              <CardDescription>
                Monitor security events and compliance across all deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Security Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  Security events, compliance status, and threat monitoring
                </p>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  View Security Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
