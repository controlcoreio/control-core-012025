
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorPane } from "./EditorPane";
import { useTheme } from "@/hooks/use-theme";

interface Environment {
  value: string;
  label: string;
}

interface EditorTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  code: string;
  setCode: (code: string) => void;
  policyName: string;
  version: string;
  environment: string;
  environments: Environment[];
  isDraftMode: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function EditorTabs({
  activeTab,
  setActiveTab,
  code,
  setCode,
  policyName,
  version,
  environment,
  environments,
  isDraftMode,
  textareaRef
}: EditorTabsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  console.log('EditorTabs rendering with activeTab:', activeTab);
  console.log('EditorTabs code length:', code.length);

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 flex-shrink-0 bg-muted">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-h-0">
          <TabsContent value="editor" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <EditorPane
              code={code}
              setCode={setCode}
              isDark={isDark}
              highlightCode={() => code}
              textareaRef={textareaRef}
            />
          </TabsContent>
          
          <TabsContent value="preview" className="h-full m-0 p-4 overflow-auto data-[state=active]:block">
            <div className="h-full border rounded-md p-4 bg-background">
              <h2 className="text-xl font-semibold mb-2">{policyName}</h2>
              <div className="rounded-md bg-muted p-4 mb-3">
                <p>
                  <span className="font-bold">Status:</span> <span className="text-green-600">{isDraftMode ? "Draft" : "Active"}</span>
                  <span className="ml-4 font-bold">Version:</span> <span>{version}</span>
                  <span className="ml-4 font-bold">Environment:</span> <span>{environments.find((env) => env.value === environment)?.label}</span>
                </p>
                <p className="mt-2 text-muted-foreground">This is a <b>sample preview</b> of how your policy will be represented in the system. No live evaluation.</p>
              </div>
              <div className="space-y-2 text-base">
                <div>
                  <span className="font-semibold">Controlled Resources: </span>
                  <span className="text-muted-foreground">/api/users/{"{id}"}, /api/reports</span>
                </div>
                <div>
                  <span className="font-semibold">Governing Roles: </span>
                  <span className="text-muted-foreground">Admin, Manager, User</span>
                </div>
                <div>
                  <span className="font-semibold">Special Conditions: </span>
                  <span className="text-muted-foreground">Business hours only, Valid session token required</span>
                </div>
                <div>
                  <span className="font-semibold">Sample Rule:</span>
                  <pre className="bg-gray-200 dark:bg-gray-800 rounded p-2 mt-1 font-mono overflow-x-auto text-sm">
{`allow {
  input.user.roles[_] == "admin"
}

allow {
  input.method == "GET"
  input.resource == "sensitive_data"
  user_in_group("data_team")
}`}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="docs" className="h-full m-0 p-4 overflow-auto data-[state=active]:block">
            <div className="h-full border rounded-md p-4 bg-background">
              <h2 className="text-lg font-bold mb-2">Documentation</h2>
              <div>
                <ul className="list-disc list-inside mb-3">
                  <li>
                    Use <b>Rego</b> to define OPA policies. See <a href="https://www.openpolicyagent.org/docs/latest/policy-language/" className="underline" target="_blank" rel="noopener noreferrer">OPA Rego Docs</a>.
                  </li>
                  <li>
                    <b>allow</b> and <b>deny</b> are special rules that determine access.
                  </li>
                  <li>
                    Use input variables to access request attributes like <code>input.user</code>, <code>input.method</code>, <code>input.resource</code>.
                  </li>
                  <li>
                    Write helper functions for complex logic (e.g., time-based access, group membership).
                  </li>
                </ul>
                <div className="mb-2 font-semibold">Sample Test Input:</div>
                <pre className="bg-gray-200 dark:bg-gray-800 rounded p-2 font-mono text-sm mb-4">
{`{
  "user": {
    "id": "user1",
    "roles": ["viewer"],
    "groups": ["data_team"]
  },
  "method": "GET",
  "resource": "sensitive_data"
}`}
                </pre>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Dark mode: <span>{isDark ? "Enabled" : "Disabled"}</span>
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
