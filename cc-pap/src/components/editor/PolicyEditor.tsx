
import { useState, useRef, useEffect } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { PolicyMetadata } from "./PolicyMetadata";
import { EditorTabs } from "./EditorTabs";
import { CAPAPanel } from "./CAPAPanel";
import { ENVIRONMENTS, SAMPLE_REGO_CODE } from "@/constants/editor";
import { useLocation } from "react-router-dom";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useUnsavedWorkRecovery } from "@/hooks/use-unsaved-work-recovery";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function PolicyEditor() {
  const location = useLocation();
  const builderState = location.state;
  const { toast } = useToast();

  // Initialize state from builder or defaults
  const [policyName, setPolicyName] = useState(
    builderState?.policyName || "Access Control Policy"
  );
  const [code, setCode] = useState(
    builderState?.initialCode || SAMPLE_REGO_CODE
  );
  const [activeTab, setActiveTab] = useState("editor");
  const [isDraftMode, setIsDraftMode] = useState(
    builderState?.isDraftMode || false
  );
  const [environment, setEnvironment] = useState(
    builderState?.environment || "sandbox"
  );
  const [version, setVersion] = useState("1.0");
  const [isCAPACollapsed, setIsCAPACollapsed] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Recovery for unsaved work
  const { hasUnsavedWork, restoreWork, discardWork } = useUnsavedWorkRecovery<{
    policyName: string;
    code: string;
    environment: string;
    version: string;
    isDraftMode: boolean;
  }>({
    storageKey: 'autosave_policy_editor',
  }, (data) => {
    setPolicyName(data.policyName);
    setCode(data.code);
    setEnvironment(data.environment);
    setVersion(data.version);
    setIsDraftMode(data.isDraftMode);
    toast({
      title: "Work Restored",
      description: "Your unsaved policy has been restored.",
    });
  });

  // Auto-save functionality
  const { lastSaved, isSaving, clearAutoSave } = useAutoSave(
    {
      policyName,
      code,
      environment,
      version,
      isDraftMode,
    },
    async (data) => {
      // Just save to storage, actual save happens on manual trigger
      console.log('Auto-saving policy editor state...', data);
    },
    {
      storageKey: 'autosave_policy_editor',
      enabled: true,
      interval: 30000, // 30 seconds
    }
  );

  // Debug logging
  useEffect(() => {
    console.log('PolicyEditor mounted with state:', builderState);
    console.log('PolicyEditor code:', code);
    console.log('PolicyEditor activeTab:', activeTab);
  }, [builderState, code, activeTab]);

  const handleSaveDraft = () => {
    console.log("Saving draft:", code);
    // Clear auto-save after successful manual save
    clearAutoSave();
    toast({
      title: "Draft Saved",
      description: "Your policy draft has been saved successfully.",
    });
  };

  const handleSavePolicy = () => {
    console.log("Saving policy to", environment, ":", code);
    // Clear auto-save after successful manual save
    clearAutoSave();
    toast({
      title: "Policy Saved",
      description: `Policy has been saved to ${environment}.`,
    });
  };

  const handleFormatCode = () => {
    console.log("Formatting code");
  };

  const handleInsertSuggestion = (snippet: string) => {
    if (!snippet) return;
    const start = editorRef.current?.selectionStart ?? code.length;
    const end = editorRef.current?.selectionEnd ?? code.length;
    setCode(c => 
      c.slice(0, start) + snippet + c.slice(end)
    );
    setTimeout(() => {
      editorRef.current?.focus();
    }, 50);
  };

  const handleToggleCAPACollapse = () => {
    setIsCAPACollapsed(!isCAPACollapsed);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Unsaved Work Recovery Banner */}
      {hasUnsavedWork && (
        <div className="flex-shrink-0 p-4 border-b bg-blue-50 dark:bg-blue-950">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>You have unsaved work from a previous session.</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={discardWork}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={restoreWork}
                >
                  Restore
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="flex-shrink-0 px-6 py-2 border-b bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {isSaving ? 'Saving...' : `Last auto-saved: ${lastSaved.toLocaleTimeString()}`}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-background">
        <PolicyMetadata
          policyName={policyName}
          setPolicyName={setPolicyName}
          version={version}
          environment={environment}
          setEnvironment={setEnvironment}
          isDraftMode={isDraftMode}
          setIsDraftMode={setIsDraftMode}
          environments={ENVIRONMENTS}
          onSaveDraft={handleSaveDraft}
          onSavePolicy={handleSavePolicy}
          onFormatCode={handleFormatCode}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel minSize={30} defaultSize={isCAPACollapsed ? 85 : 70}>
            <EditorTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              code={code}
              setCode={setCode}
              policyName={policyName}
              version={version}
              environment={environment}
              environments={ENVIRONMENTS}
              isDraftMode={isDraftMode}
              textareaRef={editorRef}
            />
          </Panel>
          
          {!isCAPACollapsed && (
            <PanelResizeHandle className="w-2 cursor-ew-resize bg-muted transition-colors hover:bg-primary/30" />
          )}
          
          <Panel 
            minSize={isCAPACollapsed ? 15 : 25} 
            maxSize={isCAPACollapsed ? 15 : 55} 
            defaultSize={isCAPACollapsed ? 15 : 30}
          >
            <CAPAPanel
              code={code}
              onInsertSuggestion={handleInsertSuggestion}
              isCollapsed={isCAPACollapsed}
              onToggleCollapse={handleToggleCAPACollapse}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
