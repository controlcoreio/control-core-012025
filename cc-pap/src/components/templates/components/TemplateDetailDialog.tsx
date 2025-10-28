
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScopeBadge } from "@/components/policies/components/ScopeBadge";
import { StatusBadge } from "@/components/policies/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Copy, X, Eye, Code } from "lucide-react";
import { Template } from "../types";
import { CATEGORY_COLORS } from "@/data/mockData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CodeHighlighter } from "@/components/editor/CodeHighlighter";
import { useTheme } from "@/hooks/use-theme";

interface TemplateDetailDialogProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: (template: Template) => void;
}

export function TemplateDetailDialog({
  template,
  isOpen,
  onClose,
  onCopy,
}: TemplateDetailDialogProps) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isCopying, setIsCopying] = useState(false);
  const [showPolicyCode, setShowPolicyCode] = useState(false);

  if (!template) return null;

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
      onClose();
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  // Sample Rego code for template demonstration
  const getSamplePolicyCode = (template: Template) => {
    return `package ${template.category.toLowerCase().replace(' ', '_')}.${template.name.toLowerCase().replace(/\s+/g, '_')}

import rego.v1

# ${template.description}
default allow := false

# Allow based on scope and roles
allow if {
    ${template.scope.map(scope => {
      const [type, value] = scope.split(': ');
      return `input.${type.toLowerCase().replace(' ', '_')} == "${value}"`;
    }).join('\n    ')}
}

# Additional conditions based on template category
${template.category === "Compliance" ? `
# Compliance-specific rules
allow if {
    input.user.compliance_training_completed == true
    input.action in ["read", "audit"]
}

# Deny sensitive operations without proper authorization
deny if {
    input.action in ["delete", "modify"]
    not input.user.authorized_for_sensitive_operations
}
` : template.category === "Security Framework" ? `
# Security framework rules
allow if {
    input.user.security_clearance >= required_clearance
    input.request.encrypted == true
}

# Rate limiting check
allow if {
    count(input.user.recent_requests) < 100
}
` : `
# Standard access control
allow if {
    input.user.role in ["user", "admin"]
    input.resource.public == true
}
`}

# Audit logging
audit_log := {
    "timestamp": time.now_ns(),
    "user": input.user.id,
    "action": input.action,
    "resource": input.resource.id,
    "allowed": allow
}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl mr-8">{template.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={template.status} />
            <Badge 
              variant="outline" 
              className={`${CATEGORY_COLORS[template.category]}`}
            >
              {template.category}
            </Badge>
            {template.subCategories.map(subCat => (
              <Badge 
                key={subCat} 
                variant="outline"
                className={`${CATEGORY_COLORS[subCat]}`}
              >
                {subCat}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Scope</h3>
            <div className="flex flex-wrap gap-2">
              {template.scope.map((scope) => (
                <ScopeBadge key={scope} label={scope} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Version</h3>
              <p>{template.version}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Date Added</h3>
              <p>{formatDate(template.dateAdded)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Last Modified</h3>
              <p>{formatDate(template.lastModified)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium">Modified By</h3>
              <p>{template.modifiedBy}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Policy Content</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPolicyCode(!showPolicyCode)}
                className="flex items-center gap-2"
              >
                {showPolicyCode ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                {showPolicyCode ? "Show Overview" : "View Policy Code"}
              </Button>
            </div>
            
            {showPolicyCode ? (
              <div className="rounded-md border overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b">
                  <span className="text-sm font-medium">Rego Policy Code (Read-Only)</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 overflow-auto max-h-96">
                  <CodeHighlighter 
                    code={getSamplePolicyCode(template)} 
                    isDark={theme === 'dark'} 
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-md border p-4 bg-gray-50 dark:bg-gray-800">
                <p className="italic text-muted-foreground">
                  This is a template policy content. When copied to your policies,
                  you will be able to edit and customize it to fit your specific needs.
                  {template.category === "Compliance" && (
                    " This template follows standard compliance requirements and best practices."
                  )}
                  {template.category === "Security Framework" && (
                    " This template implements security framework guidelines and controls."
                  )}
                  {template.category === "Industry Standard" && (
                    " This template aligns with industry standard practices for your domain."
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="default"
            onClick={handleCopy}
            disabled={isCopying}
          >
            <Copy className="h-4 w-4 mr-2" />
            {isCopying ? "Copying..." : "Copy to Policies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
