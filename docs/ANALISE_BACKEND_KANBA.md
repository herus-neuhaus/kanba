# Analise tecnica e plano de backend proprio - Kanba

## Resumo executivo

O Kanba hoje e um frontend Vite + React + TypeScript fortemente acoplado ao Supabase. O Supabase nao esta sendo usado apenas como banco: ele tambem concentra autenticacao, autorizacao via RLS, RPCs, realtime e edge functions.

A melhor migracao nao e "trocar tudo de uma vez". O caminho mais seguro e criar uma API propria em paralelo, manter o PostgreSQL como banco, mover regras de negocio para o servidor e trocar os hooks do frontend por um client HTTP modulo por modulo.

## Stack atual observada

- Frontend: Vite, React 18, TypeScript, Tailwind, Radix/Shadcn.
- Estado remoto: TanStack Query.
- Backend atual: Supabase Auth, PostgREST, RPCs, Realtime e Edge Functions.
- Banco: PostgreSQL com tabelas multi-tenant por `agency_id`.
- Integracoes: Evolution API para WhatsApp, Cakto webhook, monitor Kanba AI.
- Testes: Vitest e Playwright configurados.

## Dependencias atuais do Supabase

O arquivo `src/integrations/supabase/client.ts` exporta um client global usado em quase todo o dominio. Os principais pontos de uso sao:

- Auth e sessao: `src/hooks/useAuth.tsx`.
- CRUD principal: `useTasks`, `useProjects`, `useSpaces`, `useTeam`, `useRoles`, `useCRM`, `useComments`, `useColumns`, `useWiki`, `useInvites`.
- RPCs: `accept_agency_invitation`, `get_invite_info`.
- Edge Functions: `create-whatsapp-instance`, `disconnect-whatsapp-instance`, `kanba-ai-monitor`.
- Realtime: status de WhatsApp em `useWhatsappStatus`.
- Tipos gerados: `src/integrations/supabase/types.ts`.

## Principais riscos tecnicos

1. Regras de negocio no frontend

O frontend decide coisas que deveriam estar no backend, como permissoes, filtros por projeto, delecoes em cascata, mudanca de status e vinculacao de agencia ativa. Isso aumenta risco de burla e duplica logica.

2. Segredos expostos no client

`src/lib/evolution.ts` usa `VITE_EVOLUTION_API_KEY`. Qualquer variavel `VITE_*` vai para o bundle do navegador. Chaves da Evolution API devem morar somente no backend.

3. Autorizacao dispersa

Hoje parte da seguranca depende de RLS, parte de checks no React (`useCan`, route guards, filtros por role). Em uma API propria, a autorizacao precisa ser centralizada em middleware/policies server-side.

4. Operacoes sem transacao no frontend

Exemplos: apagar projeto apaga comentarios, tarefas e depois projeto; apagar pipeline apaga deals e depois pipeline. Isso deve virar transacao no backend para evitar dados parciais se algo falhar no meio.

5. Acoplamento forte ao formato do Supabase/PostgREST

Os hooks conhecem `select` com joins do Supabase, nomes de FK e detalhes de tabelas. A API propria deve esconder isso atras de contratos estaveis.

6. Multi-tenancy ainda imaturo para produto SaaS

O modelo tem `agency_id`, membros, roles e permissoes, mas a API deve reforcar em todas as queries: usuario autenticado, agencia ativa, membership ativo, role/permissao e escopo por espaco/projeto.

## Arquitetura alvo recomendada

### Backend

Recomendacao pragmatica: Node.js + TypeScript + Fastify.

Motivo: combina bem com o projeto atual, e leve, rapido, tipado, facil de colocar no Vercel/Render/Fly/Railway, e permite crescer sem o peso inicial de um framework maior.

Bibliotecas sugeridas:

- Fastify para HTTP.
- Zod para validacao de entrada/saida.
- Prisma ou Drizzle para ORM/query builder.
- PostgreSQL proprio, podendo iniciar usando o mesmo banco exportado do Supabase.
- JWT com refresh token em cookie httpOnly.
- Argon2 ou bcrypt para senha, caso saia do Supabase Auth.
- Pino para logs.
- Vitest para testes de servico.

Alternativa mais estruturada: NestJS. Eu so escolheria Nest se voce quiser uma arquitetura empresarial desde o inicio, com modulos, guards, interceptors e DI formal.

### Frontend

Criar uma camada `src/lib/api` e trocar os hooks aos poucos:

- `authApi.signIn`, `authApi.me`, `authApi.signOut`.
- `tasksApi.list/create/update/delete`.
- `projectsApi.list/create/update/delete`.
- `crmApi.*`.
- `settingsApi.*`.

TanStack Query continua. A diferenca e que os hooks deixam de importar Supabase diretamente e passam a consumir a API.

### Banco

Manter PostgreSQL. O objetivo deve ser tirar a dependencia operacional do Supabase, nao trocar o banco relacional que ja encaixa bem no produto.

Pontos importantes:

- Criar migrations versionadas fora do Supabase.
- Definir cascades reais no banco quando fizer sentido.
- Adicionar indices por `agency_id`, `project_id`, `space_id`, `user_id`, `status`, `due_date`.
- Centralizar auditoria: `created_at`, `updated_at`, `created_by`, `updated_by`.

## Modulos da API propria

Ordem recomendada:

1. Auth e contexto

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /me`
- `POST /agencies`
- `POST /agencies/switch`

2. Organizacao e permissoes

- `GET /agencies/current`
- `PATCH /agencies/current`
- `GET /spaces`
- `POST /spaces`
- `GET /team`
- `PATCH /team/:userId/status`
- `GET /roles`
- `PATCH /roles/:id/permissions`

3. Projetos, colunas e tarefas

- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `GET /projects/:id/columns`
- `POST /tasks`
- `GET /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `GET /tasks/:id/comments`
- `POST /tasks/:id/comments`

4. CRM

- `GET /crm/pipelines`
- `POST /crm/pipelines`
- `GET /crm/clients`
- `POST /crm/clients`
- `GET /crm/deals`
- `POST /crm/deals`
- `PATCH /crm/deals/:id`

5. Integracoes server-side

- `POST /integrations/whatsapp/instance`
- `DELETE /integrations/whatsapp/instance`
- `POST /integrations/whatsapp/send`
- `POST /webhooks/cakto`
- `POST /ai/monitor`

## Politica de autorizacao sugerida

Todo endpoint protegido deve passar por:

1. Autenticacao: token/session valido.
2. Resolucao de usuario e agencia ativa.
3. Verificacao de membership ativo em `agency_members`.
4. Verificacao de role/permissao.
5. Query sempre filtrada por `agency_id`.

Exemplo conceitual:

```ts
requireAuth()
requireAgency()
requirePermission("tasks:update")
```

O frontend pode continuar usando `useCan` para UX, mas nunca como camada real de seguranca.

## Plano de migracao seguro

### Fase 1 - Fundacao

- Criar pasta `server/`.
- Subir Fastify com healthcheck.
- Configurar envs, logs, CORS e tratamento padronizado de erro.
- Conectar ao PostgreSQL.
- Criar client HTTP no frontend.

### Fase 2 - Auth

- Implementar `/auth/login`, `/auth/register`, `/me`.
- Recriar comportamento atual do `useAuth`.
- Migrar `AuthProvider` para API propria.
- Manter Supabase apenas como fonte de dados durante a transicao, se necessario.

### Fase 3 - CRUD principal

- Migrar primeiro `spaces`, `projects`, `tasks`, `comments`.
- Substituir operacoes manuais de cascata por transacoes no backend.
- Adicionar testes de servico para permissoes e multi-tenancy.

### Fase 4 - Equipe, roles e convites

- Migrar `agency_members`, `agency_roles`, `invites`.
- Recriar RPCs como services internos: aceitar convite e buscar info do convite.

### Fase 5 - Integracoes

- Mover Evolution API totalmente para o backend.
- Tirar `VITE_EVOLUTION_API_KEY` do frontend.
- Migrar edge functions para rotas/jobs backend.

### Fase 6 - Realtime e jobs

- Para realtime, usar WebSocket/SSE ou polling inicialmente.
- Jobs: deadline checks, AI monitor e cleanup de instancias WhatsApp.
- Se precisar de fila: BullMQ + Redis.

## Primeiro incremento recomendado

O melhor primeiro PR tecnico seria:

1. Criar `server/` com Fastify + TypeScript.
2. Adicionar `GET /health`.
3. Adicionar `GET /api/me` mockado ou ligado ao banco.
4. Criar `src/lib/api/client.ts`.
5. Migrar uma area pequena, como `useSpaces`, para provar o padrao.

Esse primeiro incremento valida estrutura, CORS, envs, build e padrao de erro sem mexer no fluxo critico inteiro.

## Decisoes pendentes

- Manter Supabase Auth temporariamente ou migrar auth imediatamente?
- Hospedagem desejada do backend: Vercel, Render, Railway, Fly, VPS?
- ORM preferido: Prisma para produtividade, Drizzle para controle e menor abstracao.
- Realtime precisa ser instantaneo desde o primeiro dia ou pode comecar com polling?

