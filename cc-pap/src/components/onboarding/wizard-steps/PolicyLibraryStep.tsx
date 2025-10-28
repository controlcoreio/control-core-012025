
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle,
  Brain,
  Info,
  Route
} from "lucide-react";
import { PolicyTemplate } from "@/constants/policyTemplates";
import { usePolicyTemplates } from "@/hooks/use-policies";
import { UnifiedPolicyBuilder } from "@/components/builder/UnifiedPolicyBuilder";
import { useToast } from "@/hooks/use-toast";

interface PolicyLibraryStepProps {
  pepData?: any;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export function PolicyLibraryStep({ pepData, onComplete, onNext }: PolicyLibraryStepProps) {
  const [completed, setCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPolicyBuilder, setShowPolicyBuilder] = useState(false);
  const [templateDataForBuilder, setTemplateDataForBuilder] = useState<any>(null);
  const { toast } = useToast();
  const { templates, isLoading } = usePolicyTemplates();

  // Set default category to 'ai-governance' when templates load (wizard only)
  useEffect(() => {
    if (templates.length > 0 && selectedCategory === null) {
      const hasAiGovernance = templates.some(t => t.category === 'ai-governance');
      if (hasAiGovernance) {
        setSelectedCategory('ai-governance');
      }
    }
  }, [templates, selectedCategory]);

  const handleCopyTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const templateConfig = {
        name: template.name,
        description: template.template_metadata?.summary || template.metadata?.summary || template.description,
        category: template.category,
        subcategory: template.subcategory,
        template_content: template.template_content,
        metadata: template.template_metadata || template.metadata,
        environment: 'sandbox',
        sandbox_status: 'enabled'
      };
      
      setTemplateDataForBuilder(templateConfig);
      setShowPolicyBuilder(true);
    }
  };

  const handleCustomPolicy = () => {
    setTemplateDataForBuilder(null);
    setShowPolicyBuilder(true);
  };

  const handlePolicyCreated = (policyData: any) => {
    setCompleted(true);
    onComplete(policyData);
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Loading policy templates...
      </div>
    );
  }

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  return (
    <div className="space-y-6">
      {!completed ? (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Templates ({templates.length})
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({templates.filter(t => t.category === category).length})
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-12">
                No templates found.
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card key={template.id} className="transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {template.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed line-clamp-3">
                      {template.template_metadata?.summary || template.metadata?.summary || template.description}
                    </CardDescription>
                    
                    {(template.template_metadata?.risk_level || template.metadata?.risk_level) && (
                      <Badge variant={
                        (template.template_metadata?.risk_level || template.metadata?.risk_level) === 'critical' ? 'destructive' :
                        (template.template_metadata?.risk_level || template.metadata?.risk_level) === 'high' ? 'default' :
                        'secondary'
                      } className="text-xs">
                        {(template.template_metadata?.risk_level || template.metadata?.risk_level).toUpperCase()} RISK
                      </Badge>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleCopyTemplate(template.id)}
                        className="flex-1"
                        size="sm"
                      >
                        Copy Control
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Custom Policy Option */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="text-center p-6">
              <h4 className="font-semibold mb-2">Need something more specific?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Build a custom policy from scratch using our visual policy builder.
              </p>
              <Button onClick={handleCustomPolicy} variant="outline">
                <Route className="h-4 w-4 mr-2" />
                Build Custom Policy
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="px-4">
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
                    <h4 className="text-lg font-medium text-green-800 dark:text-green-200">
                      Policy Created Successfully!
                    </h4>
                    <Badge variant="outline" className="text-purple-600 border-purple-300 whitespace-nowrap">
                      <Brain className="h-3 w-3 mr-1" />
                      AI-Enhanced
                    </Badge>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Your policy has been created and activated. This AI-enhanced policy provides real-time control over AI access and content filtering.
                  </p>
                </div>
                <Button onClick={onNext} size="lg">
                  Continue Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Policy Builder Modal */}
      <UnifiedPolicyBuilder
        open={showPolicyBuilder}
        onClose={() => {
          setShowPolicyBuilder(false);
          setTemplateDataForBuilder(null);
        }}
        mode="create"
        templateData={templateDataForBuilder}
        onboarding={true}
        onPolicyCreate={(policyData) => {
          handlePolicyCreated(policyData);
          setShowPolicyBuilder(false);
          toast({
            title: "Policy Created",
            description: `Policy "${policyData.name}" has been created successfully.`,
          });
        }}
      />
    </div>
  );
}
