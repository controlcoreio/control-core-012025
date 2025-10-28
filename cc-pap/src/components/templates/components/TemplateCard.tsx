
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Copy } from "lucide-react";
import { Template } from "../types";
import { CATEGORY_COLORS } from "@/data/mockData";
import { useState } from "react";
import { StatusBadge } from "@/components/policies/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: Template;
  onView: (template: Template) => void;
  onCopy: (template: Template) => void;
  className?: string;
}

export function TemplateCard({ template, onView, onCopy, className }: TemplateCardProps) {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      onCopy(template);
      toast({
        title: "Template Copied",
        description: `"${template.name}" has been copied to your Policies.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <StatusBadge status={template.status} />
          <Badge 
            variant="outline" 
            className={`${CATEGORY_COLORS[template.category]} text-xs`}
          >
            {template.category}
          </Badge>
        </div>
        <CardTitle className={cn("text-lg mt-2", className)}>
          {template.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 flex-grow">
        <div className="flex flex-wrap gap-1 mt-1">
          {template.subCategories.map(subCat => (
            <Badge 
              key={subCat} 
              variant="outline"
              className={`${CATEGORY_COLORS[subCat]} text-xs`}
            >
              {subCat}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-1 flex justify-between border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground text-xs px-2 py-1 h-7" 
          onClick={() => onView(template)}
        >
          <FileText className="w-3 h-3 mr-1" />
          View
        </Button>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleCopy}
          disabled={isCopying}
          className="text-xs px-2 py-1 h-7"
        >
          <Copy className="w-3 h-3 mr-1" />
          {isCopying ? "Copying..." : "Copy to Policies"}
        </Button>
      </CardFooter>
    </Card>
  );
}
