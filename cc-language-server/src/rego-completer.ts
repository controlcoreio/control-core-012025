import { CompletionItem, CompletionItemKind } from 'vscode-languageserver';

export class RegoCompleter {
  private keywords = [
    'package', 'import', 'default', 'allow', 'deny', 'violation',
    'true', 'false', 'null', 'undefined'
  ];

  private functions = [
    'count', 'sum', 'max', 'min', 'sort', 'reverse',
    'concat', 'contains', 'startswith', 'endswith',
    'upper', 'lower', 'trim', 'split', 'replace'
  ];

  getCompletions(text: string, offset: number): CompletionItem[] {
    const completions: CompletionItem[] = [];
    
    // Add keyword completions
    this.keywords.forEach(keyword => {
      completions.push({
        label: keyword,
        kind: CompletionItemKind.Keyword,
        detail: 'Rego keyword',
        documentation: `Rego keyword: ${keyword}`
      });
    });

    // Add function completions
    this.functions.forEach(func => {
      completions.push({
        label: func,
        kind: CompletionItemKind.Function,
        detail: 'Rego function',
        documentation: `Rego built-in function: ${func}`
      });
    });

    return completions;
  }

  resolveCompletionItem(item: CompletionItem): CompletionItem {
    return item;
  }
}
