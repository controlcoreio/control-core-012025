
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, ExternalLink, Bot, Shield, Zap, Key, Code, Database, Settings, Users, FileText, Brain, Lock, AlertTriangle, Gauge, CheckCircle, AlertCircle, Info, Lightbulb, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export function KnowledgePage() {
  const [expandedValueProp, setExpandedValueProp] = useState<string | null>(null);

  const toggleValueProp = (id: string) => {
    setExpandedValueProp(expandedValueProp === id ? null : id);
  };

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
            <h2 className="text-2xl font-bold mb-2">Control Core - Centralized Authorization & Compliance</h2>
            <p className="text-lg text-muted-foreground">
              The platform designed for organizations navigating AI adoption, regulatory compliance, 
              and modern security challenges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card 
            className={cn(
              "bg-white/50 dark:bg-gray-800/50 border-blue-200 dark:border-blue-800 cursor-pointer transition-all hover:shadow-md",
              expandedValueProp === 'compliance' && "ring-2 ring-blue-500 shadow-lg"
            )}
            onClick={() => toggleValueProp('compliance')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-sm">Regulatory Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>Automatically enforce GDPR, HIPAA, SOC2, PCI-DSS, FINTRAC, and OSFI requirements.</p>
              <p className="text-xs text-muted-foreground italic">Example: Enforce data residency rules for GDPR with automatic audit trails.</p>
              <p className="text-xs text-blue-600 font-medium mt-2">Click to learn more →</p>
            </CardContent>
          </Card>
          
          <Card 
            className={cn(
              "bg-white/50 dark:bg-gray-800/50 border-red-200 dark:border-red-800 cursor-pointer transition-all hover:shadow-md",
              expandedValueProp === 'ai-leakage' && "ring-2 ring-red-500 shadow-lg"
            )}
            onClick={() => toggleValueProp('ai-leakage')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                <CardTitle className="text-sm">Prevent AI Data Leakage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>Control what data AI agents, LLMs, and RAG systems can access with dynamic filtering.</p>
              <p className="text-xs text-muted-foreground italic">Example: Block PII from external LLMs while allowing non-sensitive queries.</p>
              <p className="text-xs text-red-600 font-medium mt-2">Click to learn more →</p>
            </CardContent>
          </Card>
          
          <Card 
            className={cn(
              "bg-white/50 dark:bg-gray-800/50 border-green-200 dark:border-green-800 cursor-pointer transition-all hover:shadow-md",
              expandedValueProp === 'business-context' && "ring-2 ring-green-500 shadow-lg"
            )}
            onClick={() => toggleValueProp('business-context')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-green-600" />
                <CardTitle className="text-sm">Business Context</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>Policies adapt to user role, location, time, and business state in real-time.</p>
              <p className="text-xs text-muted-foreground italic">Example: Allow transactions only during business hours from approved locations.</p>
              <p className="text-xs text-green-600 font-medium mt-2">Click to learn more →</p>
            </CardContent>
          </Card>
          
          <Card 
            className={cn(
              "bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-800 cursor-pointer transition-all hover:shadow-md",
              expandedValueProp === 'centralized' && "ring-2 ring-purple-500 shadow-lg"
            )}
            onClick={() => toggleValueProp('centralized')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-sm">Centralized Permissions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>Single source of truth for authorization across all systems with GitOps workflow.</p>
              <p className="text-xs text-muted-foreground italic">Example: Update access rules once, enforce everywhere automatically.</p>
              <p className="text-xs text-purple-600 font-medium mt-2">Click to learn more →</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Expandable detailed content */}
        {expandedValueProp === 'compliance' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 animate-in slide-in-from-top">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Regulatory Compliance Made Simple
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setExpandedValueProp(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm">
                Control Core automates compliance with major regulatory frameworks through policy-as-code, ensuring consistent enforcement and comprehensive audit trails.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <strong className="text-sm">GDPR Compliance</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li><strong>Data Residency:</strong> Automatically enforce geographic restrictions on data storage and processing</li>
                    <li><strong>Right to Access:</strong> Audit logs track all data access for subject access requests</li>
                    <li><strong>Right to Erasure:</strong> Policy-based data deletion across all systems</li>
                    <li><strong>Consent Management:</strong> Enforce consent-based access to personal data</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <strong className="text-sm">HIPAA Compliance</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li><strong>Minimum Necessary:</strong> Limit data access to only what's needed for specific roles</li>
                    <li><strong>Break-the-Glass:</strong> Emergency access with automatic audit trail</li>
                    <li><strong>PHI Protection:</strong> Dynamic masking of Protected Health Information</li>
                    <li><strong>Audit Requirements:</strong> Complete access logs for HIPAA audits</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <strong className="text-sm">Financial Regulations (FINTRAC, OSFI)</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li><strong>Transaction Monitoring:</strong> Detect suspicious patterns in real-time</li>
                    <li><strong>KYC Enforcement:</strong> Validate customer verification before high-risk operations</li>
                    <li><strong>Segregation of Duties:</strong> Enforce approval workflows for transactions</li>
                    <li><strong>Audit Trails:</strong> Comprehensive logging for regulatory reporting</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-600 pl-4">
                  <strong className="text-sm">SOC2 & PCI-DSS</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li><strong>Access Controls:</strong> Principle of least privilege enforcement</li>
                    <li><strong>Change Management:</strong> All policy changes version controlled</li>
                    <li><strong>Monitoring:</strong> Real-time alerts for security violations</li>
                    <li><strong>Encryption:</strong> Policy-based data encryption requirements</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="text-xs font-medium mb-2">Real-World Example: GDPR Data Residency</p>
                <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                  <div className="text-green-600"># Enforce EU data residency for EU citizens</div>
                  <div>allow if {"{"}</div>
                  <div className="pl-4">input.user.country in data.eu_countries</div>
                  <div className="pl-4">input.resource.location == "EU"</div>
                  <div className="pl-4">input.action in ["read", "write"]</div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {expandedValueProp === 'ai-leakage' && (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800 animate-in slide-in-from-top">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                Why AI Systems Need Special Protection
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setExpandedValueProp(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm">
                AI agents make unpredictable requests that traditional access controls cannot handle. Control Core prevents data leakage through dynamic, context-aware policies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-red-600 pl-4">
                  <strong className="text-sm">Dynamic Access Patterns</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>AI agents make unpredictable requests that traditional RBAC cannot handle</li>
                    <li>Requests vary based on training data, model version, and user prompts</li>
                    <li>Need context-aware policies that adapt to request content</li>
                    <li>Control Core analyzes each request in real-time</li>
                  </ul>
                </div>
                <div className="border-l-4 border-red-600 pl-4">
                  <strong className="text-sm">Context-Sensitive Decisions</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Access should depend on AI model type and capabilities</li>
                    <li>Sentiment analysis of prompts for risk assessment</li>
                    <li>Request context (who, what, why, when) matters</li>
                    <li>Dynamic filtering based on data sensitivity</li>
                  </ul>
                </div>
                <div className="border-l-4 border-red-600 pl-4">
                  <strong className="text-sm">Cost Control</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Prevent expensive AI calls through policy-based rate limiting</li>
                    <li>Token usage tracking and budgets</li>
                    <li>Resource restrictions by user/department</li>
                    <li>Burst protection for AI endpoints</li>
                  </ul>
                </div>
                <div className="border-l-4 border-red-600 pl-4">
                  <strong className="text-sm">Data Exposure Prevention</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Limit AI access to sensitive data sources</li>
                    <li>Real-time risk assessment before data retrieval</li>
                    <li>PII and confidential data filtering</li>
                    <li>Prompt injection detection and blocking</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="text-xs font-medium mb-2">Real-World Example: Block PII from External LLMs</p>
                <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                  <div className="text-green-600"># Prevent PII from reaching external AI services</div>
                  <div>deny if {"{"}</div>
                  <div className="pl-4">input.resource.type == "external_llm"</div>
                  <div className="pl-4">contains_pii(input.prompt)</div>
                  <div>{"}"}</div>
                  <div className="mt-2"></div>
                  <div>contains_pii(text) if {"{"}</div>
                  <div className="pl-4">regex.match(`\d{"{3}"}-\d{"{2}"}-\d{"{4}"}`, text)  # SSN</div>
                  <div>{"}"}</div>
                  <div>contains_pii(text) if {"{"}</div>
                  <div className="pl-4">regex.match(`\d{"{16}"}`, text)  # Credit card</div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {expandedValueProp === 'business-context' && (
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 animate-in slide-in-from-top">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Gauge className="h-5 w-5 text-green-600" />
                Enforce Business Context Dynamically
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setExpandedValueProp(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm">
                Control Core enables context-aware policies that adapt to real-world business conditions, user attributes, and environmental factors.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-green-600 pl-4">
                  <strong className="text-sm">Time-Based Policies</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Business hours enforcement (9-5, Monday-Friday)</li>
                    <li>Timezone-aware access control</li>
                    <li>Maintenance window restrictions</li>
                    <li>Time-limited temporary access grants</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <strong className="text-sm">Location-Based Control</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>IP geolocation verification</li>
                    <li>Country allowlists/blocklists</li>
                    <li>Distance-based access (proximity to office)</li>
                    <li>VPN requirement detection</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <strong className="text-sm">User Attribute Policies</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Department and team-based access</li>
                    <li>Clearance level enforcement</li>
                    <li>Employment status validation</li>
                    <li>Dynamic role assignment from HR systems</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <strong className="text-sm">Business State Integration</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Approval workflow status checking</li>
                    <li>Budget and quota enforcement</li>
                    <li>Project lifecycle stage validation</li>
                    <li>Integration with CRM, ERP systems</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="text-xs font-medium mb-2">Real-World Example: Business Hours + Location</p>
                <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                  <div className="text-green-600"># Allow financial transactions during business hours from office</div>
                  <div>allow if {"{"}</div>
                  <div className="pl-4"># Check business hours (9 AM - 5 PM EST)</div>
                  <div className="pl-4">is_business_hours</div>
                  <div className="pl-4"></div>
                  <div className="pl-4"># Check location is from office IP range</div>
                  <div className="pl-4">location := data.pip.ipgeo.lookup[input.request.ip]</div>
                  <div className="pl-4">location.country == "US"</div>
                  <div className="pl-4">input.request.ip in data.office_ip_ranges</div>
                  <div className="pl-4"></div>
                  <div className="pl-4"># Check user role</div>
                  <div className="pl-4">input.user.role in ["finance", "manager"]</div>
                  <div>{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {expandedValueProp === 'centralized' && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800 animate-in slide-in-from-top">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Centrally Manage All Permissions
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setExpandedValueProp(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm">
                Eliminate scattered permission logic across applications. Control Core provides a single source of truth for authorization with GitOps workflow and instant propagation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-purple-600 pl-4">
                  <strong className="text-sm">Single Source of Truth</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>All authorization rules defined in one platform</li>
                    <li>No scattered permission checks in application code</li>
                    <li>Version controlled policy repository (GitHub integration)</li>
                    <li>Consistent enforcement across all systems</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-600 pl-4">
                  <strong className="text-sm">Policy-as-Code Benefits</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Track all changes with git history</li>
                    <li>Code review process for policy changes</li>
                    <li>Rollback to previous versions instantly</li>
                    <li>Automated testing before deployment</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-600 pl-4">
                  <strong className="text-sm">Instant Propagation</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>Update policy once, enforce everywhere automatically</li>
                    <li>Real-time sync via OPAL (Open Policy Administration Layer)</li>
                    <li>Sub-second deployment to all enforcement points</li>
                    <li>No application restarts required</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-600 pl-4">
                  <strong className="text-sm">Multi-System Enforcement</strong>
                  <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>APIs, databases, applications use same policies</li>
                    <li>Microservices architecture support</li>
                    <li>Cloud and on-premise resources</li>
                    <li>Third-party service integration</li>
                  </ul>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                <p className="text-xs font-medium mb-2">Real-World Example: Update Role Definition</p>
                <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                  <div className="text-green-600"># Change "manager" role permissions - affects all systems</div>
                  <div>allow if {"{"}</div>
                  <div className="pl-4">input.user.role == "manager"</div>
                  <div className="pl-4"></div>
                  <div className="pl-4"># New requirement: managers need department match</div>
                  <div className="pl-4">input.user.department == input.resource.department</div>
                  <div className="pl-4"></div>
                  <div className="pl-4"># Instantly enforced on all APIs, databases, apps</div>
                  <div className="pl-4">input.action in ["read", "write", "approve"]</div>
                  <div>{"}"}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Impact:</strong> This single policy change immediately affects authorization decisions across 50+ microservices, 10 databases, and 20 APIs - no code changes required.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="user-guide" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="user-guide">User Guide</TabsTrigger>
          <TabsTrigger value="admin-guide">Admin Guide</TabsTrigger>
          <TabsTrigger value="concepts">Core Concepts</TabsTrigger>
          <TabsTrigger value="advanced-rego">Advanced Rego</TabsTrigger>
        </TabsList>
        
        {/* User Guide Tab */}
        <TabsContent value="user-guide" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Policy Manager User Guide
              </CardTitle>
              <CardDescription>
                Step-by-step guide for creating, testing, and deploying authorization policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="getting-started">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Start Here</Badge>
                      Getting Started
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      As a Policy Manager, you're responsible for defining and maintaining authorization rules that protect your organization's resources.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Accessing the Console</h4>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                          <li>Kickstart: Your self-hosted instance</li>
                          <li>Pro: <code className="text-xs">https://your-tenant.controlplane.controlcore.io</code></li>
                          <li>Enterprise: Your custom domain</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Dashboard Overview</h4>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                          <li><strong>Policies:</strong> Create and manage controls</li>
                          <li><strong>Resources:</strong> Protected endpoints</li>
                          <li><strong>Monitoring:</strong> Decision logs and metrics</li>
                          <li><strong>Settings:</strong> System configuration</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold mb-2 text-sm">Understanding Environments</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <strong>Sandbox:</strong>
                          <ul className="list-disc pl-4 mt-1">
                            <li>Safe testing environment</li>
                            <li>No production impact</li>
                            <li>Experiment freely</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Production:</strong>
                          <ul className="list-disc pl-4 mt-1">
                            <li>Live policy enforcement</li>
                            <li>Protects real resources</li>
                            <li>Rollback capability</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="create-policy-visual">
                  <AccordionTrigger>Creating Policies (Visual Builder)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The visual policy builder provides a no-code interface for creating policies.
                    </p>
                    <div className="space-y-3">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium">Step 1: Create New Policy</h4>
                        <ol className="text-sm list-decimal pl-5 mt-2 space-y-1">
                          <li>Click <strong>Policies → Create Policy</strong></li>
                          <li>Choose <strong>Visual Builder</strong></li>
                          <li>Enter policy details (name, description, environment)</li>
                        </ol>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium">Step 2: Define Conditions</h4>
                        <p className="text-sm mt-1">Build your policy visually:</p>
                        <div className="bg-muted/50 p-3 rounded mt-2 text-sm font-mono">
                          IF User has role "developer"<br/>
                          AND Resource type is "api"<br/>
                          AND Action is "read"<br/>
                          THEN Allow
                        </div>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-medium">Step 3: Save and Test</h4>
                        <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
                          <li>Click <strong>Generate Rego</strong> to preview code</li>
                          <li>Click <strong>Save</strong> to store the policy</li>
                          <li>Use Test Console to validate behavior</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="create-policy-code">
                  <AccordionTrigger>Creating Policies (Code Editor)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      For advanced policies with nested conditions, comprehensions, or custom functions, use the Monaco code editor.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Code Editor Features</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <ul className="list-disc pl-4">
                            <li>IntelliSense with Rego completions</li>
                            <li>Real-time Regal validation</li>
                            <li>Syntax highlighting</li>
                            <li>Error detection and suggestions</li>
                            <li>Code formatting (auto-format on save)</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">When to Use Code Editor</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <ul className="list-disc pl-4">
                            <li>Nested conditions (some/every)</li>
                            <li>Array/object comprehensions</li>
                            <li>Custom helper functions</li>
                            <li>Data lookups from PIPs</li>
                            <li>Complex approval workflows</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        <strong>Tip:</strong> The visual builder will show a warning when your policy would benefit from advanced features. 
                        Click "Switch to Code Editor" to access the full power of Rego.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="testing">
                  <AccordionTrigger>Testing Policies</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Always test policies before deploying to production. Control Core provides comprehensive testing tools.
                    </p>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Test Console Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <strong>Quick Test:</strong>
                            <ul className="list-disc pl-4 mt-1">
                              <li>Select a policy</li>
                              <li>Provide test input</li>
                              <li>See instant results</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Bulk Testing:</strong>
                            <ul className="list-disc pl-4 mt-1">
                              <li>Upload test cases (CSV/JSON)</li>
                              <li>Run against multiple policies</li>
                              <li>Generate test reports</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Regression Testing:</strong>
                            <ul className="list-disc pl-4 mt-1">
                              <li>Save test suites</li>
                              <li>Re-run after changes</li>
                              <li>Compare results</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Best Practice:</strong> Create at least 5 test cases covering: allow case, deny case, edge case, error case, and boundary case.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="deployment">
                  <AccordionTrigger>Deploying Policies</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Deploy policies through environments: Draft → Sandbox → Testing → Production
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Draft
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p>Saved but not enforced. Use for work-in-progress.</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Sandbox
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p>Isolated testing. No production impact.</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Testing
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p>Pre-production validation with test data.</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 dark:bg-red-900/20 border-red-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Production
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p>Live enforcement on production systems.</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="bg-primary/5 p-3 rounded border mt-4">
                      <p className="text-sm">
                        <strong>Deployment Path:</strong> Always test in Sandbox before deploying to Production. Use Testing environment for final validation with test data.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="monitoring">
                  <AccordionTrigger>Monitoring & Audit Logs</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Monitor policy decisions, audit access attempts, and track compliance.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Audit Log Features</h4>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                          <li>All policy decisions logged</li>
                          <li>User identity and context captured</li>
                          <li>Timestamp and request details</li>
                          <li>Allow/deny reasons provided</li>
                          <li>Export for compliance reporting</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Compliance Reports</h4>
                        <ul className="text-sm list-disc pl-4 space-y-1">
                          <li>GDPR access requests</li>
                          <li>HIPAA minimum necessary</li>
                          <li>SOC2 access controls</li>
                          <li>Custom compliance queries</li>
                          <li>Automated report generation</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="templates">
                  <AccordionTrigger>Using Policy Templates</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Pre-built templates for common authorization scenarios.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Role-Based Access Control (RBAC)</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p className="mb-2">Simple role-based access policies</p>
                          <ul className="list-disc pl-4">
                            <li>User role validation</li>
                            <li>Resource-action mappings</li>
                            <li>Hierarchical roles support</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Time-Based Access</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p className="mb-2">Restrict access by time/date</p>
                          <ul className="list-disc pl-4">
                            <li>Business hours only</li>
                            <li>Timezone-aware</li>
                            <li>Maintenance windows</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Data Masking</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p className="mb-2">Protect sensitive data fields</p>
                          <ul className="list-disc pl-4">
                            <li>PII masking (SSN, CC)</li>
                            <li>Role-based visibility</li>
                            <li>Custom masking patterns</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Multi-Level Approval</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <p className="mb-2">Require multiple approvers</p>
                          <ul className="list-disc pl-4">
                            <li>Manager + VP approval</li>
                            <li>Threshold-based rules</li>
                            <li>Time-sensitive approvals</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pip-usage">
                  <AccordionTrigger>Using Policy Information Points (PIPs)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      PIPs provide real-time context for dynamic policy decisions.
                    </p>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border">
                        <h4 className="font-medium mb-2">Common PIP Types</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <strong>User Context:</strong>
                            <ul className="list-disc pl-4 text-xs mt-1">
                              <li>Active Directory / LDAP</li>
                              <li>Auth0, Okta, Azure AD</li>
                              <li>HR systems (employee data)</li>
                              <li>CRM (customer data)</li>
                            </ul>
                          </div>
                          <div>
                            <strong>Environmental Context:</strong>
                            <ul className="list-disc pl-4 text-xs mt-1">
                              <li>IP geolocation</li>
                              <li>Device fingerprinting</li>
                              <li>Risk scoring engines</li>
                              <li>Time/date services</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Using PIPs in Policies:</strong> Reference PIP data using <code className="bg-muted px-1 rounded">data.pip.source_name.attribute</code> in your Rego code. 
                          Example: <code className="bg-muted px-1 rounded">data.pip.auth0.users[input.user.id].email_verified</code>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="best-practices">
                  <AccordionTrigger>Best Practices</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Do's
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <ul className="list-disc pl-4">
                            <li>Test policies thoroughly in Sandbox</li>
                            <li>Use descriptive policy names</li>
                            <li>Document policy purpose</li>
                            <li>Version control via GitHub integration</li>
                            <li>Use templates as starting points</li>
                            <li>Monitor policy performance</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Don'ts
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <ul className="list-disc pl-4">
                            <li>Don't deploy untested policies to Production</li>
                            <li>Don't hardcode sensitive data in policies</li>
                            <li>Don't create overly complex single policies</li>
                            <li>Don't skip documentation</li>
                            <li>Don't ignore Regal linter warnings</li>
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
                  <AccordionTrigger>Bouncer (PEP) Deployment</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Deploy Bouncers (Policy Enforcement Points) to protect your resources.
                    </p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Sidecar Bouncer</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2">
                            <p><strong>Best for:</strong> Kubernetes, microservices</p>
                            <ul className="list-disc pl-4">
                              <li>Deployed as sidecar container</li>
                              <li>Co-located with protected service</li>
                              <li>Automatic policy sync via OPAL</li>
                              <li>No network latency</li>
                            </ul>
                            <div className="bg-blue-100 dark:bg-blue-800/20 p-2 rounded text-xs">
                              Location: <Link to="/settings/peps" className="text-blue-700 hover:underline">Settings → Bouncer/PEP Management</Link>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Standalone Bouncer</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2">
                            <p><strong>Best for:</strong> Traditional deployments, VM-based</p>
                            <ul className="list-disc pl-4">
                              <li>Runs as independent service</li>
                              <li>Reverse proxy mode</li>
                              <li>Protects multiple resources</li>
                              <li>Centralized enforcement</li>
                            </ul>
                            <div className="bg-green-100 dark:bg-green-800/20 p-2 rounded text-xs">
                              Guide: <Link to="/settings/peps" className="text-green-700 hover:underline">Settings → Bouncer/PEP Management</Link>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                        <Info className="h-4 w-4 text-purple-600" />
                        <AlertDescription className="text-xs">
                          <strong>Bouncer Architecture:</strong> Each Bouncer connects to the Control Plane via OPAL for real-time policy updates. 
                          Configure Bouncer-to-Control-Plane linking in Settings → Bouncer/PEP Management.
                        </AlertDescription>
                      </Alert>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Core Concepts FAQ
              </CardTitle>
              <CardDescription>
                Everything you need to know about Control Core, architecture, and Rego
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-controlcore">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Start Here</Badge>
                      What is Control Core?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Control Core is a centralized authorization and compliance platform that enforces access control policies across all your systems, APIs, and resources.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">What It Does</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <ul className="list-disc pl-4">
                            <li>Centrally manage all authorization rules</li>
                            <li>Enforce policies in real-time ({"<"}100ms)</li>
                            <li>Protect APIs, databases, AI agents, applications</li>
                            <li>Automate regulatory compliance</li>
                            <li>Prevent data leakage to AI systems</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Key Benefits</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <ul className="list-disc pl-4">
                            <li>No permission code in applications</li>
                            <li>Update rules once, enforce everywhere</li>
                            <li>Context-aware decisions (time, location, risk)</li>
                            <li>Complete audit trails for compliance</li>
                            <li>GitOps workflow with version control</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="control-plane">
                  <AccordionTrigger>What is the Control Plane?</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Control Plane is the central management system where you create, test, and deploy authorization policies.
                    </p>
                    <div className="space-y-3">
                      <div className="border-l-4 border-blue-600 pl-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <strong className="text-sm">PAP (Policy Administration Point)</strong>
                        <ul className="list-disc pl-4 mt-2 text-xs space-y-1">
                          <li>Web console for policy management (this interface)</li>
                          <li>Visual policy builder for no-code creation</li>
                          <li>Monaco code editor with Regal linting</li>
                          <li>Policy testing and validation tools</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-purple-600 pl-4 bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                        <strong className="text-sm">Policy Repository (GitHub Integration)</strong>
                        <ul className="list-disc pl-4 mt-2 text-xs space-y-1">
                          <li>All policies stored in Git for version control</li>
                          <li>Track changes and rollback if needed</li>
                          <li>Code review process for policy changes</li>
                          <li>Environment-based folders (drafts, enabled, testing, production)</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-green-600 pl-4 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <strong className="text-sm">OPAL Server (Policy Sync)</strong>
                        <ul className="list-disc pl-4 mt-2 text-xs space-y-1">
                          <li>Watches GitHub repository for changes</li>
                          <li>Pushes policy updates to all Bouncers in real-time</li>
                          <li>Sub-second propagation across entire infrastructure</li>
                          <li>WebSocket-based for instant updates</li>
                        </ul>
                      </div>
                    </div>
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-xs">
                        <strong>Deployment Types:</strong> Kickstart (self-hosted), Pro (hosted Control Plane + your Bouncer), Enterprise (custom deployment)
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bouncer">
                  <AccordionTrigger>What is a Bouncer (PEP)?</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Bouncer is a Policy Enforcement Point (PEP) that sits in front of your resources and enforces authorization policies.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">How It Works</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <ol className="list-decimal pl-4 space-y-1">
                            <li><strong>Intercepts</strong> incoming requests to your resource</li>
                            <li><strong>Extracts</strong> context (user, action, resource, time, location)</li>
                            <li><strong>Queries</strong> embedded OPA engine with policy</li>
                            <li><strong>Enforces</strong> decision (allow/deny/mask)</li>
                            <li><strong>Logs</strong> decision for audit trail</li>
                          </ol>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Deployment Types</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <div className="space-y-2">
                            <div>
                              <strong>Sidecar Bouncer:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                <li>Deployed as container sidecar (Kubernetes)</li>
                                <li>Co-located with protected service</li>
                                <li>No network latency</li>
                              </ul>
                            </div>
                            <div>
                              <strong>Standalone Bouncer:</strong>
                              <ul className="list-disc pl-4 mt-1">
                                <li>Independent reverse proxy</li>
                                <li>Protects multiple resources</li>
                                <li>Traditional VM/container deployment</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                      <Shield className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-xs">
                        <strong>Key Feature:</strong> Each Bouncer contains an embedded OPA engine for local, fast policy evaluation. Policies are synced automatically via OPAL.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="opal">
                  <AccordionTrigger>What is OPAL?</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      OPAL (Open Policy Administration Layer) is the real-time sync engine that keeps policies and data synchronized across all Bouncers.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Policy Sync</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Watches GitHub repository</li>
                            <li>Detects policy changes instantly</li>
                            <li>Pushes updates to all Bouncers</li>
                            <li>Sub-second propagation</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Data Sync</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Syncs PIP data to Bouncers</li>
                            <li>Real-time updates from data sources</li>
                            <li>Caching for performance</li>
                            <li>Periodic refresh configurable</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 dark:bg-purple-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">WebSocket Protocol</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Persistent connections to Bouncers</li>
                            <li>Pub/sub model for updates</li>
                            <li>Automatic reconnection</li>
                            <li>Heartbeat monitoring</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="bg-muted/50 p-4 rounded border">
                      <h4 className="font-medium mb-2 text-sm">Update Flow:</h4>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <Badge variant="outline">1. Policy changed in Console</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="outline">2. Saved to GitHub</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="outline">3. OPAL detects change</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="outline">4. Pushes to all Bouncers</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="outline">5. Enforced immediately</Badge>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="architecture">
                  <AccordionTrigger>Control Core Architecture (PAP, PEP, PDP, PIP)</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Understanding the four key components that make Control Core work together.
                    </p>
                    <div className="space-y-3">
                      <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                        <strong className="text-sm">PAP (Policy Administration Point) - Control Plane</strong>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>What:</strong> This web console where you create, test, and deploy policies
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Location:</strong> Hosted (Pro/Enterprise) or Self-hosted (Kickstart)
                        </p>
                      </div>
                      <div className="border-l-4 border-primary pl-4 bg-primary/5 p-3 rounded">
                        <strong className="text-sm">PEP (Policy Enforcement Point) - Bouncer</strong>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>What:</strong> The "Bouncer" that intercepts requests and enforces decisions
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Location:</strong> Sidecar or standalone, deployed with your resources
                        </p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <strong className="text-sm">PDP (Policy Decision Point) - OPA Engine</strong>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>What:</strong> OPA (Open Policy Agent) engine that evaluates Rego policies
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Location:</strong> Embedded inside each Bouncer for fast decisions ({"<"}100ms)
                        </p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <strong className="text-sm">PIP (Policy Information Point) - Data Sources</strong>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>What:</strong> External data sources providing real-time context
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Examples:</strong> Auth0, LDAP, databases, APIs, risk scoring services
                        </p>
                      </div>
                    </div>
                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-xs">
                        <strong>Request Flow:</strong> Request → PEP/Bouncer (intercept) → PDP/OPA (evaluate policy with PIP data) → Decision → PEP/Bouncer (enforce) → Response
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="what-is-rego">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">Policy Language</Badge>
                      What is Rego?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Rego is the declarative policy language used to write authorization rules in Control Core. It's powered by Open Policy Agent (OPA).
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                        <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">Why Rego?</h4>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li><strong>Declarative:</strong> Express <em>what</em> should happen, not <em>how</em></li>
                          <li><strong>Expressive:</strong> Handle complex logic elegantly</li>
                          <li><strong>Testable:</strong> Built-in unit testing support</li>
                          <li><strong>Fast:</strong> Sub-millisecond evaluation</li>
                          <li><strong>Safe:</strong> No side effects or infinite loops</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Key Concepts</h4>
                        <ul className="text-xs list-disc pl-4 space-y-1">
                          <li><strong>Rules:</strong> Define authorization decisions</li>
                          <li><strong>Queries:</strong> Ask questions about data</li>
                          <li><strong>Assignments:</strong> Compute intermediate values</li>
                          <li><strong>Packages:</strong> Organize related rules</li>
                          <li><strong>Imports:</strong> Use built-in functions</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="basic-structure">
                  <AccordionTrigger>Basic Rego Structure</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Every Rego policy follows a standard structure.
                    </p>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="font-mono text-xs space-y-1">
                        <div className="text-purple-600 dark:text-purple-400"># 1. Package declaration</div>
                        <div>package controlcore.policy</div>
                        <div className="mt-2"></div>
                        <div className="text-purple-600 dark:text-purple-400"># 2. Imports (optional)</div>
                        <div>import rego.v1</div>
                        <div className="mt-2"></div>
                        <div className="text-purple-600 dark:text-purple-400"># 3. Default rule</div>
                        <div>default allow := false</div>
                        <div className="mt-2"></div>
                        <div className="text-purple-600 dark:text-purple-400"># 4. Authorization rules</div>
                        <div>allow if {"{"}</div>
                        <div className="pl-4">input.user.role == "admin"</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="border-l-4 border-purple-500 pl-3">
                        <strong>Package:</strong>
                        <p className="text-muted-foreground">Namespace for organizing policies (e.g., <code>controlcore.api.auth</code>)</p>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-3">
                        <strong>Imports:</strong>
                        <p className="text-muted-foreground">Bring in built-in functions and future keywords</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-3">
                        <strong>Default:</strong>
                        <p className="text-muted-foreground">Fallback value when no rules match (usually <code>false</code>)</p>
                      </div>
                      <div className="border-l-4 border-yellow-500 pl-3">
                        <strong>Rules:</strong>
                        <p className="text-muted-foreground">Conditions that must be true for access</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="first-control">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Tutorial</Badge>
                      Writing Your First Control
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Let's create a simple control that allows developers to read API data.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium mb-2">Step 1: Define the Package</h4>
                        <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                          package controlcore.api.read_access
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Package names should be descriptive and hierarchical.
                        </p>
                      </div>

                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium mb-2">Step 2: Import Rego v1</h4>
                        <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                          import rego.v1
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Uses modern Rego syntax with improved features.
                        </p>
                      </div>

                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-medium mb-2">Step 3: Set Default Behavior</h4>
                        <div className="bg-muted/50 p-3 rounded font-mono text-xs">
                          default allow := false
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Secure by default - deny access unless explicitly allowed.
                        </p>
                      </div>

                      <div className="border-l-4 border-yellow-500 pl-4">
                        <h4 className="font-medium mb-2">Step 4: Write Authorization Rule</h4>
                        <div className="bg-muted/50 p-3 rounded font-mono text-xs space-y-1">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">input.user.role == "developer"</div>
                          <div className="pl-4">input.action == "read"</div>
                          <div className="pl-4">input.resource.type == "api"</div>
                          <div>{"}"}</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          All conditions must be true (AND logic). Multiple <code>allow</code> rules create OR logic.
                        </p>
                      </div>
                    </div>

                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-xs">
                        <strong>Complete Example:</strong> This control allows developers to read API data. All three conditions must be true for access.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="input-output">
                  <AccordionTrigger>Understanding Input and Output</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Input Document</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>The <code className="bg-muted px-1 rounded">input</code> contains request information:</p>
                          <div className="bg-white dark:bg-gray-800 p-2 rounded font-mono text-xs">
                            {"{"}<br/>
                            <span className="pl-2">"user": {"{"}</span><br/>
                            <span className="pl-4">"id": "user123",</span><br/>
                            <span className="pl-4">"role": "developer"</span><br/>
                            <span className="pl-2">{"}"},</span><br/>
                            <span className="pl-2">"resource": {"{"}</span><br/>
                            <span className="pl-4">"type": "api"</span><br/>
                            <span className="pl-2">{"}"},</span><br/>
                            <span className="pl-2">"action": "read"</span><br/>
                            {"}"}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Output Decision</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>The policy returns a decision:</p>
                          <div className="space-y-2">
                            <div className="bg-white dark:bg-gray-800 p-2 rounded font-mono">
                              {"{"}<br/>
                              <span className="pl-2">"allow": true</span><br/>
                              {"}"}
                            </div>
                            <p className="text-muted-foreground">
                              Or with reason:
                            </p>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded font-mono">
                              {"{"}<br/>
                              <span className="pl-2">"allow": false,</span><br/>
                              <span className="pl-2">"reason": "User role not authorized"</span><br/>
                              {"}"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="common-patterns">
                  <AccordionTrigger>Common Control Patterns</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Role-Based Access</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">input.user.role == "admin"</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Multiple Conditions (AND)</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">input.user.role == "dev"</div>
                          <div className="pl-4">input.action == "read"</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Multiple Rules (OR)</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">input.user.role == "admin"</div>
                          <div>{"}"}</div>
                          <div className="mt-2">allow if {"{"}</div>
                          <div className="pl-4">input.user.role == "manager"</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Set Membership</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">input.user.role in [</div>
                          <div className="pl-8">"admin",</div>
                          <div className="pl-8">"manager"</div>
                          <div className="pl-4">]</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Time-Based Access</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">hour := time.clock([</div>
                          <div className="pl-8">time.now_ns()</div>
                          <div className="pl-4">])[0]</div>
                          <div className="pl-4">hour {">="} 9; hour {"<"} 17</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Resource Ownership</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div>allow if {"{"}</div>
                          <div className="pl-4">input.resource.owner ==</div>
                          <div className="pl-8">input.user.id</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="complete-example">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">Complete Example</Badge>
                      Real-World Control
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm font-medium">Example: API Access Control with Business Hours</p>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="font-mono text-xs space-y-1">
                        <div className="text-green-600"># Package declaration</div>
                        <div>package controlcore.api.business_hours</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Import Rego v1 for modern syntax</div>
                        <div>import rego.v1</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Default deny (secure by default)</div>
                        <div>default allow := false</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Allow developers to read during business hours</div>
                        <div>allow if {"{"}</div>
                        <div className="pl-4 text-blue-600"># Check user role</div>
                        <div className="pl-4">input.user.role == "developer"</div>
                        <div className="pl-4"></div>
                        <div className="pl-4 text-blue-600"># Check action</div>
                        <div className="pl-4">input.action == "read"</div>
                        <div className="pl-4"></div>
                        <div className="pl-4 text-blue-600"># Check time (9 AM - 5 PM)</div>
                        <div className="pl-4">is_business_hours</div>
                        <div>{"}"}</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Helper rule for business hours check</div>
                        <div>is_business_hours if {"{"}</div>
                        <div className="pl-4">hour := time.clock([time.now_ns()])[0]</div>
                        <div className="pl-4">hour {">="} 9</div>
                        <div className="pl-4">hour {"<"} 17</div>
                        <div>{"}"}</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Admins can access anytime</div>
                        <div>allow if {"{"}</div>
                        <div className="pl-4">input.user.role == "admin"</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200">
                      <h4 className="font-semibold mb-2 text-sm">How This Works:</h4>
                      <ul className="text-xs list-decimal pl-4 space-y-1">
                        <li><strong>Default deny:</strong> Access is denied unless a rule allows it</li>
                        <li><strong>First rule:</strong> Developers can read during business hours (9-5)</li>
                        <li><strong>Helper rule:</strong> Reusable logic for time checking</li>
                        <li><strong>Second rule:</strong> Admins bypass time restrictions</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-types">
                  <AccordionTrigger>Rego Data Types</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Strings</h4>
                        <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                          name := "John Doe"<br/>
                          role := "admin"
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Numbers</h4>
                        <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                          age := 30<br/>
                          clearance := 5<br/>
                          rate := 100.5
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Booleans</h4>
                        <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                          is_active := true<br/>
                          mfa_enabled := false
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Arrays</h4>
                        <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                          roles := ["admin", "dev"]<br/>
                          permissions := ["read"]
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Objects</h4>
                        <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                          user := {"{"}<br/>
                          <span className="pl-2">"id": "123",</span><br/>
                          <span className="pl-2">"role": "admin"</span><br/>
                          {"}"}
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Sets</h4>
                        <div className="bg-muted/50 p-2 rounded font-mono text-xs">
                          roles := {"{"}"admin", "dev"{"}"}
                          <br/>
                          <span className="text-muted-foreground"># No duplicates</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="operators">
                  <AccordionTrigger>Common Operators</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Comparison</h4>
                        <div className="space-y-1 text-xs font-mono bg-muted/50 p-2 rounded">
                          <div>== (equals)</div>
                          <div>!= (not equals)</div>
                          <div>{"<"} (less than)</div>
                          <div>{"> (greater than)"}</div>
                          <div>{"<="} (less or equal)</div>
                          <div>{">="} (greater or equal)</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Logical</h4>
                        <div className="space-y-1 text-xs bg-muted/50 p-2 rounded">
                          <div><code>and</code> - All conditions true</div>
                          <div><code>or</code> - Any condition true</div>
                          <div><code>not</code> - Negate condition</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm">Membership</h4>
                        <div className="space-y-1 text-xs font-mono bg-muted/50 p-2 rounded">
                          <div>in (element in array)</div>
                          <div>contains (string)</div>
                          <div>startswith</div>
                          <div>endswith</div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="best-practices-concepts">
                  <AccordionTrigger>Best Practices for Writing Controls</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Good Practices
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <ul className="list-disc pl-4">
                            <li>Use <code>default allow := false</code> (secure by default)</li>
                            <li>Break complex logic into helper rules</li>
                            <li>Use descriptive variable names</li>
                            <li>Add comments explaining business rules</li>
                            <li>Test with multiple scenarios</li>
                            <li>Use <code>import rego.v1</code> for modern syntax</li>
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            Common Mistakes
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                          <ul className="list-disc pl-4">
                            <li>Using <code>default allow := true</code> (insecure)</li>
                            <li>Hardcoding sensitive data in policies</li>
                            <li>Creating monolithic policies (split them)</li>
                            <li>Ignoring Regal linter warnings</li>
                            <li>Not testing edge cases</li>
                            <li>Forgetting to handle missing fields</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Pro Tip:</strong> Start simple with basic role checks, then gradually add complexity. Use the visual builder for simple policies and switch to code editor when you need advanced features like comprehensions or custom functions.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="next-steps">
                  <AccordionTrigger>Next Steps</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Ready to create your first control? Here's what to do next:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">1. Add a Resource</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>First, define what you want to protect:</p>
                          <Link to="/settings/resources">
                            <Button size="sm" variant="outline" className="w-full mt-2">
                              <Shield className="h-3 w-3 mr-2" />
                              Add Protected Resource
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">2. Create a Control</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p>Then, define who can access it:</p>
                          <Link to="/policies">
                            <Button size="sm" variant="outline" className="w-full mt-2">
                              <Code className="h-3 w-3 mr-2" />
                              Create Control
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded border border-purple-200">
                      <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        Learning Resources
                      </h4>
                      <ul className="text-xs list-disc pl-4 space-y-1">
                        <li>Visit the <strong>Advanced Rego</strong> tab for complex examples</li>
                        <li>Try policy templates for common scenarios</li>
                        <li>Use the Test Console to validate your controls</li>
                        <li>Check the <a href="https://docs.controlcore.io/guides/rego-guidelines" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rego Guidelines</a> for comprehensive documentation</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Rego Tab */}
        <TabsContent value="advanced-rego" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Advanced Rego Features
                  </CardTitle>
                  <CardDescription>
                    Complex patterns for sophisticated authorization policies
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://docs.controlcore.io/guides/rego-guidelines#advanced-rego-features" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Full Guide
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="comprehensions">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">Advanced</Badge>
                      Comprehensions (Filtering & Transformation)
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Comprehensions are powerful tools for filtering and transforming data in policies.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Array Comprehension</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div className="text-green-600"># Get all admin users</div>
                          <div>admin_users := [user |</div>
                          <div className="pl-4">some user in data.users</div>
                          <div className="pl-4">user.role == "admin"</div>
                          <div>]</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Object Comprehension</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div className="text-green-600"># Map user ID to role</div>
                          <div>user_roles := {"{"}user.id: user.role |</div>
                          <div className="pl-4">some user in data.users</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="some-every">
                  <AccordionTrigger>Using some & every Keywords</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">some (ANY condition)</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div className="text-green-600"># At least one admin approved</div>
                          <div>allow if {"{"}</div>
                          <div className="pl-4">some approval in input.approvals</div>
                          <div className="pl-4">approval.role == "admin"</div>
                          <div className="pl-4">approval.status == "approved"</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">every (ALL conditions)</CardTitle>
                        </CardHeader>
                        <CardContent className="font-mono text-xs bg-muted/50 p-3 rounded">
                          <div className="text-green-600"># All users have MFA enabled</div>
                          <div>compliant if {"{"}</div>
                          <div className="pl-4">every user in data.users {"{"}</div>
                          <div className="pl-8">user.mfa_enabled == true</div>
                          <div className="pl-4">{"}"}</div>
                          <div>{"}"}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="functions">
                  <AccordionTrigger>Custom Functions & Helper Rules</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Create reusable logic with functions and helper rules.
                    </p>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="font-mono text-xs space-y-1">
                        <div className="text-green-600"># Helper rules</div>
                        <div>is_admin if {"{"} input.user.role == "admin" {"}"}</div>
                        <div>is_manager if {"{"} input.user.role == "manager" {"}"}</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Composite helper</div>
                        <div>has_elevated_access if {"{"} is_admin {"}"}</div>
                        <div>has_elevated_access if {"{"} is_manager {"}"}</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Function with parameter</div>
                        <div>user_has_role(role) if {"{"}</div>
                        <div className="pl-4">input.user.roles[_] == role</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pip-integration">
                  <AccordionTrigger>PIP Integration & Data Lookups</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Integrate external data sources for dynamic, context-aware policies.
                    </p>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="font-mono text-xs space-y-1">
                        <div className="text-green-600"># User data from Auth0 PIP</div>
                        <div>allow if {"{"}</div>
                        <div className="pl-4">user_profile := data.pip.auth0.users[input.user.id]</div>
                        <div className="pl-4">user_profile.email_verified == true</div>
                        <div className="pl-4">user_profile.mfa_enabled == true</div>
                        <div>{"}"}</div>
                        <div className="mt-2"></div>
                        <div className="text-green-600"># Location from IP Geolocation PIP</div>
                        <div>allow if {"{"}</div>
                        <div className="pl-4">location := data.pip.ipgeo.lookup[input.request.ip]</div>
                        <div className="pl-4">location.country in data.allowed_countries</div>
                        <div>{"}"}</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="real-world">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">Real-World</Badge>
                      Complete Examples
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="hipaa">
                        <AccordionTrigger className="text-sm">HIPAA Minimum Necessary Standard</AccordionTrigger>
                        <AccordionContent>
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="font-mono text-xs space-y-1">
                              <div className="text-green-600"># Only necessary fields for user's role</div>
                              <div>allow if {"{"}</div>
                              <div className="pl-4">input.resource.type == "patient_record"</div>
                              <div className="pl-4">requested_fields := input.query.fields</div>
                              <div className="pl-4">necessary := minimum_necessary_fields(input.user.role)</div>
                              <div className="pl-4">every field in requested_fields {"{"}</div>
                              <div className="pl-8">field in necessary</div>
                              <div className="pl-4">{"}"}</div>
                              <div>{"}"}</div>
                              <div className="mt-2"></div>
                              <div>minimum_necessary_fields("doctor") := [</div>
                              <div className="pl-4">"patient_id", "name", "diagnosis", "medications"</div>
                              <div>]</div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="fintrac">
                        <AccordionTrigger className="text-sm">FINTRAC Suspicious Transaction Detection</AccordionTrigger>
                        <AccordionContent>
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="font-mono text-xs space-y-1">
                              <div className="text-green-600"># Detect multiple transactions below reporting threshold</div>
                              <div>suspicious_transaction if {"{"}</div>
                              <div className="pl-4">recent := [t |</div>
                              <div className="pl-8">some t in data.transactions[input.user.id]</div>
                              <div className="pl-8">t.timestamp {">"} time.now_ns() - (24 * 3600 * 1000000000)</div>
                              <div className="pl-8">t.amount {">="} 9000; t.amount {"<"} 10000</div>
                              <div className="pl-4">]</div>
                              <div className="pl-4">count(recent) {">="} 3</div>
                              <div>{"}"}</div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="ai-prompt">
                        <AccordionTrigger className="text-sm">AI Prompt Injection Prevention</AccordionTrigger>
                        <AccordionContent>
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <div className="font-mono text-xs space-y-1">
                              <div className="text-green-600"># Block prompt injection attempts</div>
                              <div>deny if {"{"}</div>
                              <div className="pl-4">some pattern in injection_patterns</div>
                              <div className="pl-4">regex.match(pattern, input.prompt)</div>
                              <div>{"}"}</div>
                              <div className="mt-2"></div>
                              <div>injection_patterns := [</div>
                              <div className="pl-4">`(?i)ignore\\s+previous\\s+instructions`,</div>
                              <div className="pl-4">`(?i)disregard\\s+.*\\s+above`,</div>
                              <div className="pl-4">`(?i)system\\s*:\\s*you\\s+are`</div>
                              <div>]</div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-sm font-medium">Want More Examples?</p>
                <p className="text-xs">
                  Visit the complete{' '}
                  <a 
                    href="https://docs.controlcore.io/guides/rego-guidelines" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Rego Guidelines Documentation
                  </a>{' '}
                  for 800+ lines of advanced content including:
                </p>
                <ul className="text-xs list-disc pl-5 space-y-1">
                  <li>Nested conditions with some/every keywords</li>
                  <li>Array, object, and set comprehensions</li>
                  <li>Custom validation functions (email, phone, credit card)</li>
                  <li>Financial compliance examples (FINTRAC, OSFI)</li>
                  <li>Healthcare policies (HIPAA minimum necessary)</li>
                  <li>AI agent control patterns</li>
                  <li>Data masking strategies</li>
                  <li>Location-based restrictions with geospatial calculations</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
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
            <Link to="/policies">
              <Button className="w-full justify-start" variant="outline">
                <Code className="mr-2 h-4 w-4" />
                Create Control
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
