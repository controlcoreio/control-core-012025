
import React from 'react';

interface CodeHighlighterProps {
  code: string;
  isDark: boolean;
}

export function CodeHighlighter({ code, isDark }: CodeHighlighterProps) {
  // Sanitize the code input to prevent XSS
  const sanitizeCode = (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  // Enhanced syntax highlighting for Rego code
  const highlightCode = (code: string): React.ReactNode[] => {
    const sanitized = sanitizeCode(code);
    const lines = sanitized.split('\n');
    
    return lines.map((line, lineIndex) => {
      let processedLine = line;
      
      // Keywords - Rego specific
      const keywords = [
        'package', 'import', 'allow', 'deny', 'default', 'rule', 'if', 'else', 'not', 'some', 'in', 'with', 'as',
        'true', 'false', 'null', 'contains', 'startswith', 'endswith', 'regex', 'count', 'sum', 'max', 'min',
        'sort', 'all', 'any', 'array', 'object', 'set', 'is_string', 'is_number', 'is_boolean', 'is_array',
        'is_object', 'is_set', 'is_null', 'time', 'date', 'sprintf', 'lower', 'upper', 'trim', 'split', 'replace'
      ];
      
      const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
      
      // Built-in functions and operators
      const builtinRegex = /\b(input|data|rego\.v1)\b/g;
      
      // Comments
      const commentRegex = /#.*/g;
      
      // Strings
      const stringRegex = /"[^"]*"/g;
      
      // Numbers
      const numberRegex = /\b\d+\.?\d*\b/g;
      
      // Operators
      const operatorRegex = /(==|!=|<=|>=|<|>|\+|-|\*|\/|%|\||&|\^|~|:=|=)/g;
      
      // Brackets and braces
      const bracketRegex = /(\[|\]|\{|\}|\(|\))/g;
      
      // Apply highlighting in order
      processedLine = processedLine
        .replace(commentRegex, (match) =>
          `<span class="${isDark ? 'text-green-400' : 'text-green-600'} italic font-medium">${match}</span>`
        )
        .replace(stringRegex, (match) =>
          `<span class="${isDark ? 'text-orange-400' : 'text-orange-600'} font-medium">${match}</span>`
        )
        .replace(numberRegex, (match) =>
          `<span class="${isDark ? 'text-purple-400' : 'text-purple-600'} font-medium">${match}</span>`
        )
        .replace(keywordRegex, (match) =>
          `<span class="${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold">${match}</span>`
        )
        .replace(builtinRegex, (match) =>
          `<span class="${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-semibold">${match}</span>`
        )
        .replace(operatorRegex, (match) =>
          `<span class="${isDark ? 'text-yellow-400' : 'text-yellow-600'} font-bold">${match}</span>`
        )
        .replace(bracketRegex, (match) =>
          `<span class="${isDark ? 'text-gray-300' : 'text-gray-700'} font-bold">${match}</span>`
        );
      
      return (
        <React.Fragment key={lineIndex}>
          <span 
            className={`${isDark ? 'text-gray-100' : 'text-gray-800'}`}
            dangerouslySetInnerHTML={{ __html: processedLine }} 
          />
          {lineIndex < lines.length - 1 && '\n'}
        </React.Fragment>
      );
    });
  };

  return (
    <pre className={`whitespace-pre-wrap break-words font-mono leading-relaxed ${
      isDark ? 'text-gray-100' : 'text-gray-800'
    }`} style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
      {highlightCode(code)}
    </pre>
  );
}
