import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from './useAuth';
import { useWorkspace } from './useWorkspace';
import type { ProjectWiki } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useWiki(spaceIdOverride?: string) {
  const { agency } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const qc = useQueryClient();
  const { toast } = useToast();

  const spaceId = spaceIdOverride !== undefined ? spaceIdOverride : activeWorkspaceId;

  const query = useQuery({
    queryKey: ['wiki', spaceId],
    queryFn: async () => {
      if (!spaceId || !agency) return null;
      
      const data = await apiClient<ProjectWiki | null>(`/wiki?spaceId=${spaceId}`);
      return data;
    },
    enabled: !!spaceId && !!agency,
  });

  const saveWiki = useMutation({
    mutationFn: async ({ content }: { content: any }) => {
      if (!spaceId || !agency) throw new Error('Dados inválidos para salvar a wiki');
      
      const data = await apiClient<ProjectWiki>('/wiki', {
        method: 'PUT',
        body: JSON.stringify({ spaceId, content }),
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wiki', spaceId] });
      toast({
        title: "Sucesso!",
        description: "Wiki do workspace atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao salvar wiki:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a wiki. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  return { ...query, saveWiki };
}
