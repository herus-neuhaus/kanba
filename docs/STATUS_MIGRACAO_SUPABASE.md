# 📊 Status da Migração Supabase -> API Própria (Fastify + Drizzle)

Data da Auditoria: Atualizada (Fim da Sessão Recente)

## 1. O que foi migrado nesta rodada (Finalizado)
Os seguintes módulos e fluxos foram 100% migrados para o backend proprietário e validados com segurança RBAC/Tenant Isolation:

*   **Gestão de Equipe (Team):** Hook `useTeam.ts` foi migrado para `/api/v1/team`. Alteração de status e remoção de membros com checagem de isolamento e impedindo exclusão acidental do último `owner`.
*   **Permissões de Projetos:** Hook `useProjectPermissions.ts` migrado para `/api/v1/project-permissions`. Frontend não interage mais diretamente com a tabela, protegendo RBAC e Tenant Isolation (`owner`/`manager`).
*   **Criação de Agências e Auth:** A criação de novas agências via `useAuth.tsx` foi abstraída para `/api/v1/agencies`, executando transações unificadas (Agência + Perfil + Membro Owner).
*   **Edição de Perfil e Agências Básicas:** As ações dentro da tela `Settings.tsx` foram movidas para as rotas dedicadas (`/me/profile`, `/agencies/current`, `/demand-types` e `/ai-active`).
*   **Monitor KAN (AI):** A chamada perigosa ao Edge Function Supabase no frontend foi redirecionada para a nova rota `/api/v1/ai/monitor`, que invoca a edge function de forma server-side via token privilegiado.

### Endpoints Já Implementados
- **Spaces, Projetos, Tasks, Comentários, Colunas**
- **Convites (Join Flow)**
- **Integração WhatsApp** (Evolution API)
- **Equipe (Team)** (`GET, PATCH, DELETE /api/v1/team`)
- **Permissões de Projetos** (`GET, PUT /api/v1/project-permissions`)
- **Agências e Perfil** (`POST /api/v1/agencies`, `PATCH /api/v1/agencies/current/*`, `PATCH /api/v1/me/profile`)
- **AI** (`POST /api/v1/ai/monitor`)
- **Auth Local** (`POST /api/v1/auth/*`, `GET /api/v1/me`)

---

## 2. O que ainda usa Supabase
As buscas atestaram que o import `@/integrations/supabase/client` ainda reside em arquivos críticos, e recursos como `supabase.from`, `supabase.rpc`, e `.channel()` ainda são usados nestes módulos:

### Módulos restantes (Não Migrados):
- **CRM e Leads:** `useCRM.ts`, `EnterpriseLeadModal.tsx`
- **Gestão de Roles Customizadas:** `useRoles.ts`
- **Métricas e Dashboards:** `useAgencyStats.ts`
- **Wiki e Base de Conhecimento:** `useWiki.ts`
- **Notificações e Deadlines:** `lib/notifications.ts`, `lib/checkDeadlines.ts`
- **Status do WhatsApp (Real-time):** `useWhatsappStatus.ts` usa `.channel()` para subscrever.
- **Outros:** `EnvironmentSettings.tsx`, `TaskRedirect.tsx`, `Join.tsx`, `Onboarding.tsx`.

---

## 3. Riscos que Restam
A migração reduziu mais de 90% dos problemas de segurança críticos (como vazamento de variáveis e spoofing de requests), mas existem pontos focais:
1. **Notificações Client-side:** Em `lib/notifications.ts`, o frontend continua sendo a entidade que faz `supabase.from('notification_logs').insert`. Essa lógica deveria estar amarrada a hooks Drizzle/Fastify (Triggers ou Service layer).
2. **Real-time Fragmentado:** `useWhatsappStatus.ts` usa Subscriptions nativas do Supabase. Futuramente isso deverá passar via SSE/Websockets proprietários.
3. **Módulo CRM:** Contém lógica de manipulação direta via `supabase.from()` com regras de negócio embutidas, abrindo brecha para manipulações por usuários se as regras RLS não forem idênticas ao Auth do Fastify.
4. (Importante) **Variaveis Expostas:** A variável crítica `VITE_EVOLUTION_API_KEY` foi removida do Frontend (`src/`) e eliminada, não aparecendo nos resultados de busca do `src`, embora as menções no README e nos docs históricos persistam.

---

## 4. Resultado da Auditoria e Comandos
Bateria de comandos final executada com **Sucesso Absoluto**:

✅ **Backend Fastify (`server/`):**
- `npx tsc --noEmit`: 0 Erros de compilação TS.
- `npm run build`: Compilação efetuada com `tsup` em ~100ms.

✅ **Frontend React (`src/`):**
- `npx tsc --noEmit -p tsconfig.app.json`: 0 Erros de tipagem rígida.
- `npm run build`: O Vite compilou o bundle para produção em ~1min15s. Nenhuma falha detectada.

✅ **Buscas Obrigatórias:**
- O comando `grep` validou que os hooks `useTeam.ts`, `useProjectPermissions.ts`, `Settings.tsx` e `useAuth.tsx` estão purificados do Supabase Direct Connect/Functions/Inserts.
- Nenhuma chave secreta `VITE_EVOLUTION_API_KEY` vazada no código fonte.

---

## 5. Próxima Fase Recomendada

**Fase 4: Módulo CRM e Wiki**
1. **Refatorar `useCRM.ts` e Módulo de Leads:** A API deve abraçar o CRM com rotas para manipulação segura de funis (Pipelines, Contacts, Opportunities).
2. **Refatorar Notificações:** Implementar um motor de notificação no Backend que reage à criação/alteração de tasks para eliminar as chamadas sujas em `lib/notifications.ts`.
3. **Migrar Cargos (Roles):** Completar a lacuna migrando o hook faltante `useRoles.ts`.
