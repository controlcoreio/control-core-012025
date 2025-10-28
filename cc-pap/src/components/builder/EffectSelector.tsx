
import React from "react";
import { Button } from "@/components/ui/button";

export function EffectSelector({ value, onChange }: { value: "allow" | "deny", onChange: (val: "allow" | "deny") => void }) {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant={value === "allow" ? "default" : "outline"} onClick={() => onChange("allow")}>Allow</Button>
      <Button size="sm" variant={value === "deny" ? "default" : "outline"} onClick={() => onChange("deny")}>Deny</Button>
    </div>
  )
}
