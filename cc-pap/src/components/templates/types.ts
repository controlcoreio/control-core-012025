
export type TemplateCategory = "Compliance" | "Security Framework" | "Industry Standard";

export type TemplateSubCategory = 
  | "GDPR" 
  | "HIPAA" 
  | "SOC 2" 
  | "NIST" 
  | "ISO 27001" 
  | "PCI DSS" 
  | "Zero Trust"
  | "Healthcare"
  | "Finance"
  | "Education"
  | "Technology";

export interface Template {
  id: string;
  name: string;
  description: string;
  status: "enabled" | "disabled" | "draft";
  scope: string[];
  lastModified: string;
  modifiedBy: string;
  version: string;
  createdAt: string;
  createdBy: string;
  category: TemplateCategory;
  subCategories: TemplateSubCategory[];
  dateAdded: string;
  complexity?: string;
  estimatedTime?: string;
}

export interface TemplateFilters {
  search: string;
  categories: TemplateCategory[];
  subCategories: TemplateSubCategory[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}
