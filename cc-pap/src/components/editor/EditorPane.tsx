
import React, { useState, useRef, useEffect } from "react";
import { CodeHighlighter } from "./CodeHighlighter";

interface EditorPaneProps {
  code: string;
  setCode: (code: string) => void;
  isDark: boolean;
  highlightCode: (code: string) => string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export function EditorPane({ code, setCode, isDark, textareaRef }: EditorPaneProps) {
  const [isFocused, setIsFocused] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Input sanitization for the code
  const sanitizeInput = (input: string): string => {
    // Remove potentially dangerous characters while preserving code functionality
    return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  };

  // Sync scroll between textarea and highlighting
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current && e.target) {
      const textarea = e.target as HTMLTextAreaElement;
      highlightRef.current.scrollTop = textarea.scrollTop;
      highlightRef.current.scrollLeft = textarea.scrollLeft;
    }
  };

  const handleCodeChange = (newCode: string) => {
    const sanitized = sanitizeInput(newCode);
    setCode(sanitized);
  };

  // Add line numbers
  const getLineNumbers = () => {
    const lines = code.split('\n');
    return lines.map((_, index) => (
      <div key={index} className={`text-right pr-2 select-none text-sm leading-6 ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {index + 1}
      </div>
    ));
  };

  // Add debug logging
  useEffect(() => {
    console.log('EditorPane mounted with code length:', code.length);
    console.log('EditorPane isDark:', isDark);
  }, [code.length, isDark]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className={`flex-1 flex border rounded ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Line numbers */}
        <div className={`flex flex-col py-3 px-2 border-r font-mono text-sm min-w-[3rem] ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          {getLineNumbers()}
        </div>
        
        {/* Editor area */}
        <div className="flex-1 relative">
          {/* Syntax highlighting layer */}
          <div
            ref={highlightRef}
            className="absolute inset-0 px-4 py-3 pointer-events-none overflow-auto font-mono text-sm leading-6"
            style={{
              color: "transparent",
              background: "transparent",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word"
            }}
            aria-hidden="true"
          >
            <CodeHighlighter code={code} isDark={isDark} />
          </div>
          
          {/* Editable textarea */}
          <textarea
            ref={textareaRef}
            className={`absolute inset-0 w-full h-full bg-transparent font-mono px-4 py-3 outline-none resize-none overflow-auto text-sm leading-6 ${
              isDark ? 'text-white caret-white' : 'text-gray-900 caret-gray-900'
            }`}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            style={{
              background: "transparent",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              tabSize: 2,
              fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            }}
            placeholder="Enter your Rego policy code here..."
            aria-label="Policy code editor"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={50000}
          />
        </div>
      </div>
      
      {/* Status bar */}
      <div className={`h-6 flex items-center justify-between px-4 text-xs border-t ${
        isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <span>Rego Policy</span>
        <span>{code.split('\n').length} lines</span>
      </div>
    </div>
  );
}
