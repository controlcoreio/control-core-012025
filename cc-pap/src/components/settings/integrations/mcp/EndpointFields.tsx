
import { Control } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface EndpointFieldsProps {
  control: Control<any>;
}

export function EndpointFields({ control }: EndpointFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="brokerEndpoint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Broker/Endpoint Address</FormLabel>
            <FormControl>
              <Input 
                placeholder="mqtt://broker.example.com:1883" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The address of the MCP broker or endpoint
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="authEndpoint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>PDP Query Endpoint (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="https://auth.example.com/authorize" 
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
        control={control}
        name="deviceIdMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Device Identification Method (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="E.g., Client ID, Certificate CN" 
                {...field} 
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              How devices are identified for policy enforcement
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
