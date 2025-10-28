import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PEPDeploymentInstructionsStepProps {
  onComplete: () => void;
  onNext: () => void;
}

export function PEPDeploymentInstructionsStep({ onComplete, onNext }: PEPDeploymentInstructionsStepProps) {
  const [githubRepo, setGithubRepo] = useState("");
  const [isRepoConfigured, setIsRepoConfigured] = useState(false);
  const [selectedCloudProvider, setSelectedCloudProvider] = useState("aws");
  const { updateUser, user } = useAuth();
  const { toast } = useToast();

  const handleGitHubRepoSetup = () => {
    if (!githubRepo.trim()) {
      toast({
        title: "Repository Required",
        description: "Please enter your GitHub repository URL or create a new one.",
        variant: "destructive",
      });
      return;
    }

    updateUser({ githubRepo: githubRepo.trim() });
    setIsRepoConfigured(true);
    
    toast({
      title: "GitHub Repository Configured",
      description: "Your policies will be synchronized to this repository.",
    });
  };

  const dockerCommands = {
    aws: `# 1. Pull the Control Core PEP container
docker pull controlcore/pep:latest

# 2. Create environment configuration
cat > .env <<EOF
CONTROLCORE_API_KEY=your-api-key-here
CONTROLCORE_TENANT_ID=${user?.id || 'your-tenant-id'}
CONTROLCORE_CONTROL_PLANE_URL=https://api.controlcore.io
GITHUB_REPO=${githubRepo || 'your-github-repo'}
GITHUB_TOKEN=your-github-token
AWS_REGION=us-east-1
EOF

# 3. Deploy to AWS ECS/EKS or EC2
docker run -d \\
  --name controlcore-pep \\
  --env-file .env \\
  -p 8080:8080 \\
  controlcore/pep:latest`,
    
    azure: `# 1. Pull the Control Core PEP container
docker pull controlcore/pep:latest

# 2. Create environment configuration for Azure
cat > .env <<EOF
CONTROLCORE_API_KEY=your-api-key-here
CONTROLCORE_TENANT_ID=${user?.id || 'your-tenant-id'}
CONTROLCORE_CONTROL_PLANE_URL=https://api.controlcore.io
GITHUB_REPO=${githubRepo || 'your-github-repo'}
GITHUB_TOKEN=your-github-token
AZURE_SUBSCRIPTION_ID=your-subscription-id
EOF

# 3. Deploy to Azure Container Instances or AKS
az container create \\
  --name controlcore-pep \\
  --resource-group your-rg \\
  --image controlcore/pep:latest \\
  --environment-variables \\
    CONTROLCORE_API_KEY=your-api-key \\
    CONTROLCORE_TENANT_ID=${user?.id || 'your-tenant-id'}`,
    
    gcp: `# 1. Pull the Control Core PEP container
docker pull controlcore/pep:latest

# 2. Create environment configuration for GCP
cat > .env <<EOF
CONTROLCORE_API_KEY=your-api-key-here
CONTROLCORE_TENANT_ID=${user?.id || 'your-tenant-id'}
CONTROLCORE_CONTROL_PLANE_URL=https://api.controlcore.io
GITHUB_REPO=${githubRepo || 'your-github-repo'}
GITHUB_TOKEN=your-github-token
GCP_PROJECT_ID=your-project-id
EOF

# 3. Deploy to Google Cloud Run or GKE
gcloud run deploy controlcore-pep \\
  --image controlcore/pep:latest \\
  --platform managed \\
  --region us-central1 \\
  --set-env-vars CONTROLCORE_API_KEY=your-api-key,CONTROLCORE_TENANT_ID=${user?.id || 'your-tenant-id'}`
  };

  const handleContinue = () => {
    if (!isRepoConfigured) {
      toast({
        title: "GitHub Setup Required",
        description: "Please configure your GitHub repository before continuing.",
        variant: "destructive",
      });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Deploy Your PEP Container</h2>
        <p className="text-muted-foreground">
          Follow these steps to deploy the Control Core PEP in your cloud infrastructure
        </p>
      </div>

      {/* Step 1: GitHub Repository Setup */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Badge className="bg-primary text-primary-foreground">Step 1</Badge>
            <CardTitle className="text-lg">Configure GitHub Repository</CardTitle>
          </div>
          <CardDescription>
            Your policies will be automatically synchronized to your GitHub repository
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-repo">GitHub Repository URL</Label>
            <div className="flex space-x-2">
              <Input
                id="github-repo"
                placeholder="https://github.com/yourorg/controlcore-policies"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleGitHubRepoSetup}
                variant={isRepoConfigured ? "secondary" : "default"}
                disabled={isRepoConfigured}
              >
                {isRepoConfigured ? (
                  <>
                    <EnterpriseIcon name="check" size={16} className="mr-2" />
                    Configured
                  </>
                ) : (
                  "Configure"
                )}
              </Button>
            </div>
          </div>
          
          {!githubRepo && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <EnterpriseIcon name="exclamation-triangle" size={16} />
              <AlertDescription>
                <strong>New to GitHub?</strong> 
                <Button variant="link" className="p-0 h-auto text-primary ml-1" asChild>
                  <a href="https://github.com/new" target="_blank" rel="noopener noreferrer">
                    Create a new repository here
                  </a>
                </Button>
                , then paste the URL above.
              </AlertDescription>
            </Alert>
          )}
          
          {isRepoConfigured && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <EnterpriseIcon name="check" size={16} />
              <AlertDescription>
                <strong>Repository configured!</strong> Your policies will be synchronized to {githubRepo}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Cloud Provider Deployment */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Badge className="bg-primary text-primary-foreground">Step 2</Badge>
            <CardTitle className="text-lg">Deploy PEP Container</CardTitle>
          </div>
          <CardDescription>
            Choose your cloud provider and follow the deployment instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCloudProvider} onValueChange={setSelectedCloudProvider}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="aws" className="flex items-center space-x-2">
                <EnterpriseIcon name="cloud" size={16} />
                <span>AWS</span>
              </TabsTrigger>
              <TabsTrigger value="azure" className="flex items-center space-x-2">
                <EnterpriseIcon name="cloud" size={16} />
                <span>Azure</span>
              </TabsTrigger>
              <TabsTrigger value="gcp" className="flex items-center space-x-2">
                <EnterpriseIcon name="cloud" size={16} />
                <span>Google Cloud</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="aws" className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  <code>{dockerCommands.aws}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="azure" className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  <code>{dockerCommands.azure}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="gcp" className="space-y-4">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                <pre className="text-sm">
                  <code>{dockerCommands.gcp}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
          
          <Alert className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <EnterpriseIcon name="key" size={16} />
            <AlertDescription>
              <strong>API Keys Required:</strong> You'll receive your Control Core API keys via email after completing setup. 
              For immediate access, contact support@controlcore.io.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Next Step Button */}
      <div className="text-center">
        <Button onClick={handleContinue} disabled={!isRepoConfigured}>
          PEP Deployed - Continue Setup
          <EnterpriseIcon name="arrow-right" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}