import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Webhook, 
  Database, 
  Bell, 
  Plus,
  X,
  Info,
  Zap,
  FileText,
  Code
} from "lucide-react";

interface PolicyData {
  name: string;
  description: string;
  resourceId: string;
  bouncerId: string;
  effect: 'allow' | 'deny' | 'mask' | 'log';
  conditions: any[];
  regoCode: string;
  status: 'draft' | 'active';
  contextConfig?: ContextConfig;
}

interface ContextConfig {
  enrichment: ContextEnrichment[];
  actions: ContextAction[];
  modifications: ResponseModification[];
}

interface ContextEnrichment {
  id: string;
  source: string; // PIP, API, database
  attribute: string;
  targetPath: string;
  enabled: boolean;
}

interface ContextAction {
  id: string;
  type: string; // webhook, notification, log, workflow
  trigger: string; // on_allow, on_deny, on_error
  config: any;
  enabled: boolean;
}

interface ResponseModification {
  id: string;
  type: string; // add_header, inject_metadata, modify_body
  config: any;
  enabled: boolean;
}

interface ContextManagementStepProps {
  policyData: PolicyData;
  setPolicyData: (data: PolicyData) => void;
}

export function ContextManagementStep({ policyData, setPolicyData }: ContextManagementStepProps) {
  const [contextConfig, setContextConfig] = useState<ContextConfig>(
    policyData.contextConfig || {
      enrichment: [],
      actions: [],
      modifications: []
    }
  );

  const addEnrichment = () => {
    const newEnrichment: ContextEnrichment = {
      id: `enrich-${Date.now()}`,
      source: 'pip',
      attribute: '',
      targetPath: '',
      enabled: true
    };
    setContextConfig({
      ...contextConfig,
      enrichment: [...contextConfig.enrichment, newEnrichment]
    });
  };

  const removeEnrichment = (id: string) => {
    setContextConfig({
      ...contextConfig,
      enrichment: contextConfig.enrichment.filter(e => e.id !== id)
    });
  };

  const addAction = () => {
    const newAction: ContextAction = {
      id: `action-${Date.now()}`,
      type: 'webhook',
      trigger: 'on_deny',
      config: {},
      enabled: true
    };
    setContextConfig({
      ...contextConfig,
      actions: [...contextConfig.actions, newAction]
    });
  };

  const removeAction = (id: string) => {
    setContextConfig({
      ...contextConfig,
      actions: contextConfig.actions.filter(a => a.id !== id)
    });
  };

  const addModification = () => {
    const newMod: ResponseModification = {
      id: `mod-${Date.now()}`,
      type: 'add_header',
      config: { key: '', value: '' },
      enabled: true
    };
    setContextConfig({
      ...contextConfig,
      modifications: [...contextConfig.modifications, newMod]
    });
  };

  const removeModification = (id: string) => {
    setContextConfig({
      ...contextConfig,
      modifications: contextConfig.modifications.filter(m => m.id !== id)
    });
  };

  // Update policyData when context config changes
  React.useEffect(() => {
    setPolicyData({ ...policyData, contextConfig });
  }, [contextConfig]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          Context & Actions
        </h3>
        <p className="text-muted-foreground">
          Add real-time context enrichment and trigger actions (Optional)
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="enrichment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enrichment">
              <Database className="h-4 w-4 mr-2" />
              Context Enrichment
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Webhook className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="modifications">
              <FileText className="h-4 w-4 mr-2" />
              Response Mods
            </TabsTrigger>
          </TabsList>

          {/* Context Enrichment Tab */}
          <TabsContent value="enrichment" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Fetch additional context at runtime from PIPs or external sources to enrich the policy decision.
              </AlertDescription>
            </Alert>

            {contextConfig.enrichment.map((enrich) => (
              <Card key={enrich.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <Label className="text-xs">Source</Label>
                      <Select value={enrich.source} onValueChange={(value) => {
                        setContextConfig({
                          ...contextConfig,
                          enrichment: contextConfig.enrichment.map(e =>
                            e.id === enrich.id ? { ...e, source: value } : e
                          )
                        });
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pip">PIP (Policy Info Point)</SelectItem>
                          <SelectItem value="api">External API</SelectItem>
                          <SelectItem value="database">Database Query</SelectItem>
                          <SelectItem value="cache">Cache Lookup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-4">
                      <Label className="text-xs">Attribute/Endpoint</Label>
                      <Input
                        placeholder="user.profile or https://api.example.com/user"
                        value={enrich.attribute}
                        onChange={(event) => {
                          setContextConfig({
                            ...contextConfig,
                            enrichment: contextConfig.enrichment.map(e =>
                              e.id === enrich.id ? { ...e, attribute: event.target.value } : e
                            )
                          });
                        }}
                      />
                    </div>

                    <div className="col-span-4">
                      <Label className="text-xs">Target Path in Input</Label>
                      <Input
                        placeholder="input.enriched.user_profile"
                        value={enrich.targetPath}
                        onChange={(event) => {
                          setContextConfig({
                            ...contextConfig,
                            enrichment: contextConfig.enrichment.map(e =>
                              e.id === enrich.id ? { ...e, targetPath: event.target.value } : e
                            )
                          });
                        }}
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEnrichment(enrich.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={addEnrichment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Context Enrichment
            </Button>

            {contextConfig.enrichment.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No context enrichment configured</p>
              </div>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Trigger actions based on policy decisions (webhooks, notifications, logs, workflows).
              </AlertDescription>
            </Alert>

            {contextConfig.actions.map((action) => (
              <Card key={action.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <Label className="text-xs">Action Type</Label>
                      <Select value={action.type} onValueChange={(value) => {
                        setContextConfig({
                          ...contextConfig,
                          actions: contextConfig.actions.map(a =>
                            a.id === action.id ? { ...a, type: value } : a
                          )
                        });
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="notification">Send Notification</SelectItem>
                          <SelectItem value="siem_log">Log to SIEM</SelectItem>
                          <SelectItem value="workflow">Trigger Workflow</SelectItem>
                          <SelectItem value="email">Send Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Trigger</Label>
                      <Select value={action.trigger} onValueChange={(value) => {
                        setContextConfig({
                          ...contextConfig,
                          actions: contextConfig.actions.map(a =>
                            a.id === action.id ? { ...a, trigger: value } : a
                          )
                        });
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="on_allow">On Allow</SelectItem>
                          <SelectItem value="on_deny">On Deny</SelectItem>
                          <SelectItem value="on_mask">On Mask</SelectItem>
                          <SelectItem value="on_error">On Error</SelectItem>
                          <SelectItem value="always">Always</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-5">
                      <Label className="text-xs">Configuration (JSON)</Label>
                      <Textarea
                        placeholder='{"url": "https://hooks.example.com/policy"}'
                        value={typeof action.config === 'string' ? action.config : JSON.stringify(action.config, null, 2)}
                        onChange={(e) => {
                          // Store as string while typing, validate on blur
                          setContextConfig({
                            ...contextConfig,
                            actions: contextConfig.actions.map(a =>
                              a.id === action.id ? { ...a, config: e.target.value } : a
                            )
                          });
                        }}
                        onBlur={(e) => {
                          // Validate JSON on blur
                          try {
                            const config = JSON.parse(e.target.value);
                            setContextConfig({
                              ...contextConfig,
                              actions: contextConfig.actions.map(a =>
                                a.id === action.id ? { ...a, config } : a
                              )
                            });
                          } catch (err) {
                            // Keep as string if invalid
                            console.warn('Invalid JSON:', err);
                          }
                        }}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(action.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={addAction}>
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>

            {contextConfig.actions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No actions configured</p>
              </div>
            )}
          </TabsContent>

          {/* Response Modifications Tab */}
          <TabsContent value="modifications" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Modify responses at runtime (inject headers, add metadata, transform data).
              </AlertDescription>
            </Alert>

            {contextConfig.modifications.map((mod) => (
              <Card key={mod.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Label className="text-xs">Modification Type</Label>
                      <Select value={mod.type} onValueChange={(value) => {
                        setContextConfig({
                          ...contextConfig,
                          modifications: contextConfig.modifications.map(m =>
                            m.id === mod.id ? { ...m, type: value } : m
                          )
                        });
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add_header">Add HTTP Header</SelectItem>
                          <SelectItem value="inject_metadata">Inject Metadata</SelectItem>
                          <SelectItem value="modify_body">Modify Response Body</SelectItem>
                          <SelectItem value="add_audit_trail">Add Audit Trail</SelectItem>
                          <SelectItem value="mask_fields">Mask Specific Fields</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-7">
                      <Label className="text-xs">Configuration (JSON)</Label>
                      <Textarea
                        placeholder='{"header": "X-Policy-Decision", "value": "allowed"}'
                        value={typeof mod.config === 'string' ? mod.config : JSON.stringify(mod.config, null, 2)}
                        onChange={(e) => {
                          // Store as string while typing, validate on blur
                          setContextConfig({
                            ...contextConfig,
                            modifications: contextConfig.modifications.map(m =>
                              m.id === mod.id ? { ...m, config: e.target.value } : m
                            )
                          });
                        }}
                        onBlur={(e) => {
                          // Validate JSON on blur
                          try {
                            const config = JSON.parse(e.target.value);
                            setContextConfig({
                              ...contextConfig,
                              modifications: contextConfig.modifications.map(m =>
                                m.id === mod.id ? { ...m, config } : m
                              )
                            });
                          } catch (err) {
                            // Keep as string if invalid
                            console.warn('Invalid JSON:', err);
                          }
                        }}
                        rows={2}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModification(mod.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full" onClick={addModification}>
              <Plus className="h-4 w-4 mr-2" />
              Add Response Modification
            </Button>

            {contextConfig.modifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No response modifications configured</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Feature Highlight */}
        <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Control Core's Real-Time Context Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Unlike traditional policy engines, Control Core can enrich context, trigger actions, and modify responses in real-time as part of policy enforcement.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Database className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Fetch Context</p>
                <p className="text-xs text-muted-foreground">From PIPs</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Webhook className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Trigger Actions</p>
                <p className="text-xs text-muted-foreground">Webhooks, Logs</p>
              </div>
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Code className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xs font-medium">Modify Response</p>
                <p className="text-xs text-muted-foreground">Headers, Data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Example Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex items-start gap-2">
              <Zap className="h-3 w-3 mt-0.5 text-yellow-600" />
              <div>
                <strong>Context Enrichment:</strong> Fetch user's current project from HR system to verify access to project-specific data
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Webhook className="h-3 w-3 mt-0.5 text-green-600" />
              <div>
                <strong>Actions:</strong> Send webhook to SIEM when sensitive data is accessed or denied
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-3 w-3 mt-0.5 text-blue-600" />
              <div>
                <strong>Response Modification:</strong> Inject "X-Policy-Decision" header with decision metadata for downstream services
              </div>
            </div>
          </CardContent>
        </Card>

        {contextConfig.enrichment.length === 0 && contextConfig.actions.length === 0 && contextConfig.modifications.length === 0 && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This step is optional. You can skip it and your policy will work with standard evaluation. Add context management to unlock Control Core's advanced capabilities.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

