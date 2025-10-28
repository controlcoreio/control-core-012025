
import { Badge } from "@/components/ui/badge";
import { Status } from "../types";

export const StatusBadge = ({ status }: { status: Status }) => {
  const statusConfig = {
    enabled: { color: "bg-green-100 text-green-800", label: "Enabled" },
    disabled: { color: "bg-gray-100 text-gray-800", label: "Disabled" },
    archived: { color: "bg-yellow-100 text-yellow-800", label: "Archived" },
    draft: { color: "bg-blue-100 text-blue-800", label: "Draft" }
  };

  const config = statusConfig[status];

  return (
    <Badge className={config.color} variant="outline">
      {config.label}
    </Badge>
  );
};
