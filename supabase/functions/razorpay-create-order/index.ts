import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, amount, currency, userId, email } = await req.json();

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      // Return demo mode response if Razorpay not configured
      return new Response(
        JSON.stringify({
          demo: true,
          message: "Razorpay not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET secrets.",
          razorpayKeyId: "demo_key",
          orderId: `demo_order_${Date.now()}`,
          amount,
          currency
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    // Create Razorpay order
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency || "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
        notes: {
          plan,
          userId,
          email
        }
      })
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Razorpay API error: ${errorText}`);
    }

    const order = await orderResponse.json();

    // Store the order in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("payments").insert({
      user_id: userId,
      razorpay_order_id: order.id,
      amount: amount,
      currency: currency || "INR",
      status: "created"
    });

    return new Response(
      JSON.stringify({
        razorpayKeyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
