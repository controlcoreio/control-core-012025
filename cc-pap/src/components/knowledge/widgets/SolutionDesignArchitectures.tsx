
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Globe, 
  Database, 
  Shield, 
  Network, 
  Layers,
  Download,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

interface Architecture {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  integrationPoints: string[];
  benefits: string[];
  diagramDescription: string;
}

const architectures: Architecture[] = [
  {
    id: "microservices-api",
    title: "Microservices API Authorization",
    description: "Centralized authorization for distributed microservices architectures with API gateway integration.",
    icon: Network,
    color: "text-blue-500",
    integrationPoints: [
      "API Gateway via Smart Connection for centralized enforcement",
      "Microservice PEP SDK integration for service-to-service calls",
      "Service mesh sidecar proxy integration (Istio/Envoy)",
      "Container-level policy enforcement in Kubernetes clusters"
    ],
    benefits: [
      "Centralized policy management across all microservices",
      "Consistent authorization logic without code duplication",
      "Real-time contextual decisions based on service topology",
      "Reduced development overhead for authorization logic"
    ],
    diagramDescription: "API Gateway intercepts requests, consults PDP via Smart Connection, enforces decisions across microservices mesh"
  },
  {
    id: "data-lake-access",
    title: "Data Lake Access Control",
    description: "Fine-grained data access policies for big data platforms, data warehouses, and analytics workloads.",
    icon: Database,
    color: "text-green-500",
    integrationPoints: [
      "Data platform Smart Connection (Snowflake, Databricks, BigQuery)",
      "Query interceptor PEP for SQL/NoSQL databases",
      "Row-level and column-level security policy enforcement",
      "Data catalog integration for metadata-driven policies"
    ],
    benefits: [
      "Dynamic data access based on user context and data sensitivity",
      "Automated compliance with data governance regulations",
      "Real-time policy enforcement without data movement",
      "Audit trail for all data access decisions"
    ],
    diagramDescription: "Data queries intercepted by Smart Connection, evaluated against data classification policies, fine-grained access control applied"
  },
  {
    id: "ai-model-filtering",
    title: "AI Model Input/Output Filtering",
    description: "Authorization and content filtering for AI models, LLMs, and machine learning pipelines.",
    icon: Shield,
    color: "text-purple-500",
    integrationPoints: [
      "AI platform Smart Connection (OpenAI, Claude, Bedrock)",
      "Model API gateway with input/output content filtering",
      "Fine-tuning data access control during model training",
      "Real-time prompt injection and output toxicity filtering"
    ],
    benefits: [
      "Prevent unauthorized access to sensitive AI models",
      "Real-time content filtering for compliance and safety",
      "Contextual access based on user clearance and model sensitivity",
      "Audit trail for AI model usage and decisions"
    ],
    diagramDescription: "AI requests filtered through Smart Connection, content evaluated against safety policies, responses sanitized before delivery"
  },
  {
    id: "kubernetes-container",
    title: "Kubernetes Container Authorization",
    description: "Pod-level and namespace-level authorization for containerized applications and DevOps workflows.",
    icon: Layers,
    color: "text-orange-500",
    integrationPoints: [
      "Kubernetes admission controller integration",
      "Pod security policy enforcement via Smart Connection",
      "RBAC enhancement with dynamic contextual policies",
      "Service account and workload identity authorization"
    ],
    benefits: [
      "Dynamic pod scheduling based on security context",
      "Real-time workload authorization beyond static RBAC",
      "Automated compliance for container security standards",
      "Centralized policy management for multi-cluster environments"
    ],
    diagramDescription: "Kubernetes API server consults PDP via admission controller, pod deployment authorized based on security policies"
  },
  {
    id: "zero-trust-network",
    title: "Zero Trust Network Access",
    description: "Network-level authorization with continuous verification for remote access and internal network segments.",
    icon: Globe,
    color: "text-indigo-500",
    integrationPoints: [
      "VPN and ZTNA solution Smart Connection integration",
      "Network device policy enforcement via RADIUS/TACACS+",
      "Software-defined perimeter (SDP) authorization",
      "Continuous network access re-evaluation based on risk"
    ],
    benefits: [
      "Never trust, always verify network access model",
      "Dynamic network segmentation based on user context",
      "Real-time risk assessment for network access decisions",
      "Unified policy across cloud and on-premises networks"
    ],
    diagramDescription: "Network access requests evaluated by PDP, continuous verification enforced by network PEPs, dynamic segmentation applied"
  }
];

export function SolutionDesignArchitectures() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedArchitecture, setSelectedArchitecture] = useState<Architecture | null>(null);

  const handleDownloadDiagram = (architecture: Architecture) => {
    // This would trigger a download of the architecture diagram
    console.log(`Downloading diagram for ${architecture.title}`);
  };

  return (
    <>
      <Card className={cn(
        isDark ? "bg-sidebar border-border" : "bg-white border-[#90adc6]/20"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-xl",
            isDark ? "text-gray-200" : "text-[#333652]"
          )}>
            Solution Design Architectures
          </CardTitle>
          <CardDescription>
            Explore common solution architectures illustrating how our platform integrates with your existing infrastructure to provide dynamic authorization.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {architectures.map((architecture) => (
              <Card 
                key={architecture.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border",
                  isDark ? "hover:bg-muted/30" : "hover:bg-muted/20"
                )}
                onClick={() => setSelectedArchitecture(architecture)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isDark ? "bg-background" : "bg-white"
                    )}>
                      <architecture.icon className={cn("h-5 w-5", architecture.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-medium text-sm mb-1 leading-tight",
                        isDark ? "text-gray-200" : "text-[#333652]"
                      )}>
                        {architecture.title}
                      </h3>
                      <p className={cn(
                        "text-xs leading-tight",
                        isDark ? "text-gray-400" : "text-[#333652]/70"
                      )}>
                        {architecture.description}
                      </p>
                      <div className="flex items-center justify-end mt-2">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Detail Modal */}
      <Dialog open={!!selectedArchitecture} onOpenChange={() => setSelectedArchitecture(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArchitecture && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <selectedArchitecture.icon className={cn("h-6 w-6", selectedArchitecture.color)} />
                  {selectedArchitecture.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* High-Level Diagram */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Architecture Overview</h3>
                  <div className={cn(
                    "bg-muted/30 rounded-lg p-6 border-2 border-dashed",
                    isDark ? "border-muted" : "border-muted/60"
                  )}>
                    <div className="text-center space-y-2">
                      <selectedArchitecture.icon className={cn("h-16 w-16 mx-auto", selectedArchitecture.color)} />
                      <h4 className="font-medium">Architecture Diagram</h4>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {selectedArchitecture.diagramDescription}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        Interactive Diagram Coming Soon
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Key Integration Points */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Integration Points</h3>
                  <div className="space-y-2">
                    {selectedArchitecture.integrationPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedArchitecture.benefits.map((benefit, index) => (
                      <div key={index} className={cn(
                        "p-3 rounded-lg border",
                        isDark ? "bg-muted/20" : "bg-muted/10"
                      )}>
                        <div className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{benefit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadDiagram(selectedArchitecture)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Diagram
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Related How-To Guides
                  </Button>
                  <Button variant="outline">
                    <Network className="h-4 w-4 mr-2" />
                    Configure Smart Connections
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
