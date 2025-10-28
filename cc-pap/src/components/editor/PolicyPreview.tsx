
import React from "react";

interface PolicyPreviewProps {
  policyName: string;
}

export function PolicyPreview({ policyName }: PolicyPreviewProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{policyName}</h2>
      <p className="text-muted-foreground mb-1">Policy preview not yet implemented.</p>
    </div>
  );
}
