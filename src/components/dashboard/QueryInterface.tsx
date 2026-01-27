import { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, Sparkles, Bot, User, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTaxAgent } from "@/hooks/useTaxAgent";

const suggestedQueries = [
  "What's my GST liability for this month?",
  "Show ITC mismatches from GSTR-2B",
  "Calculate advance tax for Q3",
  "Any pending compliance deadlines?",
];

export function QueryInterface() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = useTaxAgent();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;
    
    const currentQuery = query;
    setQuery("");
    await sendMessage(currentQuery, "general");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Ask Your Tax Agent</h3>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Thinking..." : "Natural language queries for instant insights"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages Area */}
      {messages.length > 0 && (
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 bg-secondary/20">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl p-4",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border shadow-sm"
                )}
              >
                <div className={cn(
                  "text-sm whitespace-pre-wrap",
                  msg.role === "assistant" && "prose prose-sm max-w-none text-foreground"
                )}>
                  {msg.content || (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  )}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              "relative rounded-xl border-2 transition-all duration-200",
              isFocused ? "border-primary shadow-glow" : "border-border bg-secondary/30"
            )}
          >
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your finances, taxes, or compliance..."
              className="w-full p-4 pr-32 bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[80px]"
              rows={2}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Mic className="w-4 h-4" />
              </Button>
              <Button 
                type="submit" 
                variant="hero" 
                size="sm" 
                className="gap-2"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? "Thinking" : "Ask"}
              </Button>
            </div>
          </div>
        </form>

        {/* Suggested Queries - only show when no messages */}
        {messages.length === 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Suggested queries:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
