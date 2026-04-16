import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EVOLUTION_BASE_URL = Deno.env.get("EVOLUTION_BASE_URL")!
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  }

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 1. Buscar agências inativas há mais de 7 dias e sem assinatura ativa
    // Consideramos inativas agências com updated_at > 7 dias atrás
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: agencies, error: fetchError } = await supabase
      .from("agencies")
      .select("id, evolution_instance_name")
      .neq("subscription_status", "active")
      .lt("updated_at", sevenDaysAgo.toISOString())
      .not("evolution_instance_name", "is", null);

    if (fetchError) throw fetchError;

    const results = [];

    // 2. Para cada agência, tentar deletar a instância na Evolution API
    for (const agency of agencies || []) {
      const instanceName = agency.evolution_instance_name;
      console.log(`Cleaning up instance: ${instanceName} for agency: ${agency.id}`);

      try {
        // Tenta deletar
        const evoRes = await fetch(`${EVOLUTION_BASE_URL}/instance/delete/${instanceName}`, {
          method: "DELETE",
          headers: { "apikey": EVOLUTION_API_KEY },
        });

        const evoData = await evoRes.json();
        console.log(`Evolution API response for ${instanceName}:`, evoData);

        // 3. Atualizar banco de dados para marcar como desconectado
        await supabase
          .from("agencies")
          .update({ 
            whatsapp_connected: false, 
            evolution_instance_name: null,
            whatsapp_number: null 
          })
          .eq("id", agency.id);

        results.push({ agencyId: agency.id, status: "success", instance: instanceName });
      } catch (err: any) {
        console.error(`Failed to cleanup instance ${instanceName}:`, err);
        results.push({ agencyId: agency.id, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, details: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
