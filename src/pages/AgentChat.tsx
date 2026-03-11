import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Upload,
  FileText,
  X,
  Paperclip,
  FileSpreadsheet,
  Table,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type AgentType = "gst" | "incometax" | "audit" | "compliance" | "accounting" | "advisory";

interface UploadedData {
  id: string;
  name: string;
  type: string;
  content: string;
  preview: string;
  rowCount?: number;
}

const agentConfig: Record<AgentType, {
  name: string;
  description: string;
  icon: typeof Receipt;
  gradient: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  dataTypes: string[];
}> = {
  gst: {
    name: "GST Agent",
    description: "Expert in GSTR-1, 2B matching, ITC reconciliation, and return filing",
    icon: Receipt,
    gradient: "from-orange-500 to-red-500",
    welcomeMessage: "Hello! I'm your GST specialist. Upload your GSTR-1, GSTR-2B, purchase register, or sales data. I'll help you reconcile, identify mismatches, and prepare returns.",
    suggestedQuestions: [
      "Reconcile my GSTR-2B with purchase register",
      "Calculate ITC eligibility from uploaded invoices",
      "Find mismatches between GSTR-1 and sales data",
      "Generate GSTR-3B summary from my data",
    ],
    dataTypes: ["GSTR-1", "GSTR-2B", "Purchase Register", "Sales Register", "E-Invoice Data"],
  },
  incometax: {
    name: "Income Tax Agent",
    description: "Specialist in AIS reconciliation, tax computation, and ITR preparation",
    icon: Calculator,
    gradient: "from-blue-500 to-indigo-500",
    welcomeMessage: "Welcome! Upload your AIS, 26AS, Form 16, salary slips, or income details. I'll reconcile data, compute taxes, and help prepare your ITR.",
    suggestedQuestions: [
      "Reconcile AIS with my income records",
      "Compute advance tax from uploaded P&L",
      "Calculate deductions from salary data",
      "Generate tax computation sheet",
    ],
    dataTypes: ["AIS Statement", "26AS", "Form 16", "Salary Slips", "P&L Statement", "Balance Sheet"],
  },
  audit: {
    name: "Audit Assistant",
    description: "Risk-based sampling, anomaly detection, and audit documentation",
    icon: ClipboardCheck,
    gradient: "from-purple-500 to-pink-500",
    welcomeMessage: "Hello! Upload trial balance, ledgers, bank statements, or transaction data. I'll identify anomalies, suggest samples, and help with audit documentation.",
    suggestedQuestions: [
      "Identify high-risk transactions from ledger",
      "Generate sampling plan for receivables",
      "Find unusual entries in bank statement",
      "Create audit checklist from trial balance",
    ],
    dataTypes: ["Trial Balance", "General Ledger", "Bank Statement", "Accounts Receivable", "Inventory List"],
  },
  compliance: {
    name: "Compliance & ROC Agent",
    description: "Company law compliance, form filing, and regulatory deadlines",
    icon: Building2,
    gradient: "from-green-500 to-teal-500",
    welcomeMessage: "Welcome! Upload company details, director information, or previous filings. I'll track deadlines, prepare forms, and ensure compliance.",
    suggestedQuestions: [
      "Check compliance status from company data",
      "Generate AOC-4 draft from financials",
      "List pending ROC filings for the year",
      "Prepare director KYC documents",
    ],
    dataTypes: ["Company Master Data", "Director Details", "Previous Filings", "Share Capital Structure"],
  },
  accounting: {
    name: "Accounting Agent",
    description: "Transaction classification, journal entries, and reconciliation",
    icon: BookOpen,
    gradient: "from-cyan-500 to-blue-500",
    welcomeMessage: "Hello! Upload bank statements, expense data, invoices, or transaction lists. I'll classify entries, create journals, and reconcile accounts.",
    suggestedQuestions: [
      "Classify transactions from bank statement",
      "Generate journal entries from invoice data",
      "Reconcile bank statement with cash book",
      "Create month-end closing entries",
    ],
    dataTypes: ["Bank Statement", "Invoice Data", "Expense Reports", "Cash Book", "Ledger Extracts"],
  },
  advisory: {
    name: "FP&A / Advisory Agent",
    description: "Budget analysis, forecasting, scenario planning, and business insights",
    icon: LineChart,
    gradient: "from-amber-500 to-orange-500",
    welcomeMessage: "Welcome! Upload financial data, budgets, or operational metrics. I'll analyze trends, create forecasts, and provide strategic insights.",
    suggestedQuestions: [
      "Analyze budget vs actual from uploaded data",
      "Create 12-month cash flow forecast",
      "Identify cost optimization opportunities",
      "Generate variance analysis report",
    ],
    dataTypes: ["Budget Data", "Actuals", "Revenue Data", "Cost Centers", "KPI Metrics"],
  },
};

export default function AgentChat() {
  const { agentType } = useParams<{ agentType: string }>();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([]);
  const [showDataInput, setShowDataInput] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [dataLabel, setDataLabel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const parseCSV = (content: string): { preview: string; rowCount: number } => {
    const lines = content.trim().split('\n');
    const rowCount = lines.length - 1; // Exclude header
    const preview = lines.slice(0, 4).join('\n') + (lines.length > 4 ? '\n...' : '');
    return { preview, rowCount: Math.max(0, rowCount) };
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const { preview, rowCount } = parseCSV(content);
        
        const newData: UploadedData = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.name.endsWith('.csv') ? 'CSV' : file.name.endsWith('.xlsx') ? 'Excel' : 'Text',
          content,
          preview,
          rowCount,
        };
        
        setUploadedData(prev => [...prev, newData]);
        toast.success(`Uploaded: ${file.name}`);
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  }, []);

  const handleAddPastedData = () => {
    if (!pastedData.trim()) {
      toast.error("Please paste some data first");
      return;
    }

    const { preview, rowCount } = parseCSV(pastedData);
    const newData: UploadedData = {
      id: Date.now().toString(),
      name: dataLabel || `Data ${uploadedData.length + 1}`,
      type: 'Pasted',
      content: pastedData,
      preview,
      rowCount,
    };

    setUploadedData(prev => [...prev, newData]);
    setPastedData("");
    setDataLabel("");
    setShowDataInput(false);
    toast.success("Data added successfully");
  };

  const removeData = (id: string) => {
    setUploadedData(prev => prev.filter(d => d.id !== id));
  };

  const buildDataContext = useCallback(() => {
    if (uploadedData.length === 0) return undefined;

    let context = `## UPLOADED DATA (${uploadedData.length} file${uploadedData.length > 1 ? 's' : ''})\n\n`;
    let totalRows = 0;

    uploadedData.forEach((data, index) => {
      const rows = data.rowCount || 0;
      totalRows += rows;
      context += `### FILE ${index + 1}: ${data.name} (${data.type}, ${rows} rows)\n`;
      context += "```\n" + data.content + "\n```\n\n";
    });

    context += `---\n**TOTAL: ${uploadedData.length} files, ${totalRows} data rows.**\n`;
    context += "INSTRUCTION: Process ALL rows from ALL files. Cross-reference between files where applicable. Show verification at the end.";
    return context;
  }, [uploadedData]);

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
    
    const context = buildDataContext();
    sendMessage(input, agentType as AgentType, context);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    const context = buildDataContext();
    sendMessage(question, agentType as AgentType, context);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleNewChat = () => {
    clearMessages();
    setUploadedData([]);
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
                  onClick={handleNewChat}
                  className="shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          </div>

          {/* Uploaded Data Bar */}
          {uploadedData.length > 0 && (
            <div className="border-b border-border bg-muted/30 px-6 py-3">
              <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">Working with:</span>
                  {uploadedData.map((data) => (
                    <Badge key={data.id} variant="secondary" className="gap-1.5 pr-1">
                      <FileSpreadsheet className="w-3 h-3" />
                      {data.name}
                      {data.rowCount !== undefined && (
                        <span className="text-muted-foreground">({data.rowCount} rows)</span>
                      )}
                      <button
                        onClick={() => removeData(data.id)}
                        className="ml-1 p-0.5 hover:bg-destructive/20 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

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

                    {/* Data Upload Section */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Upload Your Data</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Accepted formats: {agent.dataTypes.join(", ")}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Upload File
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDataInput(!showDataInput)}
                          >
                            <Table className="w-4 h-4 mr-2" />
                            Paste Data
                          </Button>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv,.txt,.xlsx"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />

                        {showDataInput && (
                          <div className="mt-4 space-y-3 p-3 bg-muted/50 rounded-lg">
                            <Input
                              placeholder="Data label (e.g., 'GSTR-2B Jan 2026')"
                              value={dataLabel}
                              onChange={(e) => setDataLabel(e.target.value)}
                              className="h-9"
                            />
                            <Textarea
                              placeholder="Paste your data here (CSV format, tab-separated, or plain text)..."
                              value={pastedData}
                              onChange={(e) => setPastedData(e.target.value)}
                              className="min-h-[120px] font-mono text-xs"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleAddPastedData}>
                                Add Data
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowDataInput(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Suggested Questions */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {uploadedData.length > 0 ? "Now ask me to:" : "Or start with:"}
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
                        <span className="text-sm">
                          {uploadedData.length > 0 ? "Analyzing your data..." : "Thinking..."}
                        </span>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 h-12 w-12"
                  title="Upload data file"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    uploadedData.length > 0
                      ? `Ask ${agent.name} to analyze your data...`
                      : `Ask ${agent.name} anything...`
                  }
                  disabled={isLoading}
                  className="flex-1 min-h-[48px] max-h-32 resize-none text-base py-3"
                  rows={1}
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
                Apna CA • Your Smart CA Assistant • AI responses are for guidance only. Always verify with a practicing CA.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
