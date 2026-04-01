import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSmartAssistant } from "@/hooks/useSmartAssistant";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Trash2,
  Wand2,
  UserPlus,
  Briefcase,
  ListChecks,
  ArrowRight,
} from "lucide-react";

const suggestedCommands = [
  { text: "Add client Tata Motors with GSTIN 27AAACT2727Q1ZW", icon: UserPlus },
  { text: "Create GST return work for March 2026", icon: Briefcase },
  { text: "Show all my clients", icon: ListChecks },
  { text: "List pending work items", icon: ListChecks },
];

export function SmartAssistantPanel() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useSmartAssistant();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setInput("");
    await sendMessage(currentInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCommand = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-foreground">Smart Assistant</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  AI
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Working on it..." : "Add clients, create work, manage your practice — just type"}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground h-8">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      {messages.length > 0 && (
        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 bg-secondary/10">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border shadow-sm"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                    {msg.content ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing your request...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-secondary-foreground" />
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder='Try: "Add client ABC Corp" or "Create GST work for client X"'
              className="w-full p-4 pr-24 bg-transparent resize-none focus:outline-none text-foreground placeholder:text-muted-foreground min-h-[70px]"
              rows={2}
              disabled={isLoading}
            />
            <div className="absolute right-3 bottom-3">
              <Button
                type="submit"
                variant="hero"
                size="sm"
                className="gap-2"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isLoading ? "Working" : "Send"}
              </Button>
            </div>
          </div>
        </form>

        {/* Quick Commands - only when no messages */}
        {messages.length === 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Quick commands:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedCommands.map((cmd, index) => {
                const CmdIcon = cmd.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleCommand(cmd.text)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-left bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-lg transition-colors group"
                  >
                    <CmdIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate flex-1">{cmd.text}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
