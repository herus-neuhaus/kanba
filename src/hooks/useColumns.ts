import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import type { KanbanColumn } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api/client';

export function useColumns(projectId: string | undefined) {
  const { agency } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['columns', projectId],
    queryFn: async () => {
      if (!projectId || !agency) return [];
      const data = await apiClient<KanbanColumn[]>(`/projects/${projectId}/columns`);
      return data;
    },
    enabled: !!projectId && !!agency,
  });

  const createColumn = useMutation({
    mutationFn: async ({ title, order_index, color, is_done = false }: { title: string; order_index: number; color: string; is_done?: boolean }) => {
      if (!projectId || !agency) throw new Error('Dados inválidos para criar coluna');
      const data = await apiClient<KanbanColumn>(`/projects/${projectId}/columns`, {
        method: 'POST',
        body: JSON.stringify({ title, order_index, color, is_done }),
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['columns', projectId] });
    },
    onError: (error) => {
      console.error('Erro ao criar coluna:', error);
      toast({
        title: "Erro ao criar",
        description: "Não foi possível criar a coluna. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, title, color, order_index, is_done }: { id: string; title?: string; color?: string; order_index?: number; is_done?: boolean }) => {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (color !== undefined) updates.color = color;
      if (order_index !== undefined) updates.order_index = order_index;
      if (is_done !== undefined) updates.is_done = is_done;

      const data = await apiClient<KanbanColumn>(`/columns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['columns', projectId] });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/columns/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['columns', projectId] });
      toast({
        title: "Coluna excluída",
        description: "A coluna foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao deletar coluna:', error);
      toast({
        title: "Erro ao excluir",
        description: "Falha ao remover a coluna. Verifique sua conexão.",
        variant: "destructive"
      });
    }
  });

  return { ...query, createColumn, updateColumn, deleteColumn };
}
