import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertCircle,
  CheckCircle2,
  Code,
  FileText,
  Info,
  Lightbulb,
  Settings,
  Shield,
  Target,
  Database,
  Boxes,
  Activity
} from "lucide-react";

interface TemplateMetadata {
  version?: string;
  summary?: string;
  detailed_description?: string;
  use_cases?: Array<{
    title: string;
    description: string;
    scenario: string;
  }>;
  conditions?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
    [key: string]: any;
  }>;
  requirements?: {
    data_sources?: string[];
    integrations?: string[];
    prerequisites?: string[];
  };
  deployment_notes?: {
    setup_steps?: string[];
    configuration_tips?: string[];
    testing_scenarios?: string[];
  };
  compliance_frameworks?: string[];
  risk_level?: string;
  tags?: string[];
  related_templates?: string[];
}

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  template_content?: string;
  metadata?: TemplateMetadata;
}

interface TemplateDetailsModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyTemplate: (templateId: number) => void;
}

export function TemplateDetailsModal({
  template,
  isOpen,
  onClose,
  onCopyTemplate,
}: TemplateDetailsModalProps) {
  if (!template) return null;

  const metadata = template.template_metadata || template.metadata || {};
  const riskLevelColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            {template.name}
          </DialogTitle>
          <DialogDescription>
            {metadata.summary || template.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{template.category}</Badge>
          {template.subcategory && (
            <Badge variant="secondary">{template.subcategory}</Badge>
          )}
          {metadata.risk_level && (
            <Badge className={riskLevelColors[metadata.risk_level as keyof typeof riskLevelColors] || ""}>
              {metadata.risk_level?.toUpperCase()} RISK
            </Badge>
          )}
          {metadata.version && (
            <Badge variant="outline">v{metadata.version}</Badge>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="use-cases">
              <Target className="h-4 w-4 mr-2" />
              Use Cases
            </TabsTrigger>
            <TabsTrigger value="conditions">
              <Settings className="h-4 w-4 mr-2" />
              Conditions
            </TabsTrigger>
            <TabsTrigger value="deployment">
              <Lightbulb className="h-4 w-4 mr-2" />
              Deployment
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {metadata.detailed_description || metadata.summary || template.description}
                </p>
              </CardContent>
            </Card>

            {metadata.compliance_frameworks && metadata.compliance_frameworks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Compliance Frameworks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {metadata.compliance_frameworks.map((framework, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {metadata.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Suggested Requirements
                  </CardTitle>
                  <CardDescription>
                    Recommended data sources, metadata, and integrations for this policy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Data Source Requirements */}
                  {metadata.requirements.systems_needed && metadata.requirements.systems_needed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">Data Sources Needed</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {metadata.requirements.systems_needed.map((system, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata/Conditions Summary */}
                  {metadata.conditions_analysis && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Boxes className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold text-sm">Metadata Requirements</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-muted-foreground">Total Conditions:</span>
                          <Badge variant="outline">{metadata.conditions_analysis.total_conditions}</Badge>
                        </div>
                        {metadata.conditions_analysis.user_attributes > 0 && (
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-muted-foreground">User Attributes:</span>
                            <Badge variant="outline">{metadata.conditions_analysis.user_attributes}</Badge>
                          </div>
                        )}
                        {metadata.conditions_analysis.resource_attributes > 0 && (
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Resource Attributes:</span>
                            <Badge variant="outline">{metadata.conditions_analysis.resource_attributes}</Badge>
                          </div>
                        )}
                        {metadata.conditions_analysis.context_attributes > 0 && (
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-muted-foreground">Context Attributes:</span>
                            <Badge variant="outline">{metadata.conditions_analysis.context_attributes}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Integration Complexity */}
                  {metadata.requirements.complexity_score && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-4 w-4 text-orange-600" />
                        <h4 className="font-semibold text-sm">Integration Complexity</h4>
                      </div>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{metadata.requirements.complexity_score}</AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  {/* Prerequisites Checklist */}
                  {metadata.deployment_notes?.prerequisites && metadata.deployment_notes.prerequisites.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Prerequisites Checklist:</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {metadata.deployment_notes.prerequisites.map((prereq, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                            <span>{prereq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="use-cases" className="space-y-4 mt-4">
            {metadata.use_cases && metadata.use_cases.length > 0 ? (
              metadata.use_cases.map((useCase, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground italic">
                        <strong>Scenario:</strong> {useCase.scenario}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No use cases documented for this template.
              </p>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-3 mt-4">
            {metadata.conditions && metadata.conditions.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                {metadata.conditions.map((condition, index) => (
                  <Card key={index} className="mb-4">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">{condition.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {condition.type}
                          </Badge>
                          {condition.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Description */}
                      <div>
                        <p className="text-sm text-muted-foreground">{condition.description}</p>
                      </div>
                      
                      {/* Plain English Explanation */}
                      {condition.plain_english && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {condition.plain_english.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Data Sources */}
                      {condition.data_sources && condition.data_sources.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Data Sources:
                          </h5>
                          <div className="space-y-2">
                            {condition.data_sources.map((source: any, i: number) => (
                              <div key={i} className="border-l-2 border-blue-300 pl-3 py-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{source.name}</Badge>
                                  <span className="text-xs text-muted-foreground">{source.integration_method}</span>
                                </div>
                                {source.example_api && (
                                  <code className="text-xs bg-muted p-1 rounded block">
                                    {source.example_api}
                                  </code>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Example Values */}
                      {condition.example_values && condition.example_values.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold">Example Values:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {condition.example_values.map((value: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Range */}
                      {condition.range && (
                        <div>
                          <span className="text-xs font-semibold">Range:</span>
                          <Badge variant="secondary" className="text-xs ml-2">
                            {condition.range}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Configuration Guide */}
                      {condition.how_to_fetch && (
                        <Accordion type="single" collapsible className="border rounded-md">
                          <AccordionItem value="config" className="border-0">
                            <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                              <span className="flex items-center gap-1">
                                <Settings className="h-3 w-3" />
                                Configuration Guide
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                                {condition.how_to_fetch.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      
                      {/* Configuration Notes */}
                      {condition.configuration_notes && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          <strong>Note:</strong> {condition.configuration_notes.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No conditions documented for this template.
              </p>
            )}
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4 mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {/* Prerequisites Checklist */}
                {metadata.deployment_notes?.prerequisites && metadata.deployment_notes.prerequisites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Prerequisites
                      </CardTitle>
                      <CardDescription>
                        Ensure these requirements are met before deployment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {metadata.deployment_notes.prerequisites.map((prereq, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                            <span className="text-muted-foreground">{prereq}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Data Source Configuration */}
                {metadata.integration_guide?.steps_by_system && metadata.integration_guide.steps_by_system.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        Data Source Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure these integrations for the {metadata.conditions_analysis?.total_conditions || 0} conditions in this policy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {metadata.integration_guide.steps_by_system.map((system: any, index: number) => (
                        <div key={index} className="border-l-4 border-blue-300 pl-4 py-2">
                          <h4 className="font-semibold text-sm mb-2">{system.system}</h4>
                          <div className="space-y-1 text-xs text-muted-foreground mb-2">
                            <p><strong>Attributes needed:</strong> {system.attributes_needed?.join(', ')}</p>
                            {system.example_response && (
                              <p><strong>Response format:</strong> {system.example_response}</p>
                            )}
                          </div>
                          <Accordion type="single" collapsible className="border rounded-md">
                            <AccordionItem value={`steps-${index}`} className="border-0">
                              <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                                Integration Steps
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3">
                                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                                  {system.integration_steps?.map((step: string, i: number) => (
                                    <li key={i}>{step.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}</li>
                                  ))}
                                </ol>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Setup Steps */}
                {metadata.deployment_notes?.setup_steps && metadata.deployment_notes.setup_steps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-600" />
                        Quick Start Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2 list-decimal list-inside">
                        {metadata.deployment_notes.setup_steps.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {step.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}

                {/* Sandbox Testing Guide */}
                {metadata.deployment_notes?.sandbox_testing && metadata.deployment_notes.sandbox_testing.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-orange-600" />
                        Sandbox Testing Guide
                      </CardTitle>
                      <CardDescription>
                        Test thoroughly in sandbox before production deployment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {metadata.deployment_notes.sandbox_testing.map((scenario, index) => (
                          <li key={index} className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {scenario.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Production Deployment Checklist */}
                {metadata.deployment_notes?.production_deployment && metadata.deployment_notes.production_deployment.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        Production Deployment
                      </CardTitle>
                      <CardDescription>
                        Follow this checklist for safe production deployment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {metadata.deployment_notes.production_deployment.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {step.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Monitoring Setup */}
                {metadata.deployment_notes?.monitoring_setup && metadata.deployment_notes.monitoring_setup.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-600" />
                        Monitoring Setup
                      </CardTitle>
                      <CardDescription>
                        Configure these monitoring alerts for this policy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {metadata.deployment_notes.monitoring_setup.map((metric, index) => (
                          <li key={index} className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {metric.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Configuration Tips */}
                {metadata.deployment_notes?.configuration_tips && metadata.deployment_notes.configuration_tips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Configuration Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {metadata.deployment_notes.configuration_tips.map((tip, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {tip.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Troubleshooting */}
                {metadata.deployment_notes?.troubleshooting && metadata.deployment_notes.troubleshooting.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Troubleshooting
                      </CardTitle>
                      <CardDescription>
                        Common issues and solutions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {metadata.deployment_notes.troubleshooting.map((issue, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {issue.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Testing Scenarios (fallback) */}
                {metadata.deployment_notes?.testing_scenarios && metadata.deployment_notes.testing_scenarios.length > 0 && !metadata.deployment_notes?.sandbox_testing && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Testing Scenarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {metadata.deployment_notes.testing_scenarios.map((scenario, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {scenario.replace(/Attribute Sources/g, 'Data Sources').replace(/Add Attribute Source/g, 'Add Data Source')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Rego Policy Code
                </CardTitle>
                <CardDescription>
                  This is the production-ready Rego code for this template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code className="text-xs font-mono">
                      {template.template_content || "// No code available"}
                    </code>
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={() => {
              onCopyTemplate(template.id);
              onClose();
            }}
            className="flex-1"
          >
            Copy Control
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

