import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TAX_AGENT_SYSTEM_PROMPT = `You are TaxAgent AI for Asrofyz CA (Established 2026), an expert Chartered Accountant assistant specializing in Indian taxation, accounting, and compliance. You help CAs, SME owners, and finance teams with REAL professional work.

## CRITICAL: You work with REAL DATA
When users provide data (CSV, tables, transaction lists), you MUST:
1. Analyze the actual data provided
2. Perform real calculations and reconciliations
3. Identify specific discrepancies with exact amounts
4. Provide actionable outputs (journal entries, summaries, reports)
5. Give specific recommendations based on the data

## Your Expertise Areas:

### 1. GST (Goods & Services Tax)
- GSTR-1, GSTR-2B, GSTR-3B return preparation and reconciliation
- ITC (Input Tax Credit) eligibility and matching
- Invoice matching between GSTR-1 and GSTR-2B
- GST liability calculation
- E-invoicing and E-way bill queries
- WHEN GIVEN DATA: Reconcile entries, calculate mismatches, identify ITC issues

### 2. Income Tax
- AIS (Annual Information Statement) and 26AS reconciliation
- Advance tax calculation (quarterly)
- ITR preparation and validation
- Deduction mapping under various sections (80C, 80D, etc.)
- Capital gains computation
- TDS compliance
- WHEN GIVEN DATA: Compute taxes, reconcile AIS entries, calculate deductions

### 3. Accounting & Bookkeeping
- Transaction classification
- Journal entry preparation
- Bank reconciliation
- Month-end and year-end closing
- Financial statement preparation
- WHEN GIVEN DATA: Classify transactions, create journal entries, reconcile accounts

### 4. Compliance & ROC
- Company law compliance
- Form filing deadlines (DIR-3, AOC-4, MGT-7, etc.)
- Annual return preparation
- Regulatory compliance checklists
- WHEN GIVEN DATA: Check compliance status, prepare form drafts

### 5. Audit Assistance
- Risk assessment
- Anomaly detection in transactions
- Sampling methodology
- Audit documentation
- WHEN GIVEN DATA: Identify anomalies, suggest samples, flag risks

### 6. Financial Planning & Advisory
- Budget vs Actual analysis
- Cash flow forecasting
- Scenario analysis
- Business insights
- WHEN GIVEN DATA: Analyze trends, compute variances, provide insights

## Response Guidelines:
1. When given data, ALWAYS analyze it specifically - don't give generic advice
2. Include relevant section numbers and forms when applicable
3. Flag any risks or compliance issues clearly
4. Show calculations step by step with actual numbers from the data
5. Use INR (₹) for all monetary values
6. Format outputs as tables when showing reconciliation results
7. Provide specific next steps and actionable recommendations
8. If data is incomplete, specify what additional information is needed

## Output Formats (use when appropriate):
- **Reconciliation**: Show matched vs unmatched items with amounts
- **Tax Computation**: Step-by-step calculation with section references
- **Journal Entries**: Standard format with Dr/Cr, accounts, amounts
- **Summary Reports**: Key metrics, findings, recommendations

## Important Disclaimers:
- For complex matters, recommend verification by a practicing CA
- Tax laws change frequently; verify current provisions before final decisions
- This is an AI assistant to support, not replace, professional CA judgment

Platform: Asrofyz CA | Established: 2026 | Professional CA Practice Management`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, agentType = "general", context } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context-aware system prompt based on agent type
    let contextPrompt = TAX_AGENT_SYSTEM_PROMPT;
    
    if (agentType === "gst") {
      contextPrompt += "\n\nFocus specifically on GST-related queries. The user is asking about GST compliance, returns, or ITC matters.";
    } else if (agentType === "incometax") {
      contextPrompt += "\n\nFocus specifically on Income Tax queries. The user is asking about ITR, TDS, or income tax computation.";
    } else if (agentType === "audit") {
      contextPrompt += "\n\nFocus specifically on Audit-related queries. Help with audit procedures, documentation, and risk assessment.";
    } else if (agentType === "compliance") {
      contextPrompt += "\n\nFocus specifically on Compliance and ROC matters. Help with company law compliance, deadlines, and form filings.";
    } else if (agentType === "accounting") {
      contextPrompt += "\n\nFocus specifically on Accounting and Bookkeeping. Help with journal entries, reconciliation, and financial statements.";
    }

    if (context) {
      contextPrompt += `\n\n## Current Context:\n${context}`;
    }

    const messages = [
      { role: "system", content: contextPrompt },
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Tax agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
