
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Route, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePolicyTemplates } from "@/hooks/use-policies";
import { TemplateDetailsModal } from "./TemplateDetailsModal";
import { UnifiedPolicyBuilder } from "../builder/UnifiedPolicyBuilder";
import { useToast } from "@/hooks/use-toast";

export function PolicyTemplatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { templates, isLoading } = usePolicyTemplates();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showPolicyBuilder, setShowPolicyBuilder] = useState(false);
  const [templateDataForBuilder, setTemplateDataForBuilder] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/policies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Controls
          </Button>
        </div>
            <div className="text-center text-muted-foreground">Loading control templates...</div>
      </div>
    );
  }

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const filteredTemplates = selectedCategory 
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const handleCopyTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      console.log('[PolicyTemplatesPage] Copy Control clicked for template:', template);
      
      // Prepare template data with full metadata
      const templateConfig = {
        name: template.name,
        description: template.template_metadata?.summary || template.metadata?.summary || template.description,
        category: template.category,
        subcategory: template.subcategory,
        template_content: template.template_content,
        metadata: template.template_metadata || template.metadata,
        // Set to sandbox mode by default
        environment: 'sandbox',
        sandbox_status: 'enabled'
      };
      
      console.log('[PolicyTemplatesPage] Template config prepared:', templateConfig);
      
      // Set template data first, then open builder after a small delay
      // This ensures state is updated before the builder opens
      setTemplateDataForBuilder(templateConfig);
      
      // Use setTimeout to ensure React has processed the state update
      setTimeout(() => {
        console.log('[PolicyTemplatesPage] Opening Policy Builder with template data');
        setShowPolicyBuilder(true);
      }, 50);
    } else {
      console.error('[PolicyTemplatesPage] Template not found with ID:', templateId);
      toast({
        title: "Template Not Found",
        description: "Could not load the selected template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (template: any) => {
    setSelectedTemplate(template);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Templates</h1>
          <p className="text-muted-foreground mt-1">
            High-impact controls with pre-built rules for immediate enforcement, protection and compliance
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No templates found. Load templates by running: python load_policy_templates.py
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
                    onClick={() => handleViewDetails(template)}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    More Details
                  </Button>
                </div>
                
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

      {/* Action Bar */}
      <div className="mt-8 pt-6 border-t flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Don't see what you need? Build a custom control from scratch.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/policies/builder')}>
          <Route className="h-4 w-4 mr-2" />
          Start Custom Builder
        </Button>
      </div>

      <TemplateDetailsModal
        template={selectedTemplate}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onCopyTemplate={handleCopyTemplate}
      />

      <UnifiedPolicyBuilder
        open={showPolicyBuilder}
        onClose={() => {
          console.log('[PolicyTemplatesPage] Closing Policy Builder');
          setShowPolicyBuilder(false);
          // Add a delay before clearing template data to ensure proper cleanup
          setTimeout(() => {
            setTemplateDataForBuilder(null);
          }, 100);
        }}
        mode="create"
        templateData={templateDataForBuilder}
        onPolicyCreate={(policyData) => {
          console.log('[PolicyTemplatesPage] Policy created:', policyData);
          toast({
            title: "Policy Created",
            description: `Policy "${policyData.name}" has been created from template.`,
          });
          setShowPolicyBuilder(false);
          setTimeout(() => {
            setTemplateDataForBuilder(null);
          }, 100);
        }}
      />
    </div>
  );
}
