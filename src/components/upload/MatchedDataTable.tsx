import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, AlertTriangle, ArrowLeftRight } from "lucide-react";

interface Entry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
}

interface MatchedEntry {
  matched: boolean;
  file1Entry: Entry;
  file2Entry: Entry | null;
  matchType: "exact" | "partial" | "unmatched";
  confidence: number;
  reason?: string;
}

interface MatchedDataTableProps {
  exactMatches: MatchedEntry[];
  partialMatches: MatchedEntry[];
}

export function MatchedDataTable({ exactMatches, partialMatches }: MatchedDataTableProps) {
  const formatAmount = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalMatched = exactMatches.length + partialMatches.length;

  if (totalMatched === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No matched entries found</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="exact" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="exact" className="gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          Exact Matches
          <Badge variant="secondary" className="ml-1">{exactMatches.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="partial" className="gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Partial Matches
          <Badge variant="secondary" className="ml-1">{partialMatches.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="exact">
        {exactMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No exact matches found
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-success/5">
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead className="text-right">Amount (Source)</TableHead>
                  <TableHead className="text-right">Amount (Comparison)</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exactMatches.slice(0, 50).map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {entry.file1Entry.date || "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {entry.file1Entry.description || "-"}
                    </TableCell>
                    <TableCell>{entry.file1Entry.party || "-"}</TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatAmount(entry.file1Entry.amount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {formatAmount(entry.file2Entry?.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-success text-success-foreground">
                        {entry.confidence}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {exactMatches.length > 50 && (
              <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50">
                Showing 50 of {exactMatches.length} exact matches
              </div>
            )}
          </div>
        )}

        {exactMatches.length > 0 && (
          <Card className="mt-4 bg-success/5 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">
                  {exactMatches.length} entries matched exactly
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Total matched amount:{" "}
                <span className="font-semibold text-foreground">
                  {formatAmount(exactMatches.reduce((sum, e) => sum + (e.file1Entry.amount || 0), 0))}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="partial">
        {partialMatches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No partial matches found
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-warning/5">
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (Source)</TableHead>
                  <TableHead className="text-right">Amount (Comparison)</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partialMatches.map((entry, index) => {
                  const diff = (entry.file1Entry.amount || 0) - (entry.file2Entry?.amount || 0);
                  return (
                    <TableRow key={index} className="bg-warning/5">
                      <TableCell className="font-mono text-sm">
                        {entry.file1Entry.date || "-"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {entry.file1Entry.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatAmount(entry.file1Entry.amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatAmount(entry.file2Entry?.amount)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${diff !== 0 ? "text-destructive" : ""}`}>
                        {diff !== 0 ? formatAmount(Math.abs(diff)) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {entry.reason || "Partial match"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {partialMatches.length > 0 && (
          <Card className="mt-4 bg-warning/5 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  {partialMatches.length} entries need verification
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                These entries matched on some criteria but have differences that require manual review.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
