import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ProjectWiki } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useWiki(projectId: string | undefined) {
  const { agency } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['wiki', projectId],
    queryFn: async () => {
      if (!projectId || !agency) return null;
      
      const { data, error } = await supabase
        .from('project_wikis')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProjectWiki | null;
    },
    enabled: !!projectId && !!agency,
  });

  const saveWiki = useMutation({
    mutationFn: async ({ content }: { content: any }) => {
      if (!projectId || !agency) throw new Error('Dados inválidos para salvar a wiki');
      
      const { data, error } = await supabase
        .from('project_wikis')
        .upsert({ 
          project_id: projectId,
          content
        }, {
          onConflict: 'project_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wiki', projectId] });
      toast({
        title: "Sucesso!",
        description: "Wiki do projeto atualizada com sucesso.",
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
