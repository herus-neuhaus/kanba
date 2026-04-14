import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const caktoClientId = Deno.env.get("CAKTO_CLIENT_ID");
const caktoClientSecret = Deno.env.get("CAKTO_CLIENT_SECRET");
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();
    console.log("Cakto Webhook received:", payload);

    // Extraction logic based on Cakto payload structure
    const data = payload.data || payload;
    const productName = data.product_name || data.product?.name;
    const productId = data.product_id || data.product?.id;
    const externalId = data.external_id || data.refId;
    const transactionId = data.id;

    if (!externalId) {
      console.error("Missing external_id (agency_id) in payload");
      return new Response(JSON.stringify({ error: "Missing external_id" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Mapping plan types based on links provided by user
    // Starter: https://pay.cakto.com.br/34bt8zp
    // Growth (Pro): https://pay.cakto.com.br/bdzd6t9
    // Elite: https://pay.cakto.com.br/3et7uft
    
    let planType = 'starter';
    const nameLower = (productName || "").toLowerCase();
    const idStr = String(productId || "");

    // User explicitly asked for Growth to be mapped as 'pro'
    if (nameLower.includes('elite') || idStr.includes('3et7uft')) {
      planType = 'elite';
    } else if (nameLower.includes('growth') || nameLower.includes('pro') || idStr.includes('bdzd6t9')) {
      planType = 'pro';
    } else if (nameLower.includes('starter') || idStr.includes('34bt8zp')) {
      planType = 'starter';
    }

    console.log(`Updating agency ${externalId} to ${planType} plan. (Cakto ID: ${caktoClientId ? 'Configured' : 'Warning: Not configured'})`);

    const { error } = await supabase
      .from('agencies')
      .update({
        plan_type: planType,
        subscription_status: 'active',
        last_payment_at: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cakto_id: String(transactionId || '')
      })
      .eq('id', externalId);

    if (error) {
      console.error("Error updating agency in DB:", error);
      return new Response(JSON.stringify({ error: "Database update failed" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Agency ${externalId} updated to ${planType}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
