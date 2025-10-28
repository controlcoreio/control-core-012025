
import { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Edit, Check, X, Archive, Trash2, GitBranch, ArrowUp } from "lucide-react";
import { Policy } from "../types";
import { useEnvironment } from "@/contexts/EnvironmentContext";

interface PolicyActionsDropdownProps {
  policy: Policy;
  onActivate: () => void;
  onDeactivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onPromote: () => void;
  onReviewVersions: () => void;
}

export function PolicyActionsDropdown({
  policy,
  onActivate,
  onDeactivate,
  onArchive,
  onDelete,
  onPromote,
  onReviewVersions,
}: PolicyActionsDropdownProps) {
  const { currentEnvironment } = useEnvironment();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <ChevronDown size={16} />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[100] bg-popover text-popover-foreground border shadow-md">
        {policy.status === "enabled" ? (
          <DropdownMenuItem onClick={onDeactivate}>
            <X className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onActivate}>
            <Check className="mr-2 h-4 w-4" />
            Activate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onArchive}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
        {/* Only show promote option when in Sandbox environment and not yet promoted */}
        {currentEnvironment === 'sandbox' && !(policy as any).promoted_from_sandbox && (
          <DropdownMenuItem onClick={onPromote} className="text-blue-600 focus:text-blue-600">
            <ArrowUp className="mr-2 h-4 w-4" />
            Promote to Production
          </DropdownMenuItem>
        )}
        {/* Show promoted badge if already promoted */}
        {(policy as any).promoted_from_sandbox && (
          <DropdownMenuItem disabled className="text-green-600">
            <Check className="mr-2 h-4 w-4" />
            Already in Production
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onReviewVersions}>
          <GitBranch className="mr-2 h-4 w-4" />
          View Versions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
