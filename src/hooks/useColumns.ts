import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { KanbanColumn } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useColumns(projectId: string | undefined) {
  const { agency } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['columns', projectId],
    queryFn: async () => {
      if (!projectId || !agency) return [];
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as KanbanColumn[];
    },
    enabled: !!projectId && !!agency,
  });

  const createColumn = useMutation({
    mutationFn: async ({ title, order_index, color }: { title: string; order_index: number; color: string }) => {
      if (!projectId || !agency) throw new Error('Dados inválidos para criar coluna');
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert({ project_id: projectId, title, order_index, color })
        .select()
        .single();
      if (error) throw error;
      return data as KanbanColumn;
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
    mutationFn: async ({ id, title, color, order_index }: { id: string; title?: string; color?: string; order_index?: number }) => {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (color !== undefined) updates.color = color;
      if (order_index !== undefined) updates.order_index = order_index;

      const { data, error } = await supabase
        .from('kanban_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as KanbanColumn;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['columns', projectId] });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('id', id);
      if (error) throw error;
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
