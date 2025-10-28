
export interface PolicyTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  subcategory?: string;
  aiAware?: boolean;
  popular?: boolean;
  impact: 'high' | 'medium' | 'low' | 'critical';
  compliance?: string[];
  resourceTypes?: string[];
  smartSuggestions?: {
    basedOnResource?: boolean;
    basedOnPIP?: boolean;
    basedOnContext?: boolean;
  };
  template: {
    name: string;
    description: string;
    effect: 'allow' | 'deny' | 'log' | 'mask';
    conditions: Array<{
      attribute: string;
      operator: string;
      value: string;
    }>;
    actions: string[];
    priority: string;
    rateLimiting?: {
      limit: number;
      period: string;
      scope: string;
    };
    regoCode?: string;
    smartIntelligence?: {
      resourceAnalysis?: boolean;
      pipIntegration?: boolean;
      contextAware?: boolean;
    };
  };
}
