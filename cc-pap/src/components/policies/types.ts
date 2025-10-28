
// Re-export types from centralized location
import type { MockPolicy } from "@/data/mockData";
export type { MockPolicy } from "@/data/mockData";

// Create Policy alias for backward compatibility
export type Policy = MockPolicy;

export type Status = "enabled" | "disabled" | "draft" | "archived";

export interface PolicyDialogProps {
  type: "view" | "delete" | "archive";
  policy: MockPolicy | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface EditPolicyDialogProps {
  policy: MockPolicy | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBuilder?: (policyId: number) => void;
  onOpenCodeEditor?: (policyId: number) => void;
}
