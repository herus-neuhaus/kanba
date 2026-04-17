import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o KAN, o Monitor de Inteligência Operacional do sistema Kanba. 
Sua função é garantir que a agência não fique parada e que os prazos sejam cumpridos.

TONALIDADE E REGRAS:
- Seja extremamente direto, executivo e estratégico. 
- PROIBIDO: cumprimentos sociais (bom dia, como vai), introduções ou explicações sobre quem você é.
- Use emojis apenas para destacar indicadores de status.
- Se os dados indicarem que NADA foi movido no Kanban nas últimas 24h, você deve dar um aviso de alerta crítico e cobrar ação imediata.

INSTRUÇÕES POR PERSONA:

1. PARA O DONO (Owner):
- Foco: Visão macro, gargalos de equipe e faturamento.
- Exemplo: "Kanba Briefing: 3 atrasos críticos. Gargalo: João (5 cards parados). CRM: R$ 15k aguardando follow-up."

2. PARA O COLABORADOR:
- Foco: Prioridade de execução e prazos do dia.
- Exemplo: "Prioridade hoje: 'Entrega Havan'. Você tem 2 cards vencendo às 16h. Evite cobranças automáticas atualizando o status agora."

COMPORTAMENTO DE COBRANÇA (SISTEMA PARADO):
- Se não houver movimentação recente: "Atenção: Painel estático há 24h. O controle operacional está em risco. Atualize o status das demandas agora para manter a precisão do sistema."

FORMATO DE SAÍDA: 
"Use a seguinte estrutura de layout para a mensagem:
📊 *RELATÓRIO EXECUTIVO KANBA* 📊
_Agência: {nome_agência}_

━━━━━━━━━━━━━━━━━━━━━━
🚀 *SITUAÇÃO DAS DEMANDAS*
• {emoji_status} {texto_resumo_tarefas}
• {emoji_gargalo} *Gargalo Identificado:* {nome_colaborador}

💰 *INSIGHTS COMERCIAIS (CRM)*
• {emoji_dinheiro} *Pipeline:* {valor_total}
• {emoji_alerta} *Ação:* {sugestão_comercial}

━━━━━━━━━━━━━━━━━━━━━━
💡 *DIRETRIZ DO KAN:*
{frase_curta_e_impactante_de_gestao}
━━━━━━━━━━━━━━━━━━━━━━"`;

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("VITE_EVOLUTION_BASE_URL");
const EVOLUTION_API_TOKEN = Deno.env.get("EVOLUTION_API_TOKEN") || Deno.env.get("VITE_EVOLUTION_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateGeminiMessage(agencyData: any, isOwner: boolean) {
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not configured.");
        return "Erro: GEMINI_API_KEY não configurada.";
    }

    const payload = {
        contents: [{
            parts: [{
                text: `${SYSTEM_PROMPT}\n\nContexto atual:\nDestinatário é Dono/Owner? ${isOwner}\nDados da agência nas últimas 24h: ${JSON.stringify(agencyData)}`
            }]
        }]
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
             console.error("Erro da API do Gemini:", data.error);
             return `Erro ao gerar mensagem: ${data.error.message}`;
        }
        
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao formatar mensagem.";

    } catch (error) {
        console.error("Erro na requisição ao Gemini:", error);
        return "Erro na execução de IA.";
    }
}

async function sendWhatsAppMessage(instanceName: string, number: string, text: string) {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_TOKEN || !instanceName) {
         console.warn(`Mensagem WhatsApp abortada. Missing EVOLUTION_API_URL, EVOLUTION_API_TOKEN, or instanceName. Number: ${number}`);
         return false;
    }

    try {
        const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: number,
                text: text
            })
        });

        if (!response.ok) {
            console.error(`Erro ao enviar WhatsApp para ${number}:`, await response.text());
            return false;
        }

        return true;
    } catch (error) {
         console.error(`Exceção ao enviar WhatsApp para ${number}:`, error);
         return false;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    const isManual = !!authHeader;

    // Check if it's a cron trigger or a manual request
    try {
        console.log("Iniciando kanba-ai-monitor. Buscando agências com ai_active = true");

        const { data: agencies, error: agencyError } = await supabase
            .from('agencies')
            .select('*')
            .eq('ai_active', true);

        if (agencyError) {
             console.error("Erro ao buscar agências:", agencyError);
             return new Response(JSON.stringify({ error: "Erro ao buscar agências" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (!agencies || agencies.length === 0) {
             console.log("Nenhuma agência ativa encontrada.");
             return new Response(JSON.stringify({ message: "Nenhuma agência ativa encontrada." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayISO = yesterday.toISOString();

        for (const agency of agencies) {
            try {
                console.log(`Processando agência: ${agency.name} (${agency.id})`);
                
                // Buscar dados operacionais da agência
                const { data: tasks, error: tasksError } = await supabase
                    .from('tasks')
                    .select('id, title, column_id, assignee_ids, created_at, due_date, kanban_columns!inner(title, is_done)')
                    .eq('agency_id', agency.id);
                    
                const { data: crmDeals, error: crmError } = await supabase
                    .from('crm_deals')
                    .select('id, title, value, stage, created_at, assigned_to')
                    .eq('agency_id', agency.id);
                    
                if (tasksError) console.error(`Erro ao buscar tasks da agência ${agency.id}:`, tasksError);
                if (crmError) console.error(`Erro ao buscar CRM da agência ${agency.id}:`, crmError);

                const agencyTasks = tasks || [];
                const agencyDeals = crmDeals || [];

                const activityInLast24h = [...agencyTasks, ...agencyDeals].some(item => new Date(item.created_at) >= yesterday);

                const dataContext = {
                    agencyName: agency.name,
                    totalTasks: agencyTasks.length,
                    activeTasksIn24h: agencyTasks.filter(t => new Date(t.created_at) >= yesterday).length,
                    openDealsValue: agencyDeals.reduce((sum, deal) => deal.stage !== 'won' && deal.stage !== 'lost' ? sum + Number(deal.value) : sum, 0),
                    hasActivityInLast24h: activityInLast24h
                };

                // Notificar Membros (Colaboradores e Owners)
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, phone, role, status')
                    .eq('agency_id', agency.id)
                    .eq('status', 'active');

                if (profilesError) {
                     console.error(`Erro ao buscar perfis da agência ${agency.id}:`, profilesError);
                     continue;
                }

                if (!profiles) continue;

                for (const profile of profiles) {
                    if (!profile.phone) continue; // Pular se não tem telefone

                    const isOwner = profile.role === 'owner' || agency.owner_user_id === profile.id; // Precisa do user_id auth para exact match, mas role ajuda

                    if (isManual && !isOwner) {
                         console.log(`Disparo manual: Pulando envio para o colaborador ${profile.full_name} (${profile.role})`);
                         continue;
                    }

                    // Dados mais específicos pro usuário, se for colaborador, filtra só as tarefas dele
                    let memberDataContext = { ...dataContext };
                    if (!isOwner) {
                         const myTasks = agencyTasks.filter(t => t.assignee_ids && t.assignee_ids.includes(profile.id));
                         memberDataContext = {
                             ...dataContext,
                             myTotalTasks: myTasks.length,
                             myTasksWithActivityIn24h: myTasks.filter(t => new Date(t.created_at) >= yesterday).length,
                         }
                    }

                    const message = await generateGeminiMessage(memberDataContext, isOwner);
                    
                    console.log(`Gerou mensagem para ${profile.full_name} (${isOwner ? 'Owner' : 'Colaborador'}): ${message}`);

                    // Uncomment logic inside to actually execute when environment exists properly
                    const instanceName = agency.whatsapp_instance_id || agency.evolution_instance_name;
                    if (instanceName && profile.phone) {
                         console.log(`Enviando WhatsApp para ${profile.phone} da agência ${agency.name}`);
                         await sendWhatsAppMessage(instanceName, profile.phone, message);
                    }
                }

            } catch (err) {
                 console.error(`Erro processando agência ${agency.id}:`, err);
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Monitoramento concluído." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
         console.error("Erro fatal no kanba-ai-monitor:", err);
         return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
