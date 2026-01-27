import { useState } from "react";
import { Send, Mic, Paperclip, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const suggestedQueries = [
  "What's my GST liability for this month?",
  "Show ITC mismatches from GSTR-2B",
  "Calculate advance tax for Q3",
  "Any pending compliance deadlines?",
];

export function QueryInterface() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Ask Your Tax Agent</h3>
          <p className="text-sm text-muted-foreground">Natural language queries for instant insights</p>
        </div>
      </div>

      {/* Input Area */}
      <div
        className={cn(
          "relative rounded-xl border-2 transition-all duration-200",
          isFocused ? "border-primary shadow-glow" : "border-border bg-secondary/30"
        )}
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything about your finances, taxes, or compliance..."
          className="w-full p-4 pr-32 bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[80px]"
          rows={2}
        />
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Mic className="w-4 h-4" />
          </Button>
          <Button variant="hero" size="sm" className="gap-2">
            <Send className="w-4 h-4" />
            Ask
          </Button>
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-2">Suggested queries:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
