# Inventário Supabase - Kanba

## 1. Stack e Arquitetura Atual
- **Frontend**: React + Vite + TypeScript.
- **Supabase Client**: `@supabase/supabase-js` (v2.101.1).
- **Abordagem de Acesso a Dados**: O sistema Kanba atualmente utiliza o conceito de "Backend-as-a-Service" de forma intensa. A maioria absoluta das regras de negócio, queries (`select`) e mutações (`insert`, `update`, `delete`) é feita diretamente do lado do cliente utilizando o SDK do Supabase, envelopado pela biblioteca `@tanstack/react-query`.

## 2. Dependências e Importações do Cliente Supabase
A instância principal do cliente Supabase (`src/integrations/supabase/client.ts`) é extensamente importada no frontend, principalmente nos hooks de abstração de dados e em funções utilitárias:

**Hooks Principais (Fazendo Queries Diretas):**
- `useTasks.ts`
- `useTeam.ts`
- `useProjects.ts`
- `useAuth.tsx`
- E outros listados no projeto (`useWiki.ts`, `useWhatsappStatus.ts`, `useSpaces.ts`, `useRoles.ts`, `useProjectPermissions.ts`, `useCRM.ts`, `useInvites.ts`, `useComments.ts`, `useColumns.ts`, `useAgencyStats.ts`).

**Outros Locais (Libs e Páginas):**
- `src/lib/evolution.ts` (Utilizado para buscar metadados da agência antes de disparar requisições externas)
- Páginas como `Onboarding.tsx`, `Settings.tsx`, `Join.tsx`, etc., que consomem esses hooks ou fazem auth.

## 3. Mapa do Banco de Dados Atual (Schema `public`)

### 3.1. Tabelas
O sistema opera com um modelo multilocatário (multi-tenant) baseado no conceito de `agencies` (Agências). As tabelas principais são:
- **Core / Auth**: `agencies`, `profiles`, `agency_members`, `agency_roles`, `invites`.
- **Projetos e Tarefas**: `spaces`, `space_members`, `projects`, `kanban_columns`, `project_permissions`, `project_wikis`, `tasks`, `comments`.
- **CRM**: `crm_pipelines`, `crm_clients`, `crm_deals`, `enterprise_leads`.
- **Sistema**: `notification_logs`.

### 3.2. Funções RPC (`pg_proc`)
Muitas regras estão implementadas como funções PL/pgSQL no banco de dados, servindo como a camada mais próxima de um "backend":
- **Gerenciamento de Agências/Roles**: `setup_agency_base_roles`, `check_role_update`, `get_my_agencies`, `auth_user_can_manage_roles`, `is_agency_admin_of`, `can_manage_agency`, `has_agency_access`.
- **Convites**: `get_invite_info`, `accept_agency_invitation`.
- **Automações de Criação**: `handle_new_space_member`, `handle_new_user`, `handle_new_project_columns`.
- **Permissões de Projetos/Tarefas**: `has_project_agency_access`, `can_manage_project`, `has_task_agency_access`, `has_project_permission`.

### 3.3. Triggers
Triggers são utilizados para automatizar fluxos que não dependem do frontend:
- `on_auth_user_created` em `auth.users` para criar perfis automáticos.
- `on_agency_created_setup_roles` em `agencies`.
- `tr_create_default_kanban_columns` em `projects` (Cria colunas base do Kanban automaticamente).
- `on_space_created` em `spaces`.
- Automação de campos `updated_at` (ex: `agencies`, `storage.objects`).

### 3.4. RLS (Row Level Security) e Policies
O RLS está ativo em praticamente todas as tabelas (100% de cobertura multilocatário). O sistema confia pesadamente em subqueries nas policies e chamadas a funções `SECURITY DEFINER` (como `can_manage_project()`, `has_agency_access()`) para validar se o `auth.uid()` pertence à agência dona do recurso (isolamento de tenants).

## 4. Pontos Críticos: Regras de Negócio no Frontend
Foram identificadas diversas operações críticas que residem no frontend e deveriam migrar para o backend (Postgres RPCs ou Supabase Edge Functions):

1. **Deleção em Cascata Não-Transacional (`useProjects.ts`, `useTasks.ts`)**:
   - Ao deletar um projeto, o frontend busca (select) os IDs das tarefas, depois deleta os comentários dessas tarefas, depois as tarefas, e finalmente o projeto.
   - Isso não é atômico. Se a aba fechar no meio ou a rede cair, o banco fica com dados órfãos e o projeto parcialmente deletado.
   - **Solução Ideal**: Configurar as Foreign Keys com `ON DELETE CASCADE` ou mover a lógica para uma RPC.
2. **Criação de Agência Não-Transacional (`useAuth.tsx`)**:
   - `createAgency` faz 3 requisições ao Supabase sequenciais: insere a agência, insere o dono em `agency_members`, e atualiza o `onboarding_completed` em `profiles`.
   - Se a requisição falhar no segundo passo, a agência existirá sem membros.
   - **Solução Ideal**: Mover toda essa orquestração para uma RPC.

## 5. Riscos de Segurança (Severidade Alta a Crítica)

1. **Vazamento de Chave de API no Frontend (Crítico)**
   - O arquivo `src/lib/evolution.ts` importa `VITE_EVOLUTION_API_KEY` para o frontend e faz chamadas diretas (POST) via `fetch` para a API da Evolution (Integração de WhatsApp).
   - Isso expõe o Token/Secret do provedor de WhatsApp diretamente ao navegador do usuário, possibilitando abuso do serviço.
   - **Solução Obrigatória**: As requisições de envio de WhatsApp devem ser movidas **imediatamente** para uma Supabase Edge Function ou webhook de backend.

2. **Limpeza e Validação de Payload Cega (`useTasks.ts`)**
   - Na função `updateTask`, o cliente recebe o objeto e deleta chaves virtuais manualmente (`delete payload.column; delete payload.project;`).
   - Se o usuário tentar enviar payload com colunas de permissão forjadas (ex: `agency_id`), dependemos 100% do RLS não permitir updates nessas colunas, mas a manipulação do payload em Javascript client-side é um anti-pattern de segurança.

3. **Autenticação de Estado Isolado (Local Storage)**
   - O sistema de controle de acesso ativo à agência depende largamente de `localStorage.getItem('active_agency_id')` no `useAuth.tsx`. Apesar de o RLS proteger o dado no banco, um usuário mal-intencionado ou extensões corrompidas podem tentar manipular esse ID no navegador, podendo causar erros de interface (embora mitigados se o RLS funcionar corretamente no banco).

## 6. Prioridade de Migração (Próximos Passos Recomendados)

| Risco/Débito Técnico | Tipo | Severidade | Ação Sugerida |
| :--- | :--- | :--- | :--- |
| **Envio de WhatsApp no Frontend** | Segurança | Crítica | Criar uma **Edge Function** do Supabase para esconder a chave do serviço de mensageria (Evolution). |
| **Operações Non-ACID na Deleção** | Integridade de Dados | Alta | Aplicar constraints `ON DELETE CASCADE` no banco de dados para deleção de projetos, comentários e tarefas, simplificando o frontend. |
| **Criação de Agência (Signup) Non-ACID** | Integridade de Dados | Média | Envelopar a criação da agência e associação de owner via **Postgres RPC**, assegurando transação segura e atômica. |
| **Validação de Inputs** | Segurança | Baixa/Média | Implementar `Zod` aliado à validação no backend para mutações, para evitar payloads forjados e depender unicamente do Postgres. |
