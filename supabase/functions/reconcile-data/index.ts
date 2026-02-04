// AI-powered data reconciliation edge function

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Entry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
  [key: string]: string | number | undefined;
}

interface FileData {
  fileName: string;
  type: string;
  entries: Entry[];
  totalAmount: string;
}

interface MatchResult {
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
  matchedEntries: MatchResult[];
  unmatchedFromFile1: Entry[];
  unmatchedFromFile2: Entry[];
  aiInsights: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file1, file2, matchingStrategy } = await req.json() as {
      file1: FileData;
      file2: FileData;
      matchingStrategy?: string;
    };

    if (!file1 || !file2) {
      return new Response(
        JSON.stringify({ error: "Both files are required for reconciliation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await reconcileData(file1, file2, matchingStrategy || "smart");

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Reconciliation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Reconciliation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function reconcileData(
  file1: FileData,
  file2: FileData,
  strategy: string
): Promise<ReconciliationResult> {
  const entries1 = file1.entries || [];
  const entries2 = file2.entries || [];
  
  const matchedEntries: MatchResult[] = [];
  const unmatchedFromFile1: Entry[] = [];
  const unmatchedFromFile2: Entry[] = [...entries2];
  
  let matchedCount = 0;
  let partialMatchCount = 0;

  // Process each entry from file 1
  for (const entry1 of entries1) {
    let bestMatch: { entry: Entry; score: number; matchType: "exact" | "partial" } | null = null;
    let bestMatchIndex = -1;

    for (let i = 0; i < unmatchedFromFile2.length; i++) {
      const entry2 = unmatchedFromFile2[i];
      const matchScore = calculateMatchScore(entry1, entry2, strategy);

      if (matchScore > (bestMatch?.score || 0)) {
        bestMatch = { 
          entry: entry2, 
          score: matchScore,
          matchType: matchScore >= 90 ? "exact" : "partial"
        };
        bestMatchIndex = i;
      }
    }

    if (bestMatch && bestMatch.score >= 50) {
      // Found a match
      matchedEntries.push({
        matched: true,
        file1Entry: entry1,
        file2Entry: bestMatch.entry,
        matchType: bestMatch.matchType,
        confidence: bestMatch.score,
        reason: getMatchReason(entry1, bestMatch.entry, bestMatch.score),
      });

      if (bestMatch.matchType === "exact") {
        matchedCount++;
      } else {
        partialMatchCount++;
      }

      // Remove matched entry from unmatched list
      unmatchedFromFile2.splice(bestMatchIndex, 1);
    } else {
      // No match found
      unmatchedFromFile1.push(entry1);
      matchedEntries.push({
        matched: false,
        file1Entry: entry1,
        file2Entry: null,
        matchType: "unmatched",
        confidence: 0,
        reason: "No matching entry found in second file",
      });
    }
  }

  // Calculate totals
  const file1Total = entries1.reduce((sum, e) => sum + (e.amount || 0), 0);
  const file2Total = entries2.reduce((sum, e) => sum + (e.amount || 0), 0);
  const amountDiff = Math.abs(file1Total - file2Total);

  const matchPercentage = entries1.length > 0 
    ? Math.round(((matchedCount + partialMatchCount * 0.5) / entries1.length) * 100)
    : 0;

  // Generate AI insights
  const aiInsights = await generateReconciliationInsights(
    file1, file2, matchedCount, partialMatchCount, 
    unmatchedFromFile1.length, unmatchedFromFile2.length, amountDiff
  );

  return {
    summary: {
      totalFile1: entries1.length,
      totalFile2: entries2.length,
      matched: matchedCount,
      partialMatched: partialMatchCount,
      unmatched: unmatchedFromFile1.length + unmatchedFromFile2.length,
      matchPercentage,
      amountDifference: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amountDiff),
    },
    matchedEntries,
    unmatchedFromFile1,
    unmatchedFromFile2,
    aiInsights,
  };
}

function calculateMatchScore(entry1: Entry, entry2: Entry, strategy: string): number {
  let score = 0;
  let factors = 0;

  // Amount matching (highest weight)
  if (entry1.amount !== undefined && entry2.amount !== undefined) {
    const amountDiff = Math.abs(entry1.amount - entry2.amount);
    const maxAmount = Math.max(entry1.amount, entry2.amount) || 1;
    const amountSimilarity = 1 - (amountDiff / maxAmount);
    
    if (amountSimilarity >= 0.99) {
      score += 40; // Exact match
    } else if (amountSimilarity >= 0.95) {
      score += 30; // Very close
    } else if (amountSimilarity >= 0.90) {
      score += 20; // Close
    }
    factors++;
  }

  // Date matching
  if (entry1.date && entry2.date) {
    const date1 = normalizeDate(entry1.date);
    const date2 = normalizeDate(entry2.date);
    
    if (date1 === date2) {
      score += 25;
    } else if (datesWithinDays(date1, date2, 3)) {
      score += 15;
    } else if (datesWithinDays(date1, date2, 7)) {
      score += 10;
    }
    factors++;
  }

  // Reference matching
  if (entry1.reference && entry2.reference) {
    const ref1 = normalizeString(entry1.reference);
    const ref2 = normalizeString(entry2.reference);
    
    if (ref1 === ref2) {
      score += 25;
    } else if (ref1.includes(ref2) || ref2.includes(ref1)) {
      score += 15;
    }
    factors++;
  }

  // Description similarity
  if (entry1.description && entry2.description) {
    const similarity = stringSimilarity(
      normalizeString(entry1.description),
      normalizeString(entry2.description)
    );
    score += similarity * 10;
    factors++;
  }

  // Party/Vendor matching
  if (entry1.party && entry2.party) {
    const similarity = stringSimilarity(
      normalizeString(entry1.party),
      normalizeString(entry2.party)
    );
    if (similarity > 0.8) {
      score += 15;
    } else if (similarity > 0.5) {
      score += 10;
    }
    factors++;
  }

  return Math.min(score, 100);
}

function normalizeDate(dateStr: string): string {
  try {
    // Handle various date formats
    const cleaned = dateStr.replace(/[/\\-]/g, '-');
    const parts = cleaned.split('-');
    
    if (parts.length === 3) {
      // Try DD-MM-YYYY or YYYY-MM-DD
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function datesWithinDays(date1: string, date2: string, days: number): boolean {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  } catch {
    return false;
  }
}

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  // Simple contains check
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }
  
  // Levenshtein-based similarity
  const editDistance = levenshteinDistance(str1, str2);
  return 1 - editDistance / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

function getMatchReason(entry1: Entry, entry2: Entry, score: number): string {
  const reasons: string[] = [];
  
  if (entry1.amount === entry2.amount) {
    reasons.push("Exact amount match");
  } else if (Math.abs((entry1.amount || 0) - (entry2.amount || 0)) < 100) {
    reasons.push("Amount within ₹100");
  }
  
  if (entry1.date === entry2.date) {
    reasons.push("Same date");
  }
  
  if (entry1.reference && entry2.reference && 
      normalizeString(entry1.reference) === normalizeString(entry2.reference)) {
    reasons.push("Reference match");
  }
  
  if (reasons.length === 0) {
    if (score >= 90) return "High confidence match based on multiple factors";
    if (score >= 70) return "Good match with minor differences";
    return "Partial match - review recommended";
  }
  
  return reasons.join(", ");
}

async function generateReconciliationInsights(
  file1: FileData,
  file2: FileData,
  matched: number,
  partial: number,
  unmatched1: number,
  unmatched2: number,
  amountDiff: number
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  const defaultInsight = `Reconciliation complete. ${matched} exact matches found, ${partial} partial matches requiring review, and ${unmatched1 + unmatched2} unmatched entries. ${amountDiff > 0 ? `Net difference of ₹${amountDiff.toLocaleString('en-IN')} detected.` : 'Totals balanced.'}`;
  
  if (!LOVABLE_API_KEY) return defaultInsight;

  try {
    const response = await fetch("https://ai.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a financial reconciliation expert. Provide brief, actionable insights about the reconciliation results. Focus on key discrepancies and recommendations. Keep response under 150 words."
          },
          {
            role: "user",
            content: `Analyze reconciliation between "${file1.fileName}" (${file1.type}) and "${file2.fileName}" (${file2.type}):
- File 1: ${file1.entries.length} entries, Total: ${file1.totalAmount}
- File 2: ${file2.entries.length} entries, Total: ${file2.totalAmount}
- Exact matches: ${matched}
- Partial matches: ${partial}
- Unmatched from file 1: ${unmatched1}
- Unmatched from file 2: ${unmatched2}
- Amount difference: ₹${amountDiff.toLocaleString('en-IN')}

Provide insights and recommendations.`
          }
        ],
        max_tokens: 300,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || defaultInsight;
    }
  } catch (e) {
    console.error("AI insights generation failed:", e);
  }
  
  return defaultInsight;
}
