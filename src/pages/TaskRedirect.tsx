import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSplash } from '@/components/layout/LoadingSplash';

/**
 * Componente TaskRedirect
 * Responsável por receber um taskId via URL /t/:taskId,
 * localizar o projeto correspondente e redirecionar o usuário
 * para o quadro Kanban correto com a modal aberta.
 */
export default function TaskRedirect() {
  const { taskId } = useParams<{ taskId: string }>();
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Aguarda o carregamento do perfil para garantir permissões no redirect
    if (authLoading) return;

    const findAndRedirect = async () => {
      try {
        if (!taskId) {
          navigate('/dashboard', { replace: true });
          return;
        }

        // Busca a tarefa para identificar o projeto
        const task = await apiClient<{ id: string; project_id: string }>(`/tasks/${taskId}`);

        if (!task) {
          toast({
            title: 'Tarefa não localizada',
            description: 'A demanda pode ter sido excluída ou você não tem acesso.',
            variant: 'destructive',
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        /**
         * Lógica de Redirecionamento Inteligente:
         * Se for cliente, vai para /cliente/projetos/...
         * Se for agência (owner/manager/member), vai para /projetos/...
         */
        const prefix = profile?.role === 'client' ? '/cliente' : '';
        const finalUrl = `${prefix}/projetos/${task.project_id}/kanban?task=${task.id}`;

        console.log(`[Shortlink] Redirecionando para: ${finalUrl}`);
        navigate(finalUrl, { replace: true });
      } catch (err: any) {
        console.error('Redirect error:', err);
        navigate('/dashboard', { replace: true });
      }
    };

    findAndRedirect();
  }, [taskId, authLoading, profile, navigate, toast]);

  // Exibe a Splash Screen de carregamento enquanto o processamento ocorre
  return <LoadingSplash />;
}
