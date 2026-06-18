# Arquitetura Backend - Kanba

Este documento descreve o plano técnico para a migração do Kanba, saindo do modelo atual "Backend-as-a-Service" (BaaS) com acesso direto ao Supabase pelo frontend, para uma arquitetura robusta, segura e própria utilizando Node.js.

## 1. Arquitetura Alvo
- **Ambiente**: Node.js
- **Framework REST**: Fastify (Escolhido por sua alta performance, ecossistema de plugins estruturado e integração nativa com validação JSON Schema).
- **Linguagem**: TypeScript.
- **Banco de Dados**: PostgreSQL (Mantendo o banco atual).
- **Validação**: Zod (Totalmente integrado com TypeScript e plugins do Fastify como `fastify-type-provider-zod`).
- **ORM Recomendado**: **Drizzle ORM**.
  - *Justificativa*: A equipe atual já possui bom conhecimento de SQL e modelo relacional por conta do uso direto do Supabase. O Drizzle oferece uma sintaxe "SQL-like" que facilita a transição de queries nativas para TypeScript com 100% de type-safety. Além disso, não requer uma engine binária em background (como o Prisma), tornando o cold-start mais rápido, consome menos memória e adapta-se bem a infraestruturas de containers ou serverless.

## 2. Módulos do Backend (Domain-Driven)
A aplicação adotará uma arquitetura modular baseada em domínios (Modular Monolith):

1. **Auth Module**: Registro, login, recuperação de senha, gerenciamento de tokens e validação de sessão.
2. **Tenant Module (Agencies)**: Gestão de Agências, Membros da Agência, Convites e Roles.
3. **Projects & Tasks Module**: Spaces, Projetos, Colunas (Kanban), Tarefas, Comentários e Wikis. Permissões granulares de projeto ficam aqui.
4. **CRM Module**: Pipelines, Clientes, Negócios (Deals) e Leads.
5. **Integrations & Webhooks Module**: Comunicação com Evolution API (WhatsApp), processamento de webhooks do Cakto, etc.

## 3. Contratos REST Iniciais
A comunicação deixará de ser feita via `supabase.from()` e passará a ocorrer em endpoints RESTful padronizados:

- `POST /api/v1/auth/register` (Criação de usuário e agência associada via transação)
- `POST /api/v1/auth/login`
- `GET  /api/v1/agencies/me` (Busca dados da agência e membros)
- `POST /api/v1/agencies/invites/accept` (Aceitar convite)
- `GET  /api/v1/projects?space_id=...`
- `DELETE /api/v1/projects/:id` (Deleção atômica do projeto, suas tarefas e comentários)
- `POST /api/v1/tasks` (Criação de tarefa com validação Zod rigorosa)
- `PATCH /api/v1/tasks/:id` (Edição com payload limpo no backend)
- `POST /api/v1/integrations/whatsapp/send` (Endpoint seguro para disparos)

## 4. Estratégia de Autenticação

### Fase de Transição (Híbrida)
Durante a transição gradual, manteremos o **Supabase Auth**.
O frontend enviará o token JWT (Session do Supabase) no cabeçalho `Authorization: Bearer <token>`. O Fastify utilizará a chave pública JWT do Supabase ou a SDK `@supabase/supabase-js` para validar e decodificar o token, autenticando a requisição.

### Fase Definitiva (Independente)
Uma vez que os módulos REST estejam operacionais, substituiremos o Supabase Auth por uma solução 100% interna:
- **Acesso**: JWT (JSON Web Token) de curta duração gerado pelo nosso servidor.
- **Segurança**: Refresh Tokens armazenados em cookies `httpOnly`, `Secure` e `SameSite=Strict` para mitigar ataques XSS e CSRF. O frontend não lidará diretamente com os refresh tokens no Local Storage.

## 5. Estratégia de Autorização Multi-Tenant
A dependência excessiva em RLS será reduzida (embora o RLS possa continuar ativo como "segunda camada" de segurança no banco). 
A estratégia primária será implementada no código via **Middlewares de Fastify (Hooks)**:
1. O usuário se autentica e o token expõe seu `user_id`.
2. Um middleware pré-handler (`preHandler`) inspeciona o `agency_id` (enviado via header `X-Agency-Id` ou associado ao token do usuário ativo).
3. O middleware valida em cache (Redis/Memória) ou no banco se o usuário tem permissão (`status='active'`) naquela agência.
4. O Drizzle ORM é instruído, em nível de serviço, a incluir sempre a cláusula `.where(eq(table.agencyId, req.agencyId))` nas consultas.

## 6. Estratégia para Substituir Supabase RPCs
As atuais Functions/RPCs do PostgreSQL (ex: `accept_agency_invitation`, `create_agency_and_roles`) quebram a responsabilidade de regras de negócio em SQL. 
- **Substituição**: Serão reescritas em TypeScript como "Services" (ex: `AgencyService.createAgency`).
- **Transacionalidade**: Utilizaremos a função de transação do Drizzle (`db.transaction(async (tx) => { ... })`) para garantir operações ACID em cenários como deletar um projeto e suas tarefas, ou cadastrar uma agência, criar colunas base e atribuir cargos padrão, garantindo que tudo ocorra de maneira atômica e não deixe lixo no banco em caso de erro.

## 7. Estratégia para Substituir Edge Functions
Não dependeremos mais das Edge Functions do Deno/Supabase.
Scripts serverless ou lógicas isoladas serão rotas comuns do Fastify ou "Background Jobs" no Node.js. Por estarem rodando no mesmo runtime da API principal, reaproveitarão os mesmos validadores (Zod), utilitários, instâncias do Drizzle e tipagens do TypeScript.

## 8. Estratégia para Evolution API e Cakto webhook
- **Evolution API (WhatsApp)**: O risco crítico atual (`VITE_EVOLUTION_API_KEY` exposta) será resolvido imediatamente. A secret residirá num arquivo `.env` seguro no servidor backend. O frontend fará um POST para `/api/v1/integrations/whatsapp/send`, o Fastify validará a permissão, buscará o `evolution_instance_name` do tenant e fará a chamada REST fechada entre backend e provedor.
- **Cakto Webhook**: O servidor exporá o endpoint `POST /api/v1/webhooks/cakto`. O payload será rigorosamente validado usando o schema Zod (rejeitando bad requests precocemente). Em seguida, atualizações de assinatura (status, pagamentos) serão processadas transacionalmente pelo ORM, atualizando os dados da tabela `agencies`.

## 9. Plano de Migração em Fases

**Fase 1: Fundação Backend & Segurança Crítica (Prioridade Máxima)**
- Setup inicial do repositório Fastify + Zod + Drizzle ORM.
- Conectar ao banco PostgreSQL atual do Supabase.
- Migrar chamadas da Evolution API do Frontend para o novo backend.
- Configurar autenticação híbrida validando tokens do Supabase Auth no Fastify.

**Fase 2: Mutações Complexas e Integridade (Prioridade Alta)**
- Migrar criações não-ACID (Criação de agência/registro).
- Migrar exclusões em cascata do frontend para rotas de deleção na API (`DELETE /api/v1/projects/:id`).
- Aplicar schemas de validação rígidos no payload dessas requisições (eliminar manipulação no front).

**Fase 3: Migração de Leitura e Operações CRUD Básicas (Média)**
- Reescrever e desligar os RPCs (PL/pgSQL), transformando-os em Serviços no TS.
- Converter gradualmente as listagens (Hooks do React Query como `useTasks`, `useProjects`) de chamadas `supabase.from()` para `fetch/axios` consumindo as rotas `/api/v1/...`.

**Fase 4: Desacoplamento Total e Encerramento (Baixa)**
- Migrar o módulo de Autenticação (Login, Registro, Password Reset) para o próprio backend com JWT + httpOnly.
- Desvincular de vez o pacote `@supabase/supabase-js` do frontend.
- Desligar exposição de API pública e RLS no Supabase, fechando as portas do banco de dados para a internet e permitindo conexão apenas a partir dos IPs estáticos do novo backend Node.js.
