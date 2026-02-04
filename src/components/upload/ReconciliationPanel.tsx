import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Loader2,
  FileText,
  ArrowRight
} from "lucide-react";
import { MismatchTable } from "./MismatchTable";
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
  matchedEntries: Array<{
    matched: boolean;
    file1Entry: Entry;
    file2Entry: Entry | null;
    matchType: "exact" | "partial" | "unmatched";
    confidence: number;
    reason?: string;
  }>;
  unmatchedFromFile1: Entry[];
  unmatchedFromFile2: Entry[];
  aiInsights: string;
}

interface ReconciliationPanelProps {
  files: ProcessedFile[];
}

export function ReconciliationPanel({ files }: ReconciliationPanelProps) {
  const [selectedFiles, setSelectedFiles] = useState<[string | null, string | null]>([null, null]);
  const [isReconciling, setIsReconciling] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const handleFileSelect = (fileId: string, slot: 0 | 1) => {
    const newSelection = [...selectedFiles] as [string | null, string | null];
    newSelection[slot] = fileId;
    setSelectedFiles(newSelection);
    setResult(null); // Clear previous result
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
      setResult(data.result);
      
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

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Data Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select two files to compare and find matching/mismatching entries using AI-powered analysis
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
          {/* Summary Card */}
          <Card className={
            result.summary.matchPercentage >= 90 
              ? "border-success/30 bg-success/5" 
              : result.summary.matchPercentage >= 70
              ? "border-warning/30 bg-warning/5"
              : "border-destructive/30 bg-destructive/5"
          }>
            <CardHeader>
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
            <CardContent className="space-y-6">
              {/* Match Percentage */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Match Rate</span>
                  <span className="font-semibold">{result.summary.matchPercentage}%</span>
                </div>
                <Progress 
                  value={result.summary.matchPercentage} 
                  className="h-3"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-bold text-success">{result.summary.matched}</div>
                  <div className="text-xs text-muted-foreground">Exact Matches</div>
                </div>
                <div className="p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-bold text-warning">{result.summary.partialMatched}</div>
                  <div className="text-xs text-muted-foreground">Partial Matches</div>
                </div>
                <div className="p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-bold text-destructive">{result.summary.unmatched}</div>
                  <div className="text-xs text-muted-foreground">Unmatched</div>
                </div>
                <div className="p-3 rounded-lg bg-background border">
                  <div className="text-2xl font-bold">{result.summary.amountDifference}</div>
                  <div className="text-xs text-muted-foreground">Amount Difference</div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="p-4 rounded-lg bg-background border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  AI Insights
                </h4>
                <p className="text-sm text-muted-foreground">{result.aiInsights}</p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  File 1: {result.summary.totalFile1} entries
                </Badge>
                <Badge variant="outline">
                  File 2: {result.summary.totalFile2} entries
                </Badge>
                {result.summary.matchPercentage >= 90 && (
                  <Badge className="bg-success text-success-foreground">
                    High Confidence Match
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mismatch Details */}
          {(result.unmatchedFromFile1.length > 0 || result.unmatchedFromFile2.length > 0) && (
            <MismatchTable
              unmatchedFromFile1={result.unmatchedFromFile1}
              unmatchedFromFile2={result.unmatchedFromFile2}
              file1Name={getSelectedFile(0)?.name || "File 1"}
              file2Name={getSelectedFile(1)?.name || "File 2"}
            />
          )}
        </>
      )}
    </div>
  );
}
