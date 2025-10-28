
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplateCategory, TemplateSubCategory } from "../types";
import { CATEGORY_COLORS } from "@/data/mockData";

interface CategoryFilterProps {
  title: string;
  categories: (TemplateCategory | TemplateSubCategory)[];
  selectedCategories: (TemplateCategory | TemplateSubCategory)[];
  onToggleCategory: (category: TemplateCategory | TemplateSubCategory) => void;
}

export function CategoryFilter({
  title,
  categories,
  selectedCategories,
  onToggleCategory
}: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "bg-gray-100 text-gray-800 border-gray-200";
          
          return (
            <Badge 
              key={category} 
              variant="outline" 
              className={`cursor-pointer border rounded-full px-3 py-1 transition-colors hover:opacity-90 ${isSelected ? colorClass : 'bg-gray-50 text-gray-500 border-gray-200'}`}
              onClick={() => onToggleCategory(category)}
            >
              {category}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
