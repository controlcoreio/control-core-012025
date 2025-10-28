
import { Control } from "react-hook-form";
import {
  FormControl,
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
import { EnterpriseIcon } from "@/components/ui/enterprise-icon";
import { MCPType } from "../types";

const mcpTypes: MCPType[] = [
  "MQTT",
  "CoAP",
  "AMQP",
  "DDS",
  "Other",
  "AI Agent MCP",
  "IoT Device"
];

interface BasicInfoFieldsProps {
  control: Control<any>;
}

export function BasicInfoFields({ control }: BasicInfoFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <EnterpriseIcon name="pencil" size={16} />
              Connection Name
            </FormLabel>
            <FormControl>
              <Input placeholder="Enter connection name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <EnterpriseIcon name="globe" size={16} />
              Protocol Type
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a protocol type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {mcpTypes.map((type) => (
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
    </>
  );
}
