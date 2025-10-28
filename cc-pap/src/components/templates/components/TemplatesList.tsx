
import { Card } from "@/components/ui/card";
import { Template } from "../types";

interface TemplatesListProps {
  templates: Template[];
  onViewTemplate: (template: Template) => void;
  onCopyTemplate: (template: Template) => void;
}

export function TemplatesList({ templates, onViewTemplate, onCopyTemplate }: TemplatesListProps) {
  return (
    <Card>
      <div className="divide-y">
        {templates.map(template => (
          <div key={template.id} className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{template.name}</h3>
              <div className="flex gap-1">
                {template.subCategories.map(subCat => (
                  <span key={subCat} className="text-xs text-muted-foreground">
                    {subCat}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {template.description}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Version {template.version}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  className="text-xs text-primary hover:underline"
                  onClick={() => onViewTemplate(template)}
                >
                  View
                </button>
                <span className="text-xs text-muted-foreground">|</span>
                <button 
                  className="text-xs text-primary hover:underline"
                  onClick={() => onCopyTemplate(template)}
                >
                  Copy to Policies
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
