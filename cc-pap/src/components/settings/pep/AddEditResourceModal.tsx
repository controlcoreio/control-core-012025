import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { SecurityPostureConfig } from "./SecurityPostureConfig";
import { Shield, Info, Clock } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

interface Resource {
  id: number;
  name: string;
  url: string;
  original_host: string;
  original_host_production: string;
  default_security_posture: 'allow-all' | 'deny-all';
  auto_discovered: boolean;
  discovered_at?: string;
  bouncer_id?: number;
  business_context?: string;
  data_classification?: string;
  compliance_tags?: string[];
  cost_center?: string;
  owner_email?: string;
  owner_team?: string;
  sla_tier?: string;
  data_residency?: string;
  audit_level?: string;
}

interface AddEditResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingResourceId?: string | null;
  onSaveSuccess?: () => void;
}

export function AddEditResourceModal({ open, onOpenChange, editingResourceId, onSaveSuccess }: AddEditResourceModalProps) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [isAutoDiscovered, setIsAutoDiscovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Basic fields
  const [resourceName, setResourceName] = useState("");
  const [originalHost, setOriginalHost] = useState("");
  const [securityPosture, setSecurityPosture] = useState<'allow-all' | 'deny-all'>('deny-all');
  
  // Enrichment fields
  const [businessContext, setBusinessContext] = useState("");
  const [dataClassification, setDataClassification] = useState("");
  const [complianceTags, setComplianceTags] = useState<string[]>([]);
  const [costCenter, setCostCenter] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerTeam, setOwnerTeam] = useState("");
  const [slaTier, setSlaTier] = useState("");
  const [dataResidency, setDataResidency] = useState("");
  const [auditLevel, setAuditLevel] = useState("");

  useEffect(() => {
    if (editingResourceId && open) {
      fetchResource(editingResourceId);
    } else {
      resetForm();
    }
  }, [editingResourceId, open]);

  const fetchResource = async (resourceId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/v1/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch resource');
      }
      
      const data = await response.json();
      setResource(data);
      setIsAutoDiscovered(data.auto_discovered || false);
      
      // Load basic fields
      setResourceName(data.name || "");
      setOriginalHost(data.original_host || "");
      setSecurityPosture(data.default_security_posture || 'deny-all');
      
      // Load enrichment data
      setBusinessContext(data.business_context || "");
      setDataClassification(data.data_classification || "");
      setComplianceTags(data.compliance_tags || []);
      setCostCenter(data.cost_center || "");
      setOwnerEmail(data.owner_email || "");
      setOwnerTeam(data.owner_team || "");
      setSlaTier(data.sla_tier || "");
      setDataResidency(data.data_residency || "");
      setAuditLevel(data.audit_level || "");
    } catch (error) {
      console.error("Failed to fetch resource:", error);
      alert("Failed to load resource. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setResource(null);
    setIsAutoDiscovered(false);
    setResourceName("");
    setOriginalHost("");
    setSecurityPosture('deny-all');
    setBusinessContext("");
    setDataClassification("");
    setComplianceTags([]);
    setCostCenter("");
    setOwnerEmail("");
    setOwnerTeam("");
    setSlaTier("");
    setDataResidency("");
    setAuditLevel("");
  };

  const handleSave = async () => {
    if (!resource) return;
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const enrichmentData = {
        business_context: businessContext,
        data_classification: dataClassification,
        compliance_tags: complianceTags,
        cost_center: costCenter,
        owner_email: ownerEmail,
        owner_team: ownerTeam,
        sla_tier: slaTier,
        data_residency: dataResidency,
        audit_level: auditLevel,
      };

      const response = await fetch(`${APP_CONFIG.api.baseUrl}/api/v1/resources/${resource.id}/enrich`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(enrichmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to save enrichment');
      }

      onOpenChange(false);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error("Failed to save enrichment:", error);
      alert("Failed to save enrichment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecurityPostureChange = (posture: 'allow-all' | 'deny-all') => {
    setSecurityPosture(posture);
  };

  const handleComplianceTagToggle = (tag: string) => {
    setComplianceTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading resource...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAutoDiscovered && (
              <Badge className="bg-blue-600">Auto-Discovered</Badge>
            )}
            {isAutoDiscovered ? "Enrich Auto-Discovered Resource" : editingResourceId ? "Edit Resource" : "Add Resource"}
          </DialogTitle>
          <DialogDescription>
            {isAutoDiscovered 
              ? "This resource was auto-discovered from your bouncer. Add metadata to improve policy decisions and monitoring."
              : editingResourceId
              ? "Update the resource configuration."
              : "Configure a new resource to be protected by ControlCore."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-Discovery Info Banner */}
          {isAutoDiscovered && resource?.discovered_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Automatically discovered from bouncer</p>
                  <p className="text-blue-700 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {new Date(resource.discovered_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resource-name">Resource Name</Label>
                <Input
                  id="resource-name"
                  placeholder="MyCompany Customer API"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  disabled={isAutoDiscovered}
                  className={isAutoDiscovered ? "bg-muted" : ""}
                />
                {isAutoDiscovered && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Auto-discovered from bouncer configuration
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="original-host">Original Host</Label>
                <Input
                  id="original-host"
                  placeholder="api.mycompany.com"
                  value={originalHost}
                  onChange={(e) => setOriginalHost(e.target.value)}
                  disabled={isAutoDiscovered}
                  className={isAutoDiscovered ? "bg-muted" : ""}
                />
              </div>
            </div>

            {!isAutoDiscovered && (
              <SecurityPostureConfig
                resourceName={resourceName || "this resource"}
                currentPosture={securityPosture}
                onPostureChange={handleSecurityPostureChange}
              />
            )}
          </div>

          {/* Enrichment Fields */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Business Context & Enrichment</h4>
            
            <div className="space-y-2">
              <Label htmlFor="business-context">Business Description</Label>
              <Textarea
                id="business-context"
                placeholder="Describe the business purpose and use of this resource..."
                value={businessContext}
                onChange={(e) => setBusinessContext(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This helps with policy generation and documentation
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-classification">Data Classification</Label>
                <Select value={dataClassification} onValueChange={setDataClassification}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Affects default policy strictness
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sla-tier">SLA Tier</Label>
                <Select value={slaTier} onValueChange={setSlaTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SLA tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold (99.99%)</SelectItem>
                    <SelectItem value="silver">Silver (99.9%)</SelectItem>
                    <SelectItem value="bronze">Bronze (99%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Compliance Tags</Label>
              <div className="flex flex-wrap gap-2">
                {['GDPR', 'HIPAA', 'SOC2', 'PCI-DSS', 'ISO27001'].map(tag => (
                  <Badge
                    key={tag}
                    variant={complianceTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleComplianceTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to toggle compliance requirements
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-residency">Data Residency</Label>
                <Select value={dataResidency} onValueChange={setDataResidency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="eu">European Union</SelectItem>
                    <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                    <SelectItem value="multi-region">Multi-Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audit-level">Audit Level</Label>
                <Select value={auditLevel} onValueChange={setAuditLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audit level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner-email">Owner Email</Label>
                <Input
                  id="owner-email"
                  type="email"
                  placeholder="owner@company.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="owner-team">Owner Team</Label>
                <Input
                  id="owner-team"
                  placeholder="Platform Engineering"
                  value={ownerTeam}
                  onChange={(e) => setOwnerTeam(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost-center">Cost Center</Label>
              <Input
                id="cost-center"
                placeholder="Engineering-API-Services"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : (isAutoDiscovered ? "Save Enrichment" : editingResourceId ? "Update Resource" : "Add Resource")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
