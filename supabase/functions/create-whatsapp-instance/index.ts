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

    // Formata o nome para remover espaços e caracteres especiais
    const safeAgencyName = agencyName ? agencyName.replace(/[^a-zA-Z0-9]/g, '') : 'Agency'
    const instanceName = `KanbanFlow_${safeAgencyName}`

    // Cria instância na Evolution
    const evoRes = await fetch(`${EVOLUTION_BASE_URL}/instance/create`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    })

    const evoData = await evoRes.json()

    // Trate o caso em que a instância já existe: tenta apenas conectar
    let qrBase64 = evoData?.qrcode?.base64 || evoData?.base64;

    if (!qrBase64 || evoData.error) {
       console.log("Instance might exist or creation failed, trying to connect...", evoData);
       const qrRes = await fetch(`${EVOLUTION_BASE_URL}/instance/connect/${instanceName}`, {
         headers: { "apikey": EVOLUTION_API_KEY },
       })
       const qrData = await qrRes.json()
       if (qrData.error) {
         throw new Error(`EvoAPI Error: ${qrData.message || JSON.stringify(qrData)}`)
       }
       qrBase64 = qrData?.base64 || qrData?.qrcode?.base64
    }

    if (!qrBase64) {
      throw new Error(`Failed to obtain QR Code. Data: ${JSON.stringify(evoData)}`)
    }

    // Salva instanceName na agency
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    await supabase
      .from("agencies")
      .update({ evolution_instance_name: instanceName })
      .eq("id", agencyId)

    return new Response(
      JSON.stringify({ 
        qrcode: qrBase64,
        instanceName 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})