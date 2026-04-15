import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS Headers ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Sempre retorna HTTP 200 — impede retry storms da Cakto */
function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Timing-Safe Compare (Anti timing-attack) ────────────────────────────────
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);
  if (aBuf.length !== bBuf.length) {
    let _sink = 0;
    for (let i = 0; i < aBuf.length; i++) _sink |= aBuf[i] ^ (bBuf[i % bBuf.length] ?? 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBuf.length; i++) diff |= aBuf[i] ^ bBuf[i];
  return diff === 0;
}

// ─── Plan Resolver ────────────────────────────────────────────────────────────
function resolvePlan(productName: string, productId: string): string {
  const name = String(productName).toLowerCase();
  const pid = String(productId).toLowerCase();

  // New Value-Based Pricing Slugs
  if (name.includes("enterprise")) return "enterprise";
  if (name.includes("profissional") || name.includes("professional") || name.includes("recomendado")) return "profissional";
  if (name.includes("standard") || name.includes("padrão") || name.includes("padrao")) return "standard";
  if (name.includes("basic") || name.includes("básico") || name.includes("basico")) return "basic";

  // Legacy mappings (fallback to equivalent new plans)
  if (name.includes("elite")) return "enterprise";
  if (name.includes("pro") || name.includes("growth")) return "profissional";
  if (name.includes("starter")) return "standard";

  // Check specific Cakto Product IDs if available
  if (pid.includes("3et7uft")) return "enterprise";
  if (pid.includes("bdzd6t9")) return "profissional";
  if (pid.includes("ieah9nj_849299") || pid.includes("ieah9nj")) return "standard";
  if (pid.includes("34bt8zp")) return "basic";

  return "basic";
}

// ─── UUID Validator ───────────────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Main Handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonOk({ status: "ignored", reason: "method_not_allowed" });
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("cakto-webhook v17 [CHECKOUT URL PARSER] — Nova requisição");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ─── 1. SUPABASE COM SERVICE ROLE KEY (Bypass RLS) ────────────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("ERRO FATAL: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.");
    return jsonOk({ status: "ignored", reason: "server_misconfiguration" });
  }

  // Service Role Key = acesso total, bypass de RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ─── 2. PARSE JSON ────────────────────────────────────────────────────────
  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    console.error("Payload não é JSON válido.");
    return jsonOk({ status: "ignored", reason: "invalid_json" });
  }

  console.log("Payload recebido:", JSON.stringify(payload).substring(0, 800));

  // ─── 3. VALIDAÇÃO DO SECRET VIA BODY ──────────────────────────────────────
  const expectedSecret = (Deno.env.get("CAKTO_WEBHOOK_SECRET") ?? "").trim();
  const receivedSecret = String(payload.secret ?? "").trim();

  if (!expectedSecret) {
    console.warn("ALERTA: CAKTO_WEBHOOK_SECRET não configurado. Pulando validação.");
  } else if (!receivedSecret) {
    console.error("Secret ausente no body do payload.");
    return jsonOk({ status: "ignored", reason: "missing_secret" });
  } else if (!timingSafeEqual(expectedSecret, receivedSecret)) {
    console.error("Secret do payload NÃO confere.");
    return jsonOk({ status: "ignored", reason: "invalid_secret" });
  } else {
    console.log("✅ Secret validado com sucesso.");
  }

  // ─── 4. EXTRAÇÃO SEGURA DO AGENCY ID (via checkoutUrl) ──────────────────
  // A Cakto NÃO envia parâmetros separados em objetos (metadata/tracking).
  // Em vez disso, envia a URL bruta com os parâmetros dentro de payload.data.checkoutUrl.
  let agencyId = null;

  if (payload.data?.checkoutUrl) {
    try {
      const checkoutUrl = new URL(payload.data.checkoutUrl);
      // Busca tanto por 'external_id' quanto por 'src' para garantir
      agencyId = checkoutUrl.searchParams.get('external_id') || checkoutUrl.searchParams.get('src');
    } catch (error) {
      console.warn("Erro ao fazer parse da checkoutUrl:", error);
    }
  }

  const eventType = String(payload.event ?? payload.data?.event ?? "");
  const status = String(payload.data?.status ?? payload.status ?? "");
  const transactionId = String(payload.data?.id ?? payload.id ?? "");
  const productName = String(payload.data?.product_name ?? payload.data?.product?.name ?? "");
  const productId = String(payload.data?.product_id ?? payload.data?.product?.id ?? "");

  console.log("─── Campos extraídos ───");
  console.log(`  agencyId (from checkoutUrl): "${agencyId}"`);
  console.log(`  event: "${eventType}", status: "${status}"`);
  console.log(`  transactionId (data.id): "${transactionId}"`);
  console.log(`  product: "${productName}" (${productId})`);

  // ─── 5. VALIDAÇÃO DO AGENCY ID ──────────────────────────────────────────
  if (!agencyId) {
    console.warn("Nenhum agencyId encontrado no payload. Webhook possivelmente de teste.");
    return jsonOk({ status: "ignored", reason: "Sem ID de agência" });
  }

  if (!UUID_REGEX.test(agencyId)) {
    console.warn(`agencyId "${agencyId}" não é UUID válido. Ignorando.`);
    return jsonOk({ status: "ignored", reason: "ID não é UUID válido", received_id: agencyId });
  }

  console.log(`✅ agencyId UUID válido: ${agencyId}`);

  // ─── 6. VERIFICAR AGÊNCIA NO BANCO ────────────────────────────────────────
  const { data: agencyData, error: lookupError } = await supabase
    .from("agencies")
    .select("id, plan_type, subscription_status")
    .eq("id", agencyId)
    .maybeSingle();

  if (lookupError) {
    console.error("Erro ao buscar agência:", JSON.stringify(lookupError));
    return jsonOk({ status: "ignored", reason: "db_lookup_error" });
  }

  if (!agencyData) {
    console.warn(`Agência "${agencyId}" NÃO encontrada no banco. Pode ser webhook de teste.`);
    return jsonOk({ status: "ignored", reason: "Agência não encontrada no banco", agency_id: agencyId });
  }

  console.log(`Agência encontrada: plan=${agencyData.plan_type}, status=${agencyData.subscription_status}`);

  // ─── 7. CANCELAMENTOS ────────────────────────────────────────────────────
  const CANCEL_EVENTS = ["subscription_canceled", "chargeback", "refund"];
  if (CANCEL_EVENTS.includes(eventType)) {
    console.log(`Processando cancelamento para ${agencyId}...`);
    const { error } = await supabase
      .from("agencies")
      .update({ subscription_status: "canceled" })
      .eq("id", agencyId);

    if (error) {
      console.error("Erro ao cancelar:", JSON.stringify(error));
      return jsonOk({ status: "ignored", reason: "db_cancel_error" });
    }
    console.log("✅ Cancelamento processado.");
    return jsonOk({ status: "processed", event: eventType, agency: agencyId });
  }

  // ─── 8. PAGAMENTOS APROVADOS ──────────────────────────────────────────────
  const isPaymentApproved =
    eventType === "payment.approved" ||
    eventType === "payment_approved" ||
    status === "paid" ||
    status === "approved";

  if (!isPaymentApproved) {
    console.log(`Evento "${eventType}" não requer ação.`);
    return jsonOk({ status: "ignored", reason: "event_not_actionable", event: eventType });
  }

  // ─── 9. ATUALIZAR BANCO ──────────────────────────────────────────────────
  const planType = resolvePlan(productName, productId);
  const now = new Date();
  const nextBillingDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`Plano resolvido: ${planType.toUpperCase()}`);
  console.log(`Atualizando agência ${agencyId}...`);

  const { data: updateData, error: dbError } = await supabase
    .from("agencies")
    .update({
      plan_type: planType,
      subscription_status: "active",
      last_payment_at: now.toISOString(),
      next_billing_date: nextBillingDate,
      cakto_id: transactionId || null,
    })
    .eq("id", agencyId)
    .select();

  if (dbError) {
    console.error("❌ Erro no UPDATE:", JSON.stringify(dbError));
    return jsonOk({ status: "ignored", reason: "db_update_error" });
  }

  if (!updateData || updateData.length === 0) {
    console.warn(`UPDATE executou mas 0 linhas afetadas para "${agencyId}".`);
    return jsonOk({ status: "ignored", reason: "no_rows_updated" });
  }

  console.log("✅ Banco atualizado!", JSON.stringify(updateData));

  return jsonOk({
    status: "processed",
    plan: planType,
    agency: agencyId,
    subscription_status: "active",
  });
});
