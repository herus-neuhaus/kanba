/**
 * Utilitário para geração de URLs do sistema Kanba
 */

const BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

/**
 * Gera um link direto para uma tarefa no quadro Kanban (Shortlink)
 */
export function generateTaskLink(_projectId: string, taskId: string, _isClient = false): string {
  // Usamos o formato encurtado que redireciona automaticamente para o lugar certo
  return `${BASE_URL}/t/${taskId}`;
}

/**
 * Gera um link direto para a wiki do projeto
 */
export function generateProjectWikiLink(projectId: string): string {
  return `${BASE_URL}/projetos/${projectId}/kanban?tab=wiki`;
}
