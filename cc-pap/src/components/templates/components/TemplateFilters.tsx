
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CategoryFilter } from "./CategoryFilter";
import { TemplateCategory, TemplateSubCategory } from "../types";

interface TemplateFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategories: TemplateCategory[];
  selectedSubCategories: TemplateSubCategory[];
  onToggleCategory: (category: TemplateCategory | TemplateSubCategory) => void;
}

export function TemplateFilters({
  searchQuery,
  onSearchChange,
  selectedCategories,
  selectedSubCategories,
  onToggleCategory,
}: TemplateFiltersProps) {
  const ALL_TEMPLATE_CATEGORIES: TemplateCategory[] = [
    'Compliance',
    'Security Framework',
    'Industry Standard'
  ];

  const ALL_TEMPLATE_SUBCATEGORIES: TemplateSubCategory[] = [
    'GDPR',
    'HIPAA',
    'SOC 2',
    'NIST',
    'ISO 27001',
    'PCI DSS'
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
        <CardDescription>Refine template results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <CategoryFilter
          title="Categories"
          categories={ALL_TEMPLATE_CATEGORIES}
          selectedCategories={selectedCategories}
          onToggleCategory={onToggleCategory}
        />

        <CategoryFilter
          title="Standards & Frameworks"
          categories={ALL_TEMPLATE_SUBCATEGORIES}
          selectedCategories={selectedSubCategories}
          onToggleCategory={onToggleCategory}
        />
      </CardContent>
    </Card>
  );
}
