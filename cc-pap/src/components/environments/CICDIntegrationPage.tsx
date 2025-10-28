
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ChevronLeft, Settings, Copy, Download, GitBranch, Webhook, Key, FileCode, Zap } from "lucide-react";

export function CICDIntegrationPage() {
  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        <Link to="/environments">
          <Button variant="ghost" size="icon" className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">CI/CD & Infrastructure Integration</h1>
          <p className="text-muted-foreground">Configure automation and infrastructure as code</p>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-3 mb-4">
          <TabsTrigger value="pipeline">Pipeline Integration</TabsTrigger>
          <TabsTrigger value="iac">Infrastructure as Code</TabsTrigger>
          <TabsTrigger value="config">Configuration as Code</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-blue-600" />
                  Webhook Endpoints
                </CardTitle>
                <CardDescription>Configure webhooks for CI/CD pipeline triggers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Deployment Webhook</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        https://api.platform.com/webhooks/deploy
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Configuration Update</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        https://api.platform.com/webhooks/config
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Health Check</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        https://api.platform.com/webhooks/health
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Webhook className="h-4 w-4 mr-2" />
                  Create New Webhook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-600" />
                  API Tokens & Service Accounts
                </CardTitle>
                <CardDescription>Manage authentication for CI/CD systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">GitHub Actions</div>
                      <div className="text-xs text-muted-foreground">
                        Token created: 2024-05-15 | Expires: 2025-05-15
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      <Button variant="ghost" size="sm">Rotate</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Jenkins Pipeline</div>
                      <div className="text-xs text-muted-foreground">
                        Token created: 2024-04-20 | Expires: 2025-04-20
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                      <Button variant="ghost" size="sm">Rotate</Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium text-sm text-gray-600">Azure DevOps</div>
                      <div className="text-xs text-muted-foreground">
                        No token configured
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>

                <Button className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Generate New Token
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline Integration Examples</CardTitle>
              <CardDescription>Copy-paste snippets for popular CI/CD platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="github" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="github">GitHub Actions</TabsTrigger>
                  <TabsTrigger value="gitlab">GitLab CI</TabsTrigger>
                  <TabsTrigger value="azure">Azure DevOps</TabsTrigger>
                  <TabsTrigger value="jenkins">Jenkins</TabsTrigger>
                </TabsList>
                
                <TabsContent value="github" className="mt-4">
                  <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg">
                    <pre>{`name: Deploy Platform
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Platform
        run: |
          curl -X POST \\
            -H "Authorization: Bearer \${{ secrets.PLATFORM_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            -d '{"environment": "staging", "version": "\${{ github.sha }}"}' \\
            https://api.platform.com/webhooks/deploy`}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="gitlab" className="mt-4">
                  <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg">
                    <pre>{`deploy_platform:
  stage: deploy
  script:
    - curl -X POST
        -H "Authorization: Bearer $PLATFORM_TOKEN"
        -H "Content-Type: application/json"
        -d '{"environment": "production", "version": "'$CI_COMMIT_SHA'"}'
        https://api.platform.com/webhooks/deploy
  only:
    - main`}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="azure" className="mt-4">
                  <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg">
                    <pre>{`trigger:
- main

pool:
  vmImage: ubuntu-latest

steps:
- task: Bash@3
  inputs:
    targetType: 'inline'
    script: |
      curl -X POST \\
        -H "Authorization: Bearer $(PLATFORM_TOKEN)" \\
        -H "Content-Type: application/json" \\
        -d '{"environment": "production", "version": "$(Build.SourceVersion)"}' \\
        https://api.platform.com/webhooks/deploy`}</pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="jenkins" className="mt-4">
                  <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg">
                    <pre>{`pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                script {
                    sh '''
                        curl -X POST \\
                          -H "Authorization: Bearer \${PLATFORM_TOKEN}" \\
                          -H "Content-Type: application/json" \\
                          -d '{"environment": "production", "version": "'\${GIT_COMMIT}'"}' \\
                          https://api.platform.com/webhooks/deploy
                    '''
                }
            }
        }
    }
}`}</pre>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Snippet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iac" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-orange-600" />
                  Infrastructure Templates
                </CardTitle>
                <CardDescription>Pre-built IaC templates for common cloud platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { name: "AWS - Terraform", type: "terraform", cloud: "aws", size: "25 KB" },
                    { name: "Azure - ARM Templates", type: "arm", cloud: "azure", size: "18 KB" },
                    { name: "GCP - Deployment Manager", type: "dm", cloud: "gcp", size: "22 KB" },
                    { name: "Kubernetes - Helm Chart", type: "helm", cloud: "k8s", size: "15 KB" }
                  ].map((template) => (
                    <div key={template.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">Size: {template.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Configuration</CardTitle>
                <CardDescription>Customize templates with your environment parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cluster-name">Cluster Name</Label>
                    <Input id="cluster-name" placeholder="authorization-platform" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Primary Region</Label>
                    <Input id="region" placeholder="us-east-1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instance-type">Instance Type</Label>
                    <Input id="instance-type" placeholder="m5.large" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ha-enabled">High Availability</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Enabled (Multi-AZ)</option>
                      <option>Disabled (Single-AZ)</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Custom Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-green-600" />
                  Git Repository Sync
                </CardTitle>
                <CardDescription>Manage platform configurations as code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input id="repo-url" placeholder="https://github.com/company/platform-config.git" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input id="branch" placeholder="main" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="config-path">Configuration Path</Label>
                    <Input id="config-path" placeholder="/environments/" />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Sync Status</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span>2024-06-02 10:30</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">In Sync</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Changes:</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm">Configure Webhook</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration History</CardTitle>
                <CardDescription>Track changes to platform configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { commit: "a1b2c3d", message: "Update HA configuration for production", author: "ops.team", time: "2 hours ago" },
                    { commit: "e4f5g6h", message: "Enable debug logging for staging", author: "dev.team", time: "1 day ago" },
                    { commit: "i7j8k9l", message: "Add new PIP configuration", author: "platform.admin", time: "3 days ago" }
                  ].map((change) => (
                    <div key={change.commit} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{change.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {change.commit} by {change.author} • {change.time}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
