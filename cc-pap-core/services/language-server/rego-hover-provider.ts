import { Hover, MarkupContent, MarkupKind } from 'vscode-languageserver';

export class RegoHoverProvider {
  getHover(text: string, offset: number): Hover | null {
    const word = this.getWordAtOffset(text, offset);
    if (!word) return null;

    const documentation = this.getDocumentation(word);
    if (!documentation) return null;

    const contents: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: documentation
    };

    return { contents };
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

  private getDocumentation(word: string): string | null {
    const docs: Record<string, string> = {
      'package': 'Declares the package name for the current module',
      'import': 'Imports external packages and modules',
      'allow': 'Defines an allow rule for authorization',
      'deny': 'Defines a deny rule for authorization',
      'violation': 'Defines a violation rule for policy violations'
    };

    return docs[word] || null;
  }
}
