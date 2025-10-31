import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Code, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  FileCode,
  ExternalLink
} from "lucide-react";
import { MonacoRegoEditor } from "@/components/editor/MonacoRegoEditor";
import { useToast } from "@/hooks/use-toast";
import { SecureStorage } from "@/utils/secureStorage";

interface PolicyData {
  name: string;
  description: string;
  resourceId: string;
  bouncerId: string;
  effect: 'allow' | 'deny' | 'mask' | 'log';
  conditions: PolicyCondition[];
  regoCode: string;
  status: 'draft' | 'active';
}

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
  enabled: boolean;
}

interface RegalViolation {
  line: number;
  column: number;
  message: string;
  severity: string;
  rule: string;
  category: string;
}

interface PolicyCodeEditorProps {
  policyData: PolicyData;
  setPolicyData: (data: PolicyData) => void;
  onNext: () => void;
}

export function PolicyCodeEditor({ 
  policyData, 
  setPolicyData, 
  onNext 
}: PolicyCodeEditorProps) {
  const [code, setCode] = useState(policyData.regoCode || getDefaultRegoTemplate());
  const [regalViolations, setRegalViolations] = useState<RegalViolation[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{ errors: number; warnings: number } | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const { toast } = useToast();

  // Set editor as ready after a short delay to allow Monaco to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEditorReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Update code when policyData.regoCode changes (e.g., from template loading)
  useEffect(() => {
    console.log('[PolicyCodeEditor] policyData.regoCode changed:', policyData.regoCode);
    console.log('[PolicyCodeEditor] current code:', code);
    if (policyData.regoCode && policyData.regoCode !== code) {
      console.log('[PolicyCodeEditor] Updating code from template');
      setCode(policyData.regoCode);
    } else if (policyData.regoCode && !code) {
      // Handle case where regoCode is set but code is still empty (initial state)
      console.log('[PolicyCodeEditor] Setting initial code from template');
      setCode(policyData.regoCode);
    }
  }, [policyData.regoCode, code]);

  function getDefaultRegoTemplate() {
    return `package controlcore.${policyData.name.replace(/\s+/g, '_').toLowerCase() || 'policy'}

import rego.v1

# Control: ${policyData.name || 'New Control'}
# Description: ${policyData.description || 'Control description'}

default allow = false

# Main policy rule
allow {
  # Resource check
  input.resource_id == "${policyData.resourceId}"
  
  # Add your conditions here
  input.user.authenticated
  input.user.role in ["admin", "user"]
}

# Deny rules (optional)
deny {
  input.user.role == "guest"
}
`;
  }

  // Validate code with Regal on change (debounced)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (code.trim()) {
        validateWithRegal(code);
      }
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [code]);

  // Update policyData when code changes
  useEffect(() => {
    setPolicyData({ ...policyData, regoCode: code });
  }, [code]);

  // Regal Code Validation
  const validateWithRegal = async (code: string) => {
    setIsValidating(true);
    try {
      // Get auth token from SecureStorage
      const token = SecureStorage.getItem('access_token');
      
      // Skip validation if not authenticated
      if (!token) {
        console.info('[Code Editor] Validation requires authentication. Skipping.');
        setRegalViolations([]);
        setValidationSummary(null);
        setIsValidating(false);
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${baseUrl}/policies/validate-rego`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: code }) // Backend expects 'code', not 'rego_code'
      });

      // Check if backend is available
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.info('[Code Editor] Validation service not available - continuing without linting');
        setRegalViolations([]);
        setValidationSummary(null);
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setRegalViolations(result.violations || []);
        setValidationSummary(result.summary);
      } else if (response.status === 401) {
        // Not authenticated - degrade gracefully
        console.info('[Code Editor] Authentication required for validation');
        setRegalViolations([]);
        setValidationSummary(null);
      } else if (response.status === 404) {
        // Endpoint not available - degrade gracefully
        console.info('[Code Editor] Validation endpoint not available');
        setRegalViolations([]);
        setValidationSummary(null);
      } else {
        // Other error
        const error = await response.json();
        console.info('[Code Editor] Validation error:', error);
      }
    } catch (error) {
      console.info('[Code Editor] Validation unavailable:', error);
      // Degrade gracefully - just clear violations
      setRegalViolations([]);
      setValidationSummary(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const hasErrors = validationSummary && validationSummary.errors > 0;
  const hasWarnings = validationSummary && validationSummary.warnings > 0;

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Rego Code Editor</h3>
          {isValidating && (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Validating...
            </Badge>
          )}
          {!isValidating && validationSummary && (
            <>
              {hasErrors && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationSummary.errors} error{validationSummary.errors !== 1 ? 's' : ''}
                </Badge>
              )}
              {!hasErrors && hasWarnings && (
                <Badge variant="outline" className="text-xs bg-yellow-50">
                  <AlertCircle className="h-3 w-3 mr-1 text-yellow-600" />
                  {validationSummary.warnings} warning{validationSummary.warnings !== 1 ? 's' : ''}
                </Badge>
              )}
              {!hasErrors && !hasWarnings && (
                <Badge variant="outline" className="text-xs bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  No issues
                </Badge>
              )}
            </>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={() => validateWithRegal(code)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Validate
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('https://docs.controlcore.io/guides/rego-guidelines#advanced-rego-features', '_blank')}
          title="View advanced Rego patterns and examples"
        >
          <FileCode className="h-4 w-4 mr-2" />
          Advanced Guide
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Main Editor */}
      <div className="flex-1 overflow-hidden min-h-0">
        {!isEditorReady ? (
          <div className="h-full flex items-center justify-center bg-muted/20 rounded border">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium">Initializing Code Editor...</p>
              <p className="text-xs text-muted-foreground">Loading Monaco Editor with Rego support</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full">
            <MonacoRegoEditor
              value={code}
              onChange={handleCodeChange}
              height="100%"
            />
          </div>
        )}
      </div>

      {/* Linting Errors Panel */}
      {regalViolations.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto border rounded-lg p-4 space-y-2 bg-muted flex-shrink-0">
          <h5 className="font-medium text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Validation Issues ({regalViolations.length})
          </h5>
          <div className="space-y-2">
            {regalViolations.map((violation, index) => (
              <Alert 
                key={index} 
                variant={violation.severity === 'error' ? 'destructive' : 'default'}
                className="py-2"
              >
                <AlertDescription className="text-xs">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">
                      Line {violation.line}:{violation.column}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{violation.message}</p>
                      {violation.rule && (
                        <p className="text-muted-foreground mt-1">
                          Rule: {violation.rule} {violation.category && `(${violation.category})`}
                        </p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end pt-4 border-t mt-4 flex-shrink-0">
        <Button onClick={onNext} disabled={hasErrors}>
          Next: Preview
        </Button>
      </div>
    </div>
  );
}
