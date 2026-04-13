import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Apna CA Smart Assistant — a SENIOR Chartered Accountant AI with 20+ years of equivalent expertise in Indian taxation, accounting, audit, and financial advisory.

## CORE CAPABILITIES
1. **Client Management** — Add clients, update details, list clients
2. **Work Management** — Create work items (GST, Income Tax, Audit, Accounting, Compliance, FP&A, Risk, Advisory), track status
3. **Domain Expert** — Deep knowledge of Indian tax law, GST, Income Tax, Company Law, Ind AS
4. **Data Analysis** — When user shares data, analyze with step-by-step calculations
5. **Agent Router** — Route specialized queries to domain agents automatically

## RESPONSE QUALITY STANDARDS
- **ALWAYS** provide detailed, well-structured responses with proper formatting
- Use tables (markdown) for comparisons, lists, and structured data
- Use bullet points for key takeaways
- Include relevant section/rule references for tax positions
- For calculations: show step-by-step working with ₹ amounts in Indian format (lakhs/crores)
- **NEVER** give vague answers — be specific with numbers, dates, and references
- When asked about GST/IT/Audit, provide expert-level analysis with verification

## SMART AGENT ROUTING
When a user's query is domain-specific, include a routing suggestion:
- GST queries (GSTR filing, ITC, reconciliation) → Suggest: "For detailed GST analysis, I recommend using the **GST Agent** 🔗"
- Income Tax (computation, AIS, TDS, ITR) → Suggest: "For precise tax computation, try the **Income Tax Agent** 🔗"  
- Audit (sampling, risk, anomaly detection) → Suggest: "For audit procedures, use the **Audit Assistant** 🔗"
- Compliance (ROC, MCA, company law) → Suggest: "For compliance tracking, use the **Compliance Agent** 🔗"
- Accounting (journal entries, reconciliation) → Suggest: "For bookkeeping tasks, use the **Accounting Agent** 🔗"
- Advisory (ratios, forecasting, budgets) → Suggest: "For financial analysis, use the **FP&A Agent** 🔗"

## DATA VISUALIZATION
When presenting numerical data, suggest chart types:
- Use "📊 **Chart suggestion:** [Bar/Line/Pie chart] for [data description]" 
- Present data in table format that can be visualized
- For trends over time → Line chart
- For comparisons → Bar chart  
- For proportions → Pie/Donut chart
- For distributions → Histogram

## INDIAN TAX QUICK REFERENCE (FY 2025-26)
### GST
- Rates: 0%, 5%, 12%, 18%, 28% (+Cess)
- GSTR-1: 11th monthly / 13th quarterly
- GSTR-3B: 20th monthly
- ITC: Section 16(2) conditions mandatory

### Income Tax (New Regime Default AY 2026-27)
- 0-4L: Nil | 4-8L: 5% | 8-12L: 10% | 12-16L: 15% | 16-20L: 20% | 20-24L: 25% | 24L+: 30%
- Standard deduction: ₹75,000 | Rebate u/s 87A: Up to ₹60,000

### TDS Key Rates
- 194A: 10% | 194C: 1%/2% | 194H: 5% | 194I: 2%/10% | 194J: 10%

## RESPONSE FORMAT
- Use ✅ for success, 📋 for lists, ⚠ for warnings, ❌ for errors, 💡 for tips
- Always suggest next steps after completing an action
- Be professional yet conversational
- For complex queries, break response into sections with headers

## VERIFICATION (for calculations)
Always end calculation responses with:
\`\`\`
═══ VERIFICATION ═══
□ Data processed: [count] ✓
□ Sum check: [calculation] ✓  
□ Accuracy: HIGH
═══════════════════
\`\`\``;

const tools = [
  {
    type: "function",
    function: {
      name: "add_client",
      description: "Add a new client to the system. Use when user wants to register/add/create a new client or company.",
      parameters: {
        type: "object",
        properties: {
          company_name: { type: "string", description: "Company or client name" },
          gstin: { type: "string", description: "GST Identification Number (15 characters)" },
          pan: { type: "string", description: "PAN number (10 characters)" },
          cin: { type: "string", description: "Company Identification Number" },
          contact_person: { type: "string", description: "Primary contact person name" },
          contact_email: { type: "string", description: "Contact email address" },
          contact_phone: { type: "string", description: "Contact phone number" },
          address: { type: "string", description: "Registered address" },
          financial_year_start: { type: "number", description: "Financial year start month (1-12, default 4 for April)" },
        },
        required: ["company_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_work_item",
      description: "Create a new work item/task for a client. Use when user wants to add work like GST return, tax filing, audit, etc.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Name of the client this work is for" },
          category: {
            type: "string",
            enum: ["accounting", "gst", "income_tax", "audit", "compliance", "fpa", "risk", "advisory"],
            description: "Work category",
          },
          title: { type: "string", description: "Work item title (e.g., 'GSTR-1 March 2026')" },
          description: { type: "string", description: "Detailed description of the work" },
          due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
        },
        required: ["client_name", "category", "title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_clients",
      description: "List all clients. Use when user asks to see their clients or needs to find a client.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_work_items",
      description: "List work items, optionally filtered by client or status.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Filter by client name" },
          status: { type: "string", enum: ["draft", "in_progress", "review", "completed", "filed"], description: "Filter by status" },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_work_status",
      description: "Update the status of a work item.",
      parameters: {
        type: "object",
        properties: {
          work_title: { type: "string", description: "Title or partial title of the work item" },
          new_status: { type: "string", enum: ["draft", "in_progress", "review", "completed", "filed"], description: "New status" },
        },
        required: ["work_title", "new_status"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_summary",
      description: "Get a summary of the user's practice — total clients, work items by status, recent activity.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
];

async function executeToolCall(
  functionName: string,
  args: Record<string, any>,
  userId: string,
  supabaseAdmin: any
): Promise<string> {
  try {
    switch (functionName) {
      case "add_client": {
        const { company_name, gstin, pan, cin, contact_person, contact_email, contact_phone, address, financial_year_start } = args;

        const { data: existing } = await supabaseAdmin
          .from("clients")
          .select("id, company_name")
          .eq("user_id", userId)
          .ilike("company_name", company_name)
          .maybeSingle();

        if (existing) {
          return JSON.stringify({
            success: false,
            message: `Client "${existing.company_name}" already exists.`,
          });
        }

        const { data, error } = await supabaseAdmin.from("clients").insert({
          user_id: userId,
          company_name,
          gstin: gstin || null,
          pan: pan || null,
          cin: cin || null,
          contact_person: contact_person || null,
          contact_email: contact_email || null,
          contact_phone: contact_phone || null,
          address: address || null,
          financial_year_start: financial_year_start || 4,
        }).select().single();

        if (error) throw new Error(error.message);

        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "create",
          entity_type: "client",
          entity_id: data.id,
          details: { name: company_name, source: "smart_assistant" },
        });

        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "Client Added",
          message: `${company_name} has been added via Smart Assistant.`,
          type: "success",
          entity_type: "client",
          entity_id: data.id,
        });

        return JSON.stringify({
          success: true,
          message: `Client "${company_name}" created successfully!`,
          client_id: data.id,
          details: { company_name, gstin, pan },
        });
      }

      case "create_work_item": {
        const { client_name, category, title, description, due_date } = args;

        const { data: clients } = await supabaseAdmin
          .from("clients")
          .select("id, company_name")
          .eq("user_id", userId)
          .ilike("company_name", `%${client_name}%`);

        if (!clients || clients.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Client "${client_name}" not found. Please add the client first or check the name.`,
            available_action: "add_client",
          });
        }

        const client = clients[0];

        const { data: canCreate } = await supabaseAdmin.rpc("can_create_work_item", { p_user_id: userId });

        if (!canCreate) {
          return JSON.stringify({
            success: false,
            message: "Work item limit reached on free plan. Please upgrade to create more work items.",
          });
        }

        const { data, error } = await supabaseAdmin.from("work_items").insert({
          user_id: userId,
          client_id: client.id,
          category,
          title,
          description: description || null,
          due_date: due_date || null,
          status: "draft",
        }).select().single();

        if (error) throw new Error(error.message);

        await supabaseAdmin.rpc("increment_work_items_used", { p_user_id: userId });

        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "create",
          entity_type: "work_item",
          entity_id: data.id,
          details: { name: title, category, client: client.company_name, source: "smart_assistant" },
        });

        await supabaseAdmin.from("notifications").insert({
          user_id: userId,
          title: "Work Item Created",
          message: `${title} for ${client.company_name} created via Smart Assistant.`,
          type: "info",
          entity_type: "work_item",
          entity_id: data.id,
        });

        return JSON.stringify({
          success: true,
          message: `Work item "${title}" created for ${client.company_name}!`,
          work_item_id: data.id,
          details: { title, category, client: client.company_name, status: "draft", due_date },
        });
      }

      case "list_clients": {
        const { data: clients } = await supabaseAdmin
          .from("clients")
          .select("id, company_name, gstin, pan, contact_person, contact_email")
          .eq("user_id", userId)
          .order("company_name");

        return JSON.stringify({
          success: true,
          count: clients?.length || 0,
          clients: clients || [],
        });
      }

      case "list_work_items": {
        const { client_name, status } = args;
        let query = supabaseAdmin
          .from("work_items")
          .select("id, title, category, status, due_date, created_at, clients(company_name)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (status) query = query.eq("status", status);

        const { data: items } = await query;

        let filtered = items || [];
        if (client_name) {
          filtered = filtered.filter((i: any) =>
            i.clients?.company_name?.toLowerCase().includes(client_name.toLowerCase())
          );
        }

        return JSON.stringify({
          success: true,
          count: filtered.length,
          work_items: filtered,
        });
      }

      case "update_work_status": {
        const { work_title, new_status } = args;

        const { data: items } = await supabaseAdmin
          .from("work_items")
          .select("id, title, status")
          .eq("user_id", userId)
          .ilike("title", `%${work_title}%`);

        if (!items || items.length === 0) {
          return JSON.stringify({
            success: false,
            message: `Work item matching "${work_title}" not found.`,
          });
        }

        const item = items[0];
        const updates: any = { status: new_status };
        if (new_status === "completed" || new_status === "filed") {
          updates.completed_at = new Date().toISOString();
        }

        const { error } = await supabaseAdmin
          .from("work_items")
          .update(updates)
          .eq("id", item.id);

        if (error) throw new Error(error.message);

        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "update",
          entity_type: "work_item",
          entity_id: item.id,
          details: { name: item.title, status: new_status, source: "smart_assistant" },
        });

        return JSON.stringify({
          success: true,
          message: `"${item.title}" status updated to ${new_status}.`,
        });
      }

      case "get_dashboard_summary": {
        const [clientsRes, workRes] = await Promise.all([
          supabaseAdmin.from("clients").select("id", { count: "exact" }).eq("user_id", userId),
          supabaseAdmin.from("work_items").select("id, status, category, title, due_date, clients(company_name)").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
        ]);

        const workItems = workRes.data || [];
        const statusCounts: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {};
        workItems.forEach((w: any) => {
          statusCounts[w.status] = (statusCounts[w.status] || 0) + 1;
          categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
        });

        const overdue = workItems.filter((w: any) => w.due_date && new Date(w.due_date) < new Date() && !["completed", "filed"].includes(w.status));

        return JSON.stringify({
          success: true,
          summary: {
            total_clients: clientsRes.count || 0,
            total_work_items: workItems.length,
            by_status: statusCounts,
            by_category: categoryCounts,
            overdue_count: overdue.length,
            overdue_items: overdue.slice(0, 5).map((w: any) => ({ title: w.title, due: w.due_date, client: w.clients?.company_name })),
          },
        });
      }

      default:
        return JSON.stringify({ success: false, message: `Unknown function: ${functionName}` });
    }
  } catch (error) {
    console.error(`Tool execution error (${functionName}):`, error);
    return JSON.stringify({
      success: false,
      message: `Error executing ${functionName}: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please sign in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ];

    // Use stronger model for complex queries
    const isComplex = message.length > 300 || message.includes("reconcil") || message.includes("calculat") || message.includes("comput");
    const model = isComplex ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        stream: false,
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    if (!choice) throw new Error("No response from AI");

    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolResults: any[] = [];

      for (const toolCall of choice.message.tool_calls) {
        const fnName = toolCall.function.name;
        const fnArgs = JSON.parse(toolCall.function.arguments);
        const result = await executeToolCall(fnName, fnArgs, user.id, supabaseAdmin);
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      const followUpMessages = [
        ...messages,
        choice.message,
        ...toolResults,
      ];

      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: followUpMessages,
          stream: true,
          max_tokens: 4096,
        }),
      });

      if (!followUpResponse.ok) throw new Error("Follow-up AI call failed");

      return new Response(followUpResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls — stream direct response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!streamResponse.ok) throw new Error("Stream AI call failed");

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Smart assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
