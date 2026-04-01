import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Apna CA Smart Assistant — a conversational AI that helps Chartered Accountants manage their practice through natural language commands.

You can perform these actions:
1. **Add Client** — When a user says things like "Add client ABC Corp", "Create new client with GSTIN...", "Register company XYZ"
2. **Create Work Item** — When a user says "Create GST return for client X", "Add income tax work", "New audit work for ABC"
3. **Answer Questions** — General CA/tax/accounting questions, status queries, etc.
4. **Route to Agent** — When user needs specialized help (GST reconciliation, tax computation, audit), suggest opening the relevant agent.

## RULES:
- Extract ALL details from the user's message. If critical info is missing, ASK for it before acting.
- For Add Client: Need at minimum company_name. Optional: gstin, pan, cin, contact_person, contact_email, contact_phone, address
- For Create Work: Need client name/id, category (accounting/gst/income_tax/audit/compliance/fpa/risk/advisory), and title. Optional: description, due_date
- Always confirm the action you're about to take before executing.
- Use Indian business context (GSTIN format: 2-digit state + 10-char PAN + 1Z + 1 check digit)
- Be professional, concise, and action-oriented.
- When you detect intent to add a client or create work, use the provided tools.
- If the query is about GST calculations, reconciliation, income tax, audit etc., suggest the user open the specialized agent for better results.

## RESPONSE STYLE:
- Use ✅ for confirmations, 📋 for listing, ⚠ for warnings
- Keep responses concise and actionable
- After successful action, suggest next steps`;

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

        // Check if client already exists
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

        // Log activity
        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "create",
          entity_type: "client",
          entity_id: data.id,
          details: { name: company_name, source: "smart_assistant" },
        });

        // Create notification
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

        // Find client
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

        // Check subscription
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

        // Increment usage
        await supabaseAdmin.rpc("increment_work_items_used", { p_user_id: userId });

        // Log activity
        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          action: "create",
          entity_type: "work_item",
          entity_id: data.id,
          details: { name: title, category, client: client.company_name, source: "smart_assistant" },
        });

        // Create notification
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
          .select("id, company_name, gstin, pan, contact_person")
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
          .select("id, title, category, status, due_date, clients(company_name)")
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

    // Auth
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

    // Build messages
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-10),
      { role: "user", content: message },
    ];

    // First AI call - may return tool calls
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools,
        stream: false,
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

    if (!choice) {
      throw new Error("No response from AI");
    }

    // Check for tool calls
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

      // Second AI call with tool results for natural language response
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
          model: "google/gemini-3-flash-preview",
          messages: followUpMessages,
          stream: true,
        }),
      });

      if (!followUpResponse.ok) throw new Error("Follow-up AI call failed");

      return new Response(followUpResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls — stream the direct response
    // Re-do the call with streaming
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
