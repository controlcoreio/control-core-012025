
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Filter,
  Zap,
  Shield,
  Database,
  Server,
  Globe,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TopologyNode {
  id: string;
  type: 'PEP' | 'PDP' | 'OPAL' | 'PolicyStore' | 'PIP';
  name: string;
  environment: 'Production' | 'Staging' | 'Development';
  region: string;
  status: 'healthy' | 'degraded' | 'offline';
  engine?: 'OPA' | 'Cedar' | 'OpenFGA';
  position: { x: number; y: number };
  stats?: {
    requestsPerSec?: number;
    policyVersion?: string;
    uptime?: string;
    lastSync?: string;
  };
}

interface Connection {
  from: string;
  to: string;
  type: 'policy-sync' | 'authorization' | 'data-fetch' | 'policy-push';
  animated?: boolean;
}

const mockNodes: TopologyNode[] = [
  // Production Environment
  {
    id: 'pep-api-gateway-prod',
    type: 'PEP',
    name: 'API Gateway PEP',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    position: { x: 100, y: 200 },
    stats: { requestsPerSec: 150 }
  },
  {
    id: 'pep-webapp-prod',
    type: 'PEP',
    name: 'Web App PEP',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    position: { x: 100, y: 300 },
    stats: { requestsPerSec: 85 }
  },
  {
    id: 'pdp-prod-1',
    type: 'PDP',
    name: 'PDP-PROD-01',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    engine: 'OPA',
    position: { x: 350, y: 200 },
    stats: { policyVersion: 'v1.2.3', uptime: '99.9%' }
  },
  {
    id: 'pdp-prod-2',
    type: 'PDP',
    name: 'PDP-PROD-02',
    environment: 'Production',
    region: 'US-East-1',
    status: 'degraded',
    engine: 'OPA',
    position: { x: 350, y: 300 },
    stats: { policyVersion: 'v1.2.2', uptime: '98.1%' }
  },
  {
    id: 'opal-server-prod',
    type: 'OPAL',
    name: 'OPAL Server',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    position: { x: 600, y: 250 },
    stats: { lastSync: '2 min ago' }
  },
  {
    id: 'policy-store-prod',
    type: 'PolicyStore',
    name: 'Policy Repository',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    position: { x: 850, y: 250 }
  },
  {
    id: 'pip-hr-prod',
    type: 'PIP',
    name: 'HR System PIP',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    position: { x: 600, y: 100 },
    stats: { lastSync: '5 min ago' }
  },
  {
    id: 'pip-crm-prod',
    type: 'PIP',
    name: 'CRM PIP',
    environment: 'Production',
    region: 'US-East-1',
    status: 'healthy',
    position: { x: 600, y: 400 },
    stats: { lastSync: '1 min ago' }
  },
  // Staging Environment
  {
    id: 'pdp-staging-1',
    type: 'PDP',
    name: 'PDP-STAGING-01',
    environment: 'Staging',
    region: 'US-West-2',
    status: 'healthy',
    engine: 'Cedar',
    position: { x: 350, y: 500 },
    stats: { policyVersion: 'v1.3.0-beta', uptime: '99.5%' }
  },
  {
    id: 'opal-server-staging',
    type: 'OPAL',
    name: 'OPAL Server (Staging)',
    environment: 'Staging',
    region: 'US-West-2',
    status: 'healthy',
    position: { x: 600, y: 500 }
  }
];

const mockConnections: Connection[] = [
  { from: 'pep-api-gateway-prod', to: 'pdp-prod-1', type: 'authorization' },
  { from: 'pep-webapp-prod', to: 'pdp-prod-2', type: 'authorization' },
  { from: 'opal-server-prod', to: 'pdp-prod-1', type: 'policy-sync' },
  { from: 'opal-server-prod', to: 'pdp-prod-2', type: 'policy-sync' },
  { from: 'policy-store-prod', to: 'opal-server-prod', type: 'policy-push' },
  { from: 'opal-server-prod', to: 'pip-hr-prod', type: 'data-fetch' },
  { from: 'opal-server-prod', to: 'pip-crm-prod', type: 'data-fetch' },
  { from: 'opal-server-staging', to: 'pdp-staging-1', type: 'policy-sync' }
];

export function DeploymentTopology() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [selectedComponentType, setSelectedComponentType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLastPolicyPush, setShowLastPolicyPush] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getNodeIcon = (type: TopologyNode['type']) => {
    switch (type) {
      case 'PEP':
        return Shield;
      case 'PDP':
        return Zap;
      case 'OPAL':
        return Server;
      case 'PolicyStore':
        return Database;
      case 'PIP':
        return Globe;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: TopologyNode['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'offline':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: TopologyNode['status']) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'degraded':
        return Clock;
      case 'offline':
        return AlertCircle;
      default:
        return Activity;
    }
  };

  const getEngineColor = (engine?: string) => {
    switch (engine) {
      case 'OPA':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Cedar':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'OpenFGA':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return '';
    }
  };

  const filteredNodes = mockNodes.filter(node => {
    if (selectedEnvironment !== 'all' && node.environment !== selectedEnvironment) return false;
    if (selectedComponentType !== 'all' && node.type !== selectedComponentType) return false;
    if (selectedStatus !== 'all' && node.status !== selectedStatus) return false;
    return true;
  });

  const handleNodeClick = (node: TopologyNode) => {
    console.log(`Navigating to ${node.type} details:`, node.name);
    // In a real app, this would navigate to the specific component's detail page
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const toggleLastPolicyPush = () => {
    setShowLastPolicyPush(!showLastPolicyPush);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="Staging">Staging</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedComponentType} onValueChange={setSelectedComponentType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Component" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Components</SelectItem>
            <SelectItem value="PEP">PEP</SelectItem>
            <SelectItem value="PDP">PDP</SelectItem>
            <SelectItem value="OPAL">OPAL</SelectItem>
            <SelectItem value="PolicyStore">Policy Store</SelectItem>
            <SelectItem value="PIP">PIP</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAnimation}
            className="gap-2"
          >
            {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAnimating ? 'Stop' : 'Animate'} Data Flow
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleLastPolicyPush}
            className={cn("gap-2", showLastPolicyPush && "bg-blue-50 border-blue-200")}
          >
            <RotateCcw className="h-4 w-4" />
            Last Policy Push
          </Button>
        </div>
      </div>

      {/* Topology Map */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Topology Map</CardTitle>
          <CardDescription>
            Interactive visualization of authorization platform components and their relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-[600px] bg-gray-50 rounded-lg border overflow-hidden">
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {mockConnections.map((connection, index) => {
                const fromNode = mockNodes.find(n => n.id === connection.from);
                const toNode = mockNodes.find(n => n.id === connection.to);
                
                if (!fromNode || !toNode) return null;
                
                const isPolicyPushPath = showLastPolicyPush && 
                  (connection.type === 'policy-push' || connection.type === 'policy-sync');
                
                return (
                  <line
                    key={index}
                    x1={fromNode.position.x + 50}
                    y1={fromNode.position.y + 25}
                    x2={toNode.position.x + 50}
                    y2={toNode.position.y + 25}
                    stroke={isPolicyPushPath ? "#3b82f6" : "#d1d5db"}
                    strokeWidth={isPolicyPushPath ? "3" : "2"}
                    strokeDasharray={connection.type === 'data-fetch' ? "5,5" : "none"}
                    className={cn(
                      "transition-all duration-300",
                      isAnimating && "animate-pulse",
                      isPolicyPushPath && "animate-pulse"
                    )}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const StatusIcon = getStatusIcon(node.status);
              
              return (
                <div
                  key={node.id}
                  className={cn(
                    "absolute w-24 h-12 border-2 rounded-lg cursor-pointer transition-all duration-200",
                    "flex items-center justify-center text-xs font-medium",
                    "hover:scale-105 hover:shadow-lg hover:z-10",
                    getStatusColor(node.status),
                    hoveredNode === node.id && "scale-105 shadow-lg z-10"
                  )}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                  }}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      <StatusIcon className="h-2 w-2" />
                    </div>
                    <span className="text-[10px] leading-tight text-center">
                      {node.name.split(' ')[0]}
                    </span>
                    {node.engine && (
                      <Badge className={cn("text-[8px] px-1 py-0 h-3", getEngineColor(node.engine))}>
                        {node.engine}
                      </Badge>
                    )}
                  </div>

                  {/* Hover Details */}
                  {hoveredNode === node.id && (
                    <div className="absolute top-full left-0 mt-2 p-3 bg-white border rounded-lg shadow-lg z-20 w-48">
                      <h4 className="font-semibold text-sm mb-2">{node.name}</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Environment:</span>
                          <Badge variant="outline">{node.environment}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Region:</span>
                          <span>{node.region}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className={cn("text-xs", getStatusColor(node.status))}>
                            {node.status}
                          </Badge>
                        </div>
                        {node.stats && (
                          <div className="border-t pt-2 mt-2">
                            {node.stats.requestsPerSec && (
                              <div className="flex justify-between">
                                <span>Req/sec:</span>
                                <span>{node.stats.requestsPerSec}</span>
                              </div>
                            )}
                            {node.stats.policyVersion && (
                              <div className="flex justify-between">
                                <span>Policy:</span>
                                <span>{node.stats.policyVersion}</span>
                              </div>
                            )}
                            {node.stats.uptime && (
                              <div className="flex justify-between">
                                <span>Uptime:</span>
                                <span>{node.stats.uptime}</span>
                              </div>
                            )}
                            {node.stats.lastSync && (
                              <div className="flex justify-between">
                                <span>Last Sync:</span>
                                <span>{node.stats.lastSync}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Environment Labels */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-red-100 text-red-700 border-red-200">Production</Badge>
            </div>
            <div className="absolute top-96 left-4">
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Staging</Badge>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-2">
              <h4 className="font-medium">Component Types</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>PEP (Policy Enforcement Point)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <span>PDP (Policy Decision Point)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-3 w-3" />
                  <span>OPAL Server</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span>Degraded</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span>Offline</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Connection Types</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-400"></div>
                  <span>Authorization Request</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span>Policy Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t"></div>
                  <span>Data Fetch</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Engine Types</h4>
              <div className="space-y-1">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">OPA</Badge>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Cedar</Badge>
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">OpenFGA</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
