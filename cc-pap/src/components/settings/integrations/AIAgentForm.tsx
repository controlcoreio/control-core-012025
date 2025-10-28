
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
import { AIAgentConnection, AIAgentType } from "./types";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const agentTypes: AIAgentType[] = [
  "OpenAI",
  "Custom LLM",
  "Azure AI",
  "Anthropic",
  "Google Gemini",
  "Robotics Platform",
  "Other"
];

const protocols = [
  { value: "REST", label: "REST API" },
  { value: "gRPC", label: "gRPC" },
  { value: "WebSocket", label: "WebSocket" },
  { value: "Other", label: "Other" }
];

const controlActions = [
  { id: "request", label: "Request Authorization" },
  { id: "response", label: "Response Filtering" },
  { id: "data", label: "Data Access Control" },
  { id: "sensitive", label: "Sensitive Content Detection" },
];

const messageTypes = [
  { id: "all", label: "All Messages" },
  { id: "completion", label: "Completions" },
  { id: "chat", label: "Chat Messages" },
  { id: "embeddings", label: "Embeddings" },
  { id: "function", label: "Function Calls" },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["OpenAI", "Custom LLM", "Azure AI", "Anthropic", "Google Gemini", "Robotics Platform", "Other"]),
  protocol: z.string().optional(),
  authEndpoint: z.string().url("Must be a valid URL").optional(),
  apiKey: z.string().optional(),
  interceptAll: z.boolean().default(true),
  specificEndpoints: z.string().optional(),
});

interface AIAgentFormProps {
  onSubmit: (agent: AIAgentConnection) => void;
  onCancel: () => void;
}

export function AIAgentForm({ onSubmit, onCancel }: AIAgentFormProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [customConfig, setCustomConfig] = useState<{key: string, value: string}[]>([]);
  const [selectedMessageTypes, setSelectedMessageTypes] = useState<string[]>(['all']);
  const [selectedActions, setSelectedActions] = useState<string[]>(["request", "response"]);
  const [pepConfigOpen, setPepConfigOpen] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "OpenAI" as const,
      protocol: "REST",
      authEndpoint: "",
      apiKey: "",
      interceptAll: true,
      specificEndpoints: "",
    },
  });

  const watchAgentType = form.watch("type");
  const isCustomConfig = watchAgentType === "Other" || watchAgentType === "Custom LLM";
  const interceptAll = form.watch("interceptAll");

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Connection successful",
        description: "Successfully connected to the AI Agent",
      });
      return true;
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to the AI Agent",
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
      const agentConnection: AIAgentConnection = {
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type,
        status: "connected",
        protocol: values.protocol as "REST" | "gRPC" | "WebSocket" | "Other" | undefined,
        authEndpoint: values.authEndpoint,
        apiKey: values.apiKey,
        pepConfig: {
          interceptAll: values.interceptAll,
          specificEndpoints: values.specificEndpoints ? values.specificEndpoints.split(',').map(p => p.trim()) : [],
          messageTypes: selectedMessageTypes,
          controlActions: selectedActions
        }
      };
      
      if (isCustomConfig && customConfig.length > 0) {
        agentConnection.customConfig = customConfig.reduce((acc, config) => {
          if (config.key && config.value) {
            acc[config.key] = config.value;
          }
          return acc;
        }, {} as Record<string, string>);
      }
      
      onSubmit(agentConnection);
    }
  };

  const addConfig = () => {
    setCustomConfig([...customConfig, { key: "", value: "" }]);
  };

  const removeConfig = (index: number) => {
    const newConfig = [...customConfig];
    newConfig.splice(index, 1);
    setCustomConfig(newConfig);
  };

  const updateConfig = (index: number, field: 'key' | 'value', value: string) => {
    const newConfig = [...customConfig];
    newConfig[index][field] = value;
    setCustomConfig(newConfig);
  };

  const toggleMessageType = (type: string) => {
    if (type === 'all') {
      setSelectedMessageTypes(['all']);
    } else {
      const newTypes = selectedMessageTypes.filter(t => t !== 'all');
      if (newTypes.includes(type)) {
        setSelectedMessageTypes(newTypes.filter(t => t !== type));
      } else {
        setSelectedMessageTypes([...newTypes, type]);
      }
    }
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
              <FormLabel>Agent Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter agent name" {...field} />
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
              <FormLabel>Agent Type/Platform</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agentTypes.map((type) => (
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

        <FormField
          control={form.control}
          name="protocol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a protocol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {protocols.map((protocol) => (
                    <SelectItem key={protocol.value} value={protocol.value}>
                      {protocol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The communication protocol used for this agent
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="authEndpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authorization Endpoint (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://api.example.com/authorize" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                The endpoint where authorization checks will be directed
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder="Enter API key" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                API key for authentication with the agent platform
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
                    <FormLabel>Intercept All Communications (Default)</FormLabel>
                    <FormDescription>
                      If enabled, all inbound and outbound communications will be intercepted by the built-in PEP
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!interceptAll && (
              <FormField
                control={form.control}
                name="specificEndpoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific API Endpoints/Functions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="/v1/chat/completions, /v1/embeddings"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter comma-separated API endpoints or functions to be intercepted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <FormLabel>Message Types to Intercept</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {messageTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type.id}`}
                      checked={selectedMessageTypes.includes(type.id)}
                      onCheckedChange={() => toggleMessageType(type.id)}
                    />
                    <label 
                      htmlFor={`type-${type.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormDescription>
                Select which message types should be intercepted. "All Messages" will override other selections.
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

        {isCustomConfig && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel>Custom Configuration (Optional)</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addConfig}>
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </div>
            
            {customConfig.map((config, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Parameter name"
                  value={config.key}
                  onChange={(e) => updateConfig(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Parameter value"
                  value={config.value}
                  onChange={(e) => updateConfig(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeConfig(index)}
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
          <Button type="button" variant="outline" onClick={testConnection} disabled={isTestingConnection}>
            {isTestingConnection ? "Testing..." : "Test Connection"}
          </Button>
          <Button type="submit" disabled={isTestingConnection}>
            {isTestingConnection ? "Testing Connection..." : "Save Connection"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
