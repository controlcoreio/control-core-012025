import { SymbolInformation, SymbolKind } from 'vscode-languageserver';

export class RegoSymbolProvider {
  getSymbols(text: string, uri: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      // Find package declarations
      if (line.trim().startsWith('package ')) {
        const name = line.trim().substring(8).trim();
        symbols.push({
          name,
          kind: SymbolKind.Package,
          location: {
            uri,
            range: {
              start: { line: lineIndex, character: 0 },
              end: { line: lineIndex, character: line.length }
            }
          }
        });
      }

      // Find rule declarations
      if (line.trim().match(/^(allow|deny|violation)\s/)) {
        const name = line.trim().split(' ')[0];
        symbols.push({
          name,
          kind: SymbolKind.Function,
          location: {
            uri,
            range: {
              start: { line: lineIndex, character: 0 },
              end: { line: lineIndex, character: line.length }
            }
          }
        });
      }
    });

    return symbols;
  }
}
