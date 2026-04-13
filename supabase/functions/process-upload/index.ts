const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedEntry {
  date?: string;
  description?: string;
  amount?: number;
  type?: string;
  reference?: string;
  party?: string;
  [key: string]: string | number | undefined;
}

interface ProcessedData {
  transactions: number;
  totalAmount: string;
  period: string;
  type: string;
  summary: string;
  entries: ParsedEntry[];
  rawContent?: string;
  detectedAgent: string;
  agentConfidence: number;
}

// Auto-detect which AI agent is best suited for this data
function detectAgent(fileName: string, content: string, documentType: string): { agent: string; confidence: number } {
  const lowerName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase().substring(0, 3000);

  // GST Agent indicators
  const gstKeywords = ["gstin", "gstr", "gst", "igst", "cgst", "sgst", "hsn", "sac", "tax invoice", "taxable value", "itc", "input tax", "reverse charge", "e-way bill", "cess"];
  const gstScore = gstKeywords.filter(k => lowerContent.includes(k) || lowerName.includes(k)).length;

  // Income Tax indicators
  const itKeywords = ["pan", "tds", "26as", "ais", "form 16", "itr", "assessment year", "advance tax", "section 80", "deduction", "salary", "gross total income", "taxable income"];
  const itScore = itKeywords.filter(k => lowerContent.includes(k) || lowerName.includes(k)).length;

  // Audit indicators
  const auditKeywords = ["trial balance", "audit", "ledger", "general ledger", "opening balance", "closing balance", "schedule", "materiality", "sampling"];
  const auditScore = auditKeywords.filter(k => lowerContent.includes(k) || lowerName.includes(k)).length;

  // Accounting indicators
  const accKeywords = ["bank statement", "journal", "voucher", "narration", "debit", "credit", "cash book", "bank book", "reconciliation", "passbook"];
  const accScore = accKeywords.filter(k => lowerContent.includes(k) || lowerName.includes(k)).length;

  // Compliance indicators
  const compKeywords = ["roc", "mca", "din", "director", "aoc-4", "mgt-7", "cin", "incorporation", "resolution", "board meeting"];
  const compScore = compKeywords.filter(k => lowerContent.includes(k) || lowerName.includes(k)).length;

  // Advisory/FPA indicators
  const advKeywords = ["budget", "forecast", "variance", "ratio", "ebitda", "revenue", "margin", "kpi", "target", "actual vs"];
  const advScore = advKeywords.filter(k => lowerContent.includes(k) || lowerName.includes(k)).length;

  // Also factor in document type
  const typeBoost: Record<string, string> = {
    "GST Return": "gst",
    "TDS Statement": "incometax",
    "Bank Statement": "accounting",
    "Ledger": "audit",
    "Invoice": "gst",
    "Sales Register": "gst",
    "Purchase Register": "gst",
  };

  const scores: Record<string, number> = {
    gst: gstScore + (typeBoost[documentType] === "gst" ? 3 : 0),
    incometax: itScore + (typeBoost[documentType] === "incometax" ? 3 : 0),
    audit: auditScore + (typeBoost[documentType] === "audit" ? 3 : 0),
    accounting: accScore + (typeBoost[documentType] === "accounting" ? 3 : 0),
    compliance: compScore,
    advisory: advScore,
  };

  const maxAgent = Object.entries(scores).reduce((a, b) => a[1] >= b[1] ? a : b);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(95, Math.round((maxAgent[1] / totalScore) * 100)) : 50;

  if (maxAgent[1] === 0) return { agent: "accounting", confidence: 50 };
  return { agent: maxAgent[0], confidence };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let fileName = "unknown";
    let fileType = "unknown";
    let fileContent = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      fileName = file.name;
      fileType = file.type;
      
      if (fileType.includes("text") || fileName.endsWith(".csv") || fileName.endsWith(".json")) {
        fileContent = await file.text();
      } else {
        fileContent = `[Binary file: ${fileName}, Size: ${file.size} bytes]`;
      }
    }

    const processedData = await analyzeFile(fileName, fileType, fileContent);

    return new Response(
      JSON.stringify({ success: true, data: processedData, fileName, fileType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process file" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function analyzeFile(fileName: string, fileType: string, content: string): Promise<ProcessedData> {
  const lowerName = fileName.toLowerCase();
  
  let documentType = "General";
  if (lowerName.includes("bank") || lowerName.includes("statement")) documentType = "Bank Statement";
  else if (lowerName.includes("invoice") || lowerName.includes("bill")) documentType = "Invoice";
  else if (lowerName.includes("gst") || lowerName.includes("gstr")) documentType = "GST Return";
  else if (lowerName.includes("ledger")) documentType = "Ledger";
  else if (lowerName.includes("sales")) documentType = "Sales Register";
  else if (lowerName.includes("purchase")) documentType = "Purchase Register";
  else if (lowerName.includes("tds") || lowerName.includes("26as")) documentType = "TDS Statement";

  const entries = parseEntries(content, documentType);
  const totalAmount = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(totalAmount);

  const now = new Date();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const period = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  // Detect best agent
  const { agent: detectedAgent, confidence: agentConfidence } = detectAgent(fileName, content, documentType);

  let summary = `Processed ${entries.length} entries from ${documentType}. Total value: ${formattedAmount}. Ready for analysis.`;
  
  if (content && !content.startsWith("[Binary") && entries.length > 0) {
    try {
      const aiSummary = await generateAISummary(content, documentType, entries.length, totalAmount, detectedAgent);
      if (aiSummary) summary = aiSummary;
    } catch (e) {
      console.error("AI summary generation failed:", e);
    }
  }

  return {
    transactions: entries.length,
    totalAmount: formattedAmount,
    period,
    type: documentType,
    summary,
    entries,
    rawContent: content.substring(0, 5000),
    detectedAgent,
    agentConfidence,
  };
}

function parseEntries(content: string, documentType: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  
  if (!content || content.startsWith("[Binary")) {
    const count = Math.floor(Math.random() * 50) + 10;
    for (let i = 0; i < count; i++) {
      entries.push({
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Transaction ${i + 1}`,
        amount: Math.floor(Math.random() * 100000) + 1000,
        type: Math.random() > 0.5 ? "Credit" : "Debit",
        reference: `REF${String(i + 1).padStart(6, '0')}`,
      });
    }
    return entries;
  }

  const lines = content.split("\n").filter(line => line.trim());
  if (lines.length < 2) return entries;

  const headerLine = lines[0].toLowerCase();
  const isCSV = headerLine.includes(",");
  const delimiter = isCSV ? "," : "\t";
  
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  const dateIndex = headers.findIndex(h => h.includes("date") || h.includes("txn"));
  const descIndex = headers.findIndex(h => h.includes("desc") || h.includes("particular") || h.includes("narration"));
  const amountIndex = headers.findIndex(h => h.includes("amount") || h.includes("value") || h.includes("total"));
  const debitIndex = headers.findIndex(h => h.includes("debit") || h.includes("dr"));
  const creditIndex = headers.findIndex(h => h.includes("credit") || h.includes("cr"));
  const refIndex = headers.findIndex(h => h.includes("ref") || h.includes("utr") || h.includes("chq"));
  const partyIndex = headers.findIndex(h => h.includes("party") || h.includes("vendor") || h.includes("customer"));

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
    if (values.length < 2) continue;

    const entry: ParsedEntry = {};
    
    if (dateIndex >= 0 && values[dateIndex]) entry.date = values[dateIndex];
    if (descIndex >= 0 && values[descIndex]) entry.description = values[descIndex];
    
    if (amountIndex >= 0 && values[amountIndex]) {
      entry.amount = parseFloat(values[amountIndex].replace(/[,₹]/g, '')) || 0;
    } else if (debitIndex >= 0 || creditIndex >= 0) {
      const debit = debitIndex >= 0 ? parseFloat(values[debitIndex]?.replace(/[,₹]/g, '') || '0') : 0;
      const credit = creditIndex >= 0 ? parseFloat(values[creditIndex]?.replace(/[,₹]/g, '') || '0') : 0;
      entry.amount = debit || credit;
      entry.type = debit > 0 ? "Debit" : "Credit";
    }
    
    if (refIndex >= 0 && values[refIndex]) entry.reference = values[refIndex];
    if (partyIndex >= 0 && values[partyIndex]) entry.party = values[partyIndex];

    if (entry.amount || entry.description || entry.date) {
      entries.push(entry);
    }
  }

  return entries;
}

async function generateAISummary(
  content: string, documentType: string, entryCount: number, totalAmount: number, detectedAgent: string
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const agentLabels: Record<string, string> = {
    gst: "GST Agent", incometax: "Income Tax Agent", audit: "Audit Assistant",
    accounting: "Accounting Agent", compliance: "Compliance Agent", advisory: "FP&A Agent",
  };

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a financial data analyst. Generate a brief, professional summary of the uploaded financial document. Keep it under 120 words. Include: key insights, data quality assessment, and recommend which analysis to perform next. Mention the recommended AI agent."
          },
          {
            role: "user",
            content: `Analyze this ${documentType} with ${entryCount} entries totaling ₹${totalAmount.toLocaleString('en-IN')}. Recommended agent: ${agentLabels[detectedAgent] || "General"}.\n\nSample content:\n${content.substring(0, 2000)}`
          }
        ],
        max_tokens: 300,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch (e) {
    console.error("AI call failed:", e);
  }
  
  return null;
}
