import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useNavigate, useLocation } from "react-router-dom";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Upload, FileSpreadsheet, FileText, Database, CheckCircle2, Loader2, AlertCircle, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReconciliationPanel } from "@/components/upload/ReconciliationPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Entry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  result?: {
    transactions?: number;
    totalAmount?: string;
    period?: string;
    type?: string;
    summary?: string;
    entries?: Entry[];
  };
  error?: string;
}

const supportedFormats = [
  { icon: FileSpreadsheet, label: "Excel", ext: ".xlsx, .xls", accept: ".xlsx,.xls" },
  { icon: FileText, label: "PDF", ext: ".pdf", accept: ".pdf" },
  { icon: Database, label: "CSV/JSON", ext: ".csv, .json", accept: ".csv,.json" },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logActivity } = useActivityLog();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const processFile = useCallback(async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    };

    setFiles(prev => [...prev, newFile]);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: i } : f
      ));
    }

    // Update to processing status
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: "processing", progress: 100 } : f
    ));

    try {
      // Call the edge function to process the file
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process file");
      }

      const result = await response.json();

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: "completed", 
          result: result.data 
        } : f
      ));

      // Log the upload activity
      await logActivity("upload", "document", undefined, { 
        name: file.name, 
        type: result.data?.type,
        entries: result.data?.transactions 
      });

      toast.success(`${file.name} processed successfully!`);
    } catch (error) {
      console.error("Processing error:", error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: "error", 
          error: "Failed to process file. Please try again." 
        } : f
      ));
      toast.error(`Failed to process ${file.name}`);
    }
  }, [logActivity]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(processFile);
    e.target.value = "";
  }, [processFile]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get completed files for reconciliation
  const completedFiles = files
    .filter(f => f.status === "completed" && f.result?.entries)
    .map(f => ({
      id: f.id,
      name: f.name,
      type: f.result?.type || "Unknown",
      entries: f.result?.entries || [],
      totalAmount: f.result?.totalAmount || "₹0",
    }));

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={location.pathname} onNavigate={(href) => navigate(href)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Upload & Reconcile Data
              </h1>
              <p className="text-muted-foreground">
                Upload files for AI-powered analysis and data reconciliation
              </p>
            </div>

            {/* Upload Zone */}
            <Card>
              <CardContent className="p-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-secondary/30"
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.pdf,.csv,.json"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all",
                        isDragging ? "bg-primary/10" : "bg-secondary"
                      )}
                    >
                      <Upload className={cn("w-8 h-8", isDragging ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <p className="text-lg font-medium text-foreground mb-2">
                      Drop files here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Bank statements, invoices, ledgers, or ERP exports
                    </p>
                    
                    {/* Supported Formats */}
                    <div className="flex items-center gap-6 mt-4">
                      {supportedFormats.map(({ icon: Icon, label, ext }) => (
                        <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon className="w-5 h-5" />
                          <span>
                            {label} <span className="text-xs">({ext})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border"
                    >
                      {/* File Icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        file.status === "completed" ? "bg-success/10" :
                        file.status === "error" ? "bg-destructive/10" :
                        "bg-primary/10"
                      )}>
                        {file.status === "completed" ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : file.status === "error" ? (
                          <AlertCircle className="w-5 h-5 text-destructive" />
                        ) : file.status === "processing" ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.status === "processing" && " • AI Processing..."}
                          {file.status === "completed" && file.result && (
                            <span className="text-success">
                              {" • "}
                              {file.result.transactions} entries • {file.result.type}
                              {file.result.totalAmount && ` • ${file.result.totalAmount}`}
                            </span>
                          )}
                          {file.status === "error" && (
                            <span className="text-destructive"> • {file.error}</span>
                          )}
                        </p>
                        
                        {/* Progress Bar */}
                        {(file.status === "uploading" || file.status === "processing") && (
                          <Progress value={file.progress} className="h-1 mt-2" />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {file.status === "completed" && file.result?.entries && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* AI Summary for completed files */}
            {files.some(f => f.status === "completed" && f.result?.summary) && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    AI Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {files
                    .filter(f => f.status === "completed" && f.result?.summary)
                    .map(file => (
                      <div key={file.id} className="p-3 rounded-lg bg-background/50">
                        <p className="font-medium text-sm mb-1">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.result?.summary}</p>
                      </div>
                    ))
                  }
                </CardContent>
              </Card>
            )}

            {/* Reconciliation Panel */}
            <ReconciliationPanel files={completedFiles} />

            {/* Quick Actions */}
            {files.some(f => f.status === "completed") && (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Files Processed Successfully</h3>
                      <p className="text-sm text-muted-foreground">
                        {files.filter(f => f.status === "completed").length} file(s) ready for analysis
                      </p>
                    </div>
                    <Button className="ml-auto" onClick={() => navigate("/query")}>
                      Ask AI Questions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewFile?.name} - Extracted Data</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewFile?.result?.entries && previewFile.result.entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewFile.result.entries.slice(0, 50).map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{entry.date || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.description || "-"}</TableCell>
                      <TableCell>{entry.party || "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{entry.reference || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatAmount(entry.amount)}</TableCell>
                      <TableCell>{entry.type || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No entries extracted</p>
            )}
            {previewFile?.result?.entries && previewFile.result.entries.length > 50 && (
              <p className="text-center py-4 text-sm text-muted-foreground">
                Showing first 50 of {previewFile.result.entries.length} entries
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
