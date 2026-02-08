import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Bot,
  ClipboardList,
  FileSpreadsheet,
} from "lucide-react";

interface ReconciliationSuggestionsProps {
  suggestions: string[];
  matchPercentage: number;
  unmatchedCount: number;
  amountDifference: string;
}

export function ReconciliationSuggestions({
  suggestions,
  matchPercentage,
  unmatchedCount,
  amountDifference,
}: ReconciliationSuggestionsProps) {
  const navigate = useNavigate();

  const getPriorityLevel = (index: number): "high" | "medium" | "low" => {
    if (index === 0) return "high";
    if (index < 3) return "medium";
    return "low";
  };

  const priorityConfig = {
    high: {
      color: "border-destructive/30 bg-destructive/5",
      badge: "bg-destructive text-destructive-foreground",
      label: "High Priority",
    },
    medium: {
      color: "border-warning/30 bg-warning/5",
      badge: "bg-warning text-warning-foreground",
      label: "Medium",
    },
    low: {
      color: "border-muted bg-muted/30",
      badge: "bg-muted text-muted-foreground",
      label: "Low",
    },
  };

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Card className={
        matchPercentage >= 90 
          ? "border-success/30 bg-success/5" 
          : matchPercentage >= 70
          ? "border-warning/30 bg-warning/5"
          : "border-destructive/30 bg-destructive/5"
      }>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {matchPercentage >= 90 ? (
              <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {matchPercentage >= 90 
                  ? "Reconciliation Complete - Ready for Sign-off" 
                  : matchPercentage >= 70
                  ? "Reconciliation Requires Review"
                  : "Significant Discrepancies Found"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {matchPercentage >= 90 
                  ? `${matchPercentage}% match rate achieved. Review minor discrepancies below before finalizing.`
                  : `${unmatchedCount} unmatched entries with ${amountDifference} net difference require attention.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Recommended Next Steps
        </h4>

        {suggestions.map((suggestion, index) => {
          const priority = getPriorityLevel(index);
          const config = priorityConfig[priority];

          return (
            <Card key={index} className={config.color}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center shrink-0 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={config.badge} variant="secondary">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{suggestion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Quick Actions
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-3"
              onClick={() => navigate("/agents/accounting")}
            >
              <Bot className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Ask AI Agent</div>
                <div className="text-xs text-muted-foreground">Get help resolving discrepancies</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-3"
              onClick={() => navigate("/reports")}
            >
              <FileCheck className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Generate Report</div>
                <div className="text-xs text-muted-foreground">Create audit-ready documentation</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Before Closing Reconciliation
          </h4>
          <div className="space-y-2">
            {[
              "Review all unmatched entries and document reasons",
              "Verify partial matches with supporting documents",
              "Record adjusting entries if required",
              "Download and archive reconciliation report",
              "Obtain manager/partner approval if needed",
            ].map((item, index) => (
              <label key={index} className="flex items-center gap-2 text-sm cursor-pointer group">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {item}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
