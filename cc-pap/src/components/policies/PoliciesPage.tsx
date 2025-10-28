import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus,
  Loader2,
  FileText
} from "lucide-react";
import { UnifiedPolicyBuilder } from "../builder/UnifiedPolicyBuilder";
import { PolicyDialog } from "./components/PolicyDialog";
import { PolicyActionsDropdown } from "./components/PolicyActionsDropdown";
import { PolicyVersionsModal } from "./PolicyVersionsModal";
import { PolicyPromotionModal } from "./PolicyPromotionModal";
import { StatusBadge } from "./components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { Policy, PolicyDialogProps } from "./types";
import { useNavigate } from "react-router-dom";
import { usePolicies, useDeletePolicy, useEnablePolicy, useDisablePolicy } from "../../services/useApi";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import type { Policy as ApiPolicy } from "../../services/api";

export function PoliciesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [showPolicyBuilder, setShowPolicyBuilder] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);
  const [selectedPolicyForVersions, setSelectedPolicyForVersions] = useState<Policy | null>(null);
  const [showPolicyPromotion, setShowPolicyPromotion] = useState(false);
  const [selectedPolicyForPromotion, setSelectedPolicyForPromotion] = useState<Policy | null>(null);
  const [policyDialog, setPolicyDialog] = useState<PolicyDialogProps>({
    type: "view",
    policy: null,
    isOpen: false,
    onClose: () => {},
    onConfirm: () => {}
  });
  const [versionsModal, setVersionsModal] = useState<{
    policy: Policy | null;
    isOpen: boolean;
  }>({
    policy: null,
    isOpen: false
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentEnvironment, canCreatePolicies, canPromotePolicies, isProduction } = useEnvironment();

  // API hooks - fetch policies filtered by current environment
  const { data: policiesData, isLoading, error, refetch } = usePolicies({ 
    environment: currentEnvironment 
  });
  const deletePolicyMutation = useDeletePolicy();
  const enablePolicyMutation = useEnablePolicy();
  const disablePolicyMutation = useDisablePolicy();

  // Convert API data to component format
  const policies: Policy[] = policiesData?.data || [];

  // Handle API errors - use useEffect to avoid render-phase state updates
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load policies. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handlePolicyClick = (policy: Policy) => {
    navigate(`/policies/builder?mode=edit&policyId=${policy.id}`);
  };

  const handlePolicyPromote = async (policy: Policy, options: { createPullRequest: boolean; commitMessage: string; targetBranch: string }) => {
    try {
      // TODO: Implement API call to promote policy to GitHub repository
      // This would typically:
      // 1. Copy the policy from sandbox to production
      // 2. Create a commit in the GitHub repository
      // 3. Optionally create a pull request
      // 4. Update the backend with the new production policy
      
      console.log('Promoting policy:', policy.name, 'with options:', options);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Policy Promoted",
        description: `Policy "${policy.name}" has been successfully promoted to Production and committed to GitHub repository.`,
      });
      
      // Refresh policies list
      refetch();
    } catch (error) {
      throw error;
    }
  };


  const handlePolicyAction = async (action: string, policy: Policy) => {
    try {
      switch (action) {
        case "activate":
          await enablePolicyMutation.mutateAsync(policy.id);
          toast({
            title: "Policy Activated",
            description: `${policy.name} has been activated.`
          });
          break;
        case "deactivate":
          await disablePolicyMutation.mutateAsync(policy.id);
          toast({
            title: "Policy Deactivated", 
            description: `${policy.name} has been deactivated.`
          });
          break;
      case "archive":
        setPolicyDialog({
          type: "archive",
          policy,
          isOpen: true,
          onClose: () => setPolicyDialog(prev => ({ ...prev, isOpen: false })),
          onConfirm: () => {
            toast({
              title: "Policy Archived",
              description: `${policy.name} has been archived.`
            });
            setPolicyDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
        break;
      case "delete":
        setPolicyDialog({
          type: "delete",
          policy,
          isOpen: true,
          onClose: () => setPolicyDialog(prev => ({ ...prev, isOpen: false })),
          onConfirm: async () => {
            await deletePolicyMutation.mutateAsync(policy.id);
            toast({
              title: "Policy Deleted",
              description: `${policy.name} has been deleted.`
            });
            setPolicyDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
        break;
      case "promote":
        setSelectedPolicyForPromotion(policy);
        setShowPolicyPromotion(true);
        break;
      case "versions":
        setSelectedPolicyForVersions(policy);
        setShowVersionManager(true);
        break;
      default:
        break;
    }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} policy. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const filteredPolicies = policies.filter(policy =>
    policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Controls</h1>
          <p className="text-muted-foreground">
            Manage your authorization controls and access policies
          </p>
          {isProduction && (
            <Badge variant="outline" className="mt-2 bg-red-100 text-red-800 border-red-200">
              Production: Policies are read-only. Create new policies in Sandbox.
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/policies/templates')}>
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </Button>
          {canCreatePolicies ? (
            <Button onClick={() => setShowPolicyBuilder(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Control
            </Button>
          ) : (
            <Button disabled title="Policies can only be created in Sandbox environment">
              <Plus className="mr-2 h-4 w-4" />
              Create Control
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search controls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Environment</th>
                  <th className="text-left p-4">Resource</th>
                  <th className="text-left p-4">Version</th>
                  <th className="text-left p-4">Last Modified</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <button
                          onClick={() => handlePolicyClick(policy)}
                          className="font-medium text-left hover:text-primary cursor-pointer transition-colors"
                        >
                          {policy.name}
                        </button>
                        <div className="text-sm text-muted-foreground">
                          {policy.description}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={policy.status} />
                    </td>
                    <td className="p-4">
                      {(policy as any).environment === "both" || (policy as any).promoted_from_sandbox ? (
                        <div className="flex gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                            Sandbox
                          </Badge>
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs">
                            Production
                          </Badge>
                        </div>
                      ) : (policy as any).environment === "production" ? (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Production
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Sandbox
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{policy.resourceId}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{policy.version}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{new Date(policy.lastModified).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">by {policy.modifiedBy}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <PolicyActionsDropdown
                        policy={policy}
                        onActivate={() => handlePolicyAction("activate", policy)}
                        onDeactivate={() => handlePolicyAction("deactivate", policy)}
                        onArchive={() => handlePolicyAction("archive", policy)}
                        onDelete={() => handlePolicyAction("delete", policy)}
                        onPromote={() => handlePolicyAction("promote", policy)}
                        onReviewVersions={() => handlePolicyAction("versions", policy)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UnifiedPolicyBuilder
        open={showPolicyBuilder}
        onClose={() => setShowPolicyBuilder(false)}
        mode="create"
        onPolicyCreate={(policyData) => {
          toast({
            title: "Policy Created",
            description: `Policy "${policyData.name}" has been created successfully.`,
          });
          setShowPolicyBuilder(false);
          refetch();
        }}
      />

      <PolicyDialog
        type={policyDialog.type}
        policy={policyDialog.policy}
        isOpen={policyDialog.isOpen}
        onClose={policyDialog.onClose}
        onConfirm={policyDialog.onConfirm}
      />

      <PolicyVersionsModal
        policy={versionsModal.policy}
        isOpen={versionsModal.isOpen}
        onClose={() => setVersionsModal({ policy: null, isOpen: false })}
      />


      {/* Policy Promotion Modal */}
      {selectedPolicyForPromotion && (
        <PolicyPromotionModal
          policy={selectedPolicyForPromotion}
          isOpen={showPolicyPromotion}
          onClose={() => {
            setShowPolicyPromotion(false);
            setSelectedPolicyForPromotion(null);
          }}
          onPromote={handlePolicyPromote}
        />
      )}

      {showVersionManager && selectedPolicyForVersions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Policy Versions</h2>
              <Button variant="outline" onClick={() => setShowVersionManager(false)}>
                Close
              </Button>
            </div>
            <PolicyVersionManager
              policyId={selectedPolicyForVersions.id}
              currentEnvironment={currentEnvironment}
              onVersionSelect={(version) => {
                toast({
                  title: "Version Selected",
                  description: `Selected version ${version.version}`,
                });
              }}
              onVersionRevert={(version) => {
                toast({
                  title: "Version Reverted",
                  description: `Reverted to version ${version.version}`,
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
