
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Policy } from "../types";

interface EnvironmentStatusColumnProps {
  policy: Policy;
}

// Mock environment statuses for each policy
const getEnvironmentStatuses = (policyId: string) => {
  // This would normally come from an API call
  const mockStatuses = {
    development: { active: true, version: "v1.2.0", lastDeployed: "2024-06-02" },
    qa: { active: true, version: "v1.1.0", lastDeployed: "2024-06-01" },
    staging: { active: false, version: "", lastDeployed: "" },
    production: { active: true, version: "v1.0.0", lastDeployed: "2024-05-30" }
  };

  // Vary statuses based on policy ID for demo purposes
  if (policyId === "1") {
    return {
      development: { active: true, version: "v1.3.0", lastDeployed: "2024-06-02" },
      qa: { active: true, version: "v1.2.0", lastDeployed: "2024-06-01" },
      staging: { active: true, version: "v1.1.0", lastDeployed: "2024-05-31" },
      production: { active: true, version: "v1.0.0", lastDeployed: "2024-05-30" }
    };
  }
  
  return mockStatuses;
};

export function EnvironmentStatusColumn({ policy }: EnvironmentStatusColumnProps) {
  const statuses = getEnvironmentStatuses(policy.id);

  const environments = [
    { key: "development", label: "Dev", color: "bg-blue-500" },
    { key: "qa", label: "QA", color: "bg-yellow-500" },
    { key: "staging", label: "Stg", color: "bg-orange-500" },
    { key: "production", label: "Prod", color: "bg-red-500" }
  ];

  return (
    <div className="flex items-center gap-1">
      {environments.map((env) => {
          const status = statuses[env.key as keyof typeof statuses];
          return (
            <Tooltip key={env.key}>
              <TooltipTrigger>
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.active ? env.color : "bg-gray-300"
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">{env.label}</div>
                  {status.active ? (
                    <>
                      <div>Active: {status.version}</div>
                      <div>Deployed: {status.lastDeployed}</div>
                    </>
                  ) : (
                    <div>Not deployed</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
}
