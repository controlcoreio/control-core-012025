
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import UserManagementTabs from "./users/UserManagementTabs";
import { SuperAdminRoute } from "@/components/common/SuperAdminRoute";

export default function UserManagementPage() {
  return (
    <SuperAdminRoute>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <UserManagementTabs />
      </div>
    </SuperAdminRoute>
  );
}
