
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEnvironment, Environment } from "@/contexts/EnvironmentContext";
import { Loader2 } from "lucide-react";

const environmentColors: Record<Environment, string> = {
  sandbox: "bg-green-100 text-green-800 border-green-200",
  production: "bg-red-100 text-red-800 border-red-200"
};

const environmentLabels: Record<Environment, string> = {
  sandbox: "Sandbox",
  production: "Production"
};

export function EnvironmentSelector() {
  const { currentEnvironment, setCurrentEnvironment, isEnvironmentLoading, showProductionWarning } = useEnvironment();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Now viewing:</span>
      <Select 
        value={currentEnvironment} 
        onValueChange={(value) => setCurrentEnvironment(value as Environment)}
        disabled={isEnvironmentLoading}
      >
        <SelectTrigger className="w-32">
          {isEnvironmentLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sandbox">
            <Badge variant="outline" className={environmentColors.sandbox}>
              Sandbox
            </Badge>
          </SelectItem>
          <SelectItem value="production" onClick={() => {
            if (currentEnvironment !== 'production') {
              showProductionWarning((value) => setCurrentEnvironment(value as Environment));
            }
          }}>
            <Badge variant="outline" className={environmentColors.production}>
              Production
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
