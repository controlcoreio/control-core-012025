
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { GatewayConnection, GatewayType } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const gatewayTypes: GatewayType[] = [
  "Kong",
  "Tyk",
  "Azure API Management",
  "AWS API Gateway",
  "Google Apigee",
  "Custom API Gateway",
];

const authOptions = [
  { value: "apiKey", label: "API Key" },
  { value: "oauth2", label: "OAuth 2.0" },
  { value: "basic", label: "Basic Auth" },
  { value: "tls", label: "TLS Client Authentication" },
  { value: "none", label: "None" },
];

const httpMethods = [
  { id: "get", label: "GET" },
  { id: "post", label: "POST" },
  { id: "put", label: "PUT" },
  { id: "delete", label: "DELETE" },
  { id: "patch", label: "PATCH" },
  { id: "options", label: "OPTIONS" },
  { id: "head", label: "HEAD" },
];

const controlActions = [
  { id: "auth", label: "Authentication" },
  { id: "authz", label: "Authorization" },
  { id: "rate", label: "Rate Limiting" },
  { id: "transform", label: "Data Masking/Transformation" },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Kong", "Tyk", "Azure API Management", "AWS API Gateway", "Google Apigee", "Custom API Gateway"]),
  endpoint: z.string().url("Must be a valid URL"),
  authType: z.string(),
  description: z.string().optional(),
  pdpQueryEndpoint: z.string().url("Must be a valid URL").optional(),
  interceptAll: z.boolean().default(true),
  specificPaths: z.string().optional(),
});

interface AddGatewayFormProps {
  onSubmit: (gateway: GatewayConnection) => void;
  onCancel: () => void;
}

export function AddGatewayForm({ onSubmit, onCancel }: AddGatewayFormProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [additionalHeaders, setAdditionalHeaders] = useState<{key: string, value: string}[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>(["auth", "authz"]);
  const [pepConfigOpen, setPepConfigOpen] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "Kong" as const,
      endpoint: "",
      authType: "apiKey",
      description: "",
      pdpQueryEndpoint: "",
      interceptAll: true,
      specificPaths: "",
    },
  });

  const watchGatewayType = form.watch("type");
  const isCustomOrApigee = watchGatewayType === "Custom API Gateway" || watchGatewayType === "Google Apigee";
  const interceptAll = form.watch("interceptAll");

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Connection successful",
        description: "Successfully connected to the API Gateway",
      });
      return true;
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to the API Gateway",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const isConnected = await testConnection();
    if (isConnected) {
      // Ensure all required properties are included
      const gatewayConnection: GatewayConnection = {
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type,
        endpoint: values.endpoint,
        authType: values.authType,
        status: "connected",
        authDetails: {},
        pepConfig: {
          interceptAll: values.interceptAll,
          specificPaths: values.specificPaths ? values.specificPaths.split(',').map(p => p.trim()) : [],
          httpMethods: selectedMethods,
          controlActions: selectedActions
        }
      };
      
      // Add custom fields for Apigee and Custom API Gateway
      if (isCustomOrApigee) {
        gatewayConnection.pdpQueryEndpoint = values.pdpQueryEndpoint;
        
        if (additionalHeaders.length > 0) {
          gatewayConnection.additionalHeaders = additionalHeaders.reduce((acc, header) => {
            if (header.key && header.value) {
              acc[header.key] = header.value;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }
      
      onSubmit(gatewayConnection);
    }
  };

  const addHeader = () => {
    setAdditionalHeaders([...additionalHeaders, { key: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = [...additionalHeaders];
    newHeaders.splice(index, 1);
    setAdditionalHeaders(newHeaders);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...additionalHeaders];
    newHeaders[index][field] = value;
    setAdditionalHeaders(newHeaders);
  };

  const toggleMethod = (method: string) => {
    setSelectedMethods(prev => 
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action)
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gateway Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter gateway name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gateway Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gateway type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {gatewayTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCustomOrApigee && (
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter a description for this gateway" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Endpoint</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://api.gateway.com" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                The base URL of your API Gateway's management API
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCustomOrApigee && (
          <FormField
            control={form.control}
            name="pdpQueryEndpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PDP Query Endpoint</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://pdp.example.com/authorize" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The URL where the PEP will send authorization requests to the PDP
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="authType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authentication Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authentication type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Authentication method for PDP communication
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible open={pepConfigOpen} onOpenChange={setPepConfigOpen} className="border rounded-lg p-4 bg-muted/20">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <h3 className="text-lg font-semibold">PEP Interception Configuration</h3>
              {pepConfigOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <Separator className="my-3" />
          <CollapsibleContent className="space-y-4">
            <FormField
              control={form.control}
              name="interceptAll"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked === true);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>Intercept All API Calls (Default)</FormLabel>
                    <FormDescription>
                      If enabled, all API calls will be intercepted by the built-in PEP
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!interceptAll && (
              <FormField
                control={form.control}
                name="specificPaths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Paths/Routes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="/api/users, /api/products"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter comma-separated paths or routes to be intercepted (e.g., /api/users, /api/products)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <FormLabel>Specific HTTP Methods</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {httpMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`method-${method.id}`}
                      checked={selectedMethods.includes(method.id)}
                      onCheckedChange={() => toggleMethod(method.id)}
                    />
                    <label 
                      htmlFor={`method-${method.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {method.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormDescription>
                Select the HTTP methods to intercept. If none are selected, all methods will be intercepted.
              </FormDescription>
            </div>

            <div className="space-y-2">
              <FormLabel>Actions to Control</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {controlActions.map((action) => (
                  <div key={action.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`action-${action.id}`}
                      checked={selectedActions.includes(action.id)}
                      onCheckedChange={() => toggleAction(action.id)}
                    />
                    <label 
                      htmlFor={`action-${action.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {action.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormDescription>
                Select the actions that the PEP should control
              </FormDescription>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {isCustomOrApigee && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Additional Headers (Optional)</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </div>
            
            {additionalHeaders.map((header, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Header key"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Header value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeHeader(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isTestingConnection}>
            {isTestingConnection ? "Testing Connection..." : "Save Connection"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
