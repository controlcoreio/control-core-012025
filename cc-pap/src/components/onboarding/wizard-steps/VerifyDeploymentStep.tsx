import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Server,
  Database,
  Shield,
  Activity
} from "lucide-react";

interface VerifyDeploymentStepProps {
  onComplete: () => void;
  onNext: () => void;
}

interface HealthCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'checking' | 'success' | 'error';
  message?: string;
  icon: React.ReactNode;
}

export function VerifyDeploymentStep({ onComplete, onNext }: VerifyDeploymentStepProps) {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      id: 'api',
      name: 'Control Plane API',
      description: 'Verify the Control Plane API is responding',
      status: 'pending',
      icon: <Server className="h-5 w-5" />
    },
    {
      id: 'database',
      name: 'Database Connection',
      description: 'Check database connectivity and schema',
      status: 'pending',
      icon: <Database className="h-5 w-5" />
    },
    {
      id: 'opal',
      name: 'OPAL Connection',
      description: 'Verify OPAL policy synchronization',
      status: 'pending',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'bouncers',
      name: 'Bouncer Connections',
      description: 'Check connected Policy Enforcement Points',
      status: 'pending',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'redis',
      name: 'Redis Cache',
      description: 'Verify Redis connectivity and performance',
      status: 'pending',
      icon: <Database className="h-5 w-5" />
    },
    {
      id: 'system',
      name: 'System Status',
      description: 'Check overall system health and version',
      status: 'pending',
      icon: <Activity className="h-5 w-5" />
    }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const { toast } = useToast();

  const runHealthChecks = async () => {
    setIsChecking(true);
    
    // Reset all checks to pending
    setHealthChecks(prev => prev.map(check => ({ ...check, status: 'pending' as const })));
    
    for (const check of healthChecks) {
      // Update status to checking
      setHealthChecks(prev => 
        prev.map(c => c.id === check.id ? { ...c, status: 'checking' as const } : c)
      );
      
      try {
        const result = await performHealthCheck(check.id);
        
        // Update status based on result
        setHealthChecks(prev => 
          prev.map(c => 
            c.id === check.id 
              ? { 
                  ...c, 
                  status: result.success ? 'success' as const : 'error' as const,
                  message: result.message 
                } 
              : c
          )
        );
        
        // Add delay between checks for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        setHealthChecks(prev => 
          prev.map(c => 
            c.id === check.id 
              ? { 
                  ...c, 
                  status: 'error' as const,
                  message: 'Health check failed' 
                } 
              : c
          )
        );
      }
    }
    
    setIsChecking(false);
    
    // Check if all checks passed
    const allPassed = healthChecks.every(check => check.status === 'success');
    setAllChecksPassed(allPassed);
    
    if (allPassed) {
      toast({
        title: "All Components Verified!",
        description: "All health checks passed. Your Control Plane, Bouncers, and supporting services are ready to use.",
      });
    } else {
      toast({
        title: "Some Issues Found",
        description: "Please review the failed checks and try again. Check the troubleshooting guide for help.",
        variant: "destructive",
      });
    }
  };

  const performHealthCheck = async (checkId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      switch (checkId) {
        case 'api':
          return await checkApiHealth();
        case 'database':
          return await checkDatabaseHealth();
        case 'opal':
          return await checkOpalHealth();
        case 'bouncers':
          return await checkBouncersHealth();
        case 'redis':
          return await checkRedisHealth();
        case 'system':
          return await checkSystemHealth();
        default:
          return { success: false, message: 'Unknown health check' };
      }
    } catch (error) {
      return { success: false, message: `Health check failed: ${error}` };
    }
  };

  const checkApiHealth = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `API responding (${data.version || 'unknown version'})` 
        };
      } else {
        return { 
          success: false, 
          message: `API returned ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Cannot connect to API endpoint' 
      };
    }
  };

  const checkDatabaseHealth = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/health/database', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Database connected (${data.connection_count || 0} connections)` 
        };
      } else {
        return { 
          success: false, 
          message: `Database check failed: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Cannot connect to database' 
      };
    }
  };

  const checkOpalHealth = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/health/opal', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `OPAL connected (${data.policy_count || 0} policies)` 
        };
      } else {
        return { 
          success: false, 
          message: `OPAL check failed: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Cannot connect to OPAL server' 
      };
    }
  };

  const checkBouncersHealth = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/health/bouncers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const bouncerCount = data.connected_bouncers || 0;
        const activeBouncers = data.active_bouncers || 0;
        return { 
          success: true, 
          message: `${bouncerCount} bouncers connected, ${activeBouncers} active` 
        };
      } else {
        return { 
          success: false, 
          message: `Bouncer check failed: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Cannot connect to bouncer monitoring' 
      };
    }
  };

  const checkRedisHealth = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/health/redis', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Redis connected (${data.memory_usage || 'unknown memory usage'})` 
        };
      } else {
        return { 
          success: false, 
          message: `Redis check failed: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Cannot connect to Redis' 
      };
    }
  };

  const checkSystemHealth = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/health/system', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `System healthy (v${data.version}, ${data.uptime || 'unknown uptime'})` 
        };
      } else {
        return { 
          success: false, 
          message: `System check failed: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Cannot retrieve system information' 
      };
    }
  };

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: HealthCheck['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'checking':
        return <Badge variant="default">Checking...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Auto-run health checks on component mount
  useEffect(() => {
    runHealthChecks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-muted-foreground">
          Let's make sure your Control Plane, Bouncers, and all supporting services are properly deployed and running correctly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnterpriseIcon name="check-circle" size={20} />
            Health Checks
          </CardTitle>
          <CardDescription>
            Running comprehensive health checks on your Control Plane deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthChecks.map((check) => (
            <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {check.icon}
                <div>
                  <h3 className="font-medium">{check.name}</h3>
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                  {check.message && (
                    <p className="text-xs text-muted-foreground mt-1">{check.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                {getStatusBadge(check.status)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {allChecksPassed && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Excellent!</strong> All health checks passed. Your Control Plane is ready to use.
            You can now proceed to download and configure your Policy Enforcement Points (PEPs).
          </AlertDescription>
        </Alert>
      )}

      {!allChecksPassed && !isChecking && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Some issues found.</strong> Please review the failed checks above. 
            You may need to restart services or check your deployment configuration.
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runHealthChecks}
                className="mr-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry Checks
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://docs.controlcore.io/troubleshooting', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Troubleshooting Guide
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center pt-6">
        <Button 
          onClick={onNext} 
          size="lg"
          disabled={!allChecksPassed}
        >
          {allChecksPassed ? (
            <>
              Continue to PEP Download
              <EnterpriseIcon name="arrow-right" size={16} className="ml-2" />
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Health Checks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
