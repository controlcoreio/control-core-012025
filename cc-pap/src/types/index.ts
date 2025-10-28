
export interface MockPolicy {
  id: string;
  name: string;
  description: string;
  status: "enabled" | "disabled" | "draft" | "archived";
  sandboxStatus: "enabled" | "disabled" | "draft" | "not-promoted";
  productionStatus: "enabled" | "disabled" | "not-promoted";
  scope: string[];
  createdBy: string;
  modifiedBy: string;
  createdAt: string;
  lastModified: string;
  version: string;
  effect: "allow" | "deny";
  resourceId: string;
  updatedAt: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  learnMoreLink?: string;
  actionPath?: string;
}

export type TemplateCategory = 'Compliance' | 'Security Framework' | 'Industry Standard';
export type TemplateSubCategory = 'GDPR' | 'HIPAA' | 'SOC 2' | 'NIST' | 'ISO 27001' | 'PCI DSS' | 'Zero Trust' | 'Healthcare' | 'Finance' | 'Education' | 'Technology';
