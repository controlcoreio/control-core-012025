import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ToggleLeft, 
  ToggleRight, 
  Shield, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Copy,
  Eye,
  Settings,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  GitBranch,
  Clock,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnvironmentManagerProps {
  currentEnvironment: 'sandbox' | 'production';
  onEnvironmentChange: (environment: 'sandbox' | 'production') => void;
  onPolicyPromote?: (policyId: string, fromEnv: string, toEnv: string) => void;
}

interface EnvironmentStatus {
  name: string;
  status: 'active' | 'inactive' | 'syncing';
  lastSync: string;
  policyCount: number;
  activePolicies: number;
  version: string;
}

interface PromotionItem {
  id: string;
  policyName: string;
  status: string;
  createdAt: string;
}

export function EnvironmentManager({ 
  currentEnvironment, 
  onEnvironmentChange, 
  onPolicyPromote 
}: EnvironmentManagerProps) {
  const [environments, setEnvironments] = useState<EnvironmentStatus[]>([
    {
      name: 'sandbox',
      status: 'active',
      lastSync: '2025-01-27T10:30:00Z',
      policyCount: 12,
      activePolicies: 8,
      version: 'v2.1.0'
    },
    {
      name: 'production',
      status: 'inactive',
      lastSync: '2025-01-27T09:15:00Z',
      policyCount: 8,
      activePolicies: 8,
      version: 'v2.0.5'
    }
  ]);

  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionQueue, setPromotionQueue] = useState<PromotionItem[]>([]);
  const { toast } = useToast();

  const handleEnvironmentToggle = (environment: 'sandbox' | 'production') => {
    onEnvironmentChange(environment);
    
    toast({
      title: `Switched to ${environment === 'sandbox' ? 'Sandbox' : 'Production'}`,
      description: `Now working in ${environment} environment`,
    });
  };

  const handlePolicyPromote = async (policyId: string) => {
    setIsPromoting(true);
    try {
      // Simulate policy promotion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onPolicyPromote?.(policyId, 'sandbox', 'production');
      
      toast({
        title: "Policy Promoted",
        description: `Policy has been successfully promoted to production`,
      });
    } catch (error) {
      toast({
        title: "Promotion Failed",
        description: "Failed to promote policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const getEnvironmentIcon = (env: string) => {
    return env === 'sandbox' ? Play : Shield;
  };

  const getEnvironmentColor = (env: string, status: string) => {
    if (env === currentEnvironment) {
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
    if (status === 'active') {
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    }
    return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Environment Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Environment Management</CardTitle>
          <CardDescription>
            Switch between Sandbox and Production environments. Work in Sandbox, then promote to Production.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {environments.map((env) => {
                const Icon = getEnvironmentIcon(env.name);
                const isActive = env.name === currentEnvironment;
                
                return (
                  <Card
                    key={env.name}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isActive ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleEnvironmentToggle(env.name as 'sandbox' | 'production')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getEnvironmentColor(env.name, env.status)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{env.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {env.version}
                            </Badge>
                            <span>{env.policyCount} policies</span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="ml-auto">
                            <Badge className="bg-blue-600">
                              Active
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {environments.map((env) => (
          <Card key={env.name}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className={`p-1 rounded-full ${getEnvironmentColor(env.name, env.status)}`}>
                  {env.name === 'sandbox' ? <Play className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </div>
                {env.name === 'sandbox' ? 'Sandbox' : 'Production'}
                {env.name === currentEnvironment && (
                  <Badge className="bg-blue-600">Current</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Policies:</span>
                  <p className="font-medium">{env.policyCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Active:</span>
                  <p className="font-medium">{env.activePolicies}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Version:</span>
                  <p className="font-medium">{env.version}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Sync:</span>
                  <p className="font-medium">{new Date(env.lastSync).toLocaleDateString()}</p>
                </div>
              </div>
              
              {env.name === 'sandbox' && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <GitBranch className="h-4 w-4" />
                    <span>Ready for Promotion</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handlePolicyPromote('policy-123')}
                    disabled={isPromoting}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {isPromoting ? 'Promoting...' : 'Promote to Production'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotion Queue */}
      {promotionQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Promotion Queue</CardTitle>
            <CardDescription>
              Policies waiting to be promoted to production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {promotionQueue.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.policyName}</p>
                    <p className="text-xs text-muted-foreground">Waiting for approval</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
