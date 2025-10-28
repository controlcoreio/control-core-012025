
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, ExternalLink, Bot, Shield, Zap, Key, Code, Database, Settings, Users, FileText, Brain, Lock, AlertTriangle, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export function KnowledgePage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Knowledge Center</h1>
        <p className="text-muted-foreground">
          Your complete guide to securing AI systems and resources with Policy-Based Access Control (PBAC)
        </p>
      </div>

      {/* Control Core for AI Security - Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border rounded-lg p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Control Core for AI Security & Access Controls</h2>
            <p className="text-lg text-muted-foreground">
              The first Policy-Based Access Control (PBAC) platform designed specifically for AI systems, 
              RAG tools, and any resource behind a URL.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/50 dark:bg-gray-800/50 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">AI Agent Security</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs">
              <p>Control access for AI agents, chatbots, and autonomous systems with context-aware policies.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 dark:bg-gray-800/50 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">RAG Tool Controls</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs">
              <p>Secure Retrieval-Augmented Generation systems and limit data source access dynamically.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 dark:bg-gray-800/50 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Token Cost Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs">
              <p>Prevent unauthorized AI calls and control token consumption with pre-processing policies.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 dark:bg-gray-800/50 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm">Compliance Ready</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs">
              <p>Built-in audit trails and policy governance for AI compliance requirements.</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            Why AI Systems Need PBAC
          </h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Dynamic Access Patterns:</strong> AI agents make unpredictable requests that traditional RBAC cannot handle</li>
            <li><strong>Context-Sensitive Decisions:</strong> Access should depend on AI model type, sentiment analysis, and request context</li>
            <li><strong>Cost Control:</strong> Prevent expensive AI calls through policy-based rate limiting and resource restrictions</li>
            <li><strong>Data Exposure Prevention:</strong> Limit AI access to sensitive data sources based on real-time risk assessment</li>
          </ul>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="user-guide" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user-guide">User Guide</TabsTrigger>
          <TabsTrigger value="admin-guide">Admin Guide</TabsTrigger>
          <TabsTrigger value="concepts">Core Concepts</TabsTrigger>
        </TabsList>
        
        {/* User Guide Tab */}
        <TabsContent value="user-guide" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Guide: Getting Started with Control Core
              </CardTitle>
              <CardDescription>
                Step-by-step tutorials for using Control Core's main features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="getting-started">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Start Here</Badge>
                      Getting Started Wizard
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Getting Started wizard helps you set up your first AI security policy in minutes.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Step 1: Choose Protection Type</h4>
                        <p className="text-sm mb-2">Select what you want to protect:</p>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li>AI Agent APIs (ChatGPT, Claude, etc.)</li>
                          <li>RAG Data Sources</li>
                          <li>Internal APIs and Databases</li>
                          <li>Web Applications</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Step 2: Define Access Rules</h4>
                        <p className="text-sm mb-2">Use the visual policy builder to:</p>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li>Set who can access your resources</li>
                          <li>Define time-based restrictions</li>
                          <li>Configure AI-specific controls</li>
                          <li>Test your policies</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-primary/5 p-3 rounded border">
                      <p className="text-sm">
                        <strong>Pro Tip:</strong> Start with a single AI agent or RAG tool to understand how policies work before expanding to your entire infrastructure.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="protected-resources">
                  <AccordionTrigger>Protected Resources Management</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Learn how to add, configure, and monitor your protected resources.
                    </p>
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-medium">Adding Resources</h4>
                        <p className="text-sm">Navigate to Settings → Protected Resources → Add Resource</p>
                        <ul className="text-xs list-disc pl-4 mt-1">
                          <li>Enter your resource URL or API endpoint</li>
                          <li>Choose protection method (Reverse Proxy, API Gateway)</li>
                          <li>Configure authentication settings</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium">Resource Types</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <strong>AI Services:</strong>
                            <ul className="list-disc pl-4">
                              <li>OpenAI API</li>
                              <li>Anthropic Claude</li>
                              <li>Custom AI models</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Data Sources:</strong>
                            <ul className="list-disc pl-4">
                              <li>Vector databases</li>
                              <li>Document repositories</li>
                              <li>REST APIs</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policy-creation">
                  <AccordionTrigger>Creating Policies with the Visual Builder</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Master the visual policy builder to create sophisticated AI access controls without code.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">1. Resource Selection</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>Choose which resources this policy protects</p>
                          <ul className="list-disc pl-4">
                            <li>Select from protected resources</li>
                            <li>Use wildcards for multiple endpoints</li>
                            <li>Group related resources</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">2. Subject Definition</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>Define who or what can access</p>
                          <ul className="list-disc pl-4">
                            <li>Users and roles</li>
                            <li>AI agents and models</li>
                            <li>Applications and services</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">3. Conditions & Rules</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>Add context-aware conditions</p>
                          <ul className="list-disc pl-4">
                            <li>Time-based access</li>
                            <li>Request sentiment analysis</li>
                            <li>Token usage limits</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-sources">
                  <AccordionTrigger>Configuring Data Sources (PIPs)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Policy Information Points (PIPs) provide real-time data to make access decisions.
                    </p>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border">
                        <h4 className="font-medium mb-2">Common PIP Types for AI Security</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <strong>User Context PIPs:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              <li>Active Directory / LDAP</li>
                              <li>OAuth/OIDC providers</li>
                              <li>Role management systems</li>
                            </ul>
                          </div>
                          <div>
                            <strong>AI Context PIPs:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              <li>AI model registries</li>
                              <li>Token usage tracking</li>
                              <li>Sentiment analysis APIs</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Setting Up Your First PIP</h4>
                        <ol className="list-decimal pl-5 text-sm space-y-1">
                          <li>Go to Settings → Data Sources</li>
                          <li>Click "Add Information Source"</li>
                          <li>Choose connection type (REST API, Database, etc.)</li>
                          <li>Configure authentication and test connection</li>
                          <li>Map data fields to policy attributes</li>
                        </ol>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="policy-templates">
                  <AccordionTrigger>Using Policy Templates</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Pre-built policy templates for common AI security scenarios.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">AI Agent Rate Limiting</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p className="mb-2">Prevents AI agents from overwhelming your APIs</p>
                          <ul className="list-disc pl-4">
                            <li>Configurable requests per minute</li>
                            <li>Token-based throttling</li>
                            <li>Burst protection</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">RAG Data Isolation</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p className="mb-2">Ensures AI can only access authorized data sources</p>
                          <ul className="list-disc pl-4">
                            <li>Department-based access</li>
                            <li>Sensitivity level controls</li>
                            <li>Time-bounded access</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Guide Tab */}
        <TabsContent value="admin-guide" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Administrator Guide: Platform Configuration
              </CardTitle>
              <CardDescription>
                Complete guide to configuring and managing your Control Core platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="initial-setup">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">Critical</Badge>
                      Initial Platform Setup
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
                      <h4 className="font-medium mb-2">Before You Begin</h4>
                      <p className="text-sm mb-2">Complete these essential configuration steps:</p>
                      <ol className="list-decimal pl-5 text-sm space-y-1">
                        <li>Configure your organization's domain and branding</li>
                        <li>Set up SSO integration with your identity provider</li>
                        <li>Define organizational units and scopes</li>
                        <li>Establish backup and recovery procedures</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="user-management">
                  <AccordionTrigger>User Management & Access Control</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User Roles & Permissions
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <strong>Super Admin:</strong>
                            <p className="text-xs text-muted-foreground">Complete platform control, billing, integrations</p>
                          </div>
                          <div>
                            <strong>Policy Admin:</strong>
                            <p className="text-xs text-muted-foreground">Create and manage policies, view audit logs</p>
                          </div>
                          <div>
                            <strong>Resource Manager:</strong>
                            <p className="text-xs text-muted-foreground">Configure protected resources and PIPs</p>
                          </div>
                          <div>
                            <strong>Viewer:</strong>
                            <p className="text-xs text-muted-foreground">Read-only access to dashboards and reports</p>
                          </div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">SSO Configuration</h4>
                        <p className="text-sm mb-2">Navigate to: <Link to="/settings/users" className="text-primary hover:underline">Settings → User Management</Link></p>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li>Configure SAML 2.0 or OAuth/OIDC</li>
                          <li>Map SSO groups to Control Core roles</li>
                          <li>Set up just-in-time user provisioning</li>
                          <li>Test SSO integration thoroughly</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="resource-protection">
                  <AccordionTrigger>Protected Resources Configuration</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Comprehensive guide to protecting your AI systems and APIs.
                    </p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Reverse Proxy Method</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2">
                            <p><strong>Best for:</strong> AI APIs, microservices</p>
                            <ul className="list-disc pl-4">
                              <li>Deploy PEP as reverse proxy</li>
                              <li>No application code changes</li>
                              <li>Full request/response inspection</li>
                            </ul>
                            <div className="bg-blue-100 dark:bg-blue-800/20 p-2 rounded text-xs">
                              Location: <Link to="/settings/resources" className="text-blue-700 hover:underline">Settings → Protected Resources</Link>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">API Gateway Integration</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2">
                            <p><strong>Best for:</strong> Existing gateway deployments</p>
                            <ul className="list-disc pl-4">
                              <li>Integrate with Kong, AWS API Gateway</li>
                              <li>Plugin-based deployment</li>
                              <li>Centralized policy enforcement</li>
                            </ul>
                            <div className="bg-green-100 dark:bg-green-800/20 p-2 rounded text-xs">
                              Guide: <Link to="/settings/integrations" className="text-green-700 hover:underline">Settings → Integrations</Link>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-sources-admin">
                  <AccordionTrigger>Data Sources & PIPs Administration</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border">
                      <h4 className="font-medium mb-2">Enterprise PIP Management</h4>
                      <p className="text-sm mb-3">
                        Access: <Link to="/settings/data-sources" className="text-primary hover:underline">Settings → Data Sources</Link>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Connection Management:</strong>
                          <ul className="list-disc pl-4 text-xs mt-1">
                            <li>Connection pooling configuration</li>
                            <li>Retry and timeout policies</li>
                            <li>Health check intervals</li>
                            <li>Failover mechanisms</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Security & Compliance:</strong>
                          <ul className="list-disc pl-4 text-xs mt-1">
                            <li>Credential rotation policies</li>
                            <li>Data encryption in transit</li>
                            <li>Audit logging for all queries</li>
                            <li>GDPR compliance settings</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="notifications-admin">
                  <AccordionTrigger>Alerts & Notifications Setup</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Critical Alert Configuration</h4>
                        <p className="text-sm mb-2">
                          Configure at: <Link to="/settings/notifications" className="text-primary hover:underline">Settings → Notifications</Link>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                            <strong className="text-sm text-red-800 dark:text-red-200">Security Alerts</strong>
                            <ul className="text-xs mt-1 list-disc pl-4">
                              <li>Policy violations</li>
                              <li>Failed authentication attempts</li>
                              <li>Unusual AI activity patterns</li>
                            </ul>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                            <strong className="text-sm text-yellow-800 dark:text-yellow-200">Operational Alerts</strong>
                            <ul className="text-xs mt-1 list-disc pl-4">
                              <li>PEP health status</li>
                              <li>PIP connection failures</li>
                              <li>Performance degradation</li>
                            </ul>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                            <strong className="text-sm text-blue-800 dark:text-blue-200">Business Alerts</strong>
                            <ul className="text-xs mt-1 list-disc pl-4">
                              <li>Token usage thresholds</li>
                              <li>License limit approaching</li>
                              <li>Compliance violations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="monitoring-admin">
                  <AccordionTrigger>System Monitoring & Performance</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Gauge className="h-4 w-4" />
                            Performance Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>Key metrics to monitor:</p>
                          <ul className="list-disc pl-4">
                            <li>Policy evaluation latency</li>
                            <li>PEP request throughput</li>
                            <li>PIP response times</li>
                            <li>Cache hit rates</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Health Checks
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>Automated monitoring:</p>
                          <ul className="list-disc pl-4">
                            <li>PEP availability checks</li>
                            <li>Policy compilation status</li>
                            <li>Database connectivity</li>
                            <li>External PIP health</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Core Concepts Tab */}
        <TabsContent value="concepts" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  Policy-Based Access Control (PBAC)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  PBAC evaluates access requests against dynamic policies that consider context, attributes, and real-time conditions.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <div>
                      <strong className="text-sm">Dynamic Decisions:</strong>
                      <p className="text-xs text-muted-foreground">Access granted or denied based on real-time evaluation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <div>
                      <strong className="text-sm">Context-Aware:</strong>
                      <p className="text-xs text-muted-foreground">Considers user, resource, environment, and request attributes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                    <div>
                      <strong className="text-sm">Centralized:</strong>
                      <p className="text-xs text-muted-foreground">Single point of policy management across all resources</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Zero-Trust for AI Systems
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Apply zero-trust principles to AI agents, models, and autonomous systems.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="bg-red-100 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <strong className="text-sm">Never Trust:</strong>
                      <p className="text-xs text-muted-foreground">No implicit trust for AI agents or models</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-yellow-100 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                    <div>
                      <strong className="text-sm">Always Verify:</strong>
                      <p className="text-xs text-muted-foreground">Continuous verification of AI requests and behavior</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="bg-green-100 rounded-full p-1 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <strong className="text-sm">Least Privilege:</strong>
                      <p className="text-xs text-muted-foreground">Minimal access rights for AI systems</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="h-5 w-5 text-primary" />
                  Policy Enforcement Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-3">
                    <strong className="text-sm">PEP (Policy Enforcement Point)</strong>
                    <p className="text-xs text-muted-foreground">Intercepts requests and enforces policy decisions</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3">
                    <strong className="text-sm">PDP (Policy Decision Point)</strong>
                    <p className="text-xs text-muted-foreground">Evaluates policies and makes access decisions</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <strong className="text-sm">PIP (Policy Information Point)</strong>
                    <p className="text-xs text-muted-foreground">Provides attributes and context for decisions</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <strong className="text-sm">PAP (Policy Administration Point)</strong>
                    <p className="text-xs text-muted-foreground">Manages policy creation and deployment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-primary" />
                  AI-Specific Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Why traditional access controls fail with AI systems.
                </p>
                <div className="space-y-2">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-500">
                    <strong className="text-sm text-red-800 dark:text-red-200">Unpredictable Patterns</strong>
                    <p className="text-xs">AI requests don't follow predictable user behavior patterns</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border-l-4 border-orange-500">
                    <strong className="text-sm text-orange-800 dark:text-orange-200">Context Sensitivity</strong>
                    <p className="text-xs">Access decisions need to consider AI model type, training data, and intended use</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-500">
                    <strong className="text-sm text-yellow-800 dark:text-yellow-200">Cost Implications</strong>
                    <p className="text-xs">Every AI request has token costs that must be controlled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/onboarding">
              <Button className="w-full justify-start" variant="outline">
                <Bot className="mr-2 h-4 w-4" />
                Start Getting Started Wizard
              </Button>
            </Link>
            <Link to="/settings/resources">
              <Button className="w-full justify-start" variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Add Protected Resource
              </Button>
            </Link>
            <Link to="/builder">
              <Button className="w-full justify-start" variant="outline">
                <Code className="mr-2 h-4 w-4" />
                Create AI Security Policy
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
