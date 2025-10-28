
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Policy {
  id: string;
  name: string;
}

interface CompareVersionsModalProps {
  policy: Policy;
  fromVersion: string;
  toVersion: string;
  onClose: () => void;
}

// Mock comparison data - in real implementation, this would come from Git diff
const MOCK_COMPARISON = {
  summary: {
    filesChanged: 1,
    additions: 15,
    deletions: 8,
    modifications: 12
  },
  changes: [
    {
      type: "addition" as const,
      lineNumber: 25,
      content: `allow {
    input.user.role == "admin"
    input.resource.type == "sensitive_data"
    input.action == "read"
}`
    },
    {
      type: "deletion" as const,
      lineNumber: 18,
      content: `# Deprecated legacy rule
allow {
    input.user.legacy_access == true
}`
    },
    {
      type: "modification" as const,
      lineNumber: 42,
      oldContent: `rate_limit := 100`,
      newContent: `rate_limit := 250`
    }
  ]
};

export function CompareVersionsModal({ policy, fromVersion, toVersion, onClose }: CompareVersionsModalProps) {
  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case "addition": return "text-green-600 bg-green-50";
      case "deletion": return "text-red-600 bg-red-50";
      case "modification": return "text-blue-600 bg-blue-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Compare Versions: {policy.name}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{fromVersion}</Badge>
            <span>→</span>
            <Badge variant="outline">{toVersion}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{MOCK_COMPARISON.summary.filesChanged}</div>
                  <div className="text-sm text-muted-foreground">Files Changed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{MOCK_COMPARISON.summary.additions}</div>
                  <div className="text-sm text-muted-foreground">Additions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">~{MOCK_COMPARISON.summary.modifications}</div>
                  <div className="text-sm text-muted-foreground">Modifications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">-{MOCK_COMPARISON.summary.deletions}</div>
                  <div className="text-sm text-muted-foreground">Deletions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_COMPARISON.changes.map((change, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getChangeTypeColor(change.type)}>
                        {change.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Line {change.lineNumber}
                      </span>
                    </div>

                    {change.type === "modification" ? (
                      <div className="space-y-2">
                        <div className="bg-red-50 border-l-4 border-red-400 p-3">
                          <div className="text-sm text-red-700 font-mono">
                            - {change.oldContent}
                          </div>
                        </div>
                        <div className="bg-green-50 border-l-4 border-green-400 p-3">
                          <div className="text-sm text-green-700 font-mono">
                            + {change.newContent}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-l-4 p-3 ${
                        change.type === "addition" 
                          ? "bg-green-50 border-green-400" 
                          : "bg-red-50 border-red-400"
                      }`}>
                        <div className={`text-sm font-mono whitespace-pre-wrap ${
                          change.type === "addition" ? "text-green-700" : "text-red-700"
                        }`}>
                          {change.type === "addition" ? "+" : "-"} {change.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
