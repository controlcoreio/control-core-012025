import { Location, Range, Position } from 'vscode-languageserver';

export class RegoDefinitionProvider {
  getDefinitions(text: string, offset: number, uri: string): Location[] {
    const word = this.getWordAtOffset(text, offset);
    if (!word) return [];

    const definitions: Location[] = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      if (line.includes(word)) {
        const start = line.indexOf(word);
        const end = start + word.length;
        
        definitions.push({
          uri,
          range: {
            start: { line: lineIndex, character: start },
            end: { line: lineIndex, character: end }
          }
        });
      }
    });

    return definitions;
  }

  private getWordAtOffset(text: string, offset: number): string | null {
    const before = text.substring(0, offset);
    const after = text.substring(offset);
    
    const beforeMatch = before.match(/\w+$/);
    const afterMatch = after.match(/^\w+/);
    
    if (beforeMatch && afterMatch) {
      return beforeMatch[0] + afterMatch[0];
    }
    
    return null;
  }
}
