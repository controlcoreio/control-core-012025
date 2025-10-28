import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";
import { Input } from "@/components/ui/input";

export function BranchList() {
  // Simulated/placeholder branch count
  return (
    <>
      <div className="flex items-center justify-between">
        <Input placeholder="Search branches..." className="max-w-sm" />
        <Button>
          <GitBranch className="mr-2 h-4 w-4" />
          New Branch
        </Button>
      </div>

      <Card>
        <CardHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Branches</CardTitle>
            <div className="text-sm text-muted-foreground">
              3 active branches
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <div className="space-y-4">
            {/* Active Branch */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">main</h3>
                    <div className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">active</div>
                  </div>
                  <p className="text-sm text-muted-foreground">Last updated 30 minutes ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
            {/* Other Branches */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">feature/resource-groups</h3>
                  <p className="text-sm text-muted-foreground">Last updated 2 days ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm">Merge</Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">feature/conditional-rules</h3>
                  <p className="text-sm text-muted-foreground">Last updated 5 days ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm">Merge</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
