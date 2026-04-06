import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Project } from '@/types';

export function useProjects() {
  const { agency } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['projects', agency?.id],
    queryFn: async () => {
      if (!agency) return [];
      const { data, error } = await supabase.from('projects').select('*').eq('agency_id', agency.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!agency,
  });

  const createProject = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!agency) throw new Error('No agency');
      const { data, error } = await supabase.from('projects').insert({ name, description, agency_id: agency.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  return { ...query, createProject };
}
