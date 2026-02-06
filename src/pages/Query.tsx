import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Send, Bot, User, Loader2, Sparkles, Receipt, Calculator, ClipboardCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTaxAgent } from "@/hooks/useTaxAgent";

const agentTypes = [
  { id: "general", label: "General", icon: Sparkles, color: "text-primary" },
  { id: "gst", label: "GST", icon: Receipt, color: "text-orange-500" },
  { id: "incometax", label: "Income Tax", icon: Calculator, color: "text-blue-500" },
  { id: "audit", label: "Audit", icon: ClipboardCheck, color: "text-purple-500" },
  { id: "compliance", label: "Compliance", icon: Building2, color: "text-green-500" },
] as const;

const suggestedQueries = [
  "What is my GST liability for this month?",
  "Show me ITC mismatch between GSTR-2B and purchase register",
  "Calculate advance tax for Q3 based on current income",
  "What are the upcoming compliance deadlines?",
  "Analyze my expense patterns and suggest tax savings",
  "Generate GSTR-3B summary for December 2024",
];

export default function QueryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logActivity } = useActivityLog();
  const [query, setQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("general");
  const { messages, isLoading, sendMessage, clearMessages } = useTaxAgent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    const message = query;
    setQuery("");
    await logActivity("query", "ai_agent", undefined, { query: message, agent: selectedAgent });
    await sendMessage(message, selectedAgent as any);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setQuery("");
    await logActivity("query", "ai_agent", undefined, { query: suggestion, agent: selectedAgent });
    await sendMessage(suggestion, selectedAgent as any);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-hidden p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Ask AI Agent
              </h1>
              <p className="text-muted-foreground">
                Ask any tax, GST, or accounting question in natural language
              </p>
            </div>

            {/* Agent Selector */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground mr-2">Agent:</span>
              {agentTypes.map((agent) => {
                const Icon = agent.icon;
                return (
                  <Button
                    key={agent.id}
                    variant={selectedAgent === agent.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAgent(agent.id)}
                    className="gap-2"
                  >
                    <Icon className={cn("w-4 h-4", selectedAgent !== agent.id && agent.color)} />
                    {agent.label}
                  </Button>
                );
              })}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="ml-auto text-muted-foreground"
                >
                  Clear Chat
                </Button>
              )}
            </div>

            {/* Chat Area */}
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardContent className="flex-1 flex flex-col p-0">
                {messages.length === 0 ? (
                  /* Empty State with Suggestions */
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      How can I help you today?
                    </h3>
                    <p className="text-muted-foreground text-center mb-6 max-w-md">
                      Ask me anything about GST, Income Tax, compliance, or your financial data
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                      {suggestedQueries.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-left p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm text-foreground"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Messages */
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex gap-3",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-xl px-4 py-3",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.role === "assistant" && !message.content && isLoading && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="border-t border-border p-4">
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask about GST, Income Tax, compliance, or your financial data..."
                      className="min-h-[52px] max-h-[200px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-[52px] w-[52px]"
                      disabled={!query.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
