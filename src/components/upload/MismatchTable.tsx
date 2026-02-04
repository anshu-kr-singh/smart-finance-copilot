import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { AlertCircle, FileWarning, ChevronDown, ChevronUp } from "lucide-react";

interface Entry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
}

interface MismatchTableProps {
  unmatchedFromFile1: Entry[];
  unmatchedFromFile2: Entry[];
  file1Name: string;
  file2Name: string;
}

export function MismatchTable({
  unmatchedFromFile1,
  unmatchedFromFile2,
  file1Name,
  file2Name,
}: MismatchTableProps) {
  const [expanded, setExpanded] = useState(true);

  const formatAmount = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalUnmatched = unmatchedFromFile1.length + unmatchedFromFile2.length;

  if (totalUnmatched === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Mismatched Entries ({totalUnmatched})
          </CardTitle>
          <Button variant="ghost" size="sm">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <Tabs defaultValue="file1" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file1" className="flex items-center gap-2">
                <FileWarning className="w-4 h-4" />
                {file1Name}
                <Badge variant="destructive" className="ml-1">
                  {unmatchedFromFile1.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="file2" className="flex items-center gap-2">
                <FileWarning className="w-4 h-4" />
                {file2Name}
                <Badge variant="destructive" className="ml-1">
                  {unmatchedFromFile2.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file1" className="mt-4">
              {unmatchedFromFile1.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All entries from {file1Name} have been matched
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Party/Vendor</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[80px]">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unmatchedFromFile1.map((entry, index) => (
                        <TableRow key={index} className="bg-destructive/5">
                          <TableCell className="font-mono text-sm">
                            {entry.date || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {entry.description || "-"}
                          </TableCell>
                          <TableCell>{entry.party || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.reference || "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatAmount(entry.amount)}
                          </TableCell>
                          <TableCell>
                            {entry.type && (
                              <Badge variant={entry.type === "Credit" ? "default" : "secondary"}>
                                {entry.type}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {unmatchedFromFile1.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong>Summary:</strong> {unmatchedFromFile1.length} entries from {file1Name} 
                    could not be matched in {file2Name}. Total unmatched amount:{" "}
                    <span className="font-semibold text-foreground">
                      {formatAmount(unmatchedFromFile1.reduce((sum, e) => sum + (e.amount || 0), 0))}
                    </span>
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="file2" className="mt-4">
              {unmatchedFromFile2.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  All entries from {file2Name} have been matched
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Party/Vendor</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[80px]">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unmatchedFromFile2.map((entry, index) => (
                        <TableRow key={index} className="bg-destructive/5">
                          <TableCell className="font-mono text-sm">
                            {entry.date || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {entry.description || "-"}
                          </TableCell>
                          <TableCell>{entry.party || "-"}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.reference || "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatAmount(entry.amount)}
                          </TableCell>
                          <TableCell>
                            {entry.type && (
                              <Badge variant={entry.type === "Credit" ? "default" : "secondary"}>
                                {entry.type}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {unmatchedFromFile2.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    <strong>Summary:</strong> {unmatchedFromFile2.length} entries from {file2Name} 
                    could not be matched in {file1Name}. Total unmatched amount:{" "}
                    <span className="font-semibold text-foreground">
                      {formatAmount(unmatchedFromFile2.reduce((sum, e) => sum + (e.amount || 0), 0))}
                    </span>
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
