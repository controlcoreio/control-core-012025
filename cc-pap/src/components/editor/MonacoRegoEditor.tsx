import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useThemeContext } from '@/contexts/ThemeContext';
import { usePIPAttributes, PIPAttribute } from '@/hooks/use-pip-attributes';

interface MonacoRegoEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function MonacoRegoEditor({ 
  value, 
  onChange, 
  height = "400px", 
  readOnly = false 
}: MonacoRegoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useThemeContext();
  const { attributes: pipAttributes, loading: pipLoading } = usePIPAttributes();
  const [monacoInstance, setMonacoInstance] = useState<typeof import('monaco-editor') | null>(null);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Timeout to detect if Monaco is taking too long to load
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isEditorLoading) {
        console.warn('[MonacoRegoEditor] Monaco loading timeout - switching to fallback');
        setLoadError('Monaco Editor loading timeout');
        setIsEditorLoading(false);
        setUseFallback(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isEditorLoading]);
  
  // Update completion provider when PIP attributes are loaded
  useEffect(() => {
    if (monacoInstance && !pipLoading && pipAttributes.length > 0) {
      // Re-register completion provider with PIP attributes
      monacoInstance.languages.registerCompletionItemProvider('rego', {
        provideCompletionItems: (model, position) => {
          const pipSuggestions = pipAttributes.map(attr => ({
            label: attr.path,
            kind: monacoInstance.languages.CompletionItemKind.Field,
            insertText: attr.path,
            documentation: `${attr.description}\nType: ${attr.type}\nSource: ${attr.source}${attr.is_sensitive ? '\n⚠️ Sensitive field' : ''}`,
            detail: `PIP: ${attr.source}`,
            sortText: `1_${attr.label}` // Sort PIP attributes to top
          }));
          
          return { suggestions: pipSuggestions };
        }
      });
      
      // Register hover provider for PIP attributes
      monacoInstance.languages.registerHoverProvider('rego', {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position);
          if (!word) return null;
          
          // Check if it's a PIP attribute path
          const line = model.getLineContent(position.lineNumber);
          const wordIndex = line.indexOf(word.word);
          
          // Find matching PIP attribute
          const matchingAttr = pipAttributes.find(attr => 
            line.substring(Math.max(0, wordIndex - 50), wordIndex + word.word.length + 50).includes(attr.path)
          );
          
          if (matchingAttr) {
            return {
              contents: [
                { value: `**${matchingAttr.label}**` },
                { value: matchingAttr.description },
                { value: `**Source:** ${matchingAttr.source}` },
                { value: `**Type:** ${matchingAttr.type}` },
                { value: `**Source Field:** ${matchingAttr.source_field}` },
                ...(matchingAttr.last_sync ? [{ value: `**Last Synced:** ${new Date(matchingAttr.last_sync).toLocaleString()}` }] : []),
                ...(matchingAttr.is_sensitive ? [{ value: '⚠️ **Sensitive Data**' }] : [])
              ]
            };
          }
          
          return null;
        }
      });
    }
  }, [monacoInstance, pipAttributes, pipLoading]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    console.log('[MonacoRegoEditor] Editor mounting...', { editor, monaco });
    try {
      editorRef.current = editor;
      setMonacoInstance(monaco);
      setIsEditorLoading(false);
      setLoadError(null);
      console.log('[MonacoRegoEditor] Editor mounted successfully');

      // Register Rego language if not already registered
      if (!monaco.languages.getLanguages().find((lang: monaco.languages.ILanguageExtensionPoint) => lang.id === 'rego')) {
      monaco.languages.register({ id: 'rego' });

      // Define Rego language syntax highlighting
      monaco.languages.setMonarchTokensProvider('rego', {
        tokenizer: {
          root: [
            // Keywords
            [/\b(package|import|default|rule|allow|deny|if|else|not|some|every|in|as|with)\b/, 'keyword'],
            
            // Built-in functions
            [/\b(count|max|min|sum|sort|split|contains|startswith|endswith|regex|sprintf|format_int|to_number|type_name)\b/, 'keyword.function'],
            
            // Strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, 'string', '@string'],
            
            // Comments
            [/#.*$/, 'comment'],
            
            // Numbers
            [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
            [/\d+/, 'number'],
            
            // Operators
            [/[=!<>]=?/, 'operator'],
            [/[+*/-]/, 'operator'],
            
            // Brackets
            [/[{}()[\]]/, 'delimiter.bracket'],
            
            // Variables
            [/[a-zA-Z_]\w*/, 'identifier'],
          ],
          
          string: [
            [/[^\\"]+/, 'string'],
            [/\\./, 'string.escape.invalid'],
            [/"/, 'string', '@pop']
          ],
        },
      });

      // Define completion items for Rego
      monaco.languages.registerCompletionItemProvider('rego', {
        provideCompletionItems: () => {
          const suggestions = [
            {
              label: 'allow',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'allow = true {\n\t$0\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define an allow rule'
            },
            {
              label: 'deny',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'deny = true {\n\t$0\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a deny rule'
            },
            {
              label: 'package',
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: 'package $0',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Package declaration'
            },
            {
              label: 'input',
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: 'input.$0',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Input document'
            },
            {
              label: 'data',
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: 'data.$0',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Data document'
            },
            // Built-in functions
            {
              label: 'count',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'count($0)',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Returns the length of the object'
            },
            {
              label: 'contains',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'contains($1, $2)',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Returns true if the search string is contained in the string'
            },
            {
              label: 'startswith',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'startswith($1, $2)',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Returns true if the string begins with a prefix'
            }
          ];

          return { suggestions };
        }
      });

      // Add hover provider for built-in functions
      monaco.languages.registerHoverProvider('rego', {
        provideHover: (model: monaco.editor.ITextModel, position: monaco.Position) => {
          const word = model.getWordAtPosition(position);
          if (!word) return;

          const hoverContent: Record<string, string> = {
            'allow': 'Define a rule that evaluates to true to allow the request',
            'deny': 'Define a rule that evaluates to true to deny the request',
            'input': 'The input document containing request data',
            'data': 'The data document containing policy data',
            'count': 'Returns the number of elements in a collection',
            'contains': 'Returns true if search string is found in the target string',
            'startswith': 'Returns true if string starts with the given prefix'
          };

          if (hoverContent[word.word]) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${word.word}**` },
                { value: hoverContent[word.word] }
              ]
            };
          }
        }
      });
    }

    // Add validation markers for common Rego issues
    const validateRego = () => {
      const model = editor.getModel();
      const content = model.getValue();
      const markers = [];

      // Check for missing package declaration
      if (!content.includes('package ')) {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          message: 'Missing package declaration. Consider adding a package statement.'
        });
      }

      // Check for unclosed braces
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
          message: 'Mismatched braces detected'
        });
      }

      monaco.editor.setModelMarkers(model, 'rego', markers);
    };

      editor.onDidChangeModelContent(() => {
        validateRego();
      });

      // Initial validation
      validateRego();
    } catch (error) {
      console.error('Monaco editor initialization error:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to initialize editor');
      setIsEditorLoading(false);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  // Fallback to textarea if Monaco fails
  if (useFallback || loadError) {
    return (
      <div className="border rounded-md overflow-hidden">
        {loadError && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-xs text-yellow-800">
            Editor failed to load. Using fallback mode. Error: {loadError}
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className="w-full font-mono text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ height: height }}
          placeholder="Enter your Rego policy code here..."
        />
      </div>
    );
  }

  console.log('[MonacoRegoEditor] Rendering editor', { 
    isEditorLoading, 
    loadError, 
    useFallback, 
    height, 
    value: value?.substring(0, 50) + '...' 
  });

  // Simple test - if Monaco fails, show a textarea
  if (loadError) {
    console.error('[MonacoRegoEditor] Load error, using fallback:', loadError);
    return (
      <div className="border rounded-md overflow-hidden" style={{ height: height }}>
        <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-xs text-yellow-800">
          Monaco Editor failed to load. Using fallback mode. Error: {loadError}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          className="w-full font-mono text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ height: `calc(${height} - 40px)` }}
          placeholder="Enter your Rego policy code here..."
        />
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden relative" style={{ height: height }}>
      {isEditorLoading && (
        <div className="absolute inset-0 z-50 bg-white/90 dark:bg-gray-900/90 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-muted-foreground">Loading editor...</p>
          </div>
        </div>
      )}
      <Editor
        height={height}
        language="rego"
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onChange={handleEditorChange}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-muted-foreground">Loading Monaco Editor...</p>
            </div>
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          contextmenu: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: false
          },
          parameterHints: {
            enabled: true
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          acceptSuggestionOnCommitCharacter: true
        }}
        onMount={handleEditorDidMount}
        onLoadError={(error) => {
          console.error('[MonacoRegoEditor] Load error:', error);
          setLoadError(error.message || 'Failed to load Monaco Editor');
        }}
      />
    </div>
  );
}