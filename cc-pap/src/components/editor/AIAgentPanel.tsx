import React, { useEffect, useRef, useState } from "react";
import { Zap, Lightbulb, Info, Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types for messages between user and AI
type AgentMsg = { id: string; role: "user" | "ai"; content: string; };

interface Suggestion {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onInsert?: string; // Text to insert into editor on accept
}

interface ErrorNotice {
  id: string;
  text: string;
  line: number;
  type: "syntax"|"logic"|"type";
}

interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  description?: string;
}

interface AIAgentPanelProps {
  code: string;
  onInsertSuggestion?: (insertion: string) => void;
  onAskExplain?: (selected: string) => void;
  // Add more interaction callbacks as needed
}

export function AIAgentPanel({
  code,
  onInsertSuggestion,
  onAskExplain,
}: AIAgentPanelProps) {
  // For demo: mock data generators
  // Suggestions (normally would be AI-powered, here we just mock some based on code content)
  const getSuggestions = (txt: string): Suggestion[] => {
    const sugs: Suggestion[] = [];
    if (!txt.includes("allow {")) {
      sugs.push({
        id: "allow-rule",
        label: "Add allow rule skeleton",
        icon: <Zap size={18} className="text-blue-600" />,
        onInsert: "allow {\n    # conditions\n}\n"
      });
    }
    if (!txt.includes("deny {")) {
      sugs.push({
        id: "deny-rule",
        label: "Add deny rule skeleton",
        icon: <Zap size={18} className="text-red-700" />,
        onInsert: "deny {\n    # conditions\n}\n"
      });
    }
    if (txt.includes("input.")) {
      sugs.push({
        id: "input-auto",
        label: "See available input attributes",
        icon: <Lightbulb size={18} className="text-yellow-600"/>,
        onInsert: "# Example: input.user.id == \"admin\"\n"
      });
    }
    return sugs;
  };

  // Errors: simulate a syntax error for demo
  const errors: ErrorNotice[] = code.includes("allow {") && !code.includes("}") ?
    [{
      id: "err-unclosed",
      text: "Unclosed allow rule block — missing '}'",
      line: (code.split("\n").findIndex(line => line.includes("allow {")) || 0) + 1,
      type: "syntax"
    }]
    : [];

  // Code Snippets (for demo — would be context-aware later)
  const snippets: CodeSnippet[] = [
    {
      id: "snippet-allow-admin",
      title: "Allow if user is admin",
      code: 'allow {\n    input.user.roles[_] == "admin"\n}\n',
      description: "Permit access for users with the 'admin' role.",
    },
    {
      id: "snippet-business-hours",
      title: "Deny outside business hours",
      code: "deny {\n    input.method == \"PUT\"\n    not is_business_hours\n}\n",
      description: "Deny changes when not during business hours.",
    }
  ];

  // Conversation state (in-memory)
  const [chat, setChat] = useState<AgentMsg[]>([]);
  const [userInput, setUserInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // On user chat submit, mock AI reply after delay
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim()) return;
    const msg: AgentMsg = { id: "u-" + Date.now(), role: "user", content: userInput };
    setChat(c => [...c, msg]);
    // fake "thinking"
    setTimeout(() => {
      setChat(c => [
        ...c,
        { id: "ai-" + Date.now(), role: "ai", content: "🤖 (AI): Sorry, I am a demo! For '" + userInput + "', I would suggest searching the OPA docs." }
      ]);
    }, 900);
    setUserInput("");
  };

  return (
    <aside
      className="flex flex-col border-l bg-background dark:bg-background max-w-md min-w-[290px] h-full font-sans"
      style={{ width: "386px" }}
      data-testid="ai-agent-panel"
    >
      {/* Panel Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted">
        <Zap size={20} className="text-blue-600" />
        <span className="font-bold text-base tracking-wide text-primary font-sans">
          AI Agent
        </span>
        <span className="ml-2 text-xs text-muted-foreground font-sans">Assistant & Suggestions</span>
      </div>
      {/* Scrollable content */}
      <ScrollArea className="flex-1 flex flex-col gap-3 px-4 py-2 font-sans text-[0.97rem]">
        {/* 1. Live Suggestions */}
        <div>
          <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-indigo-700">
            <Lightbulb size={16} className="text-yellow-500" />
            AI-powered Suggestions
          </div>
          <div className="flex flex-col gap-1">
            {getSuggestions(code).length === 0 ? (
              <span className="text-muted-foreground text-xs">No suggestions right now.</span>
            ) : (
              getSuggestions(code).map(s => (
                <Button
                  key={s.id}
                  variant="outline"
                  className="justify-start text-xs gap-2"
                  size="sm"
                  onClick={() => onInsertSuggestion?.(s.onInsert || "")}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </Button>
              ))
            )}
          </div>
        </div>
        {/* 2. Error Detection */}
        <div>
          <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-red-700">
            <X size={15} /> Real-time Error Detection
          </div>
          <div className="text-xs">
            {errors.length === 0 ? (
              <span className="text-green-700 flex items-center gap-2"><Check size={13}/> No problems detected</span>
            ):(
              <ul className="text-red-700 space-y-1">
                {errors.map(e =>
                  <li key={e.id}>
                    Line <b>{e.line}</b>: {e.text}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
        {/* 3. Snippets */}
        <div>
          <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-blue-700">
            <Search size={15}/> Code Snippets & Templates
          </div>
          <div className="flex flex-col gap-1">
            {snippets.map(snip =>
              <Button
                key={snip.id}
                variant="secondary"
                size="sm"
                className="justify-start px-2 text-xs"
                onClick={() => onInsertSuggestion?.(snip.code)}
              >
                <span className="font-mono">{snip.title}</span>
              </Button>
            )}
          </div>
        </div>
        {/* 4. Agent Chat — last for scrolling */}
        <div className="mt-3 border-t pt-2">
          <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-slate-600">
            <Info size={14}/> Conversation
          </div>
          <div className="flex flex-col gap-1 text-xs max-h-32 overflow-y-auto">
            {chat.length === 0 && (
              <span className="text-muted-foreground italic text-xs">Start a conversation with the agent below.</span>
            )}
            {chat.map(m => (
              <div key={m.id} className={cn(
                "rounded-xl px-2 py-1 mt-1 max-w-[90%] break-words",
                m.role === "user" ? "bg-blue-100 text-blue-900 ml-auto mr-2" : "bg-slate-100 text-slate-800"
              )}>{m.content}</div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        </div>
      </ScrollArea>
      {/* Chat input row */}
      <form
        onSubmit={handleSend}
        className="border-t p-2 flex gap-2 items-center bg-background dark:bg-background font-sans"
      >
        <Input
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          placeholder="Ask the AI Agent for help…"
          className="text-xs rounded-full font-sans"
        />
        <Button
          type="submit"
          size="icon"
          variant="default"
          className="rounded-full"
          aria-label="Send to AI"
          disabled={!userInput.trim()}
        >
          <Zap size={16} />
        </Button>
      </form>
    </aside>
  );
}
