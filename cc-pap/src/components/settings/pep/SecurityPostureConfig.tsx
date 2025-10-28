
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Monitor, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface SecurityPostureConfigProps {
  resourceName: string;
  currentPosture: 'allow-all' | 'deny-all';
  onPostureChange: (posture: 'allow-all' | 'deny-all') => void;
  userTier?: 'trial' | 'hosted' | 'enterprise';
}

export function SecurityPostureConfig({ 
  resourceName, 
  currentPosture, 
  onPostureChange,
  userTier = 'hosted' 
}: SecurityPostureConfigProps) {
  const [selectedPosture, setSelectedPosture] = useState<'allow-all' | 'deny-all'>(currentPosture);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (selectedPosture === 'deny-all' && currentPosture === 'allow-all') {
      setShowConfirmDialog(true);
    } else {
      onPostureChange(selectedPosture);
      toast({
        title: "Security posture updated",
        description: `${resourceName} is now in ${selectedPosture === 'allow-all' ? 'Monitoring Mode' : 'Secure by Default mode'}.`,
      });
    }
  };

  const handleConfirmChange = () => {
    setShowConfirmDialog(false);
    onPostureChange(selectedPosture);
    toast({
      title: "Security posture updated",
      description: `${resourceName} is now in Secure by Default mode.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Default Security Posture
          </CardTitle>
          <CardDescription>
            Configure how traffic is handled when no specific policy matches the request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={selectedPosture} 
            onValueChange={(value: 'allow-all' | 'deny-all') => setSelectedPosture(value)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="allow-all" id="allow-all" className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="allow-all" className="text-base font-medium cursor-pointer">
                    <Monitor className="inline h-4 w-4 mr-1" />
                    Allow All (Monitoring Mode)
                  </Label>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Recommended for new resources
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Traffic not matched by a specific policy will be allowed. All requests are logged in Audit Logs. 
                  Ideal for quick setup and observation of your API traffic patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="deny-all" id="deny-all" className="mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="deny-all" className="text-base font-medium cursor-pointer">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Deny All (Secure by Default Mode)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Traffic not matched by a specific 'Allow' policy will be blocked. This provides the highest level of security.
                </p>
                {userTier !== 'enterprise' && (
                  <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    For complex applications, consider upgrading to an Enterprise plan for unlimited policies to fully leverage 'Deny All'.
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          {selectedPosture !== currentPosture && (
            <Button onClick={handleSave} className="w-full">
              Update Security Posture
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Security Posture Change to 'Deny All'</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to 'Deny All' means any request not explicitly allowed by your policies will be blocked. 
              Ensure you have 'Allow' policies in place for all legitimate traffic. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Switch to Deny All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
