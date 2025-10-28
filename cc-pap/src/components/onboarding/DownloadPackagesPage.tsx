import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Server, 
  Package, 
  CheckCircle, 
  ExternalLink,
  Clock,
  Shield,
  Zap
} from "lucide-react";

interface PackageInfo {
  package_id: string;
  package_type: string;
  package_format: string;
  download_url: string;
  file_size: number;
  expires_at: string;
  components: string[];
  requirements: Record<string, any>;
}

interface SignupResult {
  user_id: string;
  email: string;
  company_name: string;
  subscription_tier: string;
  billing_cycle: string;
  requires_payment: boolean;
  trial_end?: string;
  next_steps: string[];
}

export function DownloadPackagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const signupResult = location.state?.signupResult as SignupResult;

  useEffect(() => {
    if (!signupResult) {
      navigate('/signup');
      return;
    }
    
    fetchPackages();
  }, [signupResult, navigate]);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`/api/downloads/${signupResult.user_id}`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      } else {
        throw new Error('Failed to fetch packages');
      }
    } catch (error) {
      toast({
        title: "Error loading packages",
        description: "Failed to load download packages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (packageInfo: PackageInfo) => {
    setDownloading(packageInfo.package_id);
    try {
      const response = await fetch(`/api/downloads/${signupResult.user_id}/${packageInfo.package_id}`);
      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `controlcore-${packageInfo.package_type}-${packageInfo.package_format}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download started",
          description: `${packageInfo.package_type} package is downloading.`,
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPackageIcon = (packageType: string) => {
    switch (packageType) {
      case 'helm':
        return <Server className="h-5 w-5" />;
      case 'docker-compose':
        return <Package className="h-5 w-5" />;
      case 'binary':
        return <Zap className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getPackageDescription = (packageType: string, packageFormat: string) => {
    if (packageType === 'helm') {
      return "Deploy using Helm charts for production-ready Kubernetes clusters";
    } else if (packageType === 'docker-compose') {
      return "Simple deployment using Docker Compose for development and testing";
    } else if (packageType === 'binary') {
      return `Standalone executable for ${packageFormat.replace('-', ' ')} systems`;
    }
    return "Deployment package for Control Core";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Preparing your download packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Control Core {signupResult.subscription_tier.charAt(0).toUpperCase() + signupResult.subscription_tier.slice(1)}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Download your Control Plane and start securing your APIs
          </p>
        </div>

        {/* Account Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Account Created Successfully
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
                <Badge variant="default" className="capitalize">
                  {signupResult.subscription_tier}
                </Badge>
              </div>
            </div>
            {signupResult.trial_end && (
              <Alert className="mt-4 border-green-200 bg-green-50 dark:bg-green-900/20">
                <Clock className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  <strong>Free Trial Active!</strong> Your trial expires on {new Date(signupResult.trial_end).toLocaleDateString()}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Download Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Control Plane
            </CardTitle>
            <CardDescription>
              Choose your preferred deployment method. All packages include the complete Control Plane with dependencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="helm" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="helm">Kubernetes (Helm)</TabsTrigger>
                <TabsTrigger value="docker">Docker Compose</TabsTrigger>
                <TabsTrigger value="binary">Binary</TabsTrigger>
              </TabsList>

              <TabsContent value="helm" className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommended for Production</h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Helm charts provide the most robust deployment option with automatic scaling, 
                    health checks, and production-ready configurations.
                  </p>
                </div>
                {packages.filter(pkg => pkg.package_type === 'helm').map((pkg) => (
                  <Card key={pkg.package_id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPackageIcon(pkg.package_type)}
                          <div>
                            <h3 className="font-semibold">Kubernetes (Helm Chart)</h3>
                            <p className="text-sm text-muted-foreground">
                              {getPackageDescription(pkg.package_type, pkg.package_format)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{formatFileSize(pkg.file_size)}</Badge>
                              <Badge variant="outline">{pkg.components.length} components</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleDownload(pkg)}
                          disabled={downloading === pkg.package_id}
                          className="min-w-[120px]"
                        >
                          {downloading === pkg.package_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="docker" className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Great for Development</h3>
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    Docker Compose is perfect for development, testing, and small-scale deployments 
                    with minimal infrastructure requirements.
                  </p>
                </div>
                {packages.filter(pkg => pkg.package_type === 'docker-compose').map((pkg) => (
                  <Card key={pkg.package_id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPackageIcon(pkg.package_type)}
                          <div>
                            <h3 className="font-semibold">Docker Compose</h3>
                            <p className="text-sm text-muted-foreground">
                              {getPackageDescription(pkg.package_type, pkg.package_format)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{formatFileSize(pkg.file_size)}</Badge>
                              <Badge variant="outline">{pkg.components.length} components</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleDownload(pkg)}
                          disabled={downloading === pkg.package_id}
                          className="min-w-[120px]"
                        >
                          {downloading === pkg.package_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="binary" className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Simple & Portable</h3>
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    Binary executables are perfect for quick testing, edge deployments, 
                    or when you need maximum portability.
                  </p>
                </div>
                {packages.filter(pkg => pkg.package_type === 'binary').map((pkg) => (
                  <Card key={pkg.package_id} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getPackageIcon(pkg.package_type)}
                          <div>
                            <h3 className="font-semibold">Binary ({pkg.package_format.replace('-', ' ')})</h3>
                            <p className="text-sm text-muted-foreground">
                              {getPackageDescription(pkg.package_type, pkg.package_format)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{formatFileSize(pkg.file_size)}</Badge>
                              <Badge variant="outline">{pkg.components.length} components</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleDownload(pkg)}
                          disabled={downloading === pkg.package_id}
                          className="min-w-[120px]"
                        >
                          {downloading === pkg.package_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Follow these steps to get your Control Core instance up and running
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signupResult.next_steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm">{step}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex gap-4">
              <Button 
                onClick={() => window.open('https://docs.controlcore.io/deployment', '_blank')}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Deployment Guide
              </Button>
              <Button 
                onClick={() => window.open('https://docs.controlcore.io/getting-started', '_blank')}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Getting Started Guide
              </Button>
              <Button 
                onClick={() => window.open('mailto:support@controlcore.io', '_blank')}
                variant="outline"
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
