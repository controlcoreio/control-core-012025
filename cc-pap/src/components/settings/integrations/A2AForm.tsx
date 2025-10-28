
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { A2AConnection, A2AAuthMethod } from "./types";
import { v4 as uuidv4 } from "uuid";

const a2aFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  serviceEndpoints: z.string().min(1, {
    message: "At least one service endpoint is required.",
  }),
  authMethod: z.string({
    required_error: "Please select an authentication method.",
  }),
  authDetails: z.record(z.string()),
  interceptorEndpoint: z.string().optional(),
  sourceAgent: z.string().optional(),
  destinationAgent: z.string().optional(),
  authorizationScope: z.string().optional(),
  trustConfiguration: z.string().optional(),
});

type A2AFormValues = z.infer<typeof a2aFormSchema>;

interface A2AFormProps {
  onSubmit: (connection: A2AConnection) => void;
  onCancel: () => void;
  isGoogleA2A?: boolean;
}

export function A2AForm({ onSubmit, onCancel, isGoogleA2A = false }: A2AFormProps) {
  const [authMethod, setAuthMethod] = useState<A2AAuthMethod>("None");
  
  const form = useForm<A2AFormValues>({
    resolver: zodResolver(a2aFormSchema),
    defaultValues: {
      name: "",
      serviceEndpoints: "",
      authMethod: "None",
      authDetails: {},
      interceptorEndpoint: "",
      sourceAgent: "",
      destinationAgent: "",
      authorizationScope: "",
      trustConfiguration: "",
    },
  });

  function onFormSubmit(values: A2AFormValues) {
    const connection: A2AConnection = {
      id: uuidv4(),
      name: values.name,
      type: isGoogleA2A ? "Google Agent to Agent" : "gRPC",
      serviceEndpoints: values.serviceEndpoints.split(',').map(endpoint => endpoint.trim()),
      status: "connected",
      authMethod: values.authMethod as A2AAuthMethod,
      authDetails: values.authDetails || {},
      interceptorEndpoint: values.interceptorEndpoint,
      sourceAgent: values.sourceAgent,
      destinationAgent: values.destinationAgent,
      authorizationScope: values.authorizationScope,
      trustConfiguration: values.trustConfiguration,
    };
    onSubmit(connection);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter connection name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isGoogleA2A && (
          <>
            <FormField
              control={form.control}
              name="sourceAgent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Agent</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter source Google Agent identifier" {...field} />
                  </FormControl>
                  <FormDescription>
                    The identifier of the Google Agent initiating the communication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationAgent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Agent</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter destination Google Agent identifier" {...field} />
                  </FormControl>
                  <FormDescription>
                    The identifier of the Google Agent receiving the communication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="serviceEndpoints"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Endpoint(s)</FormLabel>
              <FormControl>
                <Input placeholder="Enter service endpoints (comma-separated)" {...field} />
              </FormControl>
              <FormDescription>
                Enter the endpoints for the services, separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="authMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authentication Method</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setAuthMethod(value as A2AAuthMethod);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select authentication method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isGoogleA2A ? (
                    <>
                      <SelectItem value="Service Account">Service Account</SelectItem>
                      <SelectItem value="API Key">API Key</SelectItem>
                      <SelectItem value="OAuth">OAuth</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Mutual TLS">Mutual TLS</SelectItem>
                      <SelectItem value="JWT">JWT</SelectItem>
                      <SelectItem value="API Key">API Key</SelectItem>
                      <SelectItem value="Custom Headers">Custom Headers</SelectItem>
                      <SelectItem value="OAuth">OAuth</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional auth details based on selected auth method */}
        {authMethod === "API Key" && (
          <FormField
            control={form.control}
            name="authDetails.apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter API Key" {...field} />
                </FormControl>
                <FormDescription>
                  The API Key used for authorization between agents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {authMethod === "Service Account" && (
          <>
            <FormField
              control={form.control}
              name="authDetails.serviceAccountEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Account Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your-service-account@project-id.iam.gserviceaccount.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The email of the Google Cloud Service Account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="authDetails.privateKeyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Private Key ID</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Private Key ID" {...field} />
                  </FormControl>
                  <FormDescription>
                    The ID of the private key for the Service Account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {isGoogleA2A && (
          <FormField
            control={form.control}
            name="authorizationScope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Authorization Scope</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.googleapis.com/auth/cloud-platform" {...field} />
                </FormControl>
                <FormDescription>
                  The Google Cloud scope required for authorization (e.g., cloud-platform)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="interceptorEndpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PDP Query Endpoint</FormLabel>
              <FormControl>
                <Input placeholder="https://your-pdp-endpoint.com/authorize" {...field} />
              </FormControl>
              <FormDescription>
                The URL where authorization requests will be sent for policy decisions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isGoogleA2A && (
          <FormField
            control={form.control}
            name="trustConfiguration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trust Configuration</FormLabel>
                <FormControl>
                  <Input placeholder="Enter trust configuration details" {...field} />
                </FormControl>
                <FormDescription>
                  Optional configuration related to establishing trust between Google Agents
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Connection</Button>
        </div>
      </form>
    </Form>
  );
}
