import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Loader2,
  FileText,
  ArrowRight,
  Lightbulb,
  ArrowUpRight,
  CheckCheck,
  ListX,
  Bot,
  Sparkles,
} from "lucide-react";
import { MismatchTable } from "./MismatchTable";
import { MatchedDataTable } from "./MatchedDataTable";
import { ReconciliationSuggestions } from "./ReconciliationSuggestions";
import { generateReconciliationReport } from "@/lib/reconciliationReport";

interface Entry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
}

interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  entries: Entry[];
  totalAmount: string;
}

interface MatchedEntry {
  matched: boolean;
  file1Entry: Entry;
  file2Entry: Entry | null;
  matchType: "exact" | "partial" | "unmatched";
  confidence: number;
  reason?: string;
}

interface ReconciliationResult {
  summary: {
    totalFile1: number;
    totalFile2: number;
    matched: number;
    partialMatched: number;
    unmatched: number;
    matchPercentage: number;
    amountDifference: string;
  };
  matchedEntries: MatchedEntry[];
  unmatchedFromFile1: Entry[];
  unmatchedFromFile2: Entry[];
  aiInsights: string;
  suggestions?: string[];
}

interface ReconciliationPanelProps {
  files: ProcessedFile[];
}

export function ReconciliationPanel({ files }: ReconciliationPanelProps) {
  const [selectedFiles, setSelectedFiles] = useState<[string | null, string | null]>([null, null]);
  const [isReconciling, setIsReconciling] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  const handleFileSelect = (fileId: string, slot: 0 | 1) => {
    const newSelection = [...selectedFiles] as [string | null, string | null];
    newSelection[slot] = fileId;
    setSelectedFiles(newSelection);
    setResult(null);
  };

  const getSelectedFile = (slot: 0 | 1) => {
    return files.find(f => f.id === selectedFiles[slot]);
  };

  const canReconcile = selectedFiles[0] && selectedFiles[1] && selectedFiles[0] !== selectedFiles[1];

  const handleReconcile = async () => {
    if (!canReconcile) return;

    const file1 = getSelectedFile(0);
    const file2 = getSelectedFile(1);

    if (!file1 || !file2) return;

    setIsReconciling(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reconcile-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            file1: {
              fileName: file1.name,
              type: file1.type,
              entries: file1.entries,
              totalAmount: file1.totalAmount,
            },
            file2: {
              fileName: file2.name,
              type: file2.type,
              entries: file2.entries,
              totalAmount: file2.totalAmount,
            },
            matchingStrategy: "smart",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Reconciliation failed");
      }

      const data = await response.json();
      
      // Add default suggestions if not provided
      const resultWithSuggestions = {
        ...data.result,
        suggestions: data.result.suggestions || generateSuggestions(data.result),
      };
      
      setResult(resultWithSuggestions);
      setActiveTab("summary");
      
      if (data.result.summary.matchPercentage >= 90) {
        toast.success("Excellent! Data matches with high confidence");
      } else if (data.result.summary.matchPercentage >= 70) {
        toast.success("Reconciliation complete - some discrepancies found");
      } else {
        toast.warning("Significant mismatches detected - review required");
      }
    } catch (error) {
      console.error("Reconciliation error:", error);
      toast.error("Failed to reconcile files");
    } finally {
      setIsReconciling(false);
    }
  };

  const generateSuggestions = (result: ReconciliationResult): string[] => {
    const suggestions: string[] = [];
    
    if (result.summary.unmatched > 0) {
      suggestions.push(`Review ${result.summary.unmatched} unmatched entries - check for data entry errors, missing invoices, or timing differences.`);
    }
    
    if (result.summary.partialMatched > 0) {
      suggestions.push(`${result.summary.partialMatched} entries have partial matches - verify amounts and references manually to confirm accuracy.`);
    }
    
    if (result.summary.amountDifference !== "₹0") {
      suggestions.push(`Net difference of ${result.summary.amountDifference} detected - investigate timing differences, pending entries, or reconciliation adjustments needed.`);
    }
    
    if (result.unmatchedFromFile1.length > result.unmatchedFromFile2.length) {
      suggestions.push("More unmatched entries in source file - some transactions may not have been recorded in the comparison file yet.");
    }
    
    if (result.summary.matchPercentage >= 95) {
      suggestions.push("High match rate achieved! Review minor discrepancies and proceed with sign-off.");
    } else if (result.summary.matchPercentage < 70) {
      suggestions.push("Low match rate indicates potential data quality issues - verify file formats, date ranges, and data extraction accuracy.");
    }
    
    suggestions.push("Export the reconciliation report for audit trail and management review.");
    
    return suggestions;
  };

  const handleDownloadReport = () => {
    if (!result) return;
    
    const file1 = getSelectedFile(0);
    const file2 = getSelectedFile(1);
    
    if (!file1 || !file2) return;

    generateReconciliationReport(result, file1.name, file2.name);
    toast.success("Reconciliation report downloaded");
  };

  if (files.length < 2) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <GitCompare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Data Reconciliation</h3>
          <p className="text-sm text-muted-foreground">
            Upload at least 2 files to compare and reconcile data
          </p>
        </CardContent>
      </Card>
    );
  }

  const exactMatches = result?.matchedEntries.filter(e => e.matchType === "exact") || [];
  const partialMatches = result?.matchedEntries.filter(e => e.matchType === "partial") || [];

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Data Reconciliation
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select two files to compare and find matching/mismatching entries with AI-powered analysis and actionable suggestions
          </p>

          <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            {/* File 1 Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Source File</label>
              <div className="grid gap-2">
                {files.map(file => (
                  <button
                    key={file.id}
                    onClick={() => handleFileSelect(file.id, 0)}
                    disabled={file.id === selectedFiles[1]}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedFiles[0] === file.id
                        ? "border-primary bg-primary/5"
                        : file.id === selectedFiles[1]
                        ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate">{file.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {file.entries.length} entries • {file.type}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            {/* File 2 Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comparison File</label>
              <div className="grid gap-2">
                {files.map(file => (
                  <button
                    key={file.id}
                    onClick={() => handleFileSelect(file.id, 1)}
                    disabled={file.id === selectedFiles[0]}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedFiles[1] === file.id
                        ? "border-primary bg-primary/5"
                        : file.id === selectedFiles[0]
                        ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate">{file.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {file.entries.length} entries • {file.type}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleReconcile} 
            disabled={!canReconcile || isReconciling}
            className="w-full"
          >
            {isReconciling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4 mr-2" />
                Start Reconciliation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Results Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {result.summary.matchPercentage >= 90 ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : result.summary.matchPercentage >= 70 ? (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                  Reconciliation Results
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="summary" className="gap-2">
                    <CheckCheck className="w-4 h-4" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="matched" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Matched ({result.summary.matched})
                  </TabsTrigger>
                  <TabsTrigger value="unmatched" className="gap-2">
                    <ListX className="w-4 h-4" />
                    Unmatched ({result.summary.unmatched})
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Next Steps
                  </TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-6">
                  {/* Match Percentage */}
                  <div className={`p-4 rounded-lg border ${
                    result.summary.matchPercentage >= 90 
                      ? "border-success/30 bg-success/5" 
                      : result.summary.matchPercentage >= 70
                      ? "border-warning/30 bg-warning/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Overall Match Rate</span>
                      <span className="font-bold text-lg">{result.summary.matchPercentage}%</span>
                    </div>
                    <Progress 
                      value={result.summary.matchPercentage} 
                      className="h-3"
                    />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-xs text-muted-foreground">Exact Matches</span>
                      </div>
                      <div className="text-2xl font-bold text-success">{result.summary.matched}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="text-xs text-muted-foreground">Partial Matches</span>
                      </div>
                      <div className="text-2xl font-bold text-warning">{result.summary.partialMatched}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-destructive" />
                        <span className="text-xs text-muted-foreground">Unmatched</span>
                      </div>
                      <div className="text-2xl font-bold text-destructive">{result.summary.unmatched}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted border">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Net Difference</span>
                      </div>
                      <div className="text-2xl font-bold">{result.summary.amountDifference}</div>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      AI Analysis
                    </h4>
                    <p className="text-sm text-foreground">{result.aiInsights}</p>
                  </div>

                  {/* File Stats */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {getSelectedFile(0)?.name}: {result.summary.totalFile1} entries
                    </Badge>
                    <Badge variant="outline">
                      {getSelectedFile(1)?.name}: {result.summary.totalFile2} entries
                    </Badge>
                    {result.summary.matchPercentage >= 90 && (
                      <Badge className="bg-success text-success-foreground">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        High Confidence
                      </Badge>
                    )}
                  </div>
                </TabsContent>

                {/* Matched Tab */}
                <TabsContent value="matched">
                  <MatchedDataTable 
                    exactMatches={exactMatches}
                    partialMatches={partialMatches}
                  />
                </TabsContent>

                {/* Unmatched Tab */}
                <TabsContent value="unmatched">
                  <MismatchTable
                    unmatchedFromFile1={result.unmatchedFromFile1}
                    unmatchedFromFile2={result.unmatchedFromFile2}
                    file1Name={getSelectedFile(0)?.name || "File 1"}
                    file2Name={getSelectedFile(1)?.name || "File 2"}
                  />
                </TabsContent>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions">
                  <ReconciliationSuggestions 
                    suggestions={result.suggestions || []}
                    matchPercentage={result.summary.matchPercentage}
                    unmatchedCount={result.summary.unmatched}
                    amountDifference={result.summary.amountDifference}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
