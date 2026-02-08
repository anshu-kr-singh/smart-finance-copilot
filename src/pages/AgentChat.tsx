import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTaxAgent } from "@/hooks/useTaxAgent";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Receipt,
  Calculator,
  ClipboardCheck,
  Building2,
  LineChart,
  BookOpen,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type AgentType = "gst" | "incometax" | "audit" | "compliance" | "accounting" | "advisory";

const agentConfig: Record<AgentType, {
  name: string;
  description: string;
  icon: typeof Receipt;
  gradient: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
}> = {
  gst: {
    name: "GST Agent",
    description: "Expert in GSTR-1, 2B matching, ITC reconciliation, and return filing",
    icon: Receipt,
    gradient: "from-orange-500 to-red-500",
    welcomeMessage: "Hello! I'm your GST specialist. I can help you with GSTR-1, GSTR-2B, GSTR-3B returns, ITC reconciliation, invoice matching, e-invoicing, and e-way bills. What would you like to work on today?",
    suggestedQuestions: [
      "How do I reconcile GSTR-2B with my purchase register?",
      "What are the due dates for GSTR-3B filing this month?",
      "Explain ITC eligibility rules under Section 17",
      "How to correct errors in filed GSTR-1?",
    ],
  },
  incometax: {
    name: "Income Tax Agent",
    description: "Specialist in AIS reconciliation, tax computation, and ITR preparation",
    icon: Calculator,
    gradient: "from-blue-500 to-indigo-500",
    welcomeMessage: "Welcome! I'm your Income Tax expert. I can assist with AIS/26AS reconciliation, advance tax calculations, ITR preparation, TDS compliance, and deduction optimization. How can I help you today?",
    suggestedQuestions: [
      "How do I reconcile AIS with my income records?",
      "Calculate advance tax for Q4 FY 2024-25",
      "Which ITR form should I file for a private limited company?",
      "Explain Section 80C deduction limits",
    ],
  },
  audit: {
    name: "Audit Assistant",
    description: "Risk-based sampling, anomaly detection, and audit documentation",
    icon: ClipboardCheck,
    gradient: "from-purple-500 to-pink-500",
    welcomeMessage: "Hello! I'm your Audit Assistant. I can help with risk assessment, sampling methodology, anomaly detection, audit planning, and documentation. What audit task can I assist with?",
    suggestedQuestions: [
      "How to determine sample size for accounts receivable?",
      "What are key risk indicators for revenue recognition?",
      "Create an audit checklist for inventory verification",
      "Explain substantive testing procedures for fixed assets",
    ],
  },
  compliance: {
    name: "Compliance & ROC Agent",
    description: "Company law compliance, form filing, and regulatory deadlines",
    icon: Building2,
    gradient: "from-green-500 to-teal-500",
    welcomeMessage: "Welcome! I'm your Compliance & ROC specialist. I can help with company law compliance, annual filings, form preparation (AOC-4, MGT-7, DIR-3), and deadline tracking. What do you need help with?",
    suggestedQuestions: [
      "What are the upcoming ROC filing deadlines?",
      "How to file AOC-4 for FY 2024-25?",
      "Explain the process for changing company directors",
      "What are the annual compliance requirements for a Pvt Ltd?",
    ],
  },
  accounting: {
    name: "Accounting Agent",
    description: "Transaction classification, journal entries, and reconciliation",
    icon: BookOpen,
    gradient: "from-cyan-500 to-blue-500",
    welcomeMessage: "Hello! I'm your Accounting expert. I can assist with transaction classification, journal entries, bank reconciliation, month-end closing, and financial statement preparation. How can I help?",
    suggestedQuestions: [
      "How to record a deferred revenue transaction?",
      "Explain the journal entry for depreciation",
      "Steps for month-end closing process",
      "How to reconcile bank statement discrepancies?",
    ],
  },
  advisory: {
    name: "FP&A / Advisory Agent",
    description: "Budget analysis, forecasting, scenario planning, and business insights",
    icon: LineChart,
    gradient: "from-amber-500 to-orange-500",
    welcomeMessage: "Welcome! I'm your FP&A and Advisory specialist. I can help with budget vs actual analysis, cash flow forecasting, scenario planning, and strategic business insights. What would you like to analyze?",
    suggestedQuestions: [
      "How to create a 12-month cash flow forecast?",
      "Analyze budget variance for Q3",
      "What KPIs should I track for a SaaS business?",
      "Create a break-even analysis template",
    ],
  },
};

export default function AgentChat() {
  const { agentType } = useParams<{ agentType: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useTaxAgent();

  const agent = agentConfig[agentType as AgentType];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  const Icon = agent.icon;

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input, agentType as AgentType);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question, agentType as AgentType);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem="/agents" onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Agent Header */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-6 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/agents")}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>

                <div
                  className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                    agent.gradient
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-bold text-xl text-foreground">
                      {agent.name}
                    </h1>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Powered
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {agent.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Agent Welcome Card */}
                    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                              agent.gradient
                            )}
                          >
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-foreground leading-relaxed">
                              {agent.welcomeMessage}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Suggested Questions */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Suggested questions to get started:
                      </p>
                      <div className="grid gap-2">
                        {agent.suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedQuestion(question)}
                            className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-sm text-foreground group"
                          >
                            <span className="group-hover:text-primary transition-colors">
                              {question}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-4 animate-fade-in",
                      message.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : cn("bg-gradient-to-br", agent.gradient)
                      )}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex-1 max-w-[85%] rounded-xl p-4 relative group",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-card border border-border"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}

                      {message.role === "assistant" && message.content && (
                        <button
                          onClick={() => copyToClipboard(message.content, index)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-4 animate-fade-in">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br",
                        agent.gradient
                      )}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${agent.name} anything...`}
                  disabled={isLoading}
                  className="flex-1 h-12 text-base"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  className="h-12 px-6"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                AI responses are for guidance only. Always verify with a practicing CA for critical decisions.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
