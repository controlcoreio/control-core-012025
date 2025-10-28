
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Zap, CheckCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { POLICY_TEMPLATES } from "@/data/mockData";
import { PolicyTemplate } from "@/constants/policyTemplates";

interface PolicySuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceName: string;
  resourceUrl: string;
  resourceId: string;
}

export function PolicySuggestionsModal({ 
  open, 
  onOpenChange, 
  resourceName, 
  resourceUrl,
  resourceId 
}: PolicySuggestionsModalProps) {
  const { toast } = useToast();
  const [applying, setApplying] = useState<string | null>(null);

  const getSuggestedPolicies = (url: string, name: string): PolicyTemplate[] => {
    const urlLower = url.toLowerCase();
    const nameLower = name.toLowerCase();
    
    if (urlLower.includes('/ai') || urlLower.includes('model') || urlLower.includes('rag') || 
        nameLower.includes('ai') || nameLower.includes('rag') || nameLower.includes('model')) {
      return POLICY_TEMPLATES.filter(t => 
        ['ai-prompt-pii-filtering', 'ai-prompt-toxicity-control', 'ai-model-query-rate-limiting'].includes(t.id)
      );
    }
    
    if (urlLower.includes('admin') || nameLower.includes('admin') || nameLower.includes('internal')) {
      return POLICY_TEMPLATES.filter(t => 
        ['role-based-sensitive-apis', 'ip-whitelist', 'auth-required'].includes(t.id)
      );
    }
    
    // General API suggestions
    return POLICY_TEMPLATES.filter(t => 
      ['rate-limiting-public', 'role-based-sensitive-apis', 'auth-required'].includes(t.id)
    );
  };

  const handleApplyAndActivate = async (template: PolicyTemplate) => {
    setApplying(template.id);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Policy Applied & Activated!",
        description: `"${template.title}" is now protecting ${resourceName}.`,
        duration: 4000,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApplying(null);
    }
  };

  const suggestedPolicies = getSuggestedPolicies(resourceUrl, resourceName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggested Policies for {resourceName}
          </DialogTitle>
          <DialogDescription>
            Based on your resource type, here are the most relevant security policies to get you started quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {suggestedPolicies.map((template) => {
            const isApplying = applying === template.id;
            
            return (
              <Card key={template.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        template.aiAware ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-primary/10'
                      }`}>
                        <Shield className={`h-4 w-4 ${
                          template.aiAware ? 'text-purple-600' : 'text-primary'
                        }`} />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {template.title}
                          {template.aiAware && (
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              <Brain className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                          {template.popular && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              Popular
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleApplyAndActivate(template)}
                        disabled={isApplying}
                        className="min-w-[120px]"
                      >
                        {isApplying ? (
                          <>
                            <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-2" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-2" />
                            Apply & Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Need something more specific? Use our Policy Builder for custom rules.
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
