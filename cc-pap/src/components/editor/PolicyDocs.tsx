
import React from "react";

interface PolicyDocsProps {
  isDark: boolean;
}

export function PolicyDocs({ isDark }: PolicyDocsProps) {
  return (
    <section className="text-sm">
      <h2 className="text-lg font-bold mb-2">Documentation</h2>
      <div>
        <p>
          This section will provide documentation and help for writing OPA/Rego authorization policies.
        </p>
        <p className="mt-2">Dark mode: <span>{isDark ? "Enabled" : "Disabled"}</span></p>
      </div>
    </section>
  );
}
