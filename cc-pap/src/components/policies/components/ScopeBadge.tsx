
import { Badge } from "@/components/ui/badge";

export const ScopeBadge = ({ label }: { label: string }) => {
  return (
    <Badge variant="secondary" className="mr-1 mb-1">
      {label}
    </Badge>
  );
};
