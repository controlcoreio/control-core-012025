
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Search, Zap } from "lucide-react";
import { PolicyTemplate } from "@/constants/policyTemplates";
import { ALL_POLICY_TEMPLATES } from "@/data/mockData";

interface PolicyTemplateLibraryProps {
  onTemplateSelect: (template: PolicyTemplate) => void;
  onCustomPolicy: () => void;
}

export function PolicyTemplateLibrary({ onTemplateSelect, onCustomPolicy }: PolicyTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter templates based on search and category
  const filteredTemplates = ALL_POLICY_TEMPLATES.filter(template => {
    const matchesSearch = searchQuery === "" || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(ALL_POLICY_TEMPLATES.map(t => t.category)))];

  // Sort templates: AI Security first, then by popularity
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (a.category === 'AI Security' && b.category !== 'AI Security') return -1;
    if (a.category !== 'AI Security' && b.category === 'AI Security') return 1;
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-purple-800 dark:text-purple-200">AI-First Security Templates</span>
        </div>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          {ALL_POLICY_TEMPLATES.length}+ pre-built templates covering AI security, compliance automation, 
          and access controls - designed for instant deployment and protection.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <Brain className="h-3 w-3 mr-1" />
            AI-Specific Protection
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Smart Intelligence
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Compliance Ready
          </Badge>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {sortedTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-md transition-all cursor-pointer group relative"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    template.aiAware 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Brain className={`h-5 w-5 ${
                      template.aiAware ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base leading-tight">{template.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.aiAware && (
                        <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                          <Brain className="h-3 w-3 mr-1" />
                          AI-Enhanced
                        </Badge>
                      )}
                      {template.smartSuggestions?.basedOnResource && (
                        <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Smart
                        </Badge>
                      )}
                      {template.compliance && template.compliance.length > 0 && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                          {template.compliance[0]}
                        </Badge>
                      )}
                      {template.popular && (
                        <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">
                          <Zap className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm leading-relaxed">
                {template.description}
              </CardDescription>
              
              {/* Smart Intelligence Features */}
              {template.smartSuggestions && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Smart Intelligence:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.smartSuggestions.basedOnResource && (
                      <Badge variant="outline" className="text-xs">
                        Resource Analysis
                      </Badge>
                    )}
                    {template.smartSuggestions.basedOnPIP && (
                      <Badge variant="outline" className="text-xs">
                        PIP Integration
                      </Badge>
                    )}
                    {template.smartSuggestions.basedOnContext && (
                      <Badge variant="outline" className="text-xs">
                        Context Aware
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Compliance Requirements */}
              {template.compliance && template.compliance.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Compliance:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.compliance.slice(0, 2).map((comp, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {comp}
                      </Badge>
                    ))}
                    {template.compliance.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.compliance.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={() => onTemplateSelect(template)}
                  className="flex-1"
                  size="sm"
                >
                  Apply & Activate
                </Button>
                <Button
                  onClick={() => onTemplateSelect(template)}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  Customize
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Policy Option */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="text-center p-8">
          <h4 className="font-semibold mb-2">Need something more specific?</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Build a custom policy from scratch using our visual policy builder.
          </p>
          <Button onClick={onCustomPolicy} variant="outline">
            Build Custom Policy
          </Button>
        </CardContent>
      </Card>

      {/* No Results */}
      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto opacity-50" />
          </div>
          <h4 className="font-semibold mb-2">No templates found</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or category filter.
          </p>
          <Button 
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
