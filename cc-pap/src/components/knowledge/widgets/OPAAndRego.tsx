import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export function OPAAndRego() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>OPA and Rego</CardTitle>
        <CardDescription>
          Introduction to Open Policy Agent and the Rego policy language
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Open Policy Agent (OPA)</h3>
          <p className="text-sm text-muted-foreground">
            OPA is an open-source, general-purpose policy engine that unifies policy enforcement across the stack. It provides a high-level declarative language (Rego) for specifying policy as code and simple APIs to offload policy decision-making.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Rego Language</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Rego is OPA's policy language. It's purpose-built for expressing policies over complex hierarchical data structures.
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Simple Rego Example</h4>
            <pre className="bg-zinc-950 text-zinc-50 p-3 rounded-md text-xs overflow-x-auto">
{`# Allow users to read their own documents
default allow = false

allow {
    input.method == "GET"
    input.path = ["documents", doc_id]
    doc_id == input.user.documents[_]
}`}
            </pre>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Key Concepts</h4>
            <ul className="text-sm space-y-1 list-disc pl-5">
              <li>Rules define policies as logical statements</li>
              <li>Declarative approach focuses on "what", not "how"</li>
              <li>Built-in functions for common operations</li>
              <li>Support for complex data querying</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Learn More</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a 
                  href="https://www.openpolicyagent.org/docs/latest/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  Official OPA Documentation
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://play.openpolicyagent.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  Rego Playground
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.openpolicyagent.org/docs/latest/policy-language/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:underline"
                >
                  Rego Policy Language Reference
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
