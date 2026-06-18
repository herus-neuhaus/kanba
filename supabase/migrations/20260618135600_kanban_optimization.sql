-- 1. Evolução Não-Destrutiva (Adição de Coluna de Ordenação)
-- Usamos DOUBLE PRECISION para permitir o padrão de posicionamento (inserir cartões no meio calculando a média das posições)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS "position" DOUBLE PRECISION DEFAULT 0;

-- 2. Integridade Relacional (Prevenção de Perda de Dados - Zero Data Loss)
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS fk_tasks_column_id;

ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_column_id 
FOREIGN KEY (column_id) REFERENCES public.kanban_columns(id) 
ON DELETE RESTRICT;

-- 3. Otimização de Performance (Índices para Quadros Pesados)
-- Índice para carregar todas as tarefas de um projeto rapidamente
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

-- Índice para filtragem rápida por coluna e ordenação nativa no DB
CREATE INDEX IF NOT EXISTS idx_tasks_column_position ON public.tasks(column_id, "position");

-- Índice para a segurança RLS (Agiliza a verificação de tenant)
CREATE INDEX IF NOT EXISTS idx_tasks_agency_id ON public.tasks(agency_id);
