interface Entry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
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

const formatAmount = (amount?: number): string => {
  if (amount === undefined) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function generateReconciliationReport(
  result: ReconciliationResult,
  file1Name: string,
  file2Name: string
): void {
  const now = new Date();
  
  let content = `
================================================================================
                        DATA RECONCILIATION REPORT
================================================================================

Generated: ${formatDate(now)}
Source File: ${file1Name}
Comparison File: ${file2Name}

================================================================================
                              SUMMARY
================================================================================

Match Rate: ${result.summary.matchPercentage}%

+-------------------+------------------+
| Metric            | Count            |
+-------------------+------------------+
| File 1 Entries    | ${String(result.summary.totalFile1).padStart(16)} |
| File 2 Entries    | ${String(result.summary.totalFile2).padStart(16)} |
| Exact Matches     | ${String(result.summary.matched).padStart(16)} |
| Partial Matches   | ${String(result.summary.partialMatched).padStart(16)} |
| Unmatched         | ${String(result.summary.unmatched).padStart(16)} |
| Amount Difference | ${result.summary.amountDifference.padStart(16)} |
+-------------------+------------------+

================================================================================
                            AI INSIGHTS
================================================================================

${result.aiInsights}

`;

  // Add unmatched entries from File 1
  if (result.unmatchedFromFile1.length > 0) {
    content += `
================================================================================
                UNMATCHED ENTRIES FROM: ${file1Name}
================================================================================

Total Unmatched: ${result.unmatchedFromFile1.length} entries
Total Amount: ${formatAmount(result.unmatchedFromFile1.reduce((sum, e) => sum + (e.amount || 0), 0))}

`;
    
    result.unmatchedFromFile1.forEach((entry, index) => {
      content += `
Entry #${index + 1}
  Date: ${entry.date || "N/A"}
  Description: ${entry.description || "N/A"}
  Amount: ${formatAmount(entry.amount)}
  Reference: ${entry.reference || "N/A"}
  Party: ${entry.party || "N/A"}
  Type: ${entry.type || "N/A"}
`;
    });
  }

  // Add unmatched entries from File 2
  if (result.unmatchedFromFile2.length > 0) {
    content += `
================================================================================
                UNMATCHED ENTRIES FROM: ${file2Name}
================================================================================

Total Unmatched: ${result.unmatchedFromFile2.length} entries
Total Amount: ${formatAmount(result.unmatchedFromFile2.reduce((sum, e) => sum + (e.amount || 0), 0))}

`;
    
    result.unmatchedFromFile2.forEach((entry, index) => {
      content += `
Entry #${index + 1}
  Date: ${entry.date || "N/A"}
  Description: ${entry.description || "N/A"}
  Amount: ${formatAmount(entry.amount)}
  Reference: ${entry.reference || "N/A"}
  Party: ${entry.party || "N/A"}
  Type: ${entry.type || "N/A"}
`;
    });
  }

  // Add matched entries with partial matches highlighted
  const partialMatches = result.matchedEntries.filter(m => m.matchType === "partial");
  if (partialMatches.length > 0) {
    content += `
================================================================================
                    PARTIAL MATCHES (Review Required)
================================================================================

Total Partial Matches: ${partialMatches.length} entries

`;
    
    partialMatches.forEach((match, index) => {
      content += `
Match #${index + 1} (Confidence: ${match.confidence}%)
  Reason: ${match.reason || "Partial data match"}
  
  File 1 Entry:
    Date: ${match.file1Entry.date || "N/A"}
    Description: ${match.file1Entry.description || "N/A"}
    Amount: ${formatAmount(match.file1Entry.amount)}
    Reference: ${match.file1Entry.reference || "N/A"}
  
  File 2 Entry:
    Date: ${match.file2Entry?.date || "N/A"}
    Description: ${match.file2Entry?.description || "N/A"}
    Amount: ${formatAmount(match.file2Entry?.amount)}
    Reference: ${match.file2Entry?.reference || "N/A"}
`;
    });
  }

  content += `
================================================================================
                              END OF REPORT
================================================================================

This report was generated automatically by the AI-powered reconciliation system.
For queries or discrepancies, please review the source documents manually.
`;

  // Create and download the file
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Reconciliation_Report_${now.toISOString().split("T")[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// PDF-style report generation (enhanced version)
export function generateReconciliationPDF(
  result: ReconciliationResult,
  file1Name: string,
  file2Name: string
): void {
  const now = new Date();
  
  // Create HTML content for better formatting
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reconciliation Report</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { color: #1a1a2e; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
    h2 { color: #4f46e5; margin-top: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #4f46e5; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1a1a2e; }
    .stat-label { color: #666; font-size: 14px; }
    .success { border-left-color: #10b981; }
    .warning { border-left-color: #f59e0b; }
    .danger { border-left-color: #ef4444; }
    .insights { background: linear-gradient(135deg, #f0f4ff, #e5edff); border-radius: 8px; padding: 20px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #4f46e5; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .amount { text-align: right; font-family: monospace; }
    .meta { color: #888; font-size: 12px; margin-top: 40px; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>📊 Data Reconciliation Report</h1>
  
  <p style="color: #666;">
    <strong>Generated:</strong> ${formatDate(now)}<br>
    <strong>Source:</strong> ${file1Name}<br>
    <strong>Comparison:</strong> ${file2Name}
  </p>

  <div class="summary-grid">
    <div class="stat-card ${result.summary.matchPercentage >= 90 ? 'success' : result.summary.matchPercentage >= 70 ? 'warning' : 'danger'}">
      <div class="stat-value">${result.summary.matchPercentage}%</div>
      <div class="stat-label">Match Rate</div>
    </div>
    <div class="stat-card success">
      <div class="stat-value">${result.summary.matched}</div>
      <div class="stat-label">Exact Matches</div>
    </div>
    <div class="stat-card warning">
      <div class="stat-value">${result.summary.partialMatched}</div>
      <div class="stat-label">Partial Matches</div>
    </div>
    <div class="stat-card danger">
      <div class="stat-value">${result.summary.unmatched}</div>
      <div class="stat-label">Unmatched Entries</div>
    </div>
  </div>

  <div class="insights">
    <h3 style="margin-top: 0;">🤖 AI Analysis</h3>
    <p>${result.aiInsights}</p>
  </div>

  ${result.unmatchedFromFile1.length > 0 ? `
  <h2>⚠️ Unmatched from ${file1Name}</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Description</th>
      <th>Reference</th>
      <th class="amount">Amount</th>
    </tr>
    ${result.unmatchedFromFile1.map(e => `
    <tr>
      <td>${e.date || '-'}</td>
      <td>${e.description || '-'}</td>
      <td>${e.reference || '-'}</td>
      <td class="amount">${formatAmount(e.amount)}</td>
    </tr>
    `).join('')}
  </table>
  ` : ''}

  ${result.unmatchedFromFile2.length > 0 ? `
  <h2>⚠️ Unmatched from ${file2Name}</h2>
  <table>
    <tr>
      <th>Date</th>
      <th>Description</th>
      <th>Reference</th>
      <th class="amount">Amount</th>
    </tr>
    ${result.unmatchedFromFile2.map(e => `
    <tr>
      <td>${e.date || '-'}</td>
      <td>${e.description || '-'}</td>
      <td>${e.reference || '-'}</td>
      <td class="amount">${formatAmount(e.amount)}</td>
    </tr>
    `).join('')}
  </table>
  ` : ''}

  <p class="meta">
    This report was automatically generated by AI-powered reconciliation.<br>
    Amount Difference: ${result.summary.amountDifference}
  </p>
</body>
</html>
`;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
}
