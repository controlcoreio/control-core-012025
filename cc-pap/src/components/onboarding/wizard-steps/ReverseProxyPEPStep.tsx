import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Copy } from "lucide-react";
import { generateRandomString } from "@/lib/utils";
import { ResourceProtectedSuccessDialog } from "../ResourceProtectedSuccessDialog";
import { useNavigate } from "react-router-dom";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import { useToast } from "@/hooks/use-toast";
import { addControlledResource, type MockControlledAPI } from "@/data/mockData";

interface ReverseProxyPEPStepProps {
  onComplete: () => void;
}

const formSchema = z.object({
  resourceName: z.string().min(2, {
    message: "Resource name must be at least 2 characters.",
  }),
  originalHost: z.string().url({ message: "Please enter a valid URL." }),
  description: z.string().optional(),
  category: z.string().optional(),
  policyDirection: z.string().optional(),
});

export function ReverseProxyPEPStep({ onComplete }: ReverseProxyPEPStepProps) {
  const [proxyUrlGenerated, setProxyUrlGenerated] = useState(false);
  const [proxyUrl, setProxyUrl] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [certificateType, setCertificateType] = useState<"controlcore" | "custom">("controlcore");
  const [customCert, setCustomCert] = useState<{ cert: string; key: string } | null>(null);
  const { currentEnvironment } = useEnvironment();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      resourceName: "AI Chatbot Service",
      originalHost: "https://api.mycompany.com/ai/chatbot",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Simulate proxy URL generation
    const randomString = generateRandomString(8);
    // Generate URL in the format: https://Ogfas93.api.acme.com
    const url = `https://${randomString}.${new URL(values.originalHost).hostname}`;
    setProxyUrl(url);
    setProxyUrlGenerated(true);
  }

  const handleComplete = () => {
    // Save the resource to mock data
    const formData = form.getValues();
    const newAPI: MockControlledAPI = {
      id: `api-${Date.now()}`,
      name: formData.resourceName,
      endpoint: "/",
      method: "ALL",
      status: "active",
      policiesCount: 0,
      originalHost: formData.originalHost,
      apiPaths: ["/"],
      proxyUrl: proxyUrl,
      tlsCertificate: certificateType,
      associatedPolicies: 0,
      createdAt: new Date().toISOString(),
      // Add required properties
      controlCoreHost: proxyUrl,
      description: `Protected resource for ${formData.resourceName}`,
      url: formData.originalHost,
      defaultSecurityPosture: "deny-all"
    };
    
    addControlledResource(newAPI);
    
    toast({
      title: "Resource Protected",
      description: `Your resource has been protected with the proxy URL: ${proxyUrl}`,
    });
    setShowSuccessDialog(true);
  };

  const handleGoToPolicies = () => {
    setShowSuccessDialog(false);
    // Navigate to the next step in the wizard (PolicyLibraryStep)
    onComplete();
  };

  const handleViewAuditLogs = () => {
    setShowSuccessDialog(false);
    navigate("/audit-logs");
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div>
        <br></br>
        <h2 className="text-xl font-semibold">
          Secure Your URL enabled resource with Control Core's Proxy URL
        </h2>
        <p className="text-muted-foreground">
          Set up a reverse proxy to keep your AI, API, data, or app safe from unauthorized access and leaks.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Tell us about your resource</CardTitle>
            <CardDescription>
            Please provide the URL of your AI, API, application, or data resource. Control Core will create a secure proxy so you can easily enforce access policies.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
              control={form.control}
              name="resourceName"
              render={({ field }) => (
                <FormItem>
                <FormLabel className="mb-2 block text-base font-medium">
                  Resource Name
                </FormLabel>
                <FormControl>
                  <Input
                  placeholder="MyCompany Customer API"
                  {...field}
                  className="w-full md:w-[480px] h-11"
                  />
                </FormControl>
                <FormMessage />
                </FormItem>
              )}
              />

              <FormField
              control={form.control}
              name="originalHost"
              render={({ field }) => (
                <FormItem>
                <FormLabel className="mb-2 block text-base font-medium">
                  Original Host
                </FormLabel>
                <FormControl>
                  <Input
                  placeholder="https://api.mycompany.com/customers"
                  {...field}
                  className="w-full md:w-[480px] h-11"
                  />
                </FormControl>
                <FormMessage />
                </FormItem>
              )}
              />

              <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                <FormLabel className="mb-2 block text-base font-medium">
                  Brief Description
                </FormLabel>
                <FormControl>
                  <Input
                  placeholder="Describe the resource (e.g. Customer API for internal CRM)"
                  {...field}
                  className="w-full md:w-[480px] h-11"
                  />
                </FormControl>
                <FormMessage />
                </FormItem>
              )}
              />

              <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                <FormLabel className="mb-2 block text-base font-medium">
                  Resource Category
                </FormLabel>
                <FormControl>
                  <select
                  {...field}
                  className="w-full md:w-[480px] h-11 border rounded px-3 bg-background text-foreground dark:bg-background dark:text-foreground"
                  >
                  <option value="">Select category</option>
                  <option value="api">API</option>
                  <option value="application">Application</option>
                  <option value="ai-agent">AI Agent</option>
                  <option value="ai-model">AI Model</option>
                  <option value="mcp-server">MCP Server</option>
                  <option value="data">Data</option>
                  <option value="webhook">Webhook</option>
                  <option value="dashboard">Dashboard</option>
                  <option value="microservice">Microservice</option>
                  <option value="static-content">Static Content</option>
                  <option value="file-storage">File Storage</option>
                  <option value="stream">Streaming Service</option>
                  <option value="other">Other</option>
                  </select>
                </FormControl>
                <FormMessage />
                </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="policyDirection"
                render={({ field }) => (
                <FormItem>
                <FormLabel className="mb-2 block text-base font-medium">
                  Policy Direction
                </FormLabel>
                <FormControl>
                  <select
                  {...field}
                  className="w-full md:w-[480px] h-11 border rounded px-3 bg-background text-foreground dark:bg-background dark:text-foreground"
                  >
                  <option value="">Select direction</option>
                  <option value="ingress">Ingress (incoming requests)</option>
                  <option value="egress">Egress (outgoing requests)</option>
                  <option value="both">Both</option>
                  </select>
                </FormControl>
                <FormMessage />
                </FormItem>
                )}
                />

                {/* Whitelisting info for internal/SSL URLs */}
                <div className="w-full md:w-[480px] flex flex-col gap-3">
                <div className="relative group">
                  <Button
                  type="button"
                  variant="ghost"
                  className="px-0 text-left font-normal"
                  >
                  Why might I need to whitelist the proxy?
                  </Button>
                  <div className="absolute left-0 top-full z-10 mt-2 w-[480px] rounded border bg-background p-4 text-foreground shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 mt-1" />
                    <div>
                    <strong>Whitelisting Required for Internal/SSL URLs</strong>
                    <div className="mt-1 text-sm">
                      If your resource URL is internal or behind SSL, you may need to whitelist the Control Core proxy IPs or domain so requests can be forwarded correctly. This is required if your resource restricts incoming connections. Otherwise, the proxy will simply forward requests and policy decisions to your resource.
                    </div>
                    </div>
                  </div>
                  </div>
                </div>

                <div className="relative group">
                  <Button
                  type="button"
                  variant="ghost"
                  className="px-0 text-left font-normal"
                  >
                  How does Control Core protect my privacy?
                  </Button>
                  <div className="absolute left-0 top-full z-10 mt-2 w-[480px] rounded border bg-background p-4 text-foreground shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 mt-1" />
                    <div>
                    <strong>Privacy & Data Assurance</strong>
                    <div className="mt-1 text-sm">
                      Control Core does not have access to your transactions or any resource data. We strictly follow security-by-default protocols, prioritizing client privacy as our most crucial business aspect. No telemetry data is shared with any third party. For more details, please review our <a href="https://controlcore.io/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline text-primary">Privacy Policy</a>.
                    </div>
                    </div>
                  </div>
                  </div>
                </div>
                </div>

                <Button type="submit" className="w-full md:w-[480px] h-11">
                Generate Proxy URLs
                </Button>
              </form>
          </Form>
        </CardContent>
      </Card>

      {proxyUrlGenerated && (
        <Card>
          <CardHeader>
            <CardTitle>Proxy URL Generated</CardTitle>
            <CardDescription>
              Use this proxy URL to access your protected resource in the {currentEnvironment} environment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Replace your original URL with this Control Core proxy
                URL to enable policy enforcement.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="mb-2">{currentEnvironment.charAt(0).toUpperCase() + currentEnvironment.slice(1)} Proxy URL</Label>
              <div className="flex gap-2">
                <Input
                  value={proxyUrl}
                  readOnly
                  className="cursor-not-allowed flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(proxyUrl);
                    toast({
                      title: "Copied!",
                      description: "Proxy URL copied to clipboard.",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* SSL Certificate Options */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold">SSL Certificate</h3>
              <p className="text-sm text-muted-foreground">
                Choose how you want to handle SSL certificates for your proxy URL.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="controlcore-cert"
                    name="certificate"
                    checked={certificateType === "controlcore"}
                    onChange={() => setCertificateType("controlcore")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="controlcore-cert" className="font-medium">
                      Use Control Core's SSL Certificate (Default)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Control Core will provide and manage the SSL certificate for your proxy URL.
                      This is the recommended option for most users.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <input
                    type="radio"
                    id="custom-cert"
                    name="certificate"
                    checked={certificateType === "custom"}
                    onChange={() => setCertificateType("custom")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="custom-cert" className="font-medium">
                      Upload Your Own SSL Certificate
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your own SSL certificate and private key for the proxy URL.
                      <span className="font-medium"> Note: This can be changed later in Settings.</span>
                    </p>
                    
                    {certificateType === "custom" && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <Label htmlFor="cert-file" className="text-sm">Certificate File (.crt, .pem)</Label>
                          <Input
                            id="cert-file"
                            type="file"
                            accept=".crt,.pem"
                            className="mt-1"
                            onChange={(e) => {
                              // In a real app, you would handle file upload here
                              // For now, we'll just set a placeholder
                              if (e.target.files?.length) {
                                setCustomCert(prev => ({ ...prev, cert: e.target.files[0].name }));
                              }
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="key-file" className="text-sm">Private Key File (.key)</Label>
                          <Input
                            id="key-file"
                            type="file"
                            accept=".key"
                            className="mt-1"
                            onChange={(e) => {
                              // In a real app, you would handle file upload here
                              // For now, we'll just set a placeholder
                              if (e.target.files?.length) {
                                setCustomCert(prev => ({ ...prev, key: e.target.files[0].name }));
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Update the complete button */}
      {proxyUrlGenerated && (
        <div className="flex justify-center pt-4">
          <Button onClick={handleComplete} size="lg">
            Complete Setup
          </Button>
        </div>
      )}

      <ResourceProtectedSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        resourceName={form.watch("resourceName")}
        onGoToPolicies={handleGoToPolicies}
        onViewAuditLogs={handleViewAuditLogs}
      />
    </div>
  );
}
