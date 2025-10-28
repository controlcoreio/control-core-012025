
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Brain, 
  AlertCircle, 
  Lightbulb, 
  MessageSquare, 
  Send,
  Zap,
  FileText,
  TrendingUp,
  Settings
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CAPAInsightsProps {
  isOpen: boolean;
  onClose: () => void;
}

const contextualSuggestions = [
  {
    type: "suggestion",
    title: "PEP Configuration Optimization",
    message: "You're viewing the 'API Gateway PEP'. AI suggests connecting a 'Rate Limiting' policy to improve security.",
    action: "Connect Policy",
    priority: "medium"
  },
  {
    type: "alert",
    title: "Critical Infrastructure Alert",
    message: "PDP instance 'pdp-prod-us-east-01' is offline. This may affect policy evaluation for production workloads.",
    action: "View Details",
    priority: "high"
  },
  {
    type: "insight",
    title: "Policy Optimization Opportunity",
    message: "Policy 'Customer-Data-Access' has 15% unused conditions. Consider simplifying for better performance.",
    action: "Review Policy",
    priority: "low"
  }
];

const quickActions = [
  { label: "Draft Policy for Current PEP", icon: FileText },
  { label: "Analyze Policy Conflicts", icon: TrendingUp },
  { label: "Optimize PDP Performance", icon: Zap },
  { label: "Security Recommendations", icon: Settings },
];

export function CAPAInsights({ isOpen, onClose }: CAPAInsightsProps) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      type: "assistant",
      message: "Hello! I'm CAPA, your AI assistant for authorization platform insights. How can I help you today?"
    }
  ]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    setChatHistory(prev => [
      ...prev,
      { type: "user", message: chatInput },
      { 
        type: "assistant", 
        message: `I understand you're asking about "${chatInput}". Let me help you with that. Based on your current context, I'd recommend checking the policy analysis section for detailed insights.`
      }
    ]);
    setChatInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold">CAPA AI Assistant</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Contextual Suggestions */}
        <div className="p-4 border-b">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Contextual Insights
          </h3>
          <div className="space-y-2">
            {contextualSuggestions.map((suggestion, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start gap-2">
                  {suggestion.type === "alert" && (
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  )}
                  {suggestion.type === "suggestion" && (
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                  )}
                  {suggestion.type === "insight" && (
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{suggestion.title}</h4>
                      <Badge 
                        variant={suggestion.priority === "high" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {suggestion.message}
                    </p>
                    <Button size="sm" variant="outline" className="text-xs h-6">
                      {suggestion.action}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm" 
                className="justify-start text-xs h-8"
              >
                <action.icon className="h-3 w-3 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 pb-2">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              Ask CAPA
            </h3>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-4 space-y-3">
            {chatHistory.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex",
                  message.type === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div 
                  className={cn(
                    "max-w-[80%] p-2 rounded-lg text-xs",
                    message.type === "user" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}
                >
                  {message.message}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about policies, conflicts, or optimization..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="text-xs"
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {["Policy conflicts", "PEP status", "GDPR policies", "Promote to production"].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setChatInput(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
