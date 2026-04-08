# 🚀 Kanba (KanbanFlow Brazil)
**Documentação Definitiva do Sistema**

O **Kanba** é uma plataforma de gestão de demandas e automação de workflow projetada especificamente para agências que buscam eficiência operacional, centralização de comunicação e automação de notificações via WhatsApp.

---

## 📋 1. Visão Geral e Contexto
O sistema resolve o "caos informativo" das agências, substituindo grupos informais de WhatsApp e planilhas por um ecossistema estruturado. Ele permite que agências criem ambientes isolados para gerenciar projetos, equipes e tarefas, com integração nativa de mensagens para manter todos os envolvidos atualizados sem intervenção manual.

### 💎 Principais Diferenciais
- **Multi-Tenancy**: Cada agência possui seu próprio ambiente isoladamente seguro.
- **Integração Realtime**: Mudanças no board refletem instantaneamente para todos os membros.
- **Automação de Notificações**: Sistema inteligente que envia alertas via WhatsApp para prazos e status.
- **UX Premium**: Interface focada em produtividade baseada nos princípios do Shadcn UI.

---

## 🛠️ 2. Stack Tecnológica
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS.
- **UI Framework**: Radix UI + Shadcn UI + Lucide Icons.
- **Gráficos & Dados**: Recharts + Zod (Validação).
- **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime, Storage).
- **Gerenciamento de Estado**: TanStack Query v5.
- **Integração Externa**: Evolution API (WhatsApp Gateway).
- **Testes**: Vitest (Unitários) e Playwright (E2E).

---

## 📂 3. Estrutura do Projeto
```text
kanbanflow-brazil/
├── src/
│   ├── components/       # Componentes reutilizáveis (UI) e específicos (Features)
│   │   ├── features/     # Layouts e componentes complexos de negócio
│   │   └── ui/           # Componentes base do Shadcn UI
│   ├── hooks/            # Hooks customizados para lógica de negócio (useTasks, useAuth, etc.)
│   ├── integrations/     # Configuração e clientes de serviços externos (Supabase)
│   ├── lib/              # Funções utilitárias, notificações e wrappers de API
│   ├── pages/            # Páginas principais da aplicação (Auth, Kanban, Dashboard)
│   ├── types/            # Definições de tipos TypeScript globais
│   └── test/             # Configuração e arquivos de teste
├── supabase/
│   ├── functions/        # Edge Functions (Deno) para lógica server-side
│   └── migrations/       # Scripts de evolução do banco de dados
└── public/               # Ativos estáticos (imagens, ícones)
```

---

## 🏗️ 4. Infraestrutura e Backend

### 📊 Banco de Dados (PostgreSQL)
A segurança é garantida via **Row Level Security (RLS)**. As principais entidades são:
- **`agencies`**: Configurações globais da agência e estado do WhatsApp.
- **`profiles`**: Dados complementares dos usuários e papéis (`admin`, `member`).
- **`projects`**: Agrupadores de demandas com acompanhamento de progresso.
- **`tasks`**: O centro do sistema. Suporta checklists (JSONB), prioridades, etiquetas e prazos.
- **`invites`**: Controle de acesso via tokens únicos.
- **`comments`**: Histórico de comunicação dentro de cada tarefa.
- **`notification_logs`**: Rastreabilidade de envios para evitar duplicidade e spam.

### ⚡ Edge Functions (Backend Segurado)
As funções rodam no ambiente Deno do Supabase:
- **`create-whatsapp-instance`**: Cria sessões na Evolution API e retorna o QR Code.
- **`disconnect-whatsapp-instance`**: Finaliza sessões e limpa estados no banco.

---

## 🧠 5. Lógica de Negócio e Automação

### 🔔 Sistema de Notificações (`lib/notifications.ts`)
O Kanba possui um motor de notificações inteligente que:
1. Valida o tipo de notificação (`creation`, `due_date`, `overdue`, etc.).
2. Verifica os logs para garantir que o usuário não receba notificações duplicadas em um curto período (proteção anti-spam).
3. Dispara a mensagem via Evolution API apenas se os critérios de tempo e relevância forem atendidos.

### 🔐 Fluxo de Autenticação e Onboarding
1. **Registro**: Via Supabase Auth.
2. **Onboarding**: O usuário cria sua agência ou entra via link de convite.
3. **Ativação**: Configuração de perfil e conexão inicial com a instância de WhatsApp.

---

## ⚙️ 6. Guia de Desenvolvimento

### Variáveis de Ambiente (`.env`)
```env
VITE_SUPABASE_PROJECT_ID="projeto_id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_chave_anon"
VITE_SUPABASE_URL="url_do_projeto"
VITE_EVOLUTION_API_KEY="chave_da_api_whatsapp"
VITE_EVOLUTION_BASE_URL="url_do_gateway_whatsapp"
```

### Comandos Disponíveis
- `npm run dev`: Inicia o servidor local.
- `npm run build`: Gera o bundle de produção otimizado.
- `npm run lint`: Executa a verificação estática de código.
- `npm run test`: Roda os testes unitários com Vitest.
- `npm run test:watch`: Modo interativo de testes.

---

## ✅ 7. Status e Roadmap
Atualmente o sistema possui o core operacional completo (Kanban, Projetos, Auth, Whats-Connect). 

**Próximos Passos:**
- Expansão de relatórios de produtividade.
- Sistema de anexos de arquivos em tarefas via Supabase Storage.
- Refinamento de UX em dispositivos móveis.
- Automação de recorrência de tarefas.

---
*Este documento reflete a arquitetura atual e as diretrizes de desenvolvimento do projeto Kanba.*
