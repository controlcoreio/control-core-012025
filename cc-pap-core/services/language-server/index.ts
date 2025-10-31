import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  DocumentSymbolParams,
  SymbolInformation,
  SymbolKind,
  Hover,
  MarkupContent,
  MarkupKind,
  DefinitionParams,
  Location,
  Range,
  Position
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { RegoParser } from './rego-parser';
import { RegoValidator } from './rego-validator';
import { RegoCompleter } from './rego-completer';
import { RegoSymbolProvider } from './rego-symbol-provider';
import { RegoHoverProvider } from './rego-hover-provider';
import { RegoDefinitionProvider } from './rego-definition-provider';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Initialize language server components
const parser = new RegoParser();
const validator = new RegoValidator();
const completer = new RegoCompleter();
const symbolProvider = new RegoSymbolProvider();
const hoverProvider = new RegoHoverProvider();
const definitionProvider = new RegoDefinitionProvider();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', ':', '(', '[', '{']
      },
      // Tell the client that this server supports document symbols
      documentSymbolProvider: true,
      // Tell the client that this server supports hover
      hoverProvider: true,
      // Tell the client that this server supports go to definition
      definitionProvider: true
    }
  };

  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }

  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// The content of a text document has changed
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  try {
    // Parse the Rego document
    const ast = parser.parse(text);
    
    // Validate the document
    const validationErrors = validator.validate(ast, text);
    
    // Convert validation errors to diagnostics
    validationErrors.forEach(error => {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: textDocument.positionAt(error.start),
          end: textDocument.positionAt(error.end)
        },
        message: error.message,
        source: 'rego-ls'
      };
      
      if (hasDiagnosticRelatedInformationCapability && error.related) {
        diagnostic.relatedInformation = error.related.map(rel => ({
          location: {
            uri: textDocument.uri,
            range: {
              start: textDocument.positionAt(rel.start),
              end: textDocument.positionAt(rel.end)
            }
          },
          message: rel.message
        }));
      }
      
      diagnostics.push(diagnostic);
    });
  } catch (error) {
    // Handle parsing errors
    const diagnostic: Diagnostic = {
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 }
      },
      message: `Parse error: ${error}`,
      source: 'rego-ls'
    };
    diagnostics.push(diagnostic);
  }

  // Send the computed diagnostics to VSCode
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Provide completion items
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const document = documents.get(_textDocumentPosition.textDocument.uri);
  if (!document) return [];

  const position = _textDocumentPosition.position;
  const text = document.getText();
  const offset = document.offsetAt(position);

  return completer.getCompletions(text, offset);
});

// Resolve completion items
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return completer.resolveCompletionItem(item);
});

// Provide document symbols
connection.onDocumentSymbol((params: DocumentSymbolParams): SymbolInformation[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const text = document.getText();
  return symbolProvider.getSymbols(text, params.textDocument.uri);
});

// Provide hover information
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const position = params.position;
  const text = document.getText();
  const offset = document.offsetAt(position);

  return hoverProvider.getHover(text, offset);
});

// Provide go to definition
connection.onDefinition((params: DefinitionParams): Location[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const position = params.position;
  const text = document.getText();
  const offset = document.offsetAt(position);

  return definitionProvider.getDefinitions(text, offset, document.uri);
});

// Make the text document manager listen on the connection for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
