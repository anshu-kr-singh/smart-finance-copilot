import { useState } from "react";
import { Upload, FileSpreadsheet, FileText, Database, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const supportedFormats = [
  { icon: FileSpreadsheet, label: "Excel", ext: ".xlsx, .xls" },
  { icon: FileText, label: "PDF", ext: ".pdf" },
  { icon: Database, label: "ERP Export", ext: ".csv, .json" },
];

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Upload className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Upload Data</h3>
          <p className="text-sm text-muted-foreground">Drop files for instant processing</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
        )}
      >
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all",
              isDragging ? "bg-primary/10" : "bg-secondary"
            )}
          >
            <Upload className={cn("w-6 h-6", isDragging ? "text-primary" : "text-muted-foreground")} />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Bank statements, invoices, ledgers, or ERP exports
          </p>
        </div>
      </div>

      {/* Supported Formats */}
      <div className="mt-4 flex items-center gap-4 justify-center">
        {supportedFormats.map(({ icon: Icon, label, ext }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="w-4 h-4" />
            <span>
              {label} <span className="text-xs">({ext})</span>
            </span>
          </div>
        ))}
      </div>

      {/* Recent Uploads */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3">Recent Uploads</p>
        <div className="space-y-2">
          {[
            { name: "HDFC_Statement_Dec24.pdf", status: "processed", time: "2 min ago" },
            { name: "Sales_Invoices_Q3.xlsx", status: "processed", time: "1 hour ago" },
          ].map((file) => (
            <div key={file.name} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground">{file.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
