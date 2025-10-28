import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEnvironment } from "@/contexts/EnvironmentContext";

export function ProductionBanner() {
  const { currentEnvironment, setCurrentEnvironment } = useEnvironment();

  if (currentEnvironment !== 'production') return null;

  return (
    <Alert className="border-red-200 bg-red-50 text-red-800 mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          <strong>WARNING:</strong> You are in the Production environment. Any changes to policies 
          will immediately affect live traffic. We strongly recommend using the Sandbox environment 
          for all policy development and testing.
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCurrentEnvironment('sandbox')}
          className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
        >
          Switch to Sandbox
        </Button>
      </AlertDescription>
    </Alert>
  );
}