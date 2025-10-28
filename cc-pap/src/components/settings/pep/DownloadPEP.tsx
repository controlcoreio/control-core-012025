
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Download, Server, Shield, Database, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const pepTypes = [
  { 
    id: "api-gateway", 
    name: "API Gateway Bouncer", 
    description: "Enforce controls at the API gateway level (deploy in pairs: Sandbox + Production)",
    icon: Server,
    formats: ["docker", "executable", "config"]
  },
  { 
    id: "application", 
    name: "Application Bouncer", 
    description: "Agent/Library for direct application integration",
    icon: Shield,
    formats: ["library", "agent", "config"]
  },
  { 
    id: "network", 
    name: "Network Bouncer", 
    description: "Enforce controls at the network level",
    icon: Database,
    formats: ["docker", "executable"]
  },
  { 
    id: "data", 
    name: "Data Bouncer", 
    description: "Data-level control enforcement",
    icon: FileText,
    formats: ["library", "agent"]
  },
  { 
    id: "mcp", 
    name: "MCP Bouncer (for AI Agents)", 
    description: "Control enforcement for AI Agent Model Context Protocol",
    icon: Shield,
    formats: ["python-library", "docker", "service"]
  },
  { 
    id: "iot", 
    name: "IoT Device Bouncer", 
    description: "Lightweight control enforcement for IoT devices",
    icon: Database,
    formats: ["c-library", "edge-gateway", "firmware-module"]
  },
  { 
    id: "a2a", 
    name: "Google A2A Bouncer", 
    description: "Control enforcement for Google Agent-to-Agent communication",
    icon: Shield,
    formats: ["go-library", "cloud-function", "service"]
  }
];

const versions = [
  { id: "1.2.0", name: "v1.2.0 (Stable)", isStable: true, compatibleTypes: ["api-gateway", "application", "network", "data"] },
  { id: "1.3.0-beta", name: "v1.3.0 (Beta)", isStable: false, compatibleTypes: ["api-gateway", "application", "network", "data", "mcp", "iot", "a2a"] },
  { id: "1.1.0", name: "v1.1.0 (Stable)", isStable: true, compatibleTypes: ["api-gateway", "application", "network", "data"] },
  { id: "1.0.5", name: "v1.0.5 (Stable)", isStable: true, compatibleTypes: ["iot"] },
  { id: "1.0.0", name: "v1.0.0 (Stable)", isStable: true, compatibleTypes: ["mcp", "a2a"] },
];

interface DownloadFormValues {
  pepType: string;
  format: string;
  version: string;
}

export function DownloadPEP() {
  const { toast } = useToast();
  const [selectedPepType, setSelectedPepType] = useState<string | null>(null);
  const form = useForm<DownloadFormValues>({
    defaultValues: {
      pepType: "",
      format: "",
      version: "1.2.0"
    }
  });

  // Find the selected PEP type object
  const selectedPep = pepTypes.find(pep => pep.id === selectedPepType);
  
  // Filter versions compatible with the selected PEP type
  const compatibleVersions = selectedPepType 
    ? versions.filter(version => version.compatibleTypes.includes(selectedPepType))
    : versions;

  const onSubmit = (data: DownloadFormValues) => {
    // Handle the download action here
    console.log("Download requested:", data);
    
    toast({
      title: "Download Started",
      description: `Your ${selectedPep?.name} (${data.format}) v${data.version} is being downloaded.`,
    });
  };

  const handlePepTypeChange = (value: string) => {
    setSelectedPepType(value);
    form.setValue("pepType", value);
    form.setValue("format", ""); // Reset format when PEP type changes
    
    // Set a default version compatible with this PEP type
    const defaultVersion = compatibleVersions[0]?.id;
    if (defaultVersion) {
      form.setValue("version", defaultVersion);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pepTypes.map((pep) => (
          <Card 
            key={pep.id} 
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedPepType === pep.id ? "border-2 border-primary" : ""
            }`}
            onClick={() => handlePepTypeChange(pep.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <pep.icon className={`h-8 w-8 mb-2 ${
                  pep.id === "mcp" ? "text-purple-500" : 
                  pep.id === "a2a" ? "text-blue-500" : 
                  pep.id === "iot" ? "text-green-500" : 
                  "text-primary"
                }`} />
                {pep.id === "mcp" || pep.id === "iot" || pep.id === "a2a" ? (
                  <Badge variant="outline" className="bg-primary/10 text-xs">New</Badge>
                ) : null}
              </div>
              <CardTitle className="text-lg">{pep.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{pep.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPepType && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedPep?.formats.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the format that best fits your deployment needs
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {compatibleVersions.map((version) => (
                          <SelectItem key={version.id} value={version.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{version.name}</span>
                              {version.isStable ? (
                                <Badge variant="default" className="ml-2">Stable</Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2">Beta</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the version to download
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={!form.watch("format")}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PEP
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
