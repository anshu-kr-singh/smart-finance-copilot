import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useActivityLog } from "@/hooks/useActivityLog";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Receipt, 
  Calculator, 
  ClipboardCheck, 
  Building2,
  BookOpen,
  LineChart,
  Upload,
  FileText,
  X,
  FileSpreadsheet,
  Table,
  Copy,
  Check,
  TrendingUp,
  Calendar,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTaxAgent } from "@/hooks/useTaxAgent";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import apnaCaLogo from "@/assets/apna-ca-logo.png";

interface UploadedData {
  id: string;
  name: string;
  type: string;
  content: string;
  preview: string;
  rowCount?: number;
  analysis?: TransactionAnalysis;
}

interface TransactionAnalysis {
  totalTransactions: number;
  totalCredit: number;
  totalDebit: number;
  monthWise: { month: string; credit: number; debit: number; count: number }[];
  topMerchants: { name: string; amount: number; count: number }[];
  dateRange: { start: string; end: string };
}

const agentTypes = [
  { id: "general", label: "General", icon: Sparkles, color: "text-primary", gradient: "from-primary to-primary/70" },
  { id: "gst", label: "GST", icon: Receipt, color: "text-orange-500", gradient: "from-orange-500 to-red-500" },
  { id: "incometax", label: "Income Tax", icon: Calculator, color: "text-blue-500", gradient: "from-blue-500 to-indigo-500" },
  { id: "audit", label: "Audit", icon: ClipboardCheck, color: "text-purple-500", gradient: "from-purple-500 to-pink-500" },
  { id: "compliance", label: "Compliance", icon: Building2, color: "text-green-500", gradient: "from-green-500 to-teal-500" },
  { id: "accounting", label: "Accounting", icon: BookOpen, color: "text-cyan-500", gradient: "from-cyan-500 to-blue-500" },
  { id: "advisory", label: "Advisory", icon: LineChart, color: "text-amber-500", gradient: "from-amber-500 to-orange-500" },
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([]);
  const [showDataInput, setShowDataInput] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [dataLabel, setDataLabel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = useTaxAgent();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages]);

  const analyzeTransactionData = (content: string): TransactionAnalysis | undefined => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return undefined;

    const headers = lines[0].toLowerCase();
    
    // Check if it looks like transaction data
    const isTransactionData = 
      headers.includes('date') || 
      headers.includes('amount') || 
      headers.includes('credit') || 
      headers.includes('debit') ||
      headers.includes('payment') ||
      headers.includes('transaction');

    if (!isTransactionData) return undefined;

    const transactions: Array<{
      date: Date | null;
      amount: number;
      type: 'credit' | 'debit';
      merchant: string;
    }> = [];

    // Parse transaction lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/[,\t]/).map(p => p.trim());
      
      if (parts.length < 2) continue;

      // Try to find date, amount, and merchant from parts
      let date: Date | null = null;
      let amount = 0;
      let type: 'credit' | 'debit' = 'debit';
      let merchant = '';

      for (const part of parts) {
        // Try parsing as date
        const dateMatch = part.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
        if (dateMatch && !date) {
          date = new Date(dateMatch[0].replace(/(\d{2})[-/](\d{2})[-/](\d{2,4})/, '$3-$2-$1'));
          if (isNaN(date.getTime())) {
            date = new Date(dateMatch[0]);
          }
          continue;
        }

        // Try parsing as amount
        const numMatch = part.replace(/[₹,\s]/g, '').match(/^-?\d+(\.\d+)?$/);
        if (numMatch) {
          const num = parseFloat(numMatch[0]);
          if (num !== 0) {
            amount = Math.abs(num);
            type = num < 0 || part.toLowerCase().includes('dr') ? 'debit' : 'credit';
          }
          continue;
        }

        // Check for credit/debit indicators
        if (part.toLowerCase().includes('cr') || part.toLowerCase().includes('credit') || part.toLowerCase().includes('received')) {
          type = 'credit';
        } else if (part.toLowerCase().includes('dr') || part.toLowerCase().includes('debit') || part.toLowerCase().includes('paid')) {
          type = 'debit';
        }

        // Assume remaining text is merchant
        if (part.length > 2 && !merchant && !/^\d+$/.test(part)) {
          merchant = part.substring(0, 30);
        }
      }

      if (amount > 0) {
        transactions.push({ date, amount, type, merchant: merchant || 'Unknown' });
      }
    }

    if (transactions.length === 0) return undefined;

    // Calculate month-wise analysis
    const monthMap = new Map<string, { credit: number; debit: number; count: number }>();
    const merchantMap = new Map<string, { amount: number; count: number }>();
    let totalCredit = 0;
    let totalDebit = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const tx of transactions) {
      if (tx.type === 'credit') {
        totalCredit += tx.amount;
      } else {
        totalDebit += tx.amount;
      }

      if (tx.date) {
        if (!minDate || tx.date < minDate) minDate = tx.date;
        if (!maxDate || tx.date > maxDate) maxDate = tx.date;

        const monthKey = tx.date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        const existing = monthMap.get(monthKey) || { credit: 0, debit: 0, count: 0 };
        if (tx.type === 'credit') {
          existing.credit += tx.amount;
        } else {
          existing.debit += tx.amount;
        }
        existing.count++;
        monthMap.set(monthKey, existing);
      }

      // Track merchants
      const merchantData = merchantMap.get(tx.merchant) || { amount: 0, count: 0 };
      merchantData.amount += tx.amount;
      merchantData.count++;
      merchantMap.set(tx.merchant, merchantData);
    }

    // Sort and format
    const monthWise = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const topMerchants = Array.from(merchantMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalTransactions: transactions.length,
      totalCredit,
      totalDebit,
      monthWise,
      topMerchants,
      dateRange: {
        start: minDate?.toLocaleDateString('en-IN') || 'N/A',
        end: maxDate?.toLocaleDateString('en-IN') || 'N/A',
      },
    };
  };

  const parseCSV = (content: string): { preview: string; rowCount: number } => {
    const lines = content.trim().split('\n');
    const rowCount = lines.length - 1;
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
        const analysis = analyzeTransactionData(content);
        
        const newData: UploadedData = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: file.name.endsWith('.csv') ? 'CSV' : file.name.endsWith('.xlsx') ? 'Excel' : 'Text',
          content,
          preview,
          rowCount,
          analysis,
        };
        
        setUploadedData(prev => [...prev, newData]);
        toast.success(`Uploaded: ${file.name}${analysis ? ' (Transaction data detected)' : ''}`);
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
    const analysis = analyzeTransactionData(pastedData);
    
    const newData: UploadedData = {
      id: Date.now().toString(),
      name: dataLabel || `Data ${uploadedData.length + 1}`,
      type: 'Pasted',
      content: pastedData,
      preview,
      rowCount,
      analysis,
    };

    setUploadedData(prev => [...prev, newData]);
    setPastedData("");
    setDataLabel("");
    setShowDataInput(false);
    toast.success(`Data added${analysis ? ' (Transaction data detected)' : ''}`);
  };

  const removeData = (id: string) => {
    setUploadedData(prev => prev.filter(d => d.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
      if (data.analysis) {
        context += `**Pre-Analysis:**\n`;
        context += `- Total Transactions: ${data.analysis.totalTransactions}\n`;
        context += `- Total Credit: ₹${data.analysis.totalCredit.toFixed(2)}\n`;
        context += `- Total Debit: ₹${data.analysis.totalDebit.toFixed(2)}\n`;
        context += `- Date Range: ${data.analysis.dateRange.start} to ${data.analysis.dateRange.end}\n\n`;
      }
    });

    context += `---\n**TOTAL: ${uploadedData.length} files, ${totalRows} data rows.**\n`;
    context += "INSTRUCTION: Process ALL rows from ALL files. Cross-reference between files where applicable. Show verification at the end.";
    return context;
  }, [uploadedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    const message = query;
    setQuery("");
    
    const context = buildDataContext();
    
    await logActivity("query", "ai_agent", undefined, { query: message, agent: selectedAgent });
    await sendMessage(message, selectedAgent as any, context);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    const context = buildDataContext();
    await logActivity("query", "ai_agent", undefined, { query: suggestion, agent: selectedAgent });
    await sendMessage(suggestion, selectedAgent as any, context);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    clearMessages();
    setUploadedData([]);
  };

  const selectedAgentConfig = agentTypes.find(a => a.id === selectedAgent) || agentTypes[0];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                  selectedAgentConfig.gradient
                )}>
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    Ask AI Agent
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Upload data and ask questions in natural language
                  </p>
                </div>
                {messages.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearChat}>
                    Clear Chat
                  </Button>
                )}
              </div>

              {/* Agent Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                {agentTypes.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <Button
                      key={agent.id}
                      variant={selectedAgent === agent.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedAgent(agent.id)}
                      className="gap-1.5"
                    >
                      <Icon className={cn("w-4 h-4", selectedAgent !== agent.id && agent.color)} />
                      {agent.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Uploaded Data Bar */}
          {uploadedData.length > 0 && (
            <div className="border-b border-border bg-muted/30 px-6 py-3">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">Working with:</span>
                  {uploadedData.map((data) => (
                    <Badge key={data.id} variant="secondary" className="gap-1.5 pr-1">
                      <FileSpreadsheet className="w-3 h-3" />
                      {data.name}
                      {data.rowCount !== undefined && (
                        <span className="text-muted-foreground">({data.rowCount} rows)</span>
                      )}
                      {data.analysis && (
                        <span className="text-success">✓</span>
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

          {/* Transaction Analysis Cards */}
          {uploadedData.some(d => d.analysis) && (
            <div className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 px-6 py-4">
              <div className="max-w-4xl mx-auto">
                {uploadedData.filter(d => d.analysis).map(data => (
                  <div key={data.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">Transaction Analysis: {data.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {data.analysis!.dateRange.start} - {data.analysis!.dateRange.end}
                      </Badge>
                    </div>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Total Transactions</div>
                        <div className="text-xl font-bold">{data.analysis!.totalTransactions}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <ArrowDownRight className="w-3 h-3 text-success" />
                          Total Credit
                        </div>
                        <div className="text-xl font-bold text-success">{formatCurrency(data.analysis!.totalCredit)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <ArrowUpRight className="w-3 h-3 text-destructive" />
                          Total Debit
                        </div>
                        <div className="text-xl font-bold text-destructive">{formatCurrency(data.analysis!.totalDebit)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <div className="text-xs text-muted-foreground mb-1">Net Flow</div>
                        <div className={cn(
                          "text-xl font-bold",
                          data.analysis!.totalCredit - data.analysis!.totalDebit >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {formatCurrency(data.analysis!.totalCredit - data.analysis!.totalDebit)}
                        </div>
                      </div>
                    </div>

                    {/* Month-wise & Top Merchants */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Month-wise */}
                      {data.analysis!.monthWise.length > 0 && (
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Month-wise Breakdown</span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {data.analysis!.monthWise.map(m => (
                              <div key={m.month} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{m.month}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-success">+{formatCurrency(m.credit)}</span>
                                  <span className="text-destructive">-{formatCurrency(m.debit)}</span>
                                  <span className="text-xs text-muted-foreground">({m.count})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top Merchants */}
                      {data.analysis!.topMerchants.length > 0 && (
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <IndianRupee className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Top Merchants/Payees</span>
                          </div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {data.analysis!.topMerchants.map((m, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground truncate max-w-[150px]">{m.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{formatCurrency(m.amount)}</span>
                                  <span className="text-xs text-muted-foreground">({m.count}x)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                {messages.length === 0 ? (
                  /* Empty State with Suggestions */
                  <div className="space-y-6 animate-fade-in">
                    {/* Welcome Card */}
                    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <img 
                            src={apnaCaLogo} 
                            alt="Apna CA" 
                            className="w-12 h-12 object-contain rounded-lg"
                          />
                          <div>
                            <h3 className="font-semibold mb-2">Welcome to Apna CA AI Assistant</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              I can help you with GST, Income Tax, Audit, Compliance, and Financial Analysis.
                              Upload your data files (Paytm statements, bank transactions, invoices) and I'll analyze them for you.
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
                          Accepted: CSV, TXT, Excel files (Bank statements, Paytm data, invoices, etc.)
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
                              placeholder="Data label (e.g., 'Paytm Jan 2026')"
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

                    {/* Suggested Queries */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        {uploadedData.length > 0 ? "Now ask me to analyze your data:" : "Or try these questions:"}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedQueries.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-left p-3 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-sm text-foreground"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Messages */
                  <>
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
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : cn("bg-gradient-to-br", selectedAgentConfig.gradient)
                          )}
                        >
                          {message.role === "user" ? (
                            <User className="w-5 h-5" />
                          ) : (
                            <Bot className="w-5 h-5 text-white" />
                          )}
                        </div>

                        <div
                          className={cn(
                            "flex-1 max-w-[85%] rounded-xl p-4 relative group",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-card border border-border shadow-sm"
                          )}
                        >
                          {message.role === "assistant" ? (
                            message.content ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:text-primary prose-headings:text-foreground prose-strong:text-foreground">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">
                                  {uploadedData.length > 0 ? "Analyzing your data..." : "Thinking..."}
                                </span>
                              </div>
                            )
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 h-12 w-12"
                  title="Upload data file"
                >
                  <Upload className="w-5 h-5" />
                </Button>
                <Textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    uploadedData.length > 0
                      ? "Ask about your uploaded data..."
                      : "Ask about GST, Income Tax, compliance, or upload data to analyze..."
                  }
                  className="flex-1 min-h-[48px] max-h-32 resize-none text-base py-3"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6"
                  disabled={!query.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
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