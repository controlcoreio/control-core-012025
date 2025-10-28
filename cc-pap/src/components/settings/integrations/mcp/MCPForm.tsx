
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MCPConnection, MCPType, MCPAuthMethod } from "../types";
import { BasicInfoFields } from "./BasicInfoFields";
import { AuthenticationFields } from "./AuthenticationFields";
import { EndpointFields } from "./EndpointFields";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["MQTT", "CoAP", "AMQP", "DDS", "Other", "AI Agent MCP", "IoT Device"]),
  brokerEndpoint: z.string().url("Must be a valid URL"),
  authMethod: z.enum(["TLS Certificate", "Username/Password", "API Key", "OAuth", "None"]),
  authEndpoint: z.string().url("Must be a valid URL").optional(),
  deviceIdMethod: z.string().optional(),
});

interface MCPFormProps {
  onSubmit: (connection: MCPConnection) => void;
  onCancel: () => void;
}

export function MCPForm({ onSubmit, onCancel }: MCPFormProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [authDetails, setAuthDetails] = useState<{key: string, value: string}[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "MQTT" as const,
      brokerEndpoint: "",
      authMethod: "None" as const,
      authEndpoint: "",
      deviceIdMethod: "",
    },
  });

  const watchAuthMethod = form.watch("authMethod");
  const needsAuthDetails = watchAuthMethod !== "None";

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Connection successful",
        description: "Successfully connected to the MCP broker",
      });
      return true;
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to the MCP broker",
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
      const mcpConnection: MCPConnection = {
        id: crypto.randomUUID(),
        name: values.name,
        type: values.type,
        endpoint: values.brokerEndpoint,
        status: "connected",
        authMethod: values.authMethod,
        authDetails: {},
        pdpQueryEndpoint: values.authEndpoint,
        deviceIdMethod: values.deviceIdMethod,
      };
      
      if (needsAuthDetails && authDetails.length > 0) {
        mcpConnection.authDetails = authDetails.reduce((acc, detail) => {
          if (detail.key && detail.value) {
            acc[detail.key] = detail.value;
          }
          return acc;
        }, {} as Record<string, string>);
      }
      
      onSubmit(mcpConnection);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <BasicInfoFields control={form.control} />
        
        <EndpointFields control={form.control} />
        
        <AuthenticationFields 
          control={form.control} 
          authDetails={authDetails} 
          setAuthDetails={setAuthDetails} 
          needsAuthDetails={needsAuthDetails} 
        />

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
