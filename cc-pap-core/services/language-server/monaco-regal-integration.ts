/**
 * Monaco-Regal Integration
 * 
 * Integrates Monaco Editor with Regal LSP for advanced Rego policy development.
 * This replaces custom providers with Regal's official language server capabilities.
 */

import type * as Monaco from 'monaco-editor';
import { RegalLSPProxy } from './regal-lsp-proxy';

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Diagnostic {
  range: Range;
  message: string;
  severity: number;
  source?: string;
  code?: string | number;
}

export interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

/**
 * Configure Monaco Editor to use Regal LSP
 */
export class MonacoRegalIntegration {
  private monaco: typeof Monaco;
  private regalLSP: RegalLSPProxy;
  private documentUri: string;
  private documentVersion: number = 0;
  private diagnosticsDisposable: Monaco.IDisposable | null = null;

  constructor(monaco: typeof Monaco, regalLSP: RegalLSPProxy, documentUri: string = 'inmemory://policy.rego') {
    this.monaco = monaco;
    this.regalLSP = regalLSP;
    this.documentUri = documentUri;
    
    // Listen for diagnostics from Regal
    this.setupDiagnostics();
  }

  /**
   * Setup diagnostic handling from Regal LSP
   */
  private setupDiagnostics(): void {
    this.regalLSP.on('notification-textDocument/publishDiagnostics', (params: any) => {
      if (params.uri === this.documentUri) {
        this.updateDiagnostics(params.diagnostics);
      }
    });
  }

  /**
   * Notify Regal about document open
   */
  async didOpen(content: string, languageId: string = 'rego'): Promise<void> {
    this.regalLSP.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri: this.documentUri,
        languageId,
        version: this.documentVersion,
        text: content
      }
    });
  }

  /**
   * Notify Regal about document changes
   */
  async didChange(content: string): Promise<void> {
    this.documentVersion++;
    this.regalLSP.sendNotification('textDocument/didChange', {
      textDocument: {
        uri: this.documentUri,
        version: this.documentVersion
      },
      contentChanges: [
        {
          text: content
        }
      ]
    });
  }

  /**
   * Notify Regal about document close
   */
  async didClose(): Promise<void> {
    this.regalLSP.sendNotification('textDocument/didClose', {
      textDocument: {
        uri: this.documentUri
      }
    });
  }

  /**
   * Request completions from Regal
   */
  async getCompletions(position: Position): Promise<CompletionItem[]> {
    try {
      const result = await this.regalLSP.sendRequest('textDocument/completion', {
        textDocument: { uri: this.documentUri },
        position
      });

      if (!result) {
        return [];
      }

      const items = Array.isArray(result) ? result : result.items || [];
      return items;
    } catch (error) {
      console.error('Completion request failed:', error);
      return [];
    }
  }

  /**
   * Request hover information from Regal
   */
  async getHover(position: Position): Promise<any> {
    try {
      const result = await this.regalLSP.sendRequest('textDocument/hover', {
        textDocument: { uri: this.documentUri },
        position
      });
      return result;
    } catch (error) {
      console.error('Hover request failed:', error);
      return null;
    }
  }

  /**
   * Request definition location from Regal
   */
  async getDefinition(position: Position): Promise<any> {
    try {
      const result = await this.regalLSP.sendRequest('textDocument/definition', {
        textDocument: { uri: this.documentUri },
        position
      });
      return result;
    } catch (error) {
      console.error('Definition request failed:', error);
      return null;
    }
  }

  /**
   * Request formatting from Regal
   */
  async format(): Promise<any> {
    try {
      const result = await this.regalLSP.sendRequest('textDocument/formatting', {
        textDocument: { uri: this.documentUri },
        options: {
          tabSize: 2,
          insertSpaces: true
        }
      });
      return result;
    } catch (error) {
      console.error('Formatting request failed:', error);
      return null;
    }
  }

  /**
   * Update Monaco diagnostics from Regal diagnostics
   */
  private updateDiagnostics(diagnostics: Diagnostic[]): void {
    const model = this.monaco.editor.getModels().find(m => m.uri.toString() === this.documentUri);
    if (!model) {
      return;
    }

    const markers: Monaco.editor.IMarkerData[] = diagnostics.map(diagnostic => ({
      severity: this.convertSeverity(diagnostic.severity),
      startLineNumber: diagnostic.range.start.line + 1,
      startColumn: diagnostic.range.start.character + 1,
      endLineNumber: diagnostic.range.end.line + 1,
      endColumn: diagnostic.range.end.character + 1,
      message: diagnostic.message,
      source: diagnostic.source || 'regal',
      code: diagnostic.code?.toString()
    }));

    this.monaco.editor.setModelMarkers(model, 'regal', markers);
  }

  /**
   * Convert LSP severity to Monaco severity
   */
  private convertSeverity(lspSeverity: number): Monaco.MarkerSeverity {
    switch (lspSeverity) {
      case 1: return this.monaco.MarkerSeverity.Error;
      case 2: return this.monaco.MarkerSeverity.Warning;
      case 3: return this.monaco.MarkerSeverity.Info;
      case 4: return this.monaco.MarkerSeverity.Hint;
      default: return this.monaco.MarkerSeverity.Error;
    }
  }

  /**
   * Register Monaco providers for Regal
   */
  registerProviders(): Monaco.IDisposable[] {
    const disposables: Monaco.IDisposable[] = [];

    // Completion provider
    disposables.push(
      this.monaco.languages.registerCompletionItemProvider('rego', {
        provideCompletionItems: async (model, position) => {
          const pos = {
            line: position.lineNumber - 1,
            character: position.column - 1
          };

          const items = await this.getCompletions(pos);
          
          return {
            suggestions: items.map(item => ({
              label: item.label,
              kind: item.kind,
              detail: item.detail,
              documentation: item.documentation,
              insertText: item.insertText || item.label,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }))
          };
        }
      })
    );

    // Hover provider
    disposables.push(
      this.monaco.languages.registerHoverProvider('rego', {
        provideHover: async (model, position) => {
          const pos = {
            line: position.lineNumber - 1,
            character: position.column - 1
          };

          const hover = await this.getHover(pos);
          if (!hover || !hover.contents) {
            return null;
          }

          const contents = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
          
          return {
            contents: contents.map((c: any) => ({
              value: typeof c === 'string' ? c : c.value
            })),
            range: hover.range ? {
              startLineNumber: hover.range.start.line + 1,
              startColumn: hover.range.start.character + 1,
              endLineNumber: hover.range.end.line + 1,
              endColumn: hover.range.end.character + 1
            } : undefined
          };
        }
      })
    );

    // Definition provider
    disposables.push(
      this.monaco.languages.registerDefinitionProvider('rego', {
        provideDefinition: async (model, position) => {
          const pos = {
            line: position.lineNumber - 1,
            character: position.column - 1
          };

          const definition = await this.getDefinition(pos);
          if (!definition) {
            return null;
          }

          const definitions = Array.isArray(definition) ? definition : [definition];
          
          return definitions.map((def: any) => ({
            uri: this.monaco.Uri.parse(def.uri),
            range: {
              startLineNumber: def.range.start.line + 1,
              startColumn: def.range.start.character + 1,
              endLineNumber: def.range.end.line + 1,
              endColumn: def.range.end.character + 1
            }
          }));
        }
      })
    );

    // Document formatting provider
    disposables.push(
      this.monaco.languages.registerDocumentFormattingEditProvider('rego', {
        provideDocumentFormattingEdits: async (model) => {
          const edits = await this.format();
          if (!edits) {
            return [];
          }

          return edits.map((edit: any) => ({
            range: {
              startLineNumber: edit.range.start.line + 1,
              startColumn: edit.range.start.character + 1,
              endLineNumber: edit.range.end.line + 1,
              endColumn: edit.range.end.character + 1
            },
            text: edit.newText
          }));
        }
      })
    );

    return disposables;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.diagnosticsDisposable) {
      this.diagnosticsDisposable.dispose();
    }
    this.didClose();
  }
}

