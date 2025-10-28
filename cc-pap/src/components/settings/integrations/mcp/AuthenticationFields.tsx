
import { Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { MCPAuthMethod } from "../types";
import { Dispatch, SetStateAction } from "react";

const authMethods: MCPAuthMethod[] = [
  "TLS Certificate",
  "Username/Password",
  "API Key",
  "OAuth",
  "None"
];

interface AuthDetailsItem {
  key: string;
  value: string;
}

interface AuthenticationFieldsProps {
  control: Control<any>;
  needsAuthDetails: boolean;
  authDetails: AuthDetailsItem[];
  setAuthDetails: Dispatch<SetStateAction<AuthDetailsItem[]>>;
}

export function AuthenticationFields({ 
  control, 
  needsAuthDetails, 
  authDetails, 
  setAuthDetails 
}: AuthenticationFieldsProps) {
  const addAuthDetail = () => {
    setAuthDetails([...authDetails, { key: "", value: "" }]);
  };

  const removeAuthDetail = (index: number) => {
    const newDetails = [...authDetails];
    newDetails.splice(index, 1);
    setAuthDetails(newDetails);
  };

  const updateAuthDetail = (index: number, field: 'key' | 'value', value: string) => {
    const newDetails = [...authDetails];
    newDetails[index][field] = value;
    setAuthDetails(newDetails);
  };

  return (
    <>
      <FormField
        control={control}
        name="authMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Authentication Method</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {authMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {needsAuthDetails && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Authentication Details</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addAuthDetail}>
              <Plus className="h-4 w-4 mr-2" />
              Add Detail
            </Button>
          </div>
          
          {authDetails.map((detail, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Key (e.g., username, client_id)"
                value={detail.key}
                onChange={(e) => updateAuthDetail(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value"
                type={detail.key.toLowerCase().includes('password') || detail.key.toLowerCase().includes('key') ? 'password' : 'text'}
                value={detail.value}
                onChange={(e) => updateAuthDetail(index, 'value', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeAuthDetail(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
