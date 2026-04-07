import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EVOLUTION_BASE_URL = Deno.env.get("EVOLUTION_BASE_URL")!
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  }

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { agencyId, agencyName } = await req.json()
    
    if (!agencyId) {
      throw new Error("agencyId required")
    }

    const safeAgencyName = agencyName ? agencyName.replace(/[^a-zA-Z0-9]/g, '') : 'Agency'
    const instanceName = `KanbanFlow_${safeAgencyName}`

    try {
      await fetch(`${EVOLUTION_BASE_URL}/instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: { "apikey": EVOLUTION_API_KEY },
      })
    } catch (e) {
      console.error("Logout failed or instance not connected", e)
    }

    try {
      await fetch(`${EVOLUTION_BASE_URL}/instance/delete/${instanceName}`, {
        method: "DELETE",
        headers: { "apikey": EVOLUTION_API_KEY },
      })
    } catch (e) {
      console.error("Delete failed or instance not found", e)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    await supabase
      .from("agencies")
      .update({ evolution_instance_name: null, whatsapp_connected: false })
      .eq("id", agencyId)

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
