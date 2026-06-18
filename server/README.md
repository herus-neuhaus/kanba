# Kanba Server

API Backend para o Kanba, construída com Fastify, TypeScript e Zod.

## Como rodar

1. Clone o repositório ou acesse o diretório `/server`.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
4. Para rodar em desenvolvimento:
   ```bash
   npm run dev
   ```
5. Para testar o healthcheck:
   ```bash
   curl http://localhost:3333/health
   ```

## Módulo de Autenticação (Intermediário)
Implementado em `src/http/routes/auth.routes.ts`. Este módulo utiliza o Supabase Auth no backend, mas já expõe contratos REST:
- `POST /api/v1/auth/login`: Realiza login, define cookies `httpOnly` (`sb-access-token`, `sb-refresh-token`) e retorna a sessão.
- `POST /api/v1/auth/refresh`: Atualiza os cookies usando o refresh_token.
- `POST /api/v1/auth/logout`: Limpa os cookies.
- `GET /api/v1/me?agency_id=...`: Valida o token, cruza dados com Drizzle ORM (`profiles`, `agencies`, `agency_members`) e devolve o contexto completo validado do usuário (nunca confiando apenas no ID fornecido pelo client).

### Riscos Pendentes e Notas de Transição
- O frontend atual ainda utiliza `supabase.auth.signInWithPassword()` diretamente via `@supabase/supabase-js` e salva tokens em Local Storage / Session Storage gerenciados pela Lib.
- Para não quebrar o frontend, os novos endpoints `/api/v1/auth/*` foram implementados, mas **não substituem o código atual do frontend** (ex: hook `useAuth.tsx`) até a próxima etapa.
- Ao substituir o frontend, deveremos trocar as chamadas da SDK do Supabase por requisições `fetch` passando `credentials: 'include'` para tráfego seguro de cookies.
- O endpoint `/me` aceita tanto o cookie `sb-access-token` quanto o header `Authorization: Bearer <token>` para facilitar a migração suave onde o frontend apenas injeta o token que ele já possui.

## Scripts
- `npm run dev`: Inicia o servidor com hot-reload usando `tsx watch`.
- `npm run build`: Compila o código TypeScript usando `tsup`.
- `npm run start`: Roda a versão compilada em produção.
