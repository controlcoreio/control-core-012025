import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export function ExternalResources() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controlcore Blog</CardTitle>
        <CardDescription>
          Access our latest articles, guides, and resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Visit the Controlcore blog for in-depth articles, guides, case studies, and best practices on dynamic authorization, policy-based access control, and related technologies.
        </p>
        
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Recent Blog Posts:</h4>
          <ul className="text-sm space-y-2">
            <li className="p-2 bg-background rounded border">
              <span className="block font-medium">Dynamic Authorization in Microservices Architectures</span>
              <span className="text-xs text-muted-foreground">Learn how to implement consistent access control across distributed services.</span>
            </li>
            <li className="p-2 bg-background rounded border">
              <span className="block font-medium">From RBAC to PBAC: A Migration Guide</span>
              <span className="text-xs text-muted-foreground">Strategies for evolving your access control model without disrupting operations.</span>
            </li>
            <li className="p-2 bg-background rounded border">
              <span className="block font-medium">Securing AI Systems with Policy-Based Controls</span>
              <span className="text-xs text-muted-foreground">How to implement guardrails for responsible AI using dynamic authorization.</span>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-center">
          <a 
            href="https://controlcore.biz/resources" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
          >
            Visit the Controlcore Blog
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
