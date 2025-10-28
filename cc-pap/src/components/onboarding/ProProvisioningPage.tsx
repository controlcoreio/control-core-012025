import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Server,
  Shield,
  Zap,
  RefreshCw,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";

interface ProvisioningStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  estimated_time?: number;
  completed_at?: string;
  error_message?: string;
}

interface SignupResult {
  user_id: string;
  email: string;
  company_name: string;
  subscription_tier: string;
  billing_cycle: string;
  requires_payment: boolean;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  trial_end?: string;
  next_steps: string[];
}

export function ProProvisioningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [provisioningSteps, setProvisioningSteps] = useState<ProvisioningStep[]>([
    {
      id: 'namespace',
      name: 'Create Kubernetes Namespace',
      description: 'Setting up isolated environment for your tenant',
      status: 'pending',
      estimated_time: 30
    },
    {
      id: 'deployment',
      name: 'Deploy Control Plane',
      description: 'Installing Control Core Pro components',
      status: 'pending',
      estimated_time: 120
    },
    {
      id: 'dns',
      name: 'Configure DNS',
      description: 'Setting up your subdomain routing',
      status: 'pending',
      estimated_time: 60
    },
    {
      id: 'ssl',
      name: 'SSL Certificate',
      description: 'Securing your tenant with HTTPS',
      status: 'pending',
      estimated_time: 90
    },
    {
      id: 'database',
      name: 'Initialize Database',
      description: 'Setting up tenant database and schema',
      status: 'pending',
      estimated_time: 45
    },
    {
      id: 'auth',
      name: 'Configure Authentication',
      description: 'Setting up admin user and Auth0 integration',
      status: 'pending',
      estimated_time: 30
    }
  ]);
  
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  
  const signupResult = location.state?.signupResult as SignupResult;

  useEffect(() => {
    if (!signupResult) {
      navigate('/signup');
      return;
    }
    
    startProvisioning();
  }, [signupResult, navigate]);

  useEffect(() => {
    if (isPolling && !isComplete) {
      const interval = setInterval(() => {
        checkProvisioningStatus();
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPolling, isComplete]);

  const startProvisioning = async () => {
    try {
      // Start the provisioning process
      const response = await fetch('/api/provisioning/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: signupResult.user_id,
          company_name: signupResult.company_name,
          stripe_customer_id: signupResult.stripe_customer_id,
          stripe_subscription_id: signupResult.stripe_subscription_id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start provisioning');
      }

      const result = await response.json();
      setTenantInfo(result);
      
      // Start with first step
      setProvisioningSteps(prev => 
        prev.map(step => 
          step.id === 'namespace' 
            ? { ...step, status: 'in_progress' as const }
            : step
        )
      );
      setCurrentStep('namespace');
      
    } catch (error) {
      toast({
        title: "Provisioning failed to start",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const checkProvisioningStatus = async () => {
    try {
      const response = await fetch(`/api/provisioning/status/${signupResult.user_id}`);
      if (response.ok) {
        const status = await response.json();
        updateProvisioningStatus(status);
      }
    } catch (error) {
      console.error('Failed to check provisioning status:', error);
    }
  };

  const updateProvisioningStatus = (status: any) => {
    const { current_step, progress_percentage, steps, tenant_info, error_message } = status;
    
    setOverallProgress(progress_percentage);
    setCurrentStep(current_step);
    
    if (steps) {
      setProvisioningSteps(steps);
    }
    
    if (tenant_info) {
      setTenantInfo(tenant_info);
    }
    
    if (status.status === 'completed') {
      setIsComplete(true);
      setIsPolling(false);
      toast({
        title: "Provisioning Complete!",
        description: "Your Control Core Pro tenant is ready to use.",
      });
    } else if (status.status === 'failed') {
      setIsPolling(false);
      toast({
        title: "Provisioning Failed",
        description: error_message || "Please contact support for assistance.",
        variant: "destructive",
      });
    }
    
    // Calculate estimated time remaining
    const remainingSteps = provisioningSteps.filter(step => 
      step.status === 'pending' || step.status === 'in_progress'
    );
    const estimatedTime = remainingSteps.reduce((total, step) => 
      total + (step.estimated_time || 0), 0
    );
    setEstimatedTimeRemaining(estimatedTime);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Credentials copied successfully.",
    });
  };

  const getStatusIcon = (status: ProvisioningStep['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />;
      case 'in_progress':
        return <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ProvisioningStep['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!signupResult) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Setting Up Your Control Core Pro Tenant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            We're provisioning your hosted Control Plane for {signupResult.company_name}
          </p>
        </div>

        {/* Account Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Pro Plan Activated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{signupResult.company_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{signupResult.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <Badge variant="default" className="bg-green-600">
                  Pro
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Provisioning Progress</span>
              <span className="text-2xl font-bold text-green-600">{Math.round(overallProgress)}%</span>
            </CardTitle>
            <CardDescription>
              {isComplete 
                ? "Your tenant is ready!" 
                : `Estimated time remaining: ${Math.ceil(estimatedTimeRemaining / 60)} minutes`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="mb-4" />
            {currentStep && (
              <p className="text-sm text-muted-foreground">
                Current step: {provisioningSteps.find(s => s.id === currentStep)?.name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Provisioning Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Provisioning Steps</CardTitle>
            <CardDescription>
              We're setting up your dedicated Control Core Pro environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {provisioningSteps.map((step, index) => (
              <div key={step.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(step.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">{step.name}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.estimated_time && step.status !== 'completed' && (
                      <p className="text-xs text-muted-foreground">
                        Estimated: {step.estimated_time} seconds
                      </p>
                    )}
                    {step.completed_at && (
                      <p className="text-xs text-green-600">
                        Completed: {new Date(step.completed_at).toLocaleTimeString()}
                      </p>
                    )}
                    {step.error_message && (
                      <p className="text-xs text-red-600">{step.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(step.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Completion State */}
        {isComplete && tenantInfo && (
          <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="h-5 w-5" />
                Your Control Core Pro Tenant is Ready!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">Access Your Control Plane</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                        {tenantInfo.access_url}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(tenantInfo.access_url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Email</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                        {tenantInfo.admin_credentials?.email}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(tenantInfo.admin_credentials?.email)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Password</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm">
                        {showCredentials ? tenantInfo.admin_credentials?.password : '••••••••••••'}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCredentials(!showCredentials)}
                      >
                        {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(tenantInfo.admin_credentials?.password)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Please change your password after your first login for security.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => window.open(tenantInfo.access_url, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Launch Control Plane
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`${tenantInfo.access_url}/getting-started`, '_blank')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Start Getting Started Wizard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Support Information */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline"
                onClick={() => window.open('https://docs.controlcore.io/pro-tier', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Pro Tier Guide
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('https://docs.controlcore.io/getting-started', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Getting Started
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open('mailto:support@controlcore.io', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
