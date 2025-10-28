import React, { useEffect, useRef, useState } from "react";
import { Bot, Settings, Minimize2, Maximize2, Send, Mic, AlertTriangle, Lightbulb, Book, Database, Zap, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CAPAMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface InfoCard {
  id: string;
  type: "error" | "suggestion" | "documentation" | "metadata" | "resource" | "snippet" | "external-conflict";
  title: string;
  content: string;
  action?: { label: string; onClick: () => void };
  code?: string;
  line?: number;
  conflictOwner?: string;
  severity?: "High" | "Medium" | "Low";
}

interface CAPAPanelProps {
  code: string;
  onInsertSuggestion?: (insertion: string) => void;
  onAskExplain?: (selected: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function CAPAPanel({
  code,
  onInsertSuggestion,
  onAskExplain,
  isCollapsed = false,
  onToggleCollapse,
}: CAPAPanelProps) {
  const [messages, setMessages] = useState<CAPAMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<"ready" | "thinking" | "offline" | "not-configured">("not-configured");
  const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  const [isAIConfigured, setIsAIConfigured] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Check if AI is configured
  useEffect(() => {
    // In a real app, this would check for stored AI configuration
    // For demo purposes, we'll simulate checking local storage or API
    const checkAIConfiguration = () => {
      const hasAIConfig = localStorage.getItem('capa-ai-configured') === 'true';
      setIsAIConfigured(hasAIConfig);
      setStatus(hasAIConfig ? "ready" : "not-configured");
    };

    checkAIConfiguration();
  }, []);

  // Generate dynamic information cards based on code analysis
  useEffect(() => {
    const generateInfoCards = (codeContent: string): InfoCard[] => {
      const cards: InfoCard[] = [];
      
      // Error detection
      if (codeContent.includes("allow {") && !codeContent.includes("}")) {
        cards.push({
          id: "error-unclosed",
          type: "error",
          title: "Syntax Error Detected",
          content: "Unclosed allow rule block - missing closing brace",
          line: (codeContent.split("\n").findIndex(line => line.includes("allow {")) || 0) + 1,
          action: {
            label: "Fix This",
            onClick: () => onInsertSuggestion?.("}")
          }
        });
      }

      // Suggestions
      if (!codeContent.includes("allow {") && !codeContent.includes("deny {")) {
        cards.push({
          id: "suggestion-rules",
          type: "suggestion",
          title: "Add Policy Rules",
          content: "Consider adding allow or deny rules to define access control logic",
          action: {
            label: "Add Allow Rule",
            onClick: () => onInsertSuggestion?.("allow {\n    # Define conditions here\n}\n")
          }
        });
      }

      // Documentation for input attributes
      if (codeContent.includes("input.")) {
        cards.push({
          id: "doc-input",
          type: "documentation",
          title: "Input Attributes",
          content: "Input object contains request context: user, method, resource, etc.",
          action: {
            label: "View Examples",
            onClick: () => {}
          }
        });
      }

      // Metadata suggestions
      if (codeContent.includes("user.roles")) {
        cards.push({
          id: "metadata-roles",
          type: "metadata",
          title: "Available User Roles",
          content: "Connected PIPs provide: admin, manager, editor, viewer",
          action: {
            label: "Configure PIPs",
            onClick: () => {}
          }
        });
      }

      // Resource context
      if (codeContent.includes("resource")) {
        cards.push({
          id: "resource-context",
          type: "resource",
          title: "PEP Context",
          content: "This policy applies to API access. Consider linking to API Gateway PEP",
          action: {
            label: "Configure Smart Connection",
            onClick: () => {}
          }
        });
      }

      // External conflict detection for Policy Managers
      const mockExternalConflicts = [
        {
          id: "ext-conflict-1",
          title: "External Conflict Detected",
          content: "Your current changes may conflict with a policy managed by 'IT Security Team'",
          conflictOwner: "IT Security Team",
          severity: "High" as const,
          action: {
            label: "View Conflict Details",
            onClick: () => console.log("Navigate to conflict analysis")
          }
        }
      ];

      // Add external conflict cards if user role is Policy Manager
      if (codeContent.includes("allow") && codeContent.includes("admin")) {
        cards.push({
          id: "external-conflict",
          type: "external-conflict",
          title: "External Conflict Detected",
          content: "Your current changes to this policy may conflict with a policy managed by 'IT Security Team'. This could lead to unexpected access denials.",
          conflictOwner: "IT Security Team",
          severity: "High",
          action: {
            label: "View Conflict Details",
            onClick: () => console.log("Navigate to cross-scope conflicts")
          }
        });
      }

      return cards;
    };

    setInfoCards(generateInfoCards(code));
  }, [code, onInsertSuggestion]);

  // Generate live suggestions based on user input
  useEffect(() => {
    if (userInput.toLowerCase().includes("user")) {
      setLiveSuggestions(["roles", "groups", "id", "email"]);
    } else if (userInput.toLowerCase().includes("input")) {
      setLiveSuggestions(["method", "resource", "user", "path"]);
    } else if (userInput.toLowerCase().includes("time")) {
      setLiveSuggestions(["weekday", "hour", "now"]);
    } else {
      setLiveSuggestions(["allow", "deny", "input", "user", "time"]);
    }
  }, [userInput]);

  const handleSend = () => {
    if (!userInput.trim() || !isAIConfigured) return;
    
    setStatus("thinking");
    const newMessage: CAPAMessage = {
      id: Date.now().toString(),
      type: "user",
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setUserInput("");
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: CAPAMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `I understand you're asking about: "${userInput}". Here's what I can help with...`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setStatus("ready");
    }, 1500);
  };

  const handleConfigureAI = () => {
    navigate('/settings/ai-integration');
  };

  const getCardIcon = (type: InfoCard["type"]) => {
    switch (type) {
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "suggestion": return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case "documentation": return <Book className="h-4 w-4 text-blue-500" />;
      case "metadata": return <Database className="h-4 w-4 text-purple-500" />;
      case "resource": return <Zap className="h-4 w-4 text-green-500" />;
      case "snippet": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "external-conflict": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "thinking": return "text-yellow-500";
      case "offline": return "text-red-500";
      default: return "text-green-500";
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-background border-l flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Bot className="h-6 w-6 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-[400px] bg-background/95 backdrop-blur-sm border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">CAPA</span>
          <div className={cn("h-2 w-2 rounded-full", getStatusColor())} />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleConfigureAI}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleCollapse}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Not Configured Warning */}
      {!isAIConfigured && (
        <div className="p-4 border-b bg-yellow-50 dark:bg-yellow-900/20">
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                    AI Assistant Not Configured
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1 mb-3">
                    Configure an AI model to enable intelligent policy assistance.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleConfigureAI}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-3 w-3" />
                    Configure AI
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Suggestions */}
      {liveSuggestions.length > 0 && (
        <div className="p-3 border-b bg-muted/30">
          <div className="text-xs text-muted-foreground mb-2">Quick suggestions:</div>
          <div className="flex flex-wrap gap-1">
            {liveSuggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                onClick={() => setUserInput(prev => prev + suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          {/* Information Cards */}
          {infoCards.map((card) => (
            <Card key={card.id} className={cn(
              "border-l-4",
              card.type === "external-conflict" ? "border-l-orange-500 bg-orange-50" : "border-l-primary/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {getCardIcon(card.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{card.title}</h4>
                      <div className="flex items-center gap-2">
                        {card.conflictOwner && (
                          <Badge variant="outline" className="text-xs">
                            {card.conflictOwner}
                          </Badge>
                        )}
                        {card.severity && (
                          <Badge 
                            variant={card.severity === "High" ? "destructive" : "secondary"} 
                            className="text-xs"
                          >
                            {card.severity}
                          </Badge>
                        )}
                        {card.line && (
                          <Badge variant="outline" className="text-xs">
                            Line {card.line}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{card.content}</p>
                    {card.code && (
                      <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                        {card.code}
                      </pre>
                    )}
                    {card.action && (
                      <Button
                        size="sm"
                        variant={card.type === "external-conflict" ? "default" : "outline"}
                        onClick={card.action.onClick}
                        className="h-7 text-xs"
                      >
                        {card.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Conversation History */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg p-3 max-w-[85%] text-sm",
                message.type === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-foreground"
              )}
            >
              {message.content}
            </div>
          ))}

          {status === "thinking" && (
            <div className="bg-muted rounded-lg p-3 max-w-[85%] text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="animate-pulse">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isAIConfigured ? "Ask CAPA..." : "Configure AI to enable chat"}
            className="flex-1 text-sm"
            disabled={status === "thinking" || !isAIConfigured}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!userInput.trim() || status === "thinking" || !isAIConfigured}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
